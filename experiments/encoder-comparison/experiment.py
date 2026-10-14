#!/usr/bin/env python3
"""Isolated CPU comparison. Evaluation emits aggregates only; prediction reads stdin."""
import argparse
import contextlib
import gc
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import sys
import time

from common import (ROOT, ARTIFACTS, DATA, MODEL_ID, SEEDS, HEAD_SETTINGS, admission, metrics,
                    normalize_text, overlap_audit, select_threshold, sha, tokens, validate_rows, validate_primary_profile, write_json)


def configure(online=False):
    settings = {'HF_HUB_DISABLE_TELEMETRY': '1', 'HF_HUB_DISABLE_IMPLICIT_TOKEN': '1',
                'DO_NOT_TRACK': '1', 'TOKENIZERS_PARALLELISM': 'false', 'WANDB_DISABLED': 'true', 'ACCELERATE_USE_CPU': 'true',
                'HF_HUB_OFFLINE': '0' if online else '1', 'TRANSFORMERS_OFFLINE': '0' if online else '1',
                'HF_DATASETS_OFFLINE': '0' if online else '1', 'HF_HOME': str(ARTIFACTS / 'model-cache')}
    os.environ.update(settings)
    return settings


def print_json(value):
    print(json.dumps(value, sort_keys=True, allow_nan=False), flush=True)


def reference():
    return json.loads((ARTIFACTS / 'model-reference.json').read_text())


def tokenizer():
    from transformers import AutoTokenizer
    return AutoTokenizer.from_pretrained(reference()['snapshot'], local_files_only=True, trust_remote_code=False)


def prepare(args):
    from huggingface_hub import HfApi, snapshot_download
    if (ARTIFACTS / 'model-reference.json').exists():
        raise ValueError('A pinned model reference already exists; do not overwrite it.')
    info = HfApi(token=False).model_info(MODEL_ID, revision=args.revision)
    revision = info.sha
    if not revision or len(revision) != 40:
        raise ValueError('An immutable model revision could not be resolved.')
    path = snapshot_download(MODEL_ID, revision=revision, token=False,
                             cache_dir=str(ARTIFACTS / 'model-cache/hub'),
                             allow_patterns=['*.json', '*.txt', 'README.md', 'LICENSE*', 'model.safetensors'])
    license_name = (info.card_data.to_dict() if info.card_data else {}).get('license')
    if license_name != 'apache-2.0':
        raise ValueError('Unexpected model license; review required before use.')
    files = {str(p.relative_to(path)): sha(p) for p in sorted(Path(path).rglob('*')) if p.is_file()}
    result = dict(modelId=MODEL_ID, revision=revision, license=license_name, snapshot=path, files=files,
                  modelCard='https://huggingface.co/' + MODEL_ID + '/blob/' + revision + '/README.md')
    write_json(ARTIFACTS / 'model-reference.json', result)
    print_json({k: result[k] for k in ('modelId', 'revision', 'license', 'snapshot')})


def coverage(rows, tok):
    checks = [admission(row['text'], tok) for row in rows]
    summary = dict(total=len(rows), admitted=sum(c['admitted'] for c in checks),
                   rejected=sum(not c['admitted'] for c in checks),
                   reasons={reason: sum(c['reason'] == reason for c in checks)
                            for reason in ('empty', 'character_limit', 'token_limit')},
                   maxTokens=max((c['tokens'] or 0 for c in checks), default=0),
                   maxUtf16Units=max((c['utf16Units'] for c in checks), default=0))
    return checks, summary


def preflight(args):
    rows = validate_rows(json.loads(Path(args.data).read_text()), allowed_splits=('train', 'dev', 'test'))
    _, report = coverage(rows, tokenizer())
    report['dataSha256'] = sha(args.data)
    report['tokenizerRevision'] = reference()['revision']
    report['predictionsComputed'] = False
    if args.out:
        write_json(args.out, report)
    print_json(report)
    if report['rejected']:
        raise ValueError('Input admission failed. No model predictions were computed.')


def load_body(path):
    import torch
    from sentence_transformers import SentenceTransformer
    torch.set_num_threads(4)
    torch.use_deterministic_algorithms(True)
    body = SentenceTransformer(str(path), device='cpu', local_files_only=True, trust_remote_code=False)
    body.max_seq_length = 256
    return body


