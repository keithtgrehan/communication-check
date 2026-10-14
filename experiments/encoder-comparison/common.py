"""Shared deterministic contract. These functions do not load a model or access a network."""
import hashlib
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ARTIFACTS = ROOT / 'artifacts'
DATA = ROOT / 'data/train-dev.json'
MODEL_ID = 'sentence-transformers/all-MiniLM-L6-v2'
SEEDS = (42, 43, 44)
HEAD_SETTINGS = dict(C=1.0, solver='liblinear', class_weight='balanced', max_iter=1000, tol=1e-8)
CATEGORIES = ('firm_delivery', 'qualified_delivery', 'request', 'reported', 'other')


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + '\n')


def normalize_text(text):
    return ' '.join(text.casefold().split())


def tokens(text):
    return re.findall(r"[a-z]+(?:'[a-z]+)?|[0-9]+", text.lower().replace('’', "'"))


def validate_rows(rows, allowed_splits=('train', 'dev')):
    if not isinstance(rows, list) or not rows:
        raise ValueError('Expected a nonempty record array.')
    seen_ids, seen_texts, group_splits = set(), set(), {}
    for row in rows:
        if not isinstance(row, dict) or any(key not in row for key in ('id', 'group', 'split', 'text', 'label', 'category')):
            raise ValueError('Required record fields missing.')
        if any(not isinstance(row[k], str) or not row[k] for k in ('id', 'group', 'text')):
            raise ValueError('Invalid record identifiers or text.')
        if type(row['label']) is not int or row['label'] not in (0, 1) or row['category'] not in CATEGORIES:
            raise ValueError('Expected binary author labels and known categories.')
        if (row['category'] == 'firm_delivery') != bool(row['label']):
            raise ValueError('Label/category mismatch.')
        if row['split'] not in allowed_splits:
            raise ValueError('Disallowed split.')
        if row['id'] in seen_ids or normalize_text(row['text']) in seen_texts:
            raise ValueError('Duplicate record or normalized text.')
        if row['group'] in group_splits and group_splits[row['group']] != row['split']:
            raise ValueError('Scenario group crosses splits.')
        seen_ids.add(row['id']); seen_texts.add(normalize_text(row['text']))
        group_splits[row['group']] = row['split']
    return rows


def admission(text, tokenizer):
    if not isinstance(text, str) or not text.strip():
        return dict(admitted=False, reason='empty', utf16Units=0, tokens=None)
    length = len(text.encode('utf-16-le')) // 2
    if length > 2000:
        return dict(admitted=False, reason='character_limit', utf16Units=length, tokens=None)
    # Explicitly disable truncation; special tokens count toward the shared limit.
    count = len(tokenizer(text, add_special_tokens=True, truncation=False)['input_ids'])
    reason = 'token_limit' if count > 256 else None
    return dict(admitted=reason is None, reason=reason, utf16Units=length, tokens=count)


def metrics(labels, predictions):
    if len(labels) != len(predictions):
        raise ValueError('Metric lengths differ.')
    tp = sum(y == 1 and p == 1 for y, p in zip(labels, predictions))
    fp = sum(y == 0 and p == 1 for y, p in zip(labels, predictions))
    tn = sum(y == 0 and p == 0 for y, p in zip(labels, predictions))
    fn = sum(y == 1 and p == 0 for y, p in zip(labels, predictions))
    precision = tp / (tp + fp) if tp + fp else None
    recall = tp / (tp + fn) if tp + fn else None
    return dict(n=len(labels), tp=tp, fp=fp, tn=tn, fn=fn, precision=precision, recall=recall,
                f1=2 * tp / (2 * tp + fp + fn) if 2 * tp + fp + fn else 0,
                accuracy=(tp + tn) / len(labels) if labels else None,
                falsePositiveRate=fp / (fp + tn) if fp + tn else None)


def select_threshold(labels, scores):
    if len(labels) != len(scores) or any(not math.isfinite(s) or not 0 <= s <= 1 for s in scores):
        raise ValueError('Invalid model scores.')
    curve = [dict(threshold=i / 100, **metrics(labels, [int(s >= i / 100) for s in scores]))
             for i in range(5, 96, 5)]
    eligible = [r for r in curve if r['precision'] is not None and r['precision'] >= .9 and r['recall'] is not None and r['recall'] >= .7]
    chosen = max(eligible, key=lambda r: (r['recall'], r['precision'], r['threshold'])) if eligible else next(r for r in curve if r['threshold'] == .5)
    return dict(threshold=chosen['threshold'], gatePassed=bool(eligible), chosen=chosen, curve=curve,
                policy='Thresholds 0.05..0.95 by 0.05; require precision>=0.90 AND recall>=0.70; maximize recall, precision, threshold. Otherwise 0.50 diagnostic only.')


def overlap_audit(training, test):
    texts = {normalize_text(r['text']) for r in training}
    groups = {r['group'] for r in training}
    return dict(normalizedTextDuplicates=sum(normalize_text(r['text']) in texts for r in test),
                groupOverlaps=sum(r['group'] in groups for r in test))


def validate_primary_profile(rows, expected_count=60):
    if expected_count and len(rows) != expected_count:
        raise ValueError('Independent test count differs from the frozen expected count.')
    if expected_count == 60 and (sum(r['label'] for r in rows) != 30 or
            {r['category'] for r in rows if not r['label']} != {'qualified_delivery', 'request', 'reported', 'other'}):
        raise ValueError('Primary test requires 30 positives, 30 negatives and all four negative categories.')
