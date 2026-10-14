#!/usr/bin/env python3
"""Explicit LLM teacher -> blind reviewer -> immutable TRAIN snapshot -> local candidate."""
import argparse
import contextlib
import hashlib
import io
import json
from pathlib import Path
import shutil
import sys
import time

from contracts import (ROOT, BASE_DATA, PRIOR, assess, make_packet, read_json, run_id, sha,
                       validate_batch, validate_review, write_json)
from kit import export_kit, review_kit


def emit(value):
    print(json.dumps(value, sort_keys=True, allow_nan=False), flush=True)


def folder(identifier):
    return ROOT / 'runs' / run_id(identifier)


def hashes(paths, root):
    return {str(path.relative_to(root)): sha(path) for path in sorted(set(paths))}


def current_code():
    return hashes(list(ROOT.glob('*.py')) + list((ROOT / 'tests').glob('*.py')) + [ROOT / 'recipe.json'], ROOT)


def confined(run, relative):
    path = (run / relative).resolve()
    if not path.is_relative_to(run.resolve()) or not path.is_file():
        raise ValueError('Manifest paths must be existing files within the run.')
    return path


def verify_prepared(run, active_code=False):
    if sha(run / 'prepared.json') != (run / 'prepared.sha256').read_text().strip():
        raise ValueError('Prepared manifest changed.')
    manifest = read_json(run / 'prepared.json')
    for relative, expected in manifest['snapshotFiles'].items():
        if sha(confined(run, relative)) != expected:
            raise ValueError('Prepared inputs, review or data snapshot changed.')
    if active_code and current_code() != manifest['sourceFiles']:
        raise ValueError('Workflow source or recipe changed after preparation. Preserve this run and prepare a new run ID.')
    return manifest


def verify_complete(run):
    frozen = read_json(run / 'freeze.json')
    if hashlib.sha256(json.dumps(frozen['files'], sort_keys=True).encode()).hexdigest() != frozen['bundleSha256']:
        raise ValueError('Frozen bundle digest does not match its manifest.')
    for relative, expected in frozen['files'].items():
        if sha(confined(run, relative)) != expected:
            raise ValueError('Completed run artifact or snapshot changed.')
    return frozen


