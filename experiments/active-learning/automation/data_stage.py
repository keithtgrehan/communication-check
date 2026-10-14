"""One-shot synthetic data authoring; no human labels and no automatic regeneration.

The three author sessions and two training annotators use the same model family.
Their agreement is a synthetic diagnostic, never independent human validation.
Only TRAIN is sent to annotators; DEV/FINAL author references never train a model.
"""
from collections import Counter
from pathlib import Path
import json
import sys

ACTIVE = Path(__file__).resolve().parents[1]
ROOT = ACTIVE.parents[1]
if str(ACTIVE) not in sys.path:
    sys.path.insert(0, str(ACTIVE))
import core

RUBRIC = ROOT / 'experiments/encoder-comparison/data/rubric.md'
BASE = ROOT / 'experiments/encoder-comparison/data/train-dev.json'
TEACHING = ROOT / 'experiments/llm-teaching'
PRIOR_POOL = ACTIVE / 'campaigns/active-001/pool/raw.json'

# Freeze these scenario specifications before any author receives its packet.
# Domains and discourse situations differ between splits; lexical deduplication
# below does not establish perfect semantic separation.
SCENARIOS = {
    'train': [
        ('seed-bank', 'Seed-bank accession envelopes', 'A curator distinguishes promised accession packets from a donor quotation and a past dispatch.'),
        ('bell-foundry', 'Bell-foundry acoustic certificates', 'A foundry engineer separates an unconditional certificate handover from cooling-dependent delivery.'),
        ('film-restoration', 'Silent-film restoration cue sheets', 'A restorer corrects a mistaken earlier assurance; distinguish negated scope from a new definite handover.'),
        ('cave-survey', 'Cave-survey cartographic plates', 'An expedition archivist answers a request, reports someone else’s forecast, and owns a future map delivery.'),
        ('textile-museum', 'Textile conservation condition cards', 'An exhibit conservator contrasts recipient tasks, completed repairs, and assured receipt of condition cards.'),
        ('piano-workshop', 'Piano workshop voicing records', 'A craftsperson distinguishes capability and intention from an explicit promise despite cautious surrounding wording.'),
        ('kite-regatta', 'Kite-regatta course sketches', 'An organiser uses before-event deadlines and when-ready dependencies with different consequences for assurance.'),
        ('orchard-coop', 'Heritage orchard graft ledgers', 'A coordinator handles pronoun ownership across sentences and distinguishes their delivery from a grower’s claim.'),
        ('radio-archive', 'Community radio tape inventories', 'An archivist discusses an old delivery and a scheduled future-progressive inventory handover.'),
        ('stone-quarry', 'Stone-quarry sample catalogues', 'An estimator withdraws one catalogue commitment but makes another, contrasted with a wholly conditional offer.'),
    ],
    'dev': [
        ('lichen-atlas', 'Lichen atlas specimen plates', 'A field editor embeds quoted assurances in meeting recollections and separately adopts a concrete future delivery.'),
        ('marionette', 'Marionette theatre rigging diagrams', 'A stage supervisor separates completed rigging from diagram delivery and a request to the recipient.'),
        ('canal-lock', 'Historic canal-lock inspection folios', 'An inspector distinguishes definite receipt before a reopening from delivery conditional on draining a chamber.'),
        ('meteorite', 'Meteorite collection custody cards', 'A registrar contrasts a colleague’s promise, a negated dispatch, and first-person custody-card assurance.'),
        ('braille-score', 'Braille music score proofs', 'A transcriber qualifies the schedule, then either explicitly resolves it or leaves a dependency unresolved.'),
        ('salt-marsh', 'Salt-marsh transect overlays', 'A survey lead contrasts hypothetical overlays and bare capability with an explicit can-promise assurance.'),
        ('tram-depot', 'Heritage tram depot winding schedules', 'A workshop dispatcher mixes a request and past work with a distinct unqualified schedule handover.'),
    ],
    'final': [
        ('planetarium', 'Planetarium projection calibration cards', 'Nested attribution: a producer reports a technician quoting the author, then either adopts or declines that promise.'),
        ('lace-guild', 'Lace-guild pattern plates', 'Negation scope: deny a recipient action or an earlier date while separately assuring or negating actual delivery.'),
        ('harbour-buoy', 'Harbour buoy lamp test dossiers', 'Distinguish a tide-based deadline from a genuine dependency; include an unresolved conditional assurance.'),
        ('fossil-cast', 'Fossil-casting mould transfer sheets', 'A completed casting and historical promise surround a request, contrasted with a present future handover.'),
        ('observatory', 'Solar-observatory shutter timing plots', 'A schedule intention is explicitly resolved in one discourse and only repeated as an expectation in another.'),
        ('bookbindery', 'Rare-book bindery collation slips', 'A promise to ask someone to deliver differs from a direct assurance that the author’s team will supply the slips.'),
        ('glassworks', 'Stained-glass kiln batch tracings', 'Bare ability, explicit can-promise assurance, permission, and a concrete future tracing handover.'),
        ('wildlife-acoustic', 'Wildlife acoustic recorder call indexes', 'Recipient receipt is assured despite no will-deliver phrase; compare recipient requests and third-party predictions.'),
        ('dredge-lab', 'Dredge sediment microscopy contact sheets', 'Past perfect and future perfect in a multi-sentence handover; avoid treating completed laboratory work as delivery.'),
        ('costume-store', 'Opera costume-store repair inventories', 'Rhetorical questions, genuine recipient requests, and replies that either accept or merely discuss the proposed handover.'),
        ('water-clock', 'Water-clock restoration gear charts', 'A firm assertion about one work item coexists with a conditional second item; contrast conditions covering both.'),
        ('ice-core', 'Ice-core archive sleeve maps', 'Pronoun and ownership switches distinguish a reported external dispatch from the author taking over responsibility.'),
        ('papermill', 'Handmade papermill watermark registers', 'A correction retracts a commitment or changes only the recipient/date while preserving an explicit assurance.'),
        ('percussion', 'Percussion ensemble mallet allocation sheets', 'Mixed and genuinely unresolved attribution or condition scope alongside clear positive and negative contrasts; retain ambiguity.'),
    ],
}


