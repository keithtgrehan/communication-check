#!/usr/bin/env python3
"""One local model per process; JSON jobs, no input text in result/error logs.

Download is a separate public-artifact operation. Score/train are offline; the
controller additionally enforces OS network denial. NLI scores are independent
checkpoint entailment probabilities, never a softmax over rubric categories.
"""
import argparse
import hashlib
import importlib.metadata
import importlib.util
import json
import math
import os
from pathlib import Path
import platform
import re
import resource
import sys
import time

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
MODEL_IDS = {
    'deberta': 'MoritzLaurer/deberta-v3-base-zeroshot-v2.0-c',
    'modernbert': 'MoritzLaurer/ModernBERT-base-zeroshot-v2.0',
}
MODEL_REVISIONS = {
    'deberta': 'bddf8c5411c34ac3565e16e04384fd68b2618dda',
    'modernbert': 'd421c4545a438fd006fb43f8b981c5d908faa1e1',
}
HYPOTHESES = {
    'firm_delivery': 'The author unconditionally promises that they or their team will deliver a concrete work item in the future.',
    'qualified_delivery': 'The author describes conditional, tentative, estimated, hoped-for, or planned but unassured future delivery of work.',
    'request': 'The author asks the recipient to take an action rather than making a new delivery promise.',
    'reported': 'The passage quotes, attributes, or recalls a delivery assertion rather than making a new assertion by the author.',
    'other': 'The passage describes negated, hypothetical, completed past, or descriptive content rather than a future delivery promise.',
}
DOWNLOAD_PATTERNS = [
    'config.json', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json',
    'added_tokens.json', 'vocab.json', 'vocab.txt', 'merges.txt', 'spm.model',
    'sentencepiece.bpe.model', 'tokenizer.model', '*.safetensors', '*.safetensors.index.json',
    'README*', 'LICENSE*', 'license*',
]


class UnsupportedDependency(Exception):
    """An optional arm is unavailable; never install into an existing environment."""


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.tmp')
    temp.write_text(json.dumps(data, indent=2, sort_keys=True, allow_nan=False) + '\n')
    temp.replace(path)


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def configure(online=False):
    os.environ.update({
        'HF_HUB_DISABLE_TELEMETRY': '1', 'HF_HUB_DISABLE_IMPLICIT_TOKEN': '1',
        'DO_NOT_TRACK': '1', 'TOKENIZERS_PARALLELISM': 'false', 'WANDB_DISABLED': 'true',
        'ACCELERATE_USE_CPU': 'true', 'HF_HUB_OFFLINE': '0' if online else '1',
        'TRANSFORMERS_OFFLINE': '0' if online else '1', 'HF_DATASETS_OFFLINE': '1',
        'HF_HUB_DISABLE_PROGRESS_BARS': '1',
    })