def prepare(args):
    from adapter import prior_api, EXPECTED_PRIOR_BUNDLE
    api = prior_api()
    batch = validate_batch(read_json(args.batch)); batch_hash = sha(args.batch)
    packet = read_json(args.packet); packet_hash = sha(args.packet)
    review = read_json(args.review)
    decisions = validate_review(review, batch, batch_hash, packet, packet_hash)
    base = read_json(BASE_DATA)
    api.validate_rows(base)
    parent = None
    if args.parent:
        parent_run = folder(args.parent); frozen = verify_complete(parent_run)
        parent = {'runId': args.parent, 'bundleSha256': frozen['bundleSha256']}
        base = read_json(parent_run / 'inputs/data.json')
    original_dev = [r for r in read_json(BASE_DATA) if r['split'] == 'dev']
    if [r for r in base if r['split'] == 'dev'] != original_dev:
        raise ValueError('Development rows must remain exactly unchanged.')
    tok = api.tokenizer()
    accepted, quarantined = assess(batch, batch_hash, decisions, base, lambda text: api.admission(text, tok))
    existing_ids = {r['id'] for r in base}
    if any(r['id'] in existing_ids for r in accepted):
        raise ValueError('Accepted IDs collide with existing rows.')
    data = base + accepted
    api.validate_rows(data)
    _, admission = api.coverage(data, tok)
    if admission['rejected']:
        raise ValueError('Combined data fails the common token admission rule.')
    run = folder(args.run_id); run.mkdir(parents=True, exist_ok=False)
    inputs = run / 'inputs'; inputs.mkdir()
    for source, name in ((args.batch, 'proposal.json'), (args.review, 'review.json'), (args.packet, 'packet.json')):
        shutil.copyfile(source, inputs / name)
    write_json(inputs / 'data.json', data); write_json(inputs / 'accepted.json', accepted)
    write_json(inputs / 'quarantine.json', quarantined)
    shutil.copyfile(ROOT / 'recipe.json', inputs / 'recipe.json')
    source_files = current_code()
    (inputs / 'source').mkdir()
    for relative in source_files:
        target = inputs / 'source' / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / relative, target)
    ready = len(accepted) >= 8 and {r['label'] for r in accepted} == {0, 1}
    report = {'runId': args.run_id, 'batchId': batch['batchId'], 'proposalSha256': batch_hash,
      'reviewSha256': sha(args.review), 'packetSha256': packet_hash, 'priorBundleSha256': EXPECTED_PRIOR_BUNDLE,
      'baseDataSha256': sha(BASE_DATA), 'parent': parent, 'teacher': batch['teacher'], 'reviewer': review['reviewer'],
      'proposed': len(batch['examples']), 'accepted': len(accepted), 'quarantined': len(quarantined),
      'acceptedFamilies': len({r['group'] for r in accepted}), 'quarantinedFamilies': len({r['group'] for r in quarantined}),
      'acceptedCounts': {category: sum(r['category'] == category for r in accepted) for category in api.CATEGORIES} if hasattr(api, 'CATEGORIES') else
                        {category: sum(r['category'] == category for r in accepted) for category in ('firm_delivery','qualified_delivery','request','reported','other')},
      'quarantineReasons': {reason: sum(reason in r['reasons'] for r in quarantined) for reason in sorted({x for r in quarantined for x in r['reasons']})},
      'trainingRows': sum(r['split'] == 'train' for r in data), 'developmentRows': len(original_dev),
      'developmentUnchanged': True, 'coverage': admission, 'readyForTraining': ready,
      'sourceFiles': source_files, 'snapshotFiles': hashes([p for p in inputs.rglob('*') if p.is_file()], run),
      'labelEvidence': 'Separate AI teacher/reviewer agreement under procedural blinding; not human validation.',
      'preparedAtUtc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
    write_json(run / 'prepared.json', report)
    (run / 'prepared.sha256').write_text(sha(run / 'prepared.json') + '\n')
    write_json(run / 'state.json', {'stage': 'prepared' if ready else 'no_trainable_batch'})
    api.verify_freeze()
    emit({key: report[key] for key in ('runId','proposed','accepted','quarantined','acceptedFamilies','quarantineReasons','trainingRows','developmentRows','readyForTraining')})


def train(args):
    from adapter import prior_api, train_candidate
    run = folder(args.run_id); prepared = verify_prepared(run, active_code=True)
    if not prepared['readyForTraining']:
        raise ValueError('Insufficient independently agreed training examples. Do not replenish based on outcomes.')
    if (run / 'dev-report.json').exists() or (run / 'model').exists():
        raise ValueError('Candidate outputs already exist. Do not overwrite or silently retrain.')
    # The exclusive marker consumes this run ID even if fitting fails.
    with (run / 'training-started.json').open('x') as stream:
        json.dump({'startedAtUtc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'preparedSha256': sha(run / 'prepared.json')}, stream)
    write_json(run / 'state.json', {'stage': 'training'})
    try:
        data, recipe = read_json(run / 'inputs/data.json'), read_json(run / 'inputs/recipe.json')
        # Library progress can contain diagnostics; keep only our aggregate report on stdout.
        with contextlib.redirect_stdout(io.StringIO()):
            report = train_candidate(run, data, recipe)
        verify_prepared(run, active_code=True)
        report['runId'] = args.run_id; report['preparedSha256'] = sha(run / 'prepared.json')
        if prepared['parent']:
            parent_run = folder(prepared['parent']['runId']); verify_complete(parent_run)
            parent_report = read_json(parent_run / 'dev-report.json')
            report['parentDevelopmentComparison'] = {'runId': prepared['parent']['runId'], 'candidate': parent_report['candidate'],
                'f1Delta': report['candidate']['f1'] - parent_report['candidate']['f1'],
                'note': 'Repeated use of the same DEV set; not independent improvement evidence.'}
        write_json(run / 'dev-report.json', report)
        write_json(run / 'state.json', {'stage': 'complete'})
        paths = [p for p in run.rglob('*') if p.is_file() and 'checkpoints' not in p.parts and p.name != 'freeze.json']
        frozen_files = hashes(paths, run)
        bundle = hashlib.sha256(json.dumps(frozen_files, sort_keys=True).encode()).hexdigest()
        write_json(run / 'freeze.json', {'bundleSha256': bundle, 'files': frozen_files,
            'scope': 'This candidate and its independently reviewed TRAIN provenance; no independent test was run.'})
        prior_api().verify_freeze()
        emit({'runId': args.run_id, 'bundleSha256': bundle, 'candidate': report['candidate'],
              'baseline': report['baseline']['metrics'], 'devGatePassed': report['operatingPoint']['gatePassed'],
              'decision': report['decision'], 'evidence': 'Development only; no fresh independent test.'})
    except Exception as error:
        write_json(run / 'state.json', {'stage': 'failed', 'errorType': type(error).__name__})
        raise


def status(args):
    run = folder(args.run_id); prepared = verify_prepared(run)
    result = {'runId': args.run_id, 'state': read_json(run / 'state.json'), 'accepted': prepared['accepted'],
              'quarantined': prepared['quarantined'], 'trainingRows': prepared['trainingRows']}
    if (run / 'freeze.json').exists():
        result['bundleSha256'] = verify_complete(run)['bundleSha256']
        result['development'] = read_json(run / 'dev-report.json')
    emit(result)


def predict(args):
    from adapter import predict_saved
    run = folder(args.run_id); verify_complete(run)
    text = sys.stdin.read(2001)
    result = predict_saved(run, text)
    verify_complete(run)
    emit(result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    export = commands.add_parser('export-kit'); export.add_argument('--batch-id', required=True); export.add_argument('--out', required=True)
    review = commands.add_parser('review-kit'); review.add_argument('--batch', required=True); review.add_argument('--out', required=True)
    pre = commands.add_parser('prepare'); pre.add_argument('--run-id', required=True); pre.add_argument('--batch', required=True)
    pre.add_argument('--review', required=True); pre.add_argument('--packet', required=True); pre.add_argument('--parent')
    for name in ('train', 'status', 'predict'):
        commands.add_parser(name).add_argument('--run-id', required=True)
    args = parser.parse_args()
    try:
        if args.command == 'export-kit': emit(export_kit(args.batch_id, args.out))
        elif args.command == 'review-kit': emit(review_kit(args.batch, args.out))
        else: globals()[args.command](args)
    except Exception as error:
        # Do not echo untrusted file content or library exception payloads.
        emit({'error': 'Operation refused or failed without exposing input text.', 'errorType': type(error).__name__, 'command': args.command})
        raise SystemExit(1) from None


if __name__ == '__main__':
    main()