# Tags describe assigned scenario challenges, not verified per-passage phenomena.
SCENARIO_TAGS = {
    'train': [
        ['attribution', 'past_action'], ['conditional_delivery'], ['negation', 'explicit_assurance'],
        ['request', 'attribution'], ['request', 'past_action'], ['explicit_assurance'],
        ['conditional_delivery'], ['attribution'], ['past_action'], ['negation', 'mixed'],
    ],
    'dev': [
        ['attribution'], ['past_action', 'request'], ['conditional_delivery'],
        ['attribution', 'negation'], ['conditional_delivery', 'explicit_assurance'],
        ['explicit_assurance'], ['request', 'past_action', 'mixed'],
    ],
    'final': [
        ['attribution'], ['negation'], ['conditional_delivery'], ['past_action', 'request'],
        ['explicit_assurance'], ['attribution', 'request'], ['explicit_assurance'],
        ['explicit_assurance', 'request'], ['past_action'], ['request'],
        ['mixed', 'conditional_delivery'], ['attribution'], ['negation'],
        ['mixed', 'attribution', 'conditional_delivery'],
    ],
}


def scenario_plan():
    return {split: [{'group': f'auto-{split}-{name}', 'domain': domain,
                     'discourse': discourse, 'tags': SCENARIO_TAGS[split][index], 'ids': [f'auto-{split}-{name}-{i}' for i in range(1, 5)]}
                    for index, (name, domain, discourse) in enumerate(specs)]
            for split, specs in SCENARIOS.items()}


