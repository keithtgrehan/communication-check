"""Generate reusable instructions and machine-readable teacher/reviewer contracts."""
import json
from pathlib import Path
from contracts import CATEGORIES, make_packet, read_json, run_id, sha, validate_batch, write_json

IDENTITY = {'type': 'object', 'additionalProperties': False, 'required': ['actorId', 'model'],
            'properties': {key: {'type': 'string', 'minLength': 1} for key in ('actorId', 'model')}}
RUBRIC = '''# Independent wording labels

Label 1 / firm_delivery means an author's own unqualified prospective delivery of a concrete work item. Ordinary document handoffs count. It does not mean a promise is true, approved, risky or useful to flag.

Label 0 categories: qualified_delivery for conditional/tentative intentions; request for questions or requests to another person; reported for quoted/reported third-party or earlier statements rather than an author's current commitment; other for past events, pricing, capability, generic activity or non-delivery text.

If the intended reading is ambiguous, mixed, underspecified or outside this rubric, use status ambiguous, label null, category ambiguous, and explain. A clear decision requires your own label, category and rationale. Do not infer labels from wording shared by other items.

These are fictional agent labels, not human ground truth. Review only the shuffled packet and this rubric. Do not read teacher proposals, labels, rationale, groups, training/development examples or historical test fixtures. Finish and hash your review before anyone compares it with the teacher. Never revise labels to improve agreement or scores.
'''


def schemas():
    example = {'type': 'object', 'additionalProperties': False,
        'required': ['id', 'group', 'text', 'suggestedLabel', 'suggestedCategory', 'rationale'],
        'properties': {'id': {'type': 'string', 'pattern': '^ex_[0-9a-f]{8,32}$'},
          'group': {'type': 'string', 'pattern': '^fam_[0-9a-f]{8,32}$'},
          'text': {'type': 'string', 'minLength': 1, 'maxLength': 2000}, 'suggestedLabel': {'enum': [0, 1]},
          'suggestedCategory': {'enum': list(CATEGORIES)}, 'rationale': {'type': 'string', 'minLength': 1, 'maxLength': 1200}}}
    batch = {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'type': 'object', 'additionalProperties': False,
      'required': ['schemaVersion', 'batchId', 'teacher', 'syntheticOnly', 'examples'],
      'properties': {'schemaVersion': {'const': 1}, 'batchId': {'type': 'string'}, 'teacher': IDENTITY,
                     'syntheticOnly': {'const': True}, 'examples': {'type': 'array', 'minItems': 8, 'maxItems': 40, 'items': example}}}
    decision = {'type': 'object', 'additionalProperties': False, 'required': ['id', 'status', 'label', 'category', 'rationale'],
      'properties': {'id': {'type': 'string'}, 'status': {'enum': ['clear', 'ambiguous', 'rejected']},
        'label': {'enum': [0, 1, None]}, 'category': {'enum': list(CATEGORIES) + ['ambiguous']},
        'rationale': {'type': 'string', 'minLength': 1, 'maxLength': 1200}}}
    review = {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'type': 'object', 'additionalProperties': False,
      'required': ['schemaVersion', 'batchId', 'batchSha256', 'packetSha256', 'reviewer', 'decisions'],
      'properties': {'schemaVersion': {'const': 1}, 'batchId': {'type': 'string'},
        'batchSha256': {'type': 'string', 'pattern': '^[0-9a-f]{64}$'},
        'packetSha256': {'type': 'string', 'pattern': '^[0-9a-f]{64}$'}, 'reviewer': IDENTITY,
        'decisions': {'type': 'array', 'minItems': 8, 'maxItems': 40, 'items': decision}}}
    return batch, review


def export_kit(batch_id, out):
    run_id(batch_id); out = Path(out); out.mkdir(parents=True, exist_ok=False)
    batch, review = schemas(); write_json(out / 'batch.schema.json', batch); write_json(out / 'review.schema.json', review)
    (out / 'rubric.md').write_text(RUBRIC)
    (out / 'teacher-prompt.md').write_text(f'''# Create a teaching batch: {batch_id}

You are the teacher in a file-based Codex workflow. Create newly fictional English examples using the supplied rubric and batch.schema.json. Produce one batch of 40 passages in 10 new contrast families: each family has two firm-delivery assertions and two negative examples. Overall: 20 firm_delivery and 5 each qualified_delivery, request, reported, other. Use random opaque ex_<hex> example IDs and fam_<hex> family IDs, not category-coded names.

Vary wording and scenarios. Include meaningful negation, reported speech and qualified intentions. Do not label a commitment as risky or unapproved. Do not derive examples from customer data, development data, old heldouts, private tests or test error reports. Do not access those sources. Do not replenish or relabel this batch after validation or development scoring.

Use teacher.actorId to identify your distinct agent and teacher.model to state known model provenance. If runtime model is not independently verified, say so rather than claiming certainty. Set syntheticOnly=true. Every example needs your suggested label/category and rationale. Save only the proposal file requested by the lead. Do not create its independent review.

After the proposal freezes, a separate reviewer will receive a shuffled text-only packet with opaque review IDs. Disagreements, ambiguity and overlapping families are quarantined. Acceptance only makes examples eligible for TRAIN augmentation; no score or production improvement is promised.
''')
    return {'out': str(out), 'batchId': batch_id}


def review_kit(batch_path, out):
    batch = validate_batch(read_json(batch_path)); batch_hash = sha(batch_path)
    out = Path(out); out.mkdir(parents=True, exist_ok=False)
    packet = make_packet(batch, batch_hash); write_json(out / 'packet.json', packet)
    metadata = {'batchId': batch['batchId'], 'batchSha256': batch_hash, 'packetSha256': sha(out / 'packet.json'), 'items': len(packet['items'])}
    write_json(out / 'binding.json', metadata); write_json(out / 'review.schema.json', schemas()[1])
    (out / 'rubric.md').write_text(RUBRIC)
    (out / 'reviewer-prompt.md').write_text('Independently label every packet.json item using only rubric.md. Use review.schema.json and the exact hashes in binding.json. Do not open the proposal file or infer family groupings. Save and hash one complete review before comparison. Your actorId must differ from the teacher. State requested-versus-verified model provenance honestly.\n')
    return metadata
