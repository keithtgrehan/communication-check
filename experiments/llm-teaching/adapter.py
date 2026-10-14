"""Read-only reuse of the frozen encoder experiment; all new outputs stay in this package."""
import importlib.util
import json
import os
from pathlib import Path
import sys
from contracts import ROOT, PRIOR

EXPECTED_PRIOR_BUNDLE = 'ce05cc78086746d0d2c2e59c693dfee7e5f40924dc72804c888fa445e3d450ea'


def prior_api():
    sys.path.insert(0, str(PRIOR))
    try:
        spec = importlib.util.spec_from_file_location('_frozen_encoder_experiment', PRIOR / 'experiment.py')
        api = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(api)
    finally:
        sys.path.remove(str(PRIOR))
    api.configure()
    # Never use the old package as a writable runtime cache.
    os.environ['HF_HOME'] = str(ROOT / 'cache')
    os.environ['HF_HUB_DISABLE_PROGRESS_BARS'] = '1'
    frozen = api.verify_freeze()
    if frozen['bundleSha256'] != EXPECTED_PRIOR_BUNDLE:
        raise ValueError('The approved frozen baseline bundle differs.')
    return api


def baseline_candidate(api):
    return next(candidate for candidate in api.summary()['candidates'] if candidate['name'] == 'C42')


