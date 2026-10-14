"""Pure contracts for a bounded, synthetic, family-level acquisition experiment."""
import hashlib
import json
import math
import random
import re
from pathlib import Path

CATEGORIES = ('firm_delivery', 'qualified_delivery', 'request', 'reported', 'other')
PROTOCOL = {
    'version': 2, 'seed': 42, 'poolPassages': 300, 'familySize': 4,
    'maxRounds': 3, 'familiesPerRound': 10, 'randomFamilies': 2,
    'disagreementFamilies': 5, 'uncertaintyFamilies': 3,
    'minimumAcceptedFamilies': 2, 'nearDuplicateJaccard': .85,
    'trainingSeconds': 600, 'experimentSeconds': 5400, 'artifactBytes': 2_000_000_000,
    'finalPassages': 120, 'finalMinimumFamilies': 27,
    'finalMinimumPerClass': 50, 'finalMinimumPerNegativeCategory': 10,
    'bootstrapResamples': 10000, 'baseTrainRows': 120, 'devRows': 30,
    'trainingRecipe': {'seed': 42, 'classifierHeadSeed': 42, 'batchSize': 16,
                       'pairIterations': 5, 'bodySteps': 50, 'learningRate': .00002},
    'target': 'author-owned unqualified future delivery of a concrete work item',
    'selection': 'random first; frozen A/B disagreement count; current SetFit min abs(score-threshold)',
    'shortage': 'disagreement deficit transfers to uncertainty; fewer than ten eligible families stops acquisition',
    'lineage': 'original120 plus cumulative agreed new families; original pretrained checkpoint each round',
    'threshold': '0.05..0.95 step0.05; precision>=.9 recall>=.7; max recall,precision,threshold; otherwise .5 diagnostic',
    'winner': 'passing: recall,precision,earliest; otherwise diagnostic F1,-FP,TP,earliest',
    'humanAudit': 'all disputes plus max(4,ceil(accepted*.1)) stratified random agreements; pending permitted',
    'final': 'one selected new candidate plus A/B/C42; no historical heldouts; no replacement or replay',
    'stops': '3rounds; insufficient pool/additions; integrity/resource/fit failure; human accepted-label correction',
}

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, allow_nan=False).encode()).hexdigest()

def sha(path):
    result = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()

def read(path):
    path = Path(path)
    if path.stat().st_size > 20_000_000:
        raise ValueError('Oversized JSON')
    def pairs(items):
        out = {}
        for key, value in items:
            if key in out:
                raise ValueError('Duplicate JSON key')
            out[key] = value
        return out
    return json.loads(path.read_text(), object_pairs_hook=pairs,
                      parse_constant=lambda value: (_ for _ in ()).throw(ValueError('Nonfinite JSON')))