def encode(body, texts):
    return body.encode(texts, batch_size=16, normalize_embeddings=True, convert_to_numpy=True,
                       show_progress_bar=False, device='cpu')


def new_head(seed=42):
    from sklearn.linear_model import LogisticRegression
    return LogisticRegression(**HEAD_SETTINGS, random_state=seed)


def cpu_trainer(model, args, dataset):
    """SetFit 1.1.3 omits device/report controls in its inner trainer constructor."""
    from unittest.mock import patch
    from setfit import Trainer
    from sentence_transformers import SentenceTransformerTrainingArguments
    def cpu_arguments(**kwargs):
        return SentenceTransformerTrainingArguments(use_cpu=True, report_to='none', disable_tqdm=True,
                                                    dataloader_pin_memory=False, **kwargs)
    # Inject supported constructor arguments before device selection and callbacks are initialized.
    # This is scoped to construction and does not modify installed package files.
    with patch('setfit.trainer.SentenceTransformerTrainingArguments', cpu_arguments):
        trainer = Trainer(model=model, args=args, train_dataset=dataset,
                          metric=lambda predictions, labels: metrics(list(labels), list(predictions)))
    if (str(trainer.st_trainer.args.device) != 'cpu' or str(trainer.st_trainer.accelerator.device) != 'cpu'
            or next(model.model_body.parameters()).device.type != 'cpu'):
        raise ValueError('The declared CPU-only training device was not respected.')
    if trainer.st_trainer.args.report_to not in ('none', [], ['none']):
        raise ValueError('External trainer reporting must remain disabled.')
    return trainer


def export_head(head):
    if head.classes_.tolist() != [0, 1]:
        raise ValueError('Unexpected classifier class order.')
    if int(head.n_iter_.max()) >= HEAD_SETTINGS['max_iter']:
        raise ValueError('Classifier failed to converge within its fixed budget.')
    return dict(classes=[0, 1], coefficients=head.coef_[0].tolist(), intercept=float(head.intercept_[0]),
                settings=HEAD_SETTINGS, iterations=head.n_iter_.tolist())


def validate_head(head):
    import numpy as np
    if head.get('classes') != [0, 1] or not isinstance(head.get('coefficients'), list) or not head['coefficients']:
        raise ValueError('Invalid classifier head.')
    if not np.isfinite(head['coefficients']).all() or not np.isfinite(head.get('intercept', float('nan'))):
        raise ValueError('Non-finite classifier head.')


def score_head(matrix, head):
    import numpy as np
    from scipy.special import expit
    validate_head(head)
    weights = np.asarray(head['coefficients'])
    if matrix.shape[1] != len(weights):
        raise ValueError('Embedding/head dimensions do not match.')
    return expit(matrix @ weights + head['intercept'])


def lexical_matrix(texts, artifact):
    import numpy as np
    from scipy.sparse import csr_matrix
    vocabulary, idf = artifact['vocabulary'], artifact['idf']
    indices, values, offsets = [], [], [0]
    for text in texts:
        words = tokens(text)
        features = words + [words[i] + ' ' + words[i + 1] for i in range(len(words) - 1)]
        counts = {}
        for feature in features:
            if feature in vocabulary:
                index = vocabulary[feature]
                counts[index] = counts.get(index, 0) + 1
        norm = sum((count * idf[i]) ** 2 for i, count in counts.items()) ** .5
        for i, count in sorted(counts.items()):
            indices.append(i); values.append(count * idf[i] / norm)
        offsets.append(len(indices))
    return csr_matrix((values, indices, offsets), shape=(len(texts), len(idf)), dtype=np.float64)


def candidate_info(name, kind, model_path, encoder_path, train_seconds, head, labels, scores, parity):
    policy = select_threshold(labels, scores.tolist())
    report = dict(name=name, kind=kind, modelPath=str(model_path.relative_to(ROOT)),
                  encoderPath=str(Path(encoder_path).relative_to(ROOT)) if encoder_path else None,
                  trainSeconds=train_seconds, head=head, operatingPoint=policy, scoreParityMaxError=parity,
                  primary=name in ('A', 'B', 'C42'))
    report['modelBytes'] = model_path.stat().st_size + (sum(p.stat().st_size for p in Path(encoder_path).rglob('*') if p.is_file()) if encoder_path else 0)
    return report