def train_candidate(run, data, recipe):
    import gc
    import time
    api = prior_api()
    import numpy as np
    import torch
    from datasets import Dataset
    from setfit import SetFitModel, TrainingArguments

    training = sorted([r for r in data if r['split'] == 'train'], key=lambda r: r['id'])
    dev = sorted([r for r in data if r['split'] == 'dev'], key=lambda r: r['id'])
    texts, labels = [r['text'] for r in training], [r['label'] for r in training]
    dev_texts, dev_labels = [r['text'] for r in dev], [r['label'] for r in dev]
    start = time.perf_counter()
    np.random.seed(recipe['seed']); torch.manual_seed(recipe['seed'])
    body = api.load_body(api.reference()['snapshot'])
    before = {name: parameter.detach().clone() for name, parameter in body.named_parameters()}
    model = SetFitModel(model_body=body, model_head=api.new_head(), normalize_embeddings=True)
    arguments = TrainingArguments(output_dir=str(run / 'checkpoints'), seed=recipe['seed'],
        batch_size=recipe['batchSize'], num_iterations=recipe['pairIterations'], max_steps=recipe['bodySteps'],
        num_epochs=1, body_learning_rate=recipe['learningRate'], max_length=256, report_to='none',
        logging_strategy='no', eval_strategy='no', save_strategy='no', show_progress_bar=False, use_amp=False, end_to_end=False)
    trainer = api.cpu_trainer(model, arguments, Dataset.from_dict({'text': texts, 'label': labels}))
    fit_start = time.perf_counter()
    trainer.train()
    fit_seconds = time.perf_counter() - fit_start
    steps = int(trainer.st_trainer.state.global_step)
    changed, delta = 0, 0.0
    for name, parameter in body.named_parameters():
        change = float((parameter.detach() - before[name]).abs().max())
        changed += int(change > 0); delta = max(delta, change)
    if steps != recipe['bodySteps'] or not changed:
        raise ValueError('The declared encoder optimization did not occur.')
    model_dir = run / 'model'; model_dir.mkdir()
    model.model_body.save_pretrained(str(model_dir / 'encoder'), safe_serialization=True)
    head = api.export_head(model.model_head)
    (model_dir / 'head.json').write_text(json.dumps(head, indent=2, sort_keys=True) + '\n')
    matrix = api.encode(model.model_body, dev_texts)
    scores = api.score_head(matrix, head).tolist()
    head_error = float(np.max(np.abs(np.asarray(scores) - model.model_head.predict_proba(matrix)[:, 1])))
    # Freshly load exactly the saved artifact that later prediction will use.
    loaded_body = api.load_body(model_dir / 'encoder')
    reloaded_scores = api.score_head(api.encode(loaded_body, dev_texts), head).tolist()
    reload_error = float(np.max(np.abs(np.asarray(scores) - np.asarray(reloaded_scores))))
    if head_error > 1e-12 or reload_error > 1e-12:
        raise ValueError('Saved candidate does not reproduce in-memory scores.')
    operating = api.select_threshold(dev_labels, scores)
    # The baseline is evaluated ONLY on the unchanged public development rows.
    baseline = baseline_candidate(api)
    baseline_scores = api.Predictor(baseline).scores(dev_texts)
    threshold = operating['threshold']; base_threshold = baseline['operatingPoint']['threshold']
    learned = api.metrics(dev_labels, [int(s >= threshold) for s in scores])
    existing = api.metrics(dev_labels, [int(s >= base_threshold) for s in baseline_scores])
    slices = {}
    for category in sorted({r['category'] for r in dev}):
        positions = [i for i, r in enumerate(dev) if r['category'] == category]
        slices[category] = {
          'candidate': api.metrics([dev_labels[i] for i in positions], [int(scores[i] >= threshold) for i in positions]),
          'baseline': api.metrics([dev_labels[i] for i in positions], [int(baseline_scores[i] >= base_threshold) for i in positions])}
    report = dict(scope='Development-only comparison on the same previously used 30 rows; not an independent generalization test.',
       trainingRows=len(training), developmentRows=len(dev), fitSeconds=fit_seconds, totalWorkflowSeconds=time.perf_counter() - start,
       seed=42, classifierHeadSeed=42, encoderStartsFrom='Pinned original pretrained MiniLM; not the parent candidate weights.',
       operatingPoint=operating, candidate=learned, baseline={'name': 'Frozen C42', 'threshold': base_threshold,
             'devGatePassed': baseline['operatingPoint']['gatePassed'], 'metrics': existing}, categories=slices,
       optimization={'successfulCpuSteps': steps, 'changedParameterTensors': changed,
                     'totalParameterTensors': len(before), 'maximumAbsoluteParameterChange': delta},
       parity={'headMaxError': head_error, 'savedReloadMaxError': reload_error},
       modelBytes=sum(p.stat().st_size for p in model_dir.rglob('*') if p.is_file()),
       decision='Meets exploratory development target; requires fresh independent evaluation and human usefulness review.' if operating['gatePassed'] else
                'Does not meet the exploratory development target. Retain as a diagnostic candidate; do not integrate.',
       comparisonNote='DEV-only comparison at each predeclared operating point. Threshold selection is not independent evidence of model improvement.',
       diagnosticOnly=not operating['gatePassed'],
       improvements={'recallDelta': learned['recall'] - existing['recall'], 'falsePositiveDelta': learned['fp'] - existing['fp'],
                     'f1Delta': learned['f1'] - existing['f1']},
       limitations=['Synthetic teacher and reviewer labels are not human ground truth.',
                    'Repeated use of this development set can overfit model selection.',
                    'No historical independent test was read or evaluated by this workflow.'])
    api.verify_freeze()
    del trainer, model, body, loaded_body, before; gc.collect()
    return report


def predict_saved(run, text):
    api = prior_api()
    admitted = api.admission(text, api.tokenizer())
    if not admitted['admitted']:
        return {'category': 'abstain', 'admission': admitted}
    head = json.loads((run / 'model/head.json').read_text())
    body = api.load_body(run / 'model/encoder')
    score = float(api.score_head(api.encode(body, [text]), head)[0])
    report = json.loads((run / 'dev-report.json').read_text())
    threshold = report['operatingPoint']['threshold']
    api.verify_freeze()
    return {'category': 'firm_delivery' if score >= threshold else 'other', 'score': score, 'uncalibratedScore': True,
            'threshold': threshold, 'devGatePassed': report['operatingPoint']['gatePassed'], 'admission': admitted}
