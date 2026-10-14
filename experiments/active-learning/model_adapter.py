"""Read-only frozen baselines and bounded CPU fitting for active learning.

The controller owns attempt accounting, frozen input/model manifests, wall-clock
limits and OS network denial. This module never invokes the old CLI or evaluator.
"""
import contextlib
import gc
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import sys
import time

# Applies before importing preserved source or model libraries.
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
PRIOR = ROOT.parent / 'encoder-comparison'
TEACHING = ROOT.parent / 'llm-teaching/runs/teacher-demo-001'
EXPECTED_PRIOR_BUNDLE = 'ce05cc78086746d0d2c2e59c693dfee7e5f40924dc72804c888fa445e3d450ea'
EXPECTED_TEACHING_BUNDLE = '35b3a7066873c6c5a5ce57cad255cecbfe228fa0750027c271e67fcd1560a51c'
MODEL_REVISION = '1110a243fdf4706b3f48f1d95db1a4f5529b4d41'
FIXED_RECIPE = dict(seed=42, classifierHeadSeed=42, batchSize=16,
                    pairIterations=5, bodySteps=50, learningRate=2e-5)
BASELINES = ('A', 'B', 'C42')
INVARIANT_REASONS = {
    'RELOAD_PARITY': 'Saved candidate does not reproduce in-memory scores.',
    'INVALID_SCORES': 'Invalid model scores.',
    'OPTIMIZATION_INCOMPLETE': 'The declared encoder optimization step count was not completed.',
    'ENCODER_UNCHANGED': 'Encoder weights did not change after optimization.',
    'CPU_CONSTRAINT': 'The declared CPU-only device was not respected.',
    'NONFINITE_WEIGHTS': 'Encoder parameter updates contain non-finite values.',
}


class InvariantError(ValueError):
    """Explicit allowlisted failure identity; accepts no model or input text."""
    def __init__(self, reason_code):
        if reason_code not in INVARIANT_REASONS:
            raise ValueError('Unknown model invariant reason code.')
        self.reason_code = reason_code
        super().__init__(INVARIANT_REASONS[reason_code])


def _sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def _verify_manifest(root, manifest_path, expected_bundle, expected_count):
    frozen = json.loads(manifest_path.read_text())
    files = frozen.get('files')
    if not isinstance(files, dict) or len(files) != expected_count:
        raise ValueError('Protected manifest file count differs.')
    bundle = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
    if bundle != expected_bundle or frozen.get('bundleSha256') != bundle:
        raise ValueError('Protected manifest-map digest differs.')
    for relative, expected in files.items():
        path = root / relative
        # Frozen checkpoint snapshot files use legitimate in-root blob symlinks.
        if Path(relative).is_absolute() or '..' in Path(relative).parts or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError('Protected manifest path escapes its root.')
        if _sha(path) != expected:
            raise ValueError('Protected artifact hash differs.')
    return dict(bundleSha256=bundle, files=len(files))


def baseline_integrity():
    """Verify manifest maps AND every file, without accessing historical tests."""
    return dict(encoder=_verify_manifest(PRIOR, PRIOR / 'artifacts/freeze.json', EXPECTED_PRIOR_BUNDLE, 67),
                teaching=_verify_manifest(TEACHING, TEACHING / 'freeze.json', EXPECTED_TEACHING_BUNDLE, 30))


@contextlib.contextmanager
def _protected_use():
    baseline_integrity()
    try:
        yield
    finally:
        baseline_integrity()