def train(_):
    import numpy as np
    import torch
    from sklearn.feature_extraction.text import TfidfVectorizer
    rows = validate_rows(json.loads(DATA.read_text()))
    training = sorted([r for r in rows if r['split'] == 'train'], key=lambda r: r['id'])
    dev = sorted([r for r in rows if r['split'] == 'dev'], key=lambda r: r['id'])
    if len(training) != 120 or len(dev) != 30:
        raise ValueError('Expected the audited unchanged 120 TRAIN / 30 DEV split.')
    for split in (training, dev):
        if {r['label'] for r in split} != {0, 1}:
            raise ValueError('Both binary labels are required in each split.')
    _, covered = coverage(rows, tokenizer())
    if covered['rejected']:
        raise ValueError('Training admission failure. No examples may be silently dropped.')
    output = ARTIFACTS / 'models'
    if (ARTIFACTS / 'training-summary.json').exists() or output.exists():
        raise ValueError('Training outputs already exist; preserve them rather than silently retraining.')
    output.mkdir(parents=True)
    train_texts, dev_texts = [r['text'] for r in training], [r['text'] for r in dev]
    train_labels, dev_labels = [r['label'] for r in training], [r['label'] for r in dev]
    candidates = []
    start = time.perf_counter()
    vectorizer = TfidfVectorizer(tokenizer=tokens, token_pattern=None, lowercase=False,
                                 ngram_range=(1, 2), norm='l2', smooth_idf=True)
    x = vectorizer.fit_transform(train_texts)
    head = new_head().fit(x, train_labels)
    a = dict(kind='tfidf', vocabulary={k: int(v) for k, v in vectorizer.vocabulary_.items()},
             idf=vectorizer.idf_.tolist(), head=export_head(head))
    a_path = output / 'A.json'; write_json(a_path, a)
    scores = score_head(lexical_matrix(dev_texts, a), a['head'])
    parity = float(np.max(np.abs(scores - head.predict_proba(vectorizer.transform(dev_texts))[:, 1])))
    if parity > 1e-12:
        raise ValueError('Lexical portable-score parity failed.')
    candidates.append(candidate_info('A', 'tfidf', a_path, None, time.perf_counter() - start,
                                     a['head'], dev_labels, scores, parity))
    print_json(dict(stage='A complete', seconds=candidates[-1]['trainSeconds'], devGate=candidates[-1]['operatingPoint']['gatePassed']))
    start = time.perf_counter()
    body = load_body(reference()['snapshot'])
    x, xdev = encode(body, train_texts), encode(body, dev_texts)
    head = new_head().fit(x, train_labels)
    b = dict(kind='encoder', head=export_head(head), normalizeEmbeddings=True)
    b_path = output / 'B.json'; write_json(b_path, b)
    scores = score_head(xdev, b['head'])
    parity = float(np.max(np.abs(scores - head.predict_proba(xdev)[:, 1])))
    candidates.append(candidate_info('B', 'encoder', b_path, reference()['snapshot'], time.perf_counter() - start,
                                     b['head'], dev_labels, scores, parity))
    print_json(dict(stage='B complete', seconds=candidates[-1]['trainSeconds'], devGate=candidates[-1]['operatingPoint']['gatePassed']))
    del body, x, xdev, head; gc.collect()
    from setfit import SetFitModel, Trainer, TrainingArguments
    from datasets import Dataset
    dataset = Dataset.from_dict({'text': train_texts, 'label': train_labels})
    recipe = dict(batch_size=16, num_iterations=5, max_steps=50, num_epochs=1, body_learning_rate=2e-5,
                  max_length=256, report_to='none', logging_strategy='no', eval_strategy='no', save_strategy='no',
                  show_progress_bar=False, use_amp=False, end_to_end=False)
    for seed in SEEDS:
        start = time.perf_counter()
        np.random.seed(seed); torch.manual_seed(seed)
        body = load_body(reference()['snapshot'])
        before = {name: parameter.detach().clone() for name, parameter in body.named_parameters()}
        model = SetFitModel(model_body=body, model_head=new_head(), normalize_embeddings=True)
        args = TrainingArguments(output_dir=str(ARTIFACTS / 'checkpoints' / str(seed)), seed=seed, **recipe)
        trainer = cpu_trainer(model, args, dataset)
        trainer.train()
        steps = int(trainer.st_trainer.state.global_step)
        changed, max_delta = 0, 0.0
        for name, parameter in body.named_parameters():
            delta = float((parameter.detach() - before[name]).abs().max())
            changed += int(delta > 0)
            max_delta = max(max_delta, delta)
        if steps != 50 or not changed:
            raise ValueError('SetFit did not perform the declared 50 encoder updates.')
        adaptation = dict(optimizationSteps=steps, changedParameterTensors=changed,
                          totalParameterTensors=len(before), maximumAbsoluteParameterChange=max_delta)
        del before
        path = output / f'C{seed}'
        encoder_path = path / 'encoder'; model.model_body.save_pretrained(str(encoder_path), safe_serialization=True)
        exported = dict(kind='encoder', head=export_head(model.model_head), normalizeEmbeddings=True, seed=seed)
        model_path = path / 'head.json'; write_json(model_path, exported)
        xdev = encode(model.model_body, dev_texts)
        scores = score_head(xdev, exported['head'])
        expected = model.model_head.predict_proba(xdev)[:, 1]
        parity = float(np.max(np.abs(scores - expected)))
        if parity > 1e-12:
            raise ValueError('Encoder portable-head score parity failed.')
        candidates.append(candidate_info(f'C{seed}', 'encoder', model_path, encoder_path,
                                         time.perf_counter() - start, exported['head'], dev_labels, scores, parity))
        candidates[-1]['encoderAdaptation'] = adaptation
        # Reload the saved encoder/head and verify the artifact that evaluation will consume.
        reloaded = Predictor(candidates[-1])
        reload_error = float(np.max(np.abs(np.asarray(reloaded.scores(dev_texts)) - scores)))
        if reload_error > 1e-6:
            raise ValueError('Saved encoder reload score parity failed.')
        candidates[-1]['reloadScoreParityMaxError'] = reload_error
        del reloaded
        print_json(dict(stage=f'C{seed} complete', seconds=candidates[-1]['trainSeconds'], devGate=candidates[-1]['operatingPoint']['gatePassed']))
        del model, body, trainer, xdev; gc.collect()
    for candidate in candidates[:2]:
        reloaded = Predictor(candidate)
        reload_scores = reloaded.scores(dev_texts)
        # The complete curve contains metrics, so independently reconstruct the predeclared selected result.
        expected = candidate['operatingPoint']['chosen']
        actual = metrics(dev_labels, [int(s >= candidate['operatingPoint']['threshold']) for s in reload_scores])
        if any(actual[key] != expected[key] for key in actual):
            raise ValueError('Saved baseline reload decision parity failed.')
        candidate['reloadDecisionParityPassed'] = True
        del reloaded
    versions = {name: importlib.metadata.version(name) for name in ('setfit', 'sentence-transformers', 'transformers', 'torch', 'scikit-learn', 'numpy', 'scipy', 'datasets')}
    report = dict(dataSha256=sha(DATA), modelRevision=reference()['revision'], coverage=covered, candidates=candidates,
                  counts={split: {'total': len([r for r in rows if r['split'] == split]),
                                  'positive': sum(r['label'] for r in rows if r['split'] == split)} for split in ('train', 'dev')},
                  versions=versions, python=platform.python_version(), device='cpu', torchThreads=4, classifierHeadSeed=42, setfitRecipe=recipe,
                  seedPolicy='42 primary; 43 and 44 robustness only. All five candidates frozen and reported; never select best test seed.')
    write_json(ARTIFACTS / 'training-summary.json', report)
    print_json(dict(stage='training complete', candidates=len(candidates), gates={c['name']: c['operatingPoint']['gatePassed'] for c in candidates}))