def write_new(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        stream.write(json.dumps(value, sort_keys=True, indent=2, allow_nan=False) + '\n')

def check_id(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,79}', value):
        raise ValueError('Invalid identifier')
    return value

def normalized(text):
    return ' '.join(text.casefold().split())

def words(text):
    return set(re.findall(r"[a-z0-9]+(?:'[a-z]+)?", text.lower().replace('’', "'")))

def similar(a, b):
    first, second = words(a), words(b)
    return len(first & second) / len(first | second) if first | second else 1.

def actor(value):
    if not isinstance(value, dict) or set(value) != {'actorId', 'model'} or any(
            not isinstance(v, str) or not v.strip() or len(v) > 200 for v in value.values()):
        raise ValueError('Explicit actor/model provenance required')

def validate_pool(pool, count):
    if set(pool) != {'schemaVersion', 'author', 'syntheticOnly', 'examples'} or type(pool['schemaVersion']) is not int or pool['schemaVersion'] != 2 or pool['syntheticOnly'] is not True:
        raise ValueError('Unexpected pool schema')
    actor(pool['author'])
    rows = pool['examples']
    if not isinstance(rows, list) or len(rows) != count:
        raise ValueError('Unexpected authored pool count')
    seen, groups = set(), {}
    for row in rows:
        if set(row) != {'id', 'group', 'text', 'lengthClass'}:
            raise ValueError('Unexpected pool item schema')
        check_id(row['id']); check_id(row['group'])
        if row['id'] in seen or not isinstance(row['text'], str):
            raise ValueError('Duplicate ID or non-text passage')
        if row['lengthClass'] not in ('single', 'multi'):
            raise ValueError('Invalid length class')
        seen.add(row['id']); groups.setdefault(row['group'], []).append(row)
    for members in groups.values():
        if len(members) != 4 or sorted(r['lengthClass'] for r in members) != ['multi', 'multi', 'single', 'single']:
            raise ValueError('Each four-passage family requires two passages per length class')
    return rows

def overlap_reasons(rows, existing, admissions):
    if len(admissions) != len(rows):
        raise ValueError('Admission count mismatch')
    reasons = {row['group']: set() for row in rows}
    old_ids = {row['id'] for row in existing}; old_groups = {row['group'] for row in existing}
    for row, admission in zip(rows, admissions):
        if not admission['admitted']:
            reasons[row['group']].add('input_admission')
        if row['id'] in old_ids or row['group'] in old_groups:
            reasons[row['group']].add('existing_identifier')
        for old in existing:
            if normalized(row['text']) == normalized(old['text']) or similar(row['text'], old['text']) >= .85:
                reasons[row['group']].add('existing_text_overlap')
    for index, row in enumerate(rows):
        for other in rows[index + 1:]:
            if normalized(row['text']) == normalized(other['text']) or (row['group'] != other['group'] and similar(row['text'], other['text']) >= .85):
                reasons[row['group']].add('pool_overlap'); reasons[other['group']].add('pool_overlap')
    return {group: sorted(value) for group, value in reasons.items()}

def seed_for(stage):
    return int(hashlib.sha256(('42:' + stage).encode()).hexdigest()[:16], 16)

def acquire(rows, scores, thresholds, used, round_number):
    if type(round_number) is not int or not 1 <= round_number <= 3:
        raise ValueError('Round budget exceeded')
    if set(scores) != {'A', 'B', 'current'} or set(thresholds) != set(scores):
        raise ValueError('Acquisition model mismatch')
    for name, values in scores.items():
        if len(values) != len(rows) or any(not math.isfinite(v) or not 0 <= v <= 1 for v in values):
            raise ValueError('Invalid score vectors')
        if not 0 <= thresholds[name] <= 1:
            raise ValueError('Invalid threshold')
    groups = {}
    for i, row in enumerate(rows):
        if row['group'] not in used:
            groups.setdefault(row['group'], []).append(i)
    if len(groups) < 10:
        return {'stop': 'insufficient_pool', 'availableFamilies': len(groups)}
    if any(len(indices) != 4 for indices in groups.values()):
        raise ValueError('Partial acquisition family')
    tie = lambda group: digest(['42', 'acquisition', round_number, group])
    stats = {g: {'disagreements': sum((scores['A'][i] >= thresholds['A']) != (scores['B'][i] >= thresholds['B']) for i in ids),
                 'distance': min(abs(scores['current'][i] - thresholds['current']) for i in ids)} for g, ids in groups.items()}
    random_groups = random.Random(seed_for(f'random-{round_number}')).sample(sorted(groups), 2)
    remaining = set(groups) - set(random_groups)
    disagreement = sorted((g for g in remaining if stats[g]['disagreements']), key=lambda g: (-stats[g]['disagreements'], tie(g)))[:5]
    remaining -= set(disagreement)
    uncertain = sorted(remaining, key=lambda g: (stats[g]['distance'], tie(g)))[:8-len(disagreement)]
    routes = {g: 'random' for g in random_groups}
    routes.update({g: 'disagreement' for g in disagreement})
    routes.update({g: 'uncertainty' for g in uncertain})
    return {'roundNumber': round_number, 'groups': routes, 'stats': stats,
            'fallbackUncertaintyFamilies': 5-len(disagreement),
            'exampleIds': [row['id'] for row in rows if row['group'] in routes]}

def make_packet(rows, context, role):
    if role not in ('teacher', 'reviewer'):
        raise ValueError('Unknown annotation role')
    mapping = {row['id']: 'item_' + digest([context, role, row['id']])[:24] for row in rows}
    items = [{'id': mapping[row['id']], 'text': row['text']} for row in rows]
    items.sort(key=lambda row: digest([role, row['id'], 'shuffle']))
    return {'schemaVersion': 2, 'items': items}, mapping

def validate_annotation(document, packet, packet_hash):
    if set(document) != {'schemaVersion', 'packetSha256', 'actor', 'decisions'} or type(document['schemaVersion']) is not int or document['schemaVersion'] != 2 or document['packetSha256'] != packet_hash:
        raise ValueError('Annotation does not bind exact packet')
    actor(document['actor'])
    if not isinstance(document['decisions'], list):
        raise ValueError('Decisions must be an array')
    expected = {r['id']: r['text'] for r in packet['items']}
    decisions = {}
    for decision in document['decisions']:
        if not isinstance(decision, dict) or set(decision) != {'id', 'status', 'label', 'category', 'rationale', 'evidence'}:
            raise ValueError('Unexpected annotation fields')
        key = decision['id']
        if key not in expected or key in decisions:
            raise ValueError('Unknown or duplicate decision ID')
        valid = isinstance(decision['rationale'], str) and bool(decision['rationale'].strip())
        evidence = decision['evidence']
        valid = valid and isinstance(evidence, list) and bool(evidence) and all(isinstance(q, str) and bool(q) and q in expected[key] for q in evidence)
        if decision['status'] == 'clear':
            valid = valid and type(decision['label']) is int and decision['label'] in (0, 1) and decision['category'] in CATEGORIES
            valid = valid and ((decision['category'] == 'firm_delivery') == bool(decision['label']))
        elif decision['status'] == 'ambiguous':
            valid = valid and decision['label'] is None and decision['category'] == 'ambiguous'
        else:
            valid = False
        decisions[key] = dict(decision, valid=bool(valid))
    if set(decisions) != set(expected):
        raise ValueError('Incomplete annotation packet')
    return decisions

def agree(rows, annotations, packets, mappings, hashes):
    actors = [annotations[r]['actor']['actorId'].strip().casefold() for r in ('teacher', 'reviewer')]
    if actors[0] == actors[1]:
        raise ValueError('Teacher and reviewer must be different actors')
    decisions = {r: validate_annotation(annotations[r], packets[r], hashes[r]) for r in ('teacher', 'reviewer')}
    reasons = {r['group']: set() for r in rows}
    by_id = {}
    for row in rows:
        a, b = [decisions[r][mappings[r][row['id']]] for r in ('teacher', 'reviewer')]
        by_id[row['id']] = a
        if not a['valid'] or not b['valid']:
            reasons[row['group']].add('invalid_annotation')
        elif a['status'] != 'clear' or b['status'] != 'clear':
            reasons[row['group']].add('ambiguity')
        elif (a['label'], a['category']) != (b['label'], b['category']):
            reasons[row['group']].add('label_or_category_disagreement')
    for group in reasons:
        if {by_id[r['id']]['label'] for r in rows if r['group'] == group and by_id[r['id']]['valid'] and by_id[r['id']]['status'] == 'clear'} != {0, 1}:
            reasons[group].add('missing_binary_contrast')
    accepted = [dict(r, label=by_id[r['id']]['label'], category=by_id[r['id']]['category'], split='train') for r in rows if not reasons[r['group']]]
    quarantine = [{'id': r['id'], 'group': r['group'], 'reasons': sorted(reasons[r['group']])} for r in rows if reasons[r['group']]]
    return accepted, quarantine

def human_sample(accepted, context):
    n = min(len(accepted), max(4, math.ceil(.1 * len(accepted))))
    if not n:
        return []
    rng = random.Random(seed_for('human-' + context))
    ordered = sorted(accepted, key=lambda r: r['id'])
    negative = [r['id'] for r in ordered if r['label'] == 0]
    positive = [r['id'] for r in ordered if r['label'] == 1]
    if not negative or not positive:
        return rng.sample(negative+positive, n)
    n_negative = max(1, min(len(negative), n-1, math.floor(n*len(negative)/len(ordered)+.5)))
    n_positive = min(len(positive), n-n_negative)
    n_negative = n-n_positive
    chosen = rng.sample(negative, n_negative) + rng.sample(positive, n_positive)
    return chosen