def author_schema(plan):
    return {'type': 'object', 'additionalProperties': False,
            'required': ['schemaVersion', 'author', 'syntheticOnly', 'examples'],
            'properties': {
                'schemaVersion': {'type': 'integer', 'enum': [1]},
                'author': {'type': 'object', 'additionalProperties': False,
                           'required': ['actorId', 'model'], 'properties': {
                               'actorId': {'type': 'string'}, 'model': {'type': 'string'}}},
                'syntheticOnly': {'type': 'boolean', 'enum': [True]},
                'examples': {'type': 'array', 'minItems': len(plan) * 4, 'maxItems': len(plan) * 4,
                    'items': {'type': 'object', 'additionalProperties': False,
                        'required': ['id', 'group', 'text', 'referenceLabel', 'referenceCategory', 'evidence', 'rationale'],
                        'properties': {
                            'id': {'type': 'string', 'enum': [i for s in plan for i in s['ids']]},
                            'group': {'type': 'string', 'enum': [s['group'] for s in plan]},
                            'text': {'type': 'string'},
                            'referenceLabel': {'type': ['integer', 'null'], 'enum': [0, 1, None]},
                            'referenceCategory': {'type': 'string', 'enum': [*core.CATEGORIES, 'ambiguous']},
                            'evidence': {'type': 'array', 'items': {'type': 'string'}},
                            'rationale': {'type': 'string'}}}}}}


def validate_author(document, split, plan):
    if not isinstance(document, dict) or set(document) != {'schemaVersion', 'author', 'syntheticOnly', 'examples'}:
        raise ValueError('Unexpected author schema')
    if type(document['schemaVersion']) is not int or document['schemaVersion'] != 1 or document['syntheticOnly'] is not True:
        raise ValueError('Synthetic author version required')
    core.actor(document['author'])
    expected = {i: s for s in plan for i in s['ids']}
    examples = document['examples']
    if not isinstance(examples, list) or len(examples) != len(expected):
        raise ValueError('Incorrect authored row count')
    rows, seen = [], set()
    keys = {'id', 'group', 'text', 'referenceLabel', 'referenceCategory', 'evidence', 'rationale'}
    for row in examples:
        if not isinstance(row, dict) or set(row) != keys:
            raise ValueError('Unexpected author row fields')
        ident = row['id']
        if not isinstance(ident, str) or ident not in expected or ident in seen or row['group'] != expected[ident]['group']:
            raise ValueError('Unknown, duplicate or misplaced authored ID')
        seen.add(ident)
        text = row['text']
        if not isinstance(text, str) or not text.strip() or len(text.encode('utf-16-le')) // 2 > 2000:
            raise ValueError('Passage must contain 1..2000 UTF-16 code units')
        label, category = row['referenceLabel'], row['referenceCategory']
        if label is None:
            valid = category == 'ambiguous'
        else:
            valid = type(label) is int and label in (0, 1) and category in core.CATEGORIES and ((category == 'firm_delivery') == bool(label))
        if not valid:
            raise ValueError('Invalid author reference label/category')
        if not isinstance(row['rationale'], str) or not row['rationale'].strip():
            raise ValueError('Reference rationale required')
        if not isinstance(row['evidence'], list) or not row['evidence'] or any(not isinstance(q, str) or not q or q not in text for q in row['evidence']):
            raise ValueError('Reference evidence must be exact nonempty quotes')
        rows.append(dict(row, label=label, category=category, split=split,
                         source='synthetic-ai-author', scenarioFamily=expected[ident]['group'],
                         scenarioDomain=expected[ident]['domain'], tags=expected[ident]['tags']))
    for spec in plan:
        if not {0, 1}.issubset({r['label'] for r in rows if r['group'] == spec['group']}):
            raise ValueError('Every authored family requires positive and negative references')
    return sorted(rows, key=lambda r: r['id'])


def _history():
    """Only public-to-this-experiment development history; never heldout paths."""
    paths = [BASE, PRIOR_POOL]
    paths += sorted(TEACHING.glob('inbox/*/proposals.json'))
    paths += sorted(TEACHING.glob('runs/*/inputs/proposal.json'))
    rows, sources = [], []
    for path in paths:
        value = core.read(path)
        items = value if isinstance(value, list) else value['examples']
        if not isinstance(items, list):
            raise ValueError('Invalid historical development source')
        if path == BASE and Counter(r['split'] for r in items) != {'train': 120, 'dev': 30}:
            raise ValueError('Original TRAIN/DEV integrity: expected 120/30 rows')
        for r in items:
            if not all(isinstance(r.get(k), str) and r[k] for k in ('id', 'group', 'text')):
                raise ValueError('Invalid historical row')
            rows.append({k: r[k] for k in ('id', 'group', 'text')})
        sources.append({'path': str(path), 'sha256': core.sha(path), 'rows': len(items)})
    return rows, sources