def summary():
    return json.loads((ARTIFACTS / 'training-summary.json').read_text())


class Predictor:
    def __init__(self, candidate):
        self.candidate = candidate
        self.artifact = json.loads((ROOT / candidate['modelPath']).read_text())
        validate_head(self.artifact['head'])
        self.body = load_body(ROOT / candidate['encoderPath']) if candidate['kind'] == 'encoder' else None

    def scores(self, texts):
        if not texts:
            return []
        matrix = encode(self.body, texts) if self.body else lexical_matrix(texts, self.artifact)
        return score_head(matrix, self.artifact['head']).tolist()


def predict(args):
    if (ARTIFACTS / 'freeze.json').exists():
        verify_freeze()
    text = sys.stdin.read(2001)
    admitted = admission(text, tokenizer())
    if not admitted['admitted']:
        print_json(dict(category='abstain', admission=admitted)); return
    candidate = next((c for c in summary()['candidates'] if c['name'] == args.candidate), None)
    if candidate is None:
        raise ValueError('Unknown candidate.')
    score = Predictor(candidate).scores([text])[0]
    threshold = candidate['operatingPoint']['threshold']
    # No text, quotes, IDs or filesystem persistence of stdin content.
    print_json(dict(candidate=args.candidate, category='firm_delivery' if score >= threshold else 'other',
                    score=score, threshold=threshold, uncalibratedScore=True, admission=admitted,
                    devGatePassed=candidate['operatingPoint']['gatePassed']))