def dependencies():
    result = {}
    for package in ('torch', 'transformers', 'huggingface-hub', 'setfit', 'sentence-transformers'):
        try:
            result[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            result[package] = None
    return result


def hardware():
    return dict(system=platform.system(), machine=platform.machine(), processor=platform.processor(),
                python=platform.python_version(), device='cpu', threads=4, logicalCpuCount=os.cpu_count())


def peak_rss_bytes():
    value = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return int(value if sys.platform == 'darwin' else value * 1024)


def pinned_revision(job):
    revision = job.get('revision')
    if not isinstance(revision, str) or not re.fullmatch(r'[a-f0-9]{40}', revision):
        raise ValueError('A full immutable 40-character checkpoint revision is required.')
    if job.get('candidate') in MODEL_REVISIONS and revision != MODEL_REVISIONS[job['candidate']]:
        raise ValueError('Checkpoint revision differs from the approved research checkpoint.')
    return revision


def absolute_path(job, key):
    path = Path(job[key])
    if not path.is_absolute():
        raise ValueError('Model and run paths must be absolute.')
    return path.resolve()


def hypothesis_map(job):
    override = job.get('hypotheses')
    if override is None:
        return dict(HYPOTHESES)
    if (not isinstance(override, dict) or set(override) != {'firm_delivery'}
            or not isinstance(override['firm_delivery'], str) or not override['firm_delivery'].strip()
            or len(override['firm_delivery']) > 1000):
        raise ValueError('An external benchmark override requires one firm_delivery hypothesis.')
    return dict(override)


def admit(text, tokenizer, hypotheses=None):
    if not isinstance(text, str):
        raise ValueError('Text must be a string.')
    units = len(text.encode('utf-16-le')) // 2
    if not text.strip():
        return dict(admitted=False, reason='empty', utf16Units=units, tokens=None)
    if units > 2000:
        return dict(admitted=False, reason='character_limit', utf16Units=units, tokens=None)
    pairs = list(hypotheses.values()) if hypotheses else [None]
    counts = [len(tokenizer(text, text_pair=h, add_special_tokens=True, truncation=False)['input_ids'])
              for h in pairs]
    count = max(counts)
    return dict(admitted=count <= 256, reason=None if count <= 256 else 'token_limit',
                utf16Units=units, tokens=count)


def entailment_index(config):
    """Use the actual checkpoint label mapping; never guess LABEL_0 ordering."""
    matches = set()
    for label, index in (getattr(config, 'label2id', None) or {}).items():
        if str(label).casefold() == 'entailment':
            matches.add(int(index))
    for index, label in (getattr(config, 'id2label', None) or {}).items():
        if str(label).casefold() == 'entailment':
            matches.add(int(index))
    if len(matches) != 1:
        raise ValueError('Checkpoint must identify one consistent entailment label.')
    index = matches.pop()
    if not 0 <= index < config.num_labels:
        raise ValueError('Entailment label index is out of range.')
    return index


def require_dependencies(candidate):
    available = dependencies()
    if not available['torch'] or not available['transformers']:
        raise UnsupportedDependency('torch_or_transformers_missing')
    if candidate == 'modernbert':
        from transformers.models.auto.configuration_auto import CONFIG_MAPPING_NAMES
        if 'modernbert' not in CONFIG_MAPPING_NAMES:
            raise UnsupportedDependency('installed_transformers_has_no_modernbert')


def snapshot_files(model_dir):
    result = {}
    for path in sorted(model_dir.rglob('*')):
        relative = path.relative_to(model_dir)
        if '.cache' in relative.parts or path.name == 'worker-model-reference.json':
            continue
        if path.is_file():
            if not path.resolve().is_relative_to(model_dir):
                raise ValueError('Downloaded model contains an escaping file link.')
            if path.suffix in ('.bin', '.pt', '.pth', '.pkl', '.pickle', '.py'):
                raise ValueError('Unsafe executable or pickle artifact in model directory.')
            result[str(relative)] = sha(path)
    return result


def download(job):
    candidate, revision = job['candidate'], pinned_revision(job)
    if candidate not in MODEL_IDS:
        raise ValueError('Only the declared public NLI checkpoints can be downloaded.')
    require_dependencies(candidate)
    from huggingface_hub import HfApi, snapshot_download
    model_dir = absolute_path(job, 'model_dir')
    if model_dir.exists() and any(model_dir.iterdir()):
        raise ValueError('Model destination must be empty; preserve previous downloads.')
    started = time.perf_counter()
    info = HfApi(token=False).model_info(MODEL_IDS[candidate], revision=revision)
    card = info.card_data.to_dict() if info.card_data else {}
    license_name = card.get('license')
    # Check metadata and license BEFORE downloading any checkpoint weights.
    if info.sha != revision or license_name not in ('apache-2.0', 'mit'):
        raise ValueError('Checkpoint revision or model license is not approved.')
    siblings = [entry.rfilename for entry in info.siblings or []]
    if not any(name.endswith('.safetensors') for name in siblings):
        raise ValueError('Checkpoint does not offer safe tensor weights.')
    snapshot_download(MODEL_IDS[candidate], revision=revision, token=False,
                      local_dir=str(model_dir), allow_patterns=DOWNLOAD_PATTERNS)
    files = snapshot_files(model_dir)
    if 'config.json' not in files or not any(p.endswith('.safetensors') for p in files):
        raise ValueError('Downloaded checkpoint is incomplete.')
    reference = dict(candidate=candidate, modelId=MODEL_IDS[candidate], revision=revision,
                     license=license_name, files=files,
                     usage='Local research only; no product integration or commercial distillation.',
                     trainingDataLicenseCaveat=('Mixed training-data licenses; model license does not relicense training data.'
                                               if candidate == 'modernbert' else None),
                     modelCard=f'https://huggingface.co/{MODEL_IDS[candidate]}/blob/{revision}/README.md')
    write_json(model_dir / 'worker-model-reference.json', reference)
    return dict(status='ok', provenance=reference, timing=dict(downloadSeconds=time.perf_counter() - started),
                modelBytes=sum((model_dir / p).stat().st_size for p in files))


def verify_model(job):
    model_dir = absolute_path(job, 'model_dir')
    reference = json.loads((model_dir / 'worker-model-reference.json').read_text())
    if (reference.get('revision') != pinned_revision(job)
            or reference.get('modelId') != MODEL_IDS[job['candidate']]
            or reference.get('license') not in ('apache-2.0', 'mit')
            or reference.get('files') != snapshot_files(model_dir)):
        raise ValueError('Model identity, license, or files differ from pinned download.')
    return model_dir, reference


def score_nli(job):
    candidate = job['candidate']
    require_dependencies(candidate)
    model_dir, reference = verify_model(job)
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    torch.set_num_threads(4)
    start = time.perf_counter()
    tokenizer = AutoTokenizer.from_pretrained(str(model_dir), local_files_only=True, trust_remote_code=False)
    model = AutoModelForSequenceClassification.from_pretrained(
        str(model_dir), local_files_only=True, trust_remote_code=False, use_safetensors=True)
    model.to('cpu').eval()
    if any(p.device.type != 'cpu' for p in model.parameters()):
        raise ValueError('CPU-only model constraint failed.')
    index = entailment_index(model.config)
    load_seconds = time.perf_counter() - start
    hypotheses = hypothesis_map(job)
    texts = job['texts']
    admitted = [admit(text, tokenizer, hypotheses) for text in texts]
    probabilities = [{} for _ in texts]
    pairs = [(i, category, text, hypothesis) for i, text in enumerate(texts) if admitted[i]['admitted']
             for category, hypothesis in hypotheses.items()]
    start = time.perf_counter()
    with torch.inference_mode():
        for offset in range(0, len(pairs), 8):
            batch = pairs[offset:offset + 8]
            inputs = tokenizer([p[2] for p in batch], text_pair=[p[3] for p in batch],
                               padding=True, truncation=False, return_tensors='pt')
            if inputs['input_ids'].shape[1] > 256:
                raise ValueError('Paired token admission disagrees with inference tokenizer.')
            values = torch.softmax(model(**inputs).logits.float(), dim=-1)[:, index].tolist()
            for (i, category, _, _), value in zip(batch, values):
                probabilities[i][category] = value
    scores, categories = [], []
    for row in probabilities:
        scores.append(row.get('firm_delivery'))
        other = {k: v for k, v in row.items() if k != 'firm_delivery'}
        categories.append(max(other, key=other.get) if other else None)
    return dict(status='ok', scores=scores, categories=categories, admission=admitted,
                evidence=None, rationale=None,
                provenance=dict(reference, hypotheses=hypotheses, entailmentIndex=index,
                    scoreMeaning='Independent checkpoint entailment probability for firm_delivery; uncalibrated.',
                    secondaryCategoryMeaning='Maximum entailment among non-firm hypotheses; diagnostic only.',
                    batchSize=8, truncation=False),
                timing=dict(loadSeconds=load_seconds, inferenceSeconds=time.perf_counter() - start))


def adapter():
    spec = importlib.util.spec_from_file_location('_automation_frozen_adapter', ROOT.parent / 'model_adapter.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def score_compact(job):
    frozen = adapter()
    start = time.perf_counter()
    with frozen._protected_use():
        api = frozen.prior_api()
        tokenizer = api.tokenizer()
        texts = job['texts']
        admitted = [admit(text, tokenizer) for text in texts]
        accepted = [text for text, item in zip(texts, admitted) if item['admitted']]
        reference = api.reference()
        provenance = dict(candidate=job['candidate'], modelId=reference.get('modelId', 'sentence-transformers/all-MiniLM-L6-v2'),
                          revision=reference['revision'], license=reference['license'],
                          scoreMeaning='Uncalibrated logistic probability; no secondary category classifier.',
                          truncation=False, batchSize=16)
        if job['candidate'] == 'C42':
            candidate = next(c for c in api.summary()['candidates'] if c['name'] == 'C42')
            predictor = api.Predictor(candidate)
            score = predictor.scores
            provenance['frozenBundleSha256'] = frozen.EXPECTED_PRIOR_BUNDLE
        else:
            run = frozen._run_path(absolute_path(job, 'run_dir'))
            for relative in ('model', 'model/head.json', 'model/encoder'):
                if not (run / relative).resolve().is_relative_to(run):
                    raise ValueError('Candidate model escapes its run.')
            head = json.loads((run / 'model/head.json').read_text())
            body = api.load_body(run / 'model/encoder')
            if any(p.device.type != 'cpu' for p in body.parameters()):
                raise ValueError('CPU-only model constraint failed.')
            score = lambda items: api.score_head(api.encode(body, items), head).tolist() if items else []
            provenance['headSha256'] = sha(run / 'model/head.json')
            provenance['encoderFiles'] = snapshot_files(run / 'model/encoder')
        load_seconds = time.perf_counter() - start
        start = time.perf_counter()
        values = iter(frozen._scores_valid(score(accepted), len(accepted)))
        scores = [next(values) if item['admitted'] else None for item in admitted]
        return dict(status='ok', scores=scores, categories=[None] * len(texts), admission=admitted,
                    evidence=None, rationale=None, provenance=provenance,
                    timing=dict(loadSeconds=load_seconds, inferenceSeconds=time.perf_counter() - start))


def train(job):
    if job['candidate'] != 'setfit-auto':
        raise ValueError('Only the compact setfit-auto candidate can be trained.')
    run = absolute_path(job, 'run_dir')
    if (run / 'train-report.json').exists():
        raise ValueError('Training report already exists; no implicit retry.')
    report = adapter().train_candidate(run, job['data'], job['recipe'])
    write_json(run / 'train-report.json', report)
    return dict(status='ok', report=report, provenance=dict(candidate='setfit-auto',
                revision=report['modelRevision'], license='apache-2.0', recipe=job['recipe']),
                timing=dict(trainingSeconds=report['fitSeconds'], workflowSeconds=report['totalWorkflowSeconds']))


def execute(job):
    started = time.perf_counter()
    if not isinstance(job, dict) or job.get('candidate') not in ('C42', 'setfit-auto', *MODEL_IDS):
        raise ValueError('Unknown candidate.')
    action = job.get('action')
    if action not in ('download', 'train', 'score'):
        raise ValueError('Unknown action.')
    if action == 'score' and (not isinstance(job.get('texts'), list) or any(not isinstance(t, str) for t in job['texts'])):
        raise ValueError('Expected a list of text strings.')
    configure(online=action == 'download')
    try:
        if action == 'download':
            result = download(job)
        elif action == 'train':
            result = train(job)
        elif job['candidate'] in MODEL_IDS:
            result = score_nli(job)
        else:
            result = score_compact(job)
    except (UnsupportedDependency, ModuleNotFoundError) as error:
        result = dict(status='skipped', reason='unsupported_dependency', errorType=type(error).__name__,
                      provenance=dict(candidate=job['candidate']))
    for value in result.get('scores', []):
        if value is not None and (isinstance(value, bool) or not math.isfinite(value) or not 0 <= value <= 1):
            raise ValueError('Invalid score.')
    result['provenance'].update(hardware=hardware(), dependencies=dependencies())
    result.setdefault('timing', {})['totalSeconds'] = time.perf_counter() - started
    result['peakRssBytes'] = peak_rss_bytes()
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--job', required=True, help='JSON job file')
    parser.add_argument('--out', required=True, help='JSON result file')
    args = parser.parse_args()
    try:
        result = execute(json.loads(Path(args.job).read_text()))
    except Exception as error:
        result = dict(status='failed', errorType=type(error).__name__,
                      reason='Worker failed; input and exception text intentionally omitted.', peakRssBytes=peak_rss_bytes())
        write_json(args.out, result)
        return 1
    write_json(args.out, result)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