def _load_source(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _common():
    return _load_source('_active_learning_frozen_common', PRIOR / 'common.py')


def _configure():
    cache = ROOT / 'cache'
    os.environ.update({
        'HF_HUB_DISABLE_TELEMETRY': '1', 'HF_HUB_DISABLE_IMPLICIT_TOKEN': '1',
        'DO_NOT_TRACK': '1', 'TOKENIZERS_PARALLELISM': 'false', 'WANDB_DISABLED': 'true',
        'ACCELERATE_USE_CPU': 'true', 'HF_HUB_OFFLINE': '1', 'TRANSFORMERS_OFFLINE': '1',
        'HF_DATASETS_OFFLINE': '1', 'HF_HUB_DISABLE_PROGRESS_BARS': '1',
        'HF_HOME': str(cache / 'huggingface'), 'HF_HUB_CACHE': str(cache / 'huggingface/hub'),
        'HUGGINGFACE_HUB_CACHE': str(cache / 'huggingface/hub'),
        'HF_DATASETS_CACHE': str(cache / 'datasets'), 'TORCH_HOME': str(cache / 'torch'),
        'XDG_CACHE_HOME': str(cache), 'SENTENCE_TRANSFORMERS_HOME': str(cache / 'sentence-transformers'),
    })
    # Do not inherit a caller's legacy override pointing into the old experiment.
    os.environ.pop('TRANSFORMERS_CACHE', None)


def prior_api():
    """Import isolated helper namespaces; do not bind to a controller's common.py."""
    _configure()
    sentinel = object()
    previous = sys.modules.get('common', sentinel)
    sys.modules['common'] = _common()
    try:
        api = _load_source('_active_learning_frozen_encoder', PRIOR / 'experiment.py')
    finally:
        if previous is sentinel:
            sys.modules.pop('common', None)
        else:
            sys.modules['common'] = previous
    if api.reference()['revision'] != MODEL_REVISION:
        raise ValueError('Pinned pretrained checkpoint revision differs.')
    return api


def metrics(labels, predictions):
    return _common().metrics(labels, predictions)


def select_threshold(labels, scores):
    return _common().select_threshold(labels, scores)


def load_base_rows():
    with _protected_use():
        rows = _common().validate_rows(json.loads((PRIOR / 'data/train-dev.json').read_text()))
        if len(rows) != 150 or sum(r['split'] == 'train' for r in rows) != 120 or sum(r['split'] == 'dev' for r in rows) != 30:
            raise ValueError('Original 120 TRAIN / 30 DEV records differ.')
        return rows


def contamination_rows():
    with _protected_use():
        original = json.loads((PRIOR / 'data/train-dev.json').read_text())
        proposals = json.loads((TEACHING / 'inputs/proposal.json').read_text())['examples']
        if len(original) != 150 or len(proposals) != 40:
            raise ValueError('Contamination reference coverage differs.')
        return original + proposals


def _baseline_candidates(api):
    candidates = {c['name']: c for c in api.summary()['candidates'] if c['name'] in BASELINES}
    if set(candidates) != set(BASELINES):
        raise ValueError('Required frozen baseline missing.')
    return candidates


def baseline_thresholds():
    with _protected_use():
        return {name: c['operatingPoint']['threshold'] for name, c in _baseline_candidates(prior_api()).items()}


def admit_texts(texts):
    with _protected_use():
        api = prior_api()
        tokenizer = api.tokenizer()
        return [api.admission(text, tokenizer) for text in texts]


def _require_admitted(api, texts):
    tokenizer = api.tokenizer()
    if any(not api.admission(text, tokenizer)['admitted'] for text in texts):
        raise ValueError('Input admission failed; no truncation or silent exclusions allowed.')


def _scores_valid(scores, count):
    try:
        valid = len(scores) == count and all(not isinstance(s, bool) and math.isfinite(s) and 0 <= s <= 1 for s in scores)
    except (TypeError, ValueError, OverflowError):
        valid = False
    if not valid:
        raise InvariantError('INVALID_SCORES')
    return scores


def _baseline_scores(api, texts):
    result = {}
    for name, candidate in _baseline_candidates(api).items():
        predictor = api.Predictor(candidate)
        result[name] = _scores_valid(predictor.scores(texts), len(texts))
        del predictor
        gc.collect()
    return result


def score_baselines(texts):
    with _protected_use():
        api = prior_api()
        _require_admitted(api, texts)
        return _baseline_scores(api, texts)


def _run_path(run):
    run = Path(run).resolve()
    if not run.is_relative_to(ROOT.resolve()) or run == ROOT.resolve():
        raise ValueError('Candidate output must stay inside the active-learning package.')
    return run


def score_candidate(run, texts):
    with _protected_use():
        run = _run_path(run)
        for relative in ('model', 'model/head.json', 'model/encoder'):
            if not (run / relative).resolve().is_relative_to(run):
                raise ValueError('Candidate model path escapes its run.')
        api = prior_api()
        _require_admitted(api, texts)
        head = json.loads((run / 'model/head.json').read_text())
        body = api.load_body(run / 'model/encoder')
        if any(parameter.device.type != 'cpu' for parameter in body.parameters()):
            raise InvariantError('CPU_CONSTRAINT')
        return _scores_valid(api.score_head(api.encode(body, texts), head).tolist(), len(texts)) if texts else []


def _validate_training(data, recipe):
    if any(recipe.get(key) != value or isinstance(recipe.get(key), bool) for key, value in FIXED_RECIPE.items()):
        raise ValueError('Training recipe differs from the fixed approved recipe.')
    _common().validate_rows(data)
    base = load_base_rows()
    by_id = {row['id']: row for row in data}
    if any(by_id.get(row['id']) != row for row in base):
        raise ValueError('Original TRAIN/DEV records must be preserved exactly.')
    base_ids = {row['id'] for row in base}
    additions = [row for row in data if row['id'] not in base_ids]
    if any(row['split'] != 'train' for row in additions) or not 8 <= len(additions) <= 120:
        raise ValueError('Require 8..120 cumulative TRAIN additions and unchanged DEV.')
    groups = {row['group'] for row in additions}
    if len(groups) < 2 or any(sum(row['group'] == group for row in additions) != 4 for group in groups):
        raise ValueError('Training additions require complete four-passage families.')
    if groups & {row['group'] for row in base} or any({r['label'] for r in additions if r['group'] == group} != {0, 1} for group in groups):
        raise ValueError('New training families must be distinct and contain both agreed labels.')
    normalize = _common().normalize_text
    prior_texts = {normalize(row['text']) for row in contamination_rows()[150:]}
    if any(normalize(row['text']) in prior_texts for row in additions):
        raise ValueError('Previous teaching proposals cannot enter this training lineage.')
    return (sorted((r for r in data if r['split'] == split), key=lambda r: r['id']) for split in ('train', 'dev'))


def train_candidate(run, data, recipe):
    """Fit once from pinned pretrained weights; return complete development evidence."""
    with _protected_use():
        training, dev = _validate_training(data, recipe)
        run = _run_path(run)
        if (run / 'model').exists() or (run / 'checkpoints').exists():
            raise ValueError('Candidate outputs already exist; preserve the earlier attempt.')
        api = prior_api()
        _require_admitted(api, [row['text'] for row in data])
        import numpy as np
        import torch
        from datasets import Dataset
        from setfit import SetFitModel, TrainingArguments

        start = time.perf_counter()
        texts, labels = [r['text'] for r in training], [r['label'] for r in training]
        dev_texts, dev_labels = [r['text'] for r in dev], [r['label'] for r in dev]
        model_dir = run / 'model'
        model_dir.mkdir(parents=True, exist_ok=False)
        np.random.seed(recipe['seed'])
        torch.manual_seed(recipe['seed'])
        # Every round restarts here, never from C42 or a preceding round.
        body = api.load_body(api.reference()['snapshot'])
        before = {name: parameter.detach().clone() for name, parameter in body.named_parameters()}
        model = SetFitModel(model_body=body, model_head=api.new_head(seed=42), normalize_embeddings=True)
        arguments = TrainingArguments(output_dir=str(run / 'checkpoints'), seed=recipe['seed'],
            batch_size=recipe['batchSize'], num_iterations=recipe['pairIterations'], max_steps=recipe['bodySteps'],
            num_epochs=1, body_learning_rate=recipe['learningRate'], max_length=256, report_to='none',
            logging_strategy='no', eval_strategy='no', save_strategy='no', show_progress_bar=False,
            use_amp=False, end_to_end=False)
        # Provenance, categories, groups, quotations and acquisition metadata never enter fitting.
        try:
            trainer = api.cpu_trainer(model, arguments, Dataset.from_dict({'text': texts, 'label': labels}))
        except ValueError as error:
            # The frozen helper also checks CPU placement during construction.
            # Match its fixed invariant exactly; never export its exception text.
            if str(error) == 'The declared CPU-only training device was not respected.':
                raise InvariantError('CPU_CONSTRAINT') from None
            raise
        devices = dict(trainer=str(trainer.st_trainer.args.device),
                       accelerator=str(trainer.st_trainer.accelerator.device),
                       parameters=sorted({p.device.type for p in body.parameters()}))
        if devices != dict(trainer='cpu', accelerator='cpu', parameters=['cpu']):
            raise InvariantError('CPU_CONSTRAINT')
        fit_start = time.perf_counter()
        trainer.train()
        fit_seconds = time.perf_counter() - fit_start
        steps = int(trainer.st_trainer.state.global_step)
        changed, delta = 0, 0.0
        for name, parameter in body.named_parameters():
            change = float((parameter.detach() - before[name]).abs().max())
            if parameter.device.type != 'cpu':
                raise InvariantError('CPU_CONSTRAINT')
            if not math.isfinite(change):
                raise InvariantError('NONFINITE_WEIGHTS')
            changed += int(change > 0)
            delta = max(delta, change)
        if steps != 50:
            raise InvariantError('OPTIMIZATION_INCOMPLETE')
        if not changed:
            raise InvariantError('ENCODER_UNCHANGED')
        model.model_body.save_pretrained(str(model_dir / 'encoder'), safe_serialization=True)
        head = api.export_head(model.model_head)
        (model_dir / 'head.json').write_text(json.dumps(head, indent=2, sort_keys=True, allow_nan=False) + '\n')
        matrix = api.encode(model.model_body, dev_texts)
        scores = _scores_valid(api.score_head(matrix, head).tolist(), len(dev))
        head_error = float(np.max(np.abs(np.asarray(scores) - model.model_head.predict_proba(matrix)[:, 1])))
        loaded_body = api.load_body(model_dir / 'encoder')
        reloaded_scores = _scores_valid(api.score_head(api.encode(loaded_body, dev_texts), head).tolist(), len(dev))
        reload_error = float(np.max(np.abs(np.asarray(scores) - np.asarray(reloaded_scores))))
        if not math.isfinite(head_error) or head_error > 1e-12 or reload_error > 1e-12:
            raise InvariantError('RELOAD_PARITY')
        operating = api.select_threshold(dev_labels, scores)
        threshold = operating['threshold']
        learned = api.metrics(dev_labels, [int(s >= threshold) for s in scores])
        baseline_scores = _baseline_scores(api, dev_texts)
        baselines = {}
        for name, candidate in _baseline_candidates(api).items():
            saved_op = candidate['operatingPoint']
            curve = api.select_threshold(dev_labels, baseline_scores[name])
            if curve != saved_op:
                raise ValueError('Frozen baseline development operating point no longer reproduces.')
            baselines[name] = dict(operatingPoint=saved_op,
                metrics=api.metrics(dev_labels, [int(s >= saved_op['threshold']) for s in baseline_scores[name]]),
                scores=baseline_scores[name])
        categories = {}
        for category in sorted({row['category'] for row in dev}):
            indices = [i for i, row in enumerate(dev) if row['category'] == category]
            categories[category] = {'candidate': api.metrics([dev_labels[i] for i in indices], [int(scores[i] >= threshold) for i in indices])}
            for name, result in baselines.items():
                categories[category][name] = api.metrics([dev_labels[i] for i in indices],
                    [int(result['scores'][i] >= result['operatingPoint']['threshold']) for i in indices])
        report = dict(scope='Repeated unchanged 30-row DEV tuning evidence; not independent evaluation.',
            trainingRows=len(training), developmentRows=len(dev), developmentUnchanged=True,
            developmentIds=[row['id'] for row in dev], scores=scores,
            fitSeconds=fit_seconds, totalWorkflowSeconds=time.perf_counter() - start,
            seed=42, classifierHeadSeed=42, recipe=dict(recipe), modelRevision=MODEL_REVISION,
            encoderStartsFrom='Pinned original pretrained MiniLM; no warm start.',
            operatingPoint=operating, candidate=learned, baselines=baselines, categories=categories,
            optimization=dict(successfulCpuSteps=steps, changedParameterTensors=changed,
                totalParameterTensors=len(before), maximumAbsoluteParameterChange=delta, devices=devices),
            parity=dict(headMaxError=head_error, savedReloadMaxError=reload_error),
            modelBytes=sum(p.stat().st_size for p in model_dir.rglob('*') if p.is_file()),
            diagnosticOnly=not operating['gatePassed'],
            limitations=['AI labels are not human ground truth.', 'DEV contains only five scenario families and is reused for tuning.',
                         'No historical heldout examples were read.'])
        del trainer, model, body, loaded_body, before
        gc.collect()
        return report