def verify(_):
    """TRAIN-only reload determinism and local single-passage latency; no heldout data."""
    import numpy as np
    training = sorted([r for r in validate_rows(json.loads(DATA.read_text())) if r['split'] == 'train'], key=lambda r: r['id'])
    texts = [r['text'] for r in training[:10]]
    report = {'dataScope': 'First 10 sorted TRAIN rows only; no independent evaluation examples.', 'candidates': {}}
    for candidate in summary()['candidates']:
        started = time.perf_counter(); first = Predictor(candidate); load_seconds = time.perf_counter() - started
        expected = first.scores(texts)
        del first; gc.collect()
        second = Predictor(candidate)
        actual = second.scores(texts)
        delta = float(np.max(np.abs(np.asarray(actual) - np.asarray(expected))))
        if delta > 1e-12:
            raise ValueError('Saved model reload determinism failed.')
        second.scores([texts[0]])  # Explicit warmup, excluded from timing.
        samples = []
        for text in texts:
            started = time.perf_counter(); second.scores([text]); samples.append((time.perf_counter() - started) * 1000)
        report['candidates'][candidate['name']] = dict(reloadMaxScoreDifference=delta,
            singlePassageLatencyMilliseconds={'n': len(samples), 'median': float(np.median(samples)), 'p95': float(np.quantile(samples, .95))},
            modelLoadSeconds=load_seconds, modelBytes=candidate['modelBytes'], device='cpu', warmupExcluded=True)
        del second; gc.collect()
    write_json(ARTIFACTS / 'runtime-verification.json', report)
    print_json(report)


def freeze(_):
    manifest_path = ARTIFACTS / 'freeze.json'
    if manifest_path.exists():
        raise ValueError('A freeze already exists; do not overwrite it.')
    info = summary()
    files = list(ROOT.glob('*.py')) + list(ROOT.glob('requirements*')) + [DATA, ROOT / 'DESIGN.md',
             ARTIFACTS / 'training-summary.json', ARTIFACTS / 'model-reference.json']
    files.extend(p for p in (ROOT / 'tests').glob('*.py'))
    files.extend(p for p in (ROOT / 'data').glob('*') if p.is_file())
    if (ROOT / 'data-audit.md').exists():
        files.append(ROOT / 'data-audit.md')
    files.extend(p for p in (ARTIFACTS / 'runtime-verification.json', ARTIFACTS / 'setup-notes.json',
                            ARTIFACTS / 'engineering-verification.json', ARTIFACTS / 'lead-verification.json') if p.exists())
    files.extend(p for p in (ARTIFACTS / 'models').rglob('*') if p.is_file())
    files.extend(p for p in Path(reference()['snapshot']).rglob('*') if p.is_file())
    hashes = {str(path.relative_to(ROOT)): sha(path) for path in sorted(set(files))}
    bundle = hashlib.sha256(json.dumps(hashes, sort_keys=True).encode()).hexdigest()
    write_json(manifest_path, dict(bundleSha256=bundle, files=hashes,
                                  candidates={c['name']: c['operatingPoint'] for c in info['candidates']},
                                  frozenAtUtc=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())))
    print_json(dict(bundleSha256=bundle, files=len(hashes)))


def verify_freeze():
    frozen = json.loads((ARTIFACTS / 'freeze.json').read_text())
    for path, expected in frozen['files'].items():
        if sha(ROOT / path) != expected:
            raise ValueError('Frozen source, data or artifact hash changed. Evaluation refused.')
    return frozen


def claim_evaluation(bundle_hash, data_hash, out):
    out = Path(out)
    if out.exists():
        raise ValueError('Evaluation output exists; refusing overwrite or repeat.')
    marker = ARTIFACTS / ('.evaluation-used-' + bundle_hash)
    with marker.open('x') as stream:
        stream.write(json.dumps(dict(dataSha256=data_hash, state='started', out=str(out))))
    return marker


