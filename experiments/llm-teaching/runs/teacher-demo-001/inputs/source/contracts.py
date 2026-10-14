"""File-based LLM teaching contracts; no model calls or executable proposal content."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
PRIOR = ROOT.parent / 'encoder-comparison'
BASE_DATA = PRIOR / 'data/train-dev.json'
CATEGORIES = ('firm_delivery', 'qualified_delivery', 'request', 'reported', 'other')
OVERLAP_THRESHOLD = .85


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def read_json(path):
    path = Path(path)
    if path.stat().st_size > 2_000_000:
        raise ValueError('JSON input exceeds the bounded teaching-file size.')
    def unique_pairs(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("Duplicate JSON object key.")
            result[key] = value
        return result
    return json.loads(path.read_text(), object_pairs_hook=unique_pairs)


def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + '\n')


def run_id(value):
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,63}', value):
        raise ValueError('Use a short lowercase run or batch ID with digits and hyphens.')
    return value


def text_field(value, limit=2000):
    return isinstance(value, str) and bool(value.strip()) and len(value) <= limit


def identity(value):
    if not isinstance(value, dict) or set(value) != {'actorId', 'model'} or not all(text_field(v, 200) for v in value.values()):
        raise ValueError('Expected explicit actor and model provenance.')


def validate_batch(batch):
    if not isinstance(batch, dict) or set(batch) != {'schemaVersion', 'batchId', 'teacher', 'syntheticOnly', 'examples'}:
        raise ValueError('Unexpected proposal schema.')
    if type(batch['schemaVersion']) is not int or batch['schemaVersion'] != 1 or batch['syntheticOnly'] is not True:
        raise ValueError('Only version1 newly fictional teaching proposals are supported.')
    run_id(batch['batchId']); identity(batch['teacher'])
    rows = batch['examples']
    if not isinstance(rows, list) or not 8 <= len(rows) <= 40:
        raise ValueError('A batch must contain 8 to 40 examples.')
    ids = set(); groups = set(); counts = {c: 0 for c in CATEGORIES}
    for row in rows:
        if not isinstance(row, dict) or set(row) != {'id', 'group', 'text', 'suggestedLabel', 'suggestedCategory', 'rationale'}:
            raise ValueError('Unexpected proposal record fields.')
        if not isinstance(row['id'], str) or not re.fullmatch(r'ex_[0-9a-f]{8,32}', row['id']) or row['id'] in ids:
            raise ValueError('Example IDs must be distinct opaque ex_hex identifiers.')
        if not isinstance(row['group'], str) or not re.fullmatch(r'fam_[0-9a-f]{8,32}', row['group']):
            raise ValueError('Scenario IDs must be opaque fam_hex identifiers.')
        if not text_field(row['text']) or not text_field(row['rationale'], 1200):
            raise ValueError('Empty or oversized proposal text/rationale.')
        if type(row['suggestedLabel']) is not int or row['suggestedLabel'] not in (0, 1) or row['suggestedCategory'] not in CATEGORIES:
            raise ValueError('Invalid suggested label/category.')
        if (row['suggestedCategory'] == 'firm_delivery') != bool(row['suggestedLabel']):
            raise ValueError('Suggested label/category mismatch.')
        counts[row['suggestedCategory']] += 1
        ids.add(row['id']); groups.add(row['group'])
    if len(groups) > 10 or counts['firm_delivery'] > 20 or any(counts[c] > 5 for c in CATEGORIES[1:]):
        raise ValueError('Batch exceeds the predeclared category/family budget.')
    return batch


def opaque_id(batch_hash, example_id):
    return 'review_' + hashlib.sha256((batch_hash + ':' + example_id).encode()).hexdigest()[:20]


def make_packet(batch, batch_hash):
    rows = [{'id': opaque_id(batch_hash, row['id']), 'text': row['text']} for row in batch['examples']]
    # Hash-sort prevents teacher ordering and label/family patterns leaking to reviewers.
    rows.sort(key=lambda row: hashlib.sha256(('review-order-v1:' + row['id']).encode()).hexdigest())
    return {'schemaVersion': 1, 'batchId': batch['batchId'], 'batchSha256': batch_hash, 'items': rows}


def validate_review(review, batch, batch_hash, packet, packet_hash):
    required = {'schemaVersion', 'batchId', 'batchSha256', 'packetSha256', 'reviewer', 'decisions'}
    if not isinstance(review, dict) or set(review) != required:
        raise ValueError('Unexpected review schema.')
    if (type(review['schemaVersion']) is not int or review['schemaVersion'] != 1 or review['batchId'] != batch['batchId'] or review['batchSha256'] != batch_hash
            or review['packetSha256'] != packet_hash or packet != make_packet(batch, batch_hash)):
        raise ValueError('Review must bind the exact unchanged proposal and blind packet.')
    identity(review['reviewer'])
    if review['reviewer']['actorId'].strip().casefold() == batch['teacher']['actorId'].strip().casefold():
        raise ValueError('Teacher and reviewer must be different declared actors.')
    decisions = review['decisions']
    if not isinstance(decisions, list) or len(decisions) != len(packet['items']):
        raise ValueError('Every blind packet item requires exactly one decision.')
    indexed = {}
    expected = {row['id'] for row in packet['items']}
    for decision in decisions:
        if not isinstance(decision, dict) or set(decision) != {'id', 'status', 'label', 'category', 'rationale'}:
            raise ValueError('Unexpected independent decision fields.')
        if decision['id'] not in expected or decision['id'] in indexed or not text_field(decision['rationale'], 1200):
            raise ValueError('Missing, duplicate, unknown or unexplained independent decision.')
        if decision['status'] == 'clear':
            if type(decision['label']) is not int or decision['label'] not in (0, 1) or decision['category'] not in CATEGORIES:
                raise ValueError('Clear decisions require binary labels and known categories.')
            if (decision['category'] == 'firm_delivery') != bool(decision['label']):
                raise ValueError('Independent label/category mismatch.')
        elif decision['status'] in ('ambiguous', 'rejected'):
            if decision['label'] is not None or decision['category'] != 'ambiguous':
                raise ValueError('Quarantined review decisions must use null label and ambiguous category.')
        else:
            raise ValueError('Unknown review decision status.')
        indexed[decision['id']] = decision
    return indexed


def normalized(text):
    return ' '.join(text.casefold().split())


def word_set(text):
    return set(re.findall(r"[a-z0-9]+(?:'[a-z]+)?", text.lower().replace('’', "'")))


def similarity(a, b):
    first, second = word_set(a), word_set(b)
    return len(first & second) / len(first | second) if first | second else 1


def assess(batch, batch_hash, decisions, base, admission):
    groups = {}
    for row in batch['examples']:
        groups.setdefault(row['group'], []).append(row)
    reasons = {group: set() for group in groups}
    existing_groups = {row['group'] for row in base}
    existing_ids = {row['id'] for row in base}
    for group, rows in groups.items():
        if group in existing_groups:
            reasons[group].add('existing_family_id')
        if {r['suggestedLabel'] for r in rows} != {0, 1}:
            reasons[group].add('family_needs_positive_and_negative_contrast')
        for row in rows:
            if row['id'] in existing_ids:
                reasons[group].add('existing_example_id')
            decision = decisions[opaque_id(batch_hash, row['id'])]
            if decision['status'] != 'clear':
                reasons[group].add('review_ambiguous_or_rejected')
            elif (decision['label'], decision['category']) != (row['suggestedLabel'], row['suggestedCategory']):
                reasons[group].add('teacher_reviewer_disagreement')
            if not admission(row['text'])['admitted']:
                reasons[group].add('input_admission')
            if any(normalized(row['text']) == normalized(old['text']) for old in base):
                reasons[group].add('exact_overlap_with_existing_data')
            if any(similarity(row['text'], old['text']) >= OVERLAP_THRESHOLD for old in base):
                reasons[group].add('near_overlap_with_existing_data')
    proposed = batch['examples']
    for i, first in enumerate(proposed):
        for second in proposed[i + 1:]:
            if normalized(first['text']) == normalized(second['text']):
                reasons[first['group']].add('duplicate_within_batch'); reasons[second['group']].add('duplicate_within_batch')
            elif first['group'] != second['group'] and similarity(first['text'], second['text']) >= OVERLAP_THRESHOLD:
                reasons[first['group']].add('near_overlap_between_families'); reasons[second['group']].add('near_overlap_between_families')
    accepted, quarantined = [], []
    for row in proposed:
        if reasons[row['group']]:
            quarantined.append({'id': row['id'], 'group': row['group'], 'reasons': sorted(reasons[row['group']])})
        else:
            accepted.append({'id': row['id'], 'group': row['group'], 'split': 'train', 'text': row['text'],
                             'label': row['suggestedLabel'], 'category': row['suggestedCategory'],
                             'rationale': row['rationale'], 'sourceBatch': batch['batchId']})
    return accepted, quarantined