def _invoke(directory, name, prompt, schema, callback):
    prompt_path, output = directory / f'{name}-prompt.txt', directory / f'{name}-raw.json'
    with prompt_path.open('x') as stream:
        stream.write(prompt)
    metadata = callback(prompt, output, schema)
    if not isinstance(metadata, dict):
        raise ValueError('Actor callback must return provenance metadata')
    frozen = {'output': str(output), 'sha256': core.sha(output), 'promptSha256': core.sha(prompt_path),
              'schemaSha256': core.sha(schema), 'metadata': metadata}
    core.write_new(directory / f'{name}-freeze.json', frozen)
    session = metadata.get('sessionId')
    if not isinstance(session, str) or not session.strip():
        raise ValueError('Actor runner must supply a nonempty sessionId')
    return core.read(output), frozen


def prepare(run: Path, protocol: dict, actor_callback) -> dict:
    """Author 40/28/56 once, then blind-review TRAIN and quarantine whole families.

    `run/protocol.json` must already be frozen. An existing data directory rejects
    replay, including after partial failure; start a separately approved run instead.
    The callback writes exactly `out` using `schema` and returns actor metadata.
    """
    run = Path(run).resolve()
    frozen_protocol = run / 'protocol.json'
    if core.read(frozen_protocol) != protocol:
        raise ValueError('Protocol must be frozen before data generation')
    expected_counts = {'trainRows': 40, 'devRows': 28, 'finalRows': 56, 'familySize': 4, 'nearDuplicateJaccard': .85}
    if protocol.get('synthetic', expected_counts) != expected_counts:
        raise ValueError('Protocol synthetic counts or overlap threshold differ from frozen data stage')
    directory = run / 'data'
    directory.mkdir(exist_ok=False)
    plan = scenario_plan()
    history, source_hashes = _history()
    rubric = RUBRIC.read_text()
    freeze = {'protocolSha256': core.sha(frozen_protocol), 'scenarioPlan': plan,
              'scenarioPlanSha256': core.digest(plan), 'rubricSha256': core.sha(RUBRIC),
              'history': source_hashes, 'moduleSha256': core.sha(__file__),
              'labels': 'Synthetic AI reference labels; never human validation',
              'isolation': 'Separate actor sessions, same gpt-6-astra model family; procedural separation only'}
    core.write_new(directory / 'input-freeze.json', freeze)
    rows, actors, authors, sessions = [], {}, set(), set()

    def remember_session(frozen):
        session = frozen['metadata']['sessionId'].strip()
        if session in sessions:
            raise ValueError('Every author/annotator requires a distinct runner session')
        sessions.add(session)
    for split in ('train', 'dev', 'final'):
        schema = directory / f'{split}-author-schema.json'
        core.write_new(schema, author_schema(plan[split]))
        prompt = ('You are a fresh fictional data author. Do not use tools or external text. '
                  'Return only schema-compliant JSON. Use a unique actorId and model identity. '
                  'Author exactly four English passages for each assigned family, using exact assigned IDs. '
                  'These are entirely fictional work-item communications, not real people or customer drafts. '
                  'Each family must contain at least one positive and one negative reference; vary syntax, '
                  'sentence order, speaker attribution and discourse, not just noun substitution. '
                  'Use a mixture of single and multi-sentence passages, at most 2000 UTF-16 units each. '
                  'Do not force genuinely ambiguous cases into binary labels: use null/ambiguous, '
                  'retain them with exact evidence and a rationale. All difficult FINAL cases remain in the set. '
                  'Provide exact nonempty evidence quotes and reference rationale for every passage. '
                  'Do not seek human labels. Follow the rubric, not perceived risk or politeness.\n'
                  f'SPLIT: {split}\nRUBRIC:\n{rubric}\nASSIGNED_SCENARIOS:\n{json.dumps(plan[split])}')
        output, actors[f'{split}-author'] = _invoke(directory, f'{split}-author', prompt, schema, actor_callback)
        remember_session(actors[f'{split}-author'])
        authored_rows = validate_author(output, split, plan[split])
        actor_id = output['author']['actorId'].strip().casefold()
        if actor_id in authors:
            raise ValueError('Three distinct author actors required')
        authors.add(actor_id)
        rows.extend(authored_rows)
    overlap = core.overlap_reasons(rows, history, [{'admitted': True} for _ in rows])
    train = [r for r in rows if r['split'] == 'train']
    packets, mappings, hashes, annotations = {}, {}, {}, {}
    for role in ('teacher', 'reviewer'):
        packets[role], mappings[role] = core.make_packet(train, freeze['scenarioPlanSha256'], role)
        packet_path = directory / f'{role}-packet.json'
        core.write_new(packet_path, packets[role])
        core.write_new(directory / f'{role}-mapping.json', mappings[role])
        hashes[role] = core.sha(packet_path)
        prompt = ('Independently annotate this blinded fictional TRAIN packet using the supplied rubric. '
                  'No tools, no human labels. You have no author references, sibling groups, other annotator '
                  'labels, model predictions or DEV/FINAL material. Return only the annotation schema. '
                  'Use a unique actorId. Quote exact nonempty evidence for every decision. '
                  'Use ambiguous/null when genuinely unresolved.\n'
                  f'RUBRIC:\n{rubric}\nPACKET_SHA256: {hashes[role]}\nPACKET:\n{json.dumps(packets[role])}')
        annotations[role], actors[role] = _invoke(directory, role, prompt, ACTIVE / 'annotation-schema.json', actor_callback)
        remember_session(actors[role])
        core.validate_annotation(annotations[role], packets[role], hashes[role])
        if annotations[role]['actor']['actorId'].strip().casefold() in authors:
            raise ValueError('Training annotator must be a separate actor from authors')
    agreed, disputed = core.agree(train, annotations, packets, mappings, hashes)
    reasons = {r['group']: set(overlap[r['group']]) for r in train}
    for entry in disputed:
        reasons[entry['group']].update(entry['reasons'])
    additions = [{k: r[k] for k in ('id', 'group', 'text', 'label', 'category', 'split')}
                 for r in agreed if not reasons[r['group']]]
    quarantine = [{'id': r['id'], 'group': r['group'], 'reasons': sorted(reasons[r['group']])}
                  for r in train if reasons[r['group']]]
    violations = [{'id': r['id'], 'group': r['group'], 'split': r['split'], 'reasons': overlap[r['group']]}
                  for r in rows if r['split'] != 'train' and overlap[r['group']]]
    # Do not silently accept edited protocol/history while remote actors were running.
    if core.sha(frozen_protocol) != freeze['protocolSha256'] or any(core.sha(s['path']) != s['sha256'] for s in source_hashes):
        raise ValueError('Frozen data inputs changed during authoring')
    result = {'trainAdditions': additions, 'dev': [r for r in rows if r['split'] == 'dev'],
              'final': [r for r in rows if r['split'] == 'final'], 'rows': rows,
              'quarantine': quarantine, 'protocolValid': not violations,
              'protocolViolations': violations,
              'provenance': {**freeze, 'actors': actors,
                  'teacherReviewerAgreedRows': len(agreed), 'acceptedTrainingRows': len(additions),
                  'finalReferencePolicy': 'Keep all 56; null labels enter abstention diagnostics only, never binary scores',
                  'fitPolicy': 'Original 120 TRAIN plus accepted additions; old 30 DEV diagnostics only; fresh 28 DEV threshold selection',
                  'deduplication': 'Normalized exact + token-set Jaccard >=0.85 against allowed history and across families; no claim of perfect semantic deduplication',
                  'tagPolicy': 'Tags describe assigned scenario-family discourse challenges, not manually verified passage-level phenomena',
                  'humanLabellingRequired': False, 'regenerations': 0}}
    core.write_new(directory / 'prepared.json', result)
    core.write_new(directory / 'prepared-freeze.json', {'sha256': core.sha(directory / 'prepared.json')})
    return result