def evaluate(args):
    import numpy as np
    frozen = verify_freeze()
    raw_path = Path(args.data)
    rows = validate_rows(json.loads(raw_path.read_text()), allowed_splits=('test',))
    validate_primary_profile(rows, args.expected_count)
    training = validate_rows(json.loads(DATA.read_text()))
    overlap = overlap_audit(training, rows)
    if any(overlap.values()):
        raise ValueError('Independent test overlaps training/development.')
    checks, covered = coverage(rows, tokenizer())
    if args.require_all_admitted and covered['rejected']:
        raise ValueError('Primary admission failed before prediction. Use tokenizer-only preflight to inspect aggregates privately.')
    active = [r for r, c in zip(rows, checks) if c['admitted']]
    if not active:
        raise ValueError('No admitted examples. Evaluation refused.')
    out = Path(args.out)
    # A failed attempt after this point is recorded as consumed, never silently retried.
    marker = claim_evaluation(frozen['bundleSha256'], sha(raw_path), out)
    labels, texts = [r['label'] for r in active], [r['text'] for r in active]
    results = {}
    for candidate in summary()['candidates']:
        loaded = time.perf_counter(); predictor = Predictor(candidate); load_time = time.perf_counter() - loaded
        start = time.perf_counter(); scores = predictor.scores(texts); duration = time.perf_counter() - start
        predictions = [int(s >= candidate['operatingPoint']['threshold']) for s in scores]
        primary = metrics(labels, predictions)
        by_category = {category: metrics([r['label'] for r in active if r['category'] == category],
                                         [p for r, p in zip(active, predictions) if r['category'] == category])
                       for category in sorted({r['category'] for r in active})}
        results[candidate['name']] = dict(metrics=primary, categories=by_category,
                threshold=candidate['operatingPoint']['threshold'], devGatePassed=candidate['operatingPoint']['gatePassed'],
                primary=candidate['primary'], modelLoadSeconds=load_time, batchInferenceSeconds=duration,
                amortizedMillisecondsPerPassage=duration / len(active) * 1000,
                researchGatePassed=(candidate['operatingPoint']['gatePassed'] and primary['precision'] is not None and primary['precision'] >= .9 and primary['recall'] >= .7
                                    and all(by_category.get(c, {}).get('fp', 0) == 0 for c in ('request', 'reported'))))
        del predictor; gc.collect()
    verify_freeze()
    if sha(raw_path) != json.loads(marker.read_text())['dataSha256']:
        raise ValueError('Evaluation data changed during the run.')
    report = dict(scope='Independent synthetic author-labelled wording classification; no human validation or product integration claim.',
                  bundleSha256=frozen['bundleSha256'], dataSha256=sha(raw_path), coverage=covered, overlapAudit=overlap,
                  metricDenominator=len(active), originalDenominator=len(rows), results=results,
                  alwaysNegative=metrics(labels, [0] * len(labels)),
                  seedPolicy='C42 primary. C43/C44 are robustness only, all reported; no test-selected seed.',
                  primaryDecision='Research criteria are exploratory, not a deployment or reliability gate.')
    write_json(out, report)
    write_json(marker, dict(dataSha256=sha(raw_path), state='complete', reportSha256=sha(out)))
    print_json(report)


def main():
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest='command', required=True)
    preparation = commands.add_parser('prepare'); preparation.add_argument('--revision')
    pre = commands.add_parser('preflight'); pre.add_argument('--data', required=True); pre.add_argument('--out')
    commands.add_parser('train'); commands.add_parser('verify'); commands.add_parser('freeze')
    pred = commands.add_parser('predict'); pred.add_argument('--candidate', choices=('A', 'B', 'C42', 'C43', 'C44'), required=True)
    evaluate_parser = commands.add_parser('evaluate')
    evaluate_parser.add_argument('--data', required=True); evaluate_parser.add_argument('--out', required=True)
    evaluate_parser.add_argument('--expected-count', type=int, default=60)
    evaluate_parser.add_argument('--require-all-admitted', action='store_true')
    args = parser.parse_args()
    configure(online=args.command == 'prepare')
    try:
        globals()[args.command](args)
    except Exception as error:
        # Never include exception payloads: library errors can embed source text.
        print_json(dict(error='Operation failed without exposing input content.', errorType=type(error).__name__, command=args.command))
        raise SystemExit(1) from None


if __name__ == '__main__':
    main()
