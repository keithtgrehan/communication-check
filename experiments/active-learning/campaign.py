#!/usr/bin/env python3
"""Bounded local experiment controller. All model subprocesses deny networking."""
import argparse
import contextlib
import ctypes
import io
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
sys.path.insert(0, str(ROOT))
from core import (PROTOCOL, read, write_new, digest, sha, check_id, validate_pool,
                  overlap_reasons, acquire, make_packet, agree, human_sample)

def emit(value):
    print(json.dumps(value, sort_keys=True, allow_nan=False), flush=True)

def files_hash(root, paths):
    return {str(path.relative_to(root)): sha(path) for path in sorted(paths) if path.is_file()}

def source_hashes():
    return files_hash(ROOT, list(ROOT.glob('*.py')) + list((ROOT/'tests').glob('*.py')) + list(ROOT.glob('*.json')) + [ROOT/'DESIGN.md'])

def check_files(root, mapping):
    for relative, expected in mapping.items():
        path = (root / relative).resolve()
        if not path.is_relative_to(root.resolve()) or not path.is_file() or sha(path) != expected:
            raise ValueError('Manifest file is missing, outside root, or changed')

def bundle(folder, filename='freeze.json'):
    mapping = files_hash(folder, [p for p in folder.rglob('*') if p.is_file() and p.name != filename and 'checkpoints' not in p.parts])
    write_new(folder/filename, {'files': mapping, 'bundleSha256': digest(mapping)})

def verify_bundle(folder, filename='freeze.json'):
    manifest = read(folder/filename)
    if digest(manifest['files']) != manifest['bundleSha256']:
        raise ValueError('Manifest digest changed')
    check_files(folder, manifest['files'])
    return manifest

def protected_hashes():
    paths = []
    for name in ('encoder-comparison', 'llm-teaching', 'commitment-classifier'):
        directory = REPO/'experiments'/name
        for path in directory.rglob('*'):
            if any(part in ('.venv', '__pycache__', 'cache', 'model-cache', 'node_modules') for part in path.relative_to(directory).parts):
                continue
            if path.is_file():
                paths.append(path)
    for directory in ('web/src', 'web/public'):
        paths.extend(p for p in (REPO/directory).rglob('*') if p.is_file())
    for directory in (REPO, REPO/'web'):
        paths.extend(directory.glob('package*.json'))
        paths.extend(directory.glob('vite.config.*'))
        paths.extend(directory.glob('tsconfig*.json'))
    return files_hash(REPO, paths)

def cpath(identifier):
    return ROOT/'campaigns'/check_id(identifier)

def verify_campaign(campaign, active=True):
    info = read(campaign/'campaign.json')
    if sha(campaign/'campaign.json') != (campaign/'campaign.sha256').read_text().strip():
        raise ValueError('Campaign manifest changed')
    if info['protocol'] != PROTOCOL or info['sourceFiles'] != source_hashes():
        raise ValueError('Executable protocol changed')
    check_files(REPO, info['protectedFiles'])
    import model_adapter as model
    if model.baseline_integrity() != info['baselines']:
        raise ValueError('Prior baseline integrity changed')
    if (campaign/'pool-reference.json').exists():
        verify_pool(campaign)
    if active:
        if (campaign/'terminal.json').exists():
            raise ValueError('Campaign is terminal')
        if (campaign/'human-correction.json').exists():
            stop(campaign, 'human_label_correction'); raise ValueError('Human correction requires protocol review')
        if (campaign/'authoring-started.json').exists() and time.time() - read(campaign/'authoring-started.json')['unixTime'] > PROTOCOL['experimentSeconds']:
            stop(campaign, 'experiment_time_cap'); raise ValueError('Experiment time limit reached')
        total = sum(p.stat().st_size for p in ROOT.rglob('*') if p.is_file())
        if total > PROTOCOL['artifactBytes']:
            stop(campaign, 'artifact_cap'); raise ValueError('Artifact limit reached')
    return info

def verify_pool(campaign):
    expected = read(campaign/'pool-reference.json')['freezeSha256']
    if sha(campaign/'pool/freeze.json') != expected:
        raise ValueError('Original pool freeze changed')
    return verify_bundle(campaign/'pool')

def require_network_denial():
    library = ctypes.CDLL('/usr/lib/libSystem.B.dylib')
    if any(library.sandbox_check(os.getpid(), operation, 0) != 1 for operation in (b'network-outbound', b'network-inbound')):
        raise ValueError('OS sandbox network denial required')

class JobFailure(RuntimeError):
    def __init__(self, details):
        super().__init__('Offline job failed; see structured failure details')
        self.details = details

def failure_details(operation, stage, error):
    message = str(error).lower()
    reason = 'OPERATION_FAILURE'
    for text, code in [('network denial', 'NETWORK_DENIAL_REQUIRED'), ('parity', 'RELOAD_PARITY'),
                       ('cpu', 'CPU_CONSTRAINT'), ('optimization', 'OPTIMIZATION_INCOMPLETE'),
                       ('steps', 'OPTIMIZATION_INCOMPLETE'), ('encoder update', 'ENCODER_UNCHANGED'),
                       ('scores', 'INVALID_SCORES'), ('manifest', 'INTEGRITY'), ('changed', 'INTEGRITY'),
                       ('deadline', 'DEADLINE_EXPIRED'), ('replay', 'REPLAY_REFUSED')]:
        if text in message:
            reason = code; break
    explicit = getattr(error, 'reason_code', None)
    if explicit in {'RELOAD_PARITY', 'INVALID_SCORES', 'OPTIMIZATION_INCOMPLETE',
                    'ENCODER_UNCHANGED', 'CPU_CONSTRAINT', 'NONFINITE_WEIGHTS'}:
        reason = explicit
    if isinstance(error, FileExistsError):
        reason = 'REPLAY_REFUSED'
    return {'operation': operation, 'stage': stage, 'errorType': type(error).__name__, 'reasonCode': reason}

def event(campaign, kind, details=None):
    directory = campaign/'events'; directory.mkdir(exist_ok=True)
    count = len(list(directory.glob('*.json')))
    write_new(directory/f'{count+1:04d}-{kind}.json', {'kind': kind, 'unixTime': time.time(), 'details': details or {}})

def stop(campaign, reason, details=None):
    if not (campaign/'terminal.json').exists():
        write_new(campaign/'terminal.json', {'outcome': reason, 'details': details or {}, 'unixTime': time.time()})
        (campaign/'terminal.sha256').write_text(sha(campaign/'terminal.json')+'\n')
        event(campaign, 'terminal', {'reason': reason})

@contextlib.contextmanager
def locked(campaign):
    path = campaign/'.lock'
    with path.open('x') as stream:
        stream.write(str(os.getpid()))
    try:
        yield
    finally:
        path.unlink()

def offline_job(campaign, operation, payload, output, timeout=600):
    # Admission requests for evaluator-held text must never enter shared sources.
    request_root = campaign/'jobs' if output.resolve().is_relative_to(REPO) else output.parent/'jobs'
    job_id = f'{operation}-{time.time_ns()}'
    request = request_root/f'{job_id}.json'
    if (campaign/'authoring-started.json').exists():
        remaining = PROTOCOL['experimentSeconds'] - (time.time()-read(campaign/'authoring-started.json')['unixTime'])
        if remaining <= 0:
            raise TimeoutError('Experiment time limit reached')
        timeout = min(timeout, remaining)
    write_new(request, {'operation': operation, 'payload': payload, 'output': str(output.resolve()),
               'campaign': str(campaign.resolve()), 'jobId': job_id, 'deadline': time.time()+timeout,
               'campaignSha256': sha(campaign/'campaign.json')})
    write_new(campaign/'job-tickets'/f'{job_id}.json', {'request': str(request.resolve()), 'sha256': sha(request)})
    args = ['/usr/bin/sandbox-exec', '-p', '(version 1)(allow default)(deny network*)',
            sys.executable, '-B', str(ROOT/'campaign.py'), '_worker', '--request', str(request)]
    try:
        result = subprocess.run(args, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                timeout=timeout, env=dict(os.environ, PYTHONDONTWRITEBYTECODE='1'))
    except subprocess.TimeoutExpired:
        details = {'operation': operation, 'stage': 'worker', 'errorType': 'TimeoutExpired', 'reasonCode': 'DEADLINE_EXPIRED'}
        write_new(request.with_suffix('.result.json'), details)
        raise JobFailure(details) from None
    write_new(request.with_suffix('.result.json'), {'returncode': result.returncode,
              'stdoutBytes': len(result.stdout), 'stderrBytes': len(result.stderr), 'osNetworkDenied': True})
    if result.returncode or not output.is_file():
        failure = request.with_suffix('.failure.json')
        details = read(failure) if failure.exists() else {'operation': operation, 'stage': 'worker', 'errorType': 'WorkerExit',
                  'reasonCode': 'DEADLINE_EXPIRED' if result.returncode == -signal.SIGALRM else 'WORKER_EXIT'}
        raise JobFailure(details)
    return read(output)

def worker(args):
    request_path = Path(args.request).resolve()
    request = read(request_path); payload = request['payload']; operation = request['operation']
    stage = 'request_validation'
    try:
        require_network_denial()
        campaign = Path(request['campaign']).resolve()
        if campaign.parent != (ROOT/'campaigns').resolve():
            raise ValueError('Worker campaign escapes approved root')
        verify_campaign(campaign)
        ticket = read(campaign/'job-tickets'/f"{check_id(request['jobId'])}.json")
        if ticket != {'request': str(request_path), 'sha256': sha(request_path)} or request['campaignSha256'] != sha(campaign/'campaign.json'):
            raise ValueError('Worker request manifest changed')
        deadline = request['deadline']
        if deadline <= time.time():
            raise ValueError('Worker deadline expired')
        if Path(request['output']).exists():
            raise ValueError('Worker replay refused: output exists')
        if operation == 'train':
            run = Path(payload['run']).resolve()
            if run.parent != (campaign/'rounds').resolve() or payload['data'] != str(run/'data.json') or request['output'] != str(run/'dev-report.json'):
                raise ValueError('Training request paths changed')
            verify_bundle(run, 'prepared-freeze.json')
            attempt = read(campaign/'attempts'/f'{run.name}.json')
            if attempt['preparedHash'] != sha(run/'prepared-freeze.json'):
                raise ValueError('Training attempt manifest changed')
        elif operation == 'final':
            selection = verify_selection(campaign)
            consumed = read(campaign/'final-test-consumed.json')
            ref = read(campaign/'private-final-ref.json')
            if consumed['selectionHash'] != sha(campaign/'selection.json') or consumed['dataBundle'] != ref['bundleSha256']:
                raise ValueError('Final evaluation claim changed')
            if verify_bundle(Path(ref['path']))['bundleSha256'] != ref['bundleSha256'] or payload['data'] != str(Path(ref['path'])/'accepted.json') or payload['run'] != selection['run'] or request['output'] != str(campaign/'final-report.json'):
                raise ValueError('Final request changed')
        write_new(campaign/'worker-starts'/f"{request['jobId']}.json", {'requestSha256': sha(request_path), 'startedAt': time.time()})
        # A directly invoked worker is bounded too, even without its parent watchdog.
        signal.signal(signal.SIGALRM, signal.SIG_DFL)
        signal.setitimer(signal.ITIMER_REAL, max(.001, deadline-time.time()))
        stage = 'model_operation'
        import model_adapter as model
        with contextlib.redirect_stdout(io.StringIO()):
            result = worker_operation(operation, payload, model)
        stage = 'result_write'
        write_new(Path(request['output']), result)
    except Exception as error:
        failure = request_path.with_suffix('.failure.json')
        if not failure.exists():
            write_new(failure, failure_details(operation, stage, error))
        raise
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)

def worker_operation(operation, payload, model):
        if operation == 'admit':
            result = model.admit_texts(payload['texts'])
        elif operation == 'scores':
            result = model.score_baselines(payload['texts'])
            result['current'] = model.score_candidate(Path(payload['run']), payload['texts']) if payload.get('run') else result['C42']
        elif operation == 'train':
            result = model.train_candidate(Path(payload['run']), read(payload['data']), read(ROOT/'recipe.json'))
        elif operation == 'final':
            from final_eval import validate_final_profile, evaluate_predictions
            rows = read(payload['data']); validate_final_profile(rows)
            texts = [r['text'] for r in rows]
            scores = model.score_baselines(texts)
            scores['candidate'] = model.score_candidate(Path(payload['run']), texts)
            result = evaluate_predictions(rows, scores, payload['thresholds'], payload['devPassed'])
            result['osNetworkDenied'] = True
        elif operation == 'predict':
            admission = model.admit_texts([payload['text']])[0]
            result = {'admission': admission, 'uncalibratedScore': True}
            if admission['admitted']:
                score = model.score_candidate(Path(payload['run']), [payload['text']])[0]
                result.update(score=score, threshold=payload['threshold'], label=int(score >= payload['threshold']))
        else:
            raise ValueError('Unknown model operation')
        return result

def init(args):
    import model_adapter as model
    parents = ROOT/'campaigns'; parents.mkdir(exist_ok=True)
    with locked(parents):
        if any(p.is_dir() for p in parents.iterdir()):
            raise ValueError('This protocol permits one campaign; no replacement IDs')
        campaign = cpath(args.campaign); campaign.mkdir()
        info = {'campaignId': args.campaign, 'protocol': PROTOCOL, 'sourceFiles': source_hashes(),
                'protectedFiles': protected_hashes(), 'baselines': model.baseline_integrity(), 'createdAt': time.time()}
        write_new(campaign/'campaign.json', info)
        (campaign/'campaign.sha256').write_text(sha(campaign/'campaign.json')+'\n')
        event(campaign, 'initialized')
    emit({'campaign': args.campaign, 'protectedFiles': len(info['protectedFiles']), 'experimentStarted': False})

def start_authoring(campaign, args):
    write_new(campaign/'authoring-started.json', {'unixTime': time.time()})
    event(campaign, 'authoring_started'); emit({'started': True, 'seconds': PROTOCOL['experimentSeconds']})

def freeze_pool(campaign, args):
    if not (campaign/'authoring-started.json').exists():
        raise ValueError('Authoring start must be recorded before generation')
    import model_adapter as model
    pool = read(args.pool); rows = validate_pool(pool, 300)
    target = campaign/'pool'; target.mkdir()
    write_new(target/'raw.json', pool)
    admissions = offline_job(campaign, 'admit', {'texts': [r['text'] for r in rows]}, target/'admissions.json')
    reasons = overlap_reasons(rows, model.contamination_rows(), admissions)
    if args.audit:
        audit = read(args.audit)
        if set(audit) != {'poolSha256', 'excludedGroups', 'reviewer', 'note'} or audit['poolSha256'] != sha(args.pool):
            raise ValueError('Semantic audit must bind raw pool')
        for group in audit['excludedGroups']:
            if group not in reasons:
                raise ValueError('Unknown audited family')
            reasons[group] = sorted(set(reasons[group]) | {'identified_scenario_reuse'})
        write_new(target/'semantic-audit.json', audit)
    eligible = [r for r in rows if not reasons[r['group']]]
    write_new(target/'eligible.json', eligible); write_new(target/'exclusions.json', reasons)
    bundle(target)
    write_new(campaign/'pool-reference.json', {'freezeSha256': sha(target/'freeze.json')})
    event(campaign, 'pool_frozen', {'authored': 300, 'eligible': len(eligible)})
    emit({'authored': 300, 'eligible': len(eligible), 'families': len(eligible)//4})

def rounds(campaign):
    return sorted((campaign/'rounds').glob('round-*'))

def completed(campaign):
    out = []
    for folder in rounds(campaign):
        if (folder/'freeze.json').exists():
            verify_bundle(folder)
            out.append(folder)
    return out

def acquire_round(campaign, args):
    import model_adapter as model
    if (campaign/'selection.json').exists() or (campaign/'acquisition-complete.json').exists():
        raise ValueError('Acquisition has ended')
    previous = rounds(campaign)
    if len(previous) >= 3:
        raise ValueError('Round budget exhausted')
    if previous and not (previous[-1]/'freeze.json').exists():
        raise ValueError('Previous round has not completed')
    verify_pool(campaign)
    rows = read(campaign/'pool/eligible.json')
    used = set()
    for folder in previous:
        used.update(read(folder/'selection.json')['groups'])
    if len({r['group'] for r in rows}-used) < 10:
        write_new(campaign/'acquisition-complete.json', {'reason': 'insufficient_pool'})
        emit({'stop': 'insufficient_pool'}); return
    n = len(previous)+1; folder = campaign/'rounds'/f'round-{n}'; folder.mkdir(parents=True)
    latest = completed(campaign)
    run = latest[-1] if latest else None
    score_path = folder/'scores.json'
    scores = offline_job(campaign, 'scores', {'texts': [r['text'] for r in rows], 'run': str(run) if run else None}, score_path)
    thresholds = model.baseline_thresholds()
    current_t = read(run/'dev-report.json')['operatingPoint']['threshold'] if run else thresholds['C42']
    result = acquire(rows, {k: scores[k] for k in ('A','B','current')},
                     {'A': thresholds['A'], 'B': thresholds['B'], 'current': current_t}, used, n)
    result['scoringCandidate'] = str(run) if run else 'C42'
    result['thresholds'] = {'A': thresholds['A'], 'B': thresholds['B'], 'current': current_t}
    result['poolHash'] = sha(campaign/'pool/freeze.json')
    write_new(folder/'selection.json', result)
    selected = [row for row in rows if row['id'] in result['exampleIds']]
    write_new(folder/'selected.json', selected)
    for role in ('teacher', 'reviewer'):
        packet, mapping = make_packet(selected, digest(result), role)
        write_new(folder/f'{role}-packet.json', packet)
        write_new(folder/f'{role}-mapping.json', mapping)
    bundle(folder, 'acquisition-freeze.json')
    event(campaign, 'acquired', {'round': n, 'groups': result['groups']})
    emit({'roundId': folder.name, 'passages': len(selected), 'routes': result['groups'], 'fallback': result['fallbackUncertaintyFamilies']})

def prepare(campaign, args):
    import model_adapter as model
    folder = campaign/'rounds'/check_id(args.round)
    if folder != rounds(campaign)[-1] or (folder/'prepared.json').exists():
        raise ValueError('Round is not the unprepared current round')
    verify_bundle(folder, 'acquisition-freeze.json')
    rows = read(folder/'selected.json')
    packets = {r: read(folder/f'{r}-packet.json') for r in ('teacher','reviewer')}
    mappings = {r: read(folder/f'{r}-mapping.json') for r in packets}
    hashes = {r: sha(folder/f'{r}-packet.json') for r in packets}
    annotations = {'teacher': read(args.teacher), 'reviewer': read(args.reviewer)}
    accepted, quarantine = agree(rows, annotations, packets, mappings, hashes)
    for role, document in annotations.items():
        write_new(folder/f'{role}-annotation.json', document)
    base = model.load_base_rows()
    parents = completed(campaign)
    additions = [r for parent in parents for r in read(parent/'accepted.json')]
    data = base + additions + accepted
    if len({r['id'] for r in data}) != len(data) or [r for r in data if r['split']=='dev'] != [r for r in base if r['split']=='dev']:
        raise ValueError('Training lineage corrupted')
    write_new(folder/'accepted.json', accepted); write_new(folder/'quarantine.json', quarantine)
    write_new(folder/'data.json', data)
    ready = len(accepted) >= 8
    selection = read(folder/'selection.json')
    report = {'roundId': folder.name, 'roundNumber': len(rounds(campaign)), 'accepted': len(accepted),
              'quarantined': len(quarantine), 'trainingRows': 120+len(additions)+len(accepted), 'devRows': 30,
              'ready': ready, 'parents': [{'roundId': p.name, 'bundleSha256': verify_bundle(p)['bundleSha256']} for p in parents],
              'acceptedByRoute': {route: sum(selection['groups'][r['group']]==route for r in accepted) for route in ('random','disagreement','uncertainty')},
              'quarantinedByRoute': {route: sum(selection['groups'][r['group']]==route for r in quarantine) for route in ('random','disagreement','uncertainty')}}
    write_new(folder/'prepared.json', report)
    sample = human_sample(accepted, folder.name)
    wanted = set(sample) | {r['id'] for r in quarantine}
    packet = {'status': 'human review pending', 'sampleAgreementIds': sample,
              'items': [{'id': r['id'], 'text': r['text']} for r in rows if r['id'] in wanted]}
    write_new(folder/'human-review-text.json', packet)
    by_role = {role: {d['id']: d for d in annotations[role]['decisions']} for role in annotations}
    write_new(folder/'human-review-answers.json', {'items': [dict(id=row['id'], **{
        role: by_role[role][mappings[role][row['id']]] for role in by_role}) for row in rows if row['id'] in wanted], 'quarantine': quarantine})
    text = '# Human audit — pending\n\nRead each passage and record your judgment before opening human-review-answers.json.\n\n'
    for row in packet['items']:
        text += f"## {row['id']}\n\n{row['text']}\n\nYour label/category, uncertainty and reason: ____________________\n\n"
    (folder/'human-review.md').write_text(text)
    bundle(folder, 'prepared-freeze.json')
    if not ready:
        write_new(campaign/'acquisition-complete.json', {'reason': 'insufficient_additions', 'round': folder.name})
    event(campaign, 'prepared', report); emit(report)

def train(campaign, args):
    folder = campaign/'rounds'/check_id(args.round)
    if folder != rounds(campaign)[-1] or not read(folder/'prepared.json')['ready']:
        raise ValueError('No trainable current round')
    verify_bundle(folder, 'prepared-freeze.json')
    starts = list((campaign/'attempts').glob('*.json'))
    if len(starts) >= 3:
        raise ValueError('Training attempt limit')
    write_new(campaign/'attempts'/f'{folder.name}.json', {'startedAt': time.time(), 'preparedHash': sha(folder/'prepared-freeze.json')})
    result = offline_job(campaign, 'train', {'run': str(folder), 'data': str(folder/'data.json')},
                         folder/'dev-report.json', timeout=600)
    # Attach controller identity without changing the adapter report.
    write_new(folder/'round-report.json', dict(result, roundId=folder.name, roundNumber=len(rounds(campaign)), osNetworkDenied=True))
    verify_bundle(folder, 'prepared-freeze.json'); verify_campaign(campaign)
    bundle(folder)
    event(campaign, 'trained', {'round': folder.name})
    if len(rounds(campaign)) == 3:
        write_new(campaign/'acquisition-complete.json', {'reason': 'round_cap'})
    emit({'roundId': folder.name, 'candidate': result['candidate'], 'operatingPoint': result['operatingPoint']['threshold'], 'devGatePassed': result['operatingPoint']['gatePassed']})

def select_final(campaign, args):
    from final_eval import select_candidate
    import model_adapter as model
    if not (campaign/'acquisition-complete.json').exists():
        raise ValueError('Acquisition has not reached its fixed endpoint')
    finished = completed(campaign)
    if not finished:
        stop(campaign, 'no_trained_candidate'); emit({'stop': 'no_trained_candidate'}); return
    selection = select_candidate([read(p/'round-report.json') for p in finished])
    run = campaign/'rounds'/selection['roundId']
    selection.update(run=str(run), modelBundleSha256=verify_bundle(run)['bundleSha256'],
                     baselineThresholds=model.baseline_thresholds(), baselineBundles=model.baseline_integrity(),
                     selectedAt=time.time(), incumbent='C42 retained; no replacement or promotion')
    write_new(campaign/'selection.json', selection)
    write_new(campaign/'selection-freeze.json', {'sha256': sha(campaign/'selection.json')})
    event(campaign, 'candidate_selected', {'roundId': selection['roundId'], 'diagnostic': selection['diagnostic']})
    emit(selection)

def verify_selection(campaign):
    if sha(campaign/'selection.json') != read(campaign/'selection-freeze.json')['sha256']:
        raise ValueError('Final selection changed')
    selection = read(campaign/'selection.json')
    if verify_bundle(Path(selection['run']))['bundleSha256'] != selection['modelBundleSha256']:
        raise ValueError('Selected candidate changed')
    return selection

def final_kit(campaign, args):
    selection = verify_selection(campaign)
    private = Path(args.private).resolve()
    if private.is_relative_to(REPO) or not private.is_dir():
        raise ValueError('Final reference directory must be outside repository')
    pool = read(private/'pool.json')
    rows = validate_pool(pool, 120)
    if (private/'pool.json').stat().st_mtime < selection['selectedAt']:
        raise ValueError('Final authorship precedes candidate selection')
    context = sha(private/'pool.json')
    for role in ('teacher','reviewer'):
        packet, _ = make_packet(rows, context, role)
        write_new(private/f'{role}-packet.json', packet)
    bundle(private, 'reference-authoring-freeze.json')
    emit({'packetsReady': True, 'items': 120})

def final_prepare(campaign, args):
    # This command is for the evaluator: raw references stay outside the repository.
    from final_eval import validate_final_profile
    import model_adapter as model
    verify_selection(campaign)
    private = Path(args.private).resolve()
    if private.is_relative_to(REPO) or not private.is_dir():
        raise ValueError('Final fixtures require an evaluator-owned directory outside repository')
    if (campaign/'final-preparation.json').exists():
        raise ValueError('Final reference already attempted')
    write_new(campaign/'final-preparation.json', {'startedAt': time.time(), 'selectionHash': sha(campaign/'selection.json')})
    pool = read(private/'pool.json'); rows = validate_pool(pool, 120)
    verify_bundle(private, 'reference-authoring-freeze.json')
    context = sha(private/'pool.json')
    packets, mappings, hashes = {}, {}, {}
    for role in ('teacher','reviewer'):
        packet, mapping = make_packet(rows, context, role)
        if packet != read(private/f'{role}-packet.json'):
            raise ValueError('Final annotation packet mismatch')
        packets[role] = packet; mappings[role] = mapping; hashes[role] = sha(private/f'{role}-packet.json')
    annotations = {r: read(private/f'{r}-annotation.json') for r in packets}
    accepted, quarantine = agree(rows, annotations, packets, mappings, hashes)
    admissions = offline_job(campaign, 'admit', {'texts': [r['text'] for r in rows]}, private/'admissions.json')
    verify_pool(campaign)
    overlap = overlap_reasons(rows, model.contamination_rows()+read(campaign/'pool/raw.json')['examples'], admissions)
    if (private/'semantic-audit.json').exists():
        audit = read(private/'semantic-audit.json')
        if set(audit) != {'poolSha256','excludedGroups','reviewer','note'} or audit['poolSha256'] != sha(private/'pool.json'):
            raise ValueError('Final semantic audit must bind exact references')
        for group in audit['excludedGroups']:
            if group not in overlap:
                raise ValueError('Unknown semantic exclusion family')
            overlap[group] = sorted(set(overlap[group]) | {'identified_scenario_reuse'})
    verify_pool(campaign)
    bad = {g for g, reasons in overlap.items() if reasons}
    accepted = [r for r in accepted if r['group'] not in bad]
    write_new(private/'accepted.json', accepted)
    write_new(private/'quarantine.json', {'annotation': quarantine, 'overlap': overlap})
    try:
        profile = validate_final_profile(accepted)
    except ValueError:
        write_new(campaign/'final-coverage.json', {'authored': 120, 'accepted': len(accepted), 'acceptedFamilies': len(accepted)//4, 'passed': False})
        (campaign/'final-coverage.sha256').write_text(sha(campaign/'final-coverage.json')+'\n')
        bundle(private)
        stop(campaign, 'insufficient_final_reference'); emit({'stop': 'insufficient_final_reference', 'accepted': len(accepted)}); return
    bundle(private)
    write_new(campaign/'private-final-ref.json', {'path': str(private), 'bundleSha256': verify_bundle(private)['bundleSha256']})
    write_new(campaign/'final-coverage.json', {'authored': 120, 'accepted': len(accepted), 'passed': True, 'profile': profile})
    (campaign/'final-coverage.sha256').write_text(sha(campaign/'final-coverage.json')+'\n')
    event(campaign, 'final_reference_frozen', {'accepted': len(accepted)})
    emit({'accepted': len(accepted), 'profile': profile})

def predict(campaign, args):
    verify_campaign(campaign, active=False)
    selection = verify_selection(campaign)
    text = sys.stdin.read(2002)
    result = subprocess.run(['/usr/bin/sandbox-exec', '-p', '(version 1)(allow default)(deny network*)',
              sys.executable, '-B', str(ROOT/'campaign.py'), '_predict', '--run', selection['run'],
              '--threshold', str(selection['threshold'])], input=text, text=True, capture_output=True, timeout=60)
    if result.returncode:
        raise ValueError('Offline prediction failed')
    verify_selection(campaign); verify_campaign(campaign, active=False)
    emit(json.loads(result.stdout))

def prediction_worker(args):
    require_network_denial()
    import model_adapter as model
    text = sys.stdin.read(2002)
    with contextlib.redirect_stdout(io.StringIO()):
        admission = model.admit_texts([text])[0]
        result = {'admission': admission, 'uncalibratedScore': True}
        if admission['admitted']:
            score = model.score_candidate(Path(args.run), [text])[0]
            result.update(score=score, threshold=args.threshold, label=int(score >= args.threshold))
    emit(result)

def final_evaluate(campaign, args):
    import model_adapter as model
    selection = verify_selection(campaign)
    ref = read(campaign/'private-final-ref.json'); private = Path(ref['path'])
    if verify_bundle(private)['bundleSha256'] != ref['bundleSha256']:
        raise ValueError('Final data changed')
    write_new(campaign/'final-test-consumed.json', {'startedAt': time.time(), 'dataBundle': ref['bundleSha256'], 'selectionHash': sha(campaign/'selection.json')})
    thresholds = dict(selection['baselineThresholds'], candidate=selection['threshold'])
    # All frozen comparison baselines failed DEV; verify against saved summary below.
    summary = read(REPO/'experiments/encoder-comparison/artifacts/training-summary.json')
    gates = {c['name']: c['operatingPoint']['gatePassed'] for c in summary['candidates'] if c['name'] in ('A','B','C42')}
    gates['candidate'] = not selection['diagnostic']
    result = offline_job(campaign, 'final', {'data': str(private/'accepted.json'), 'run': selection['run'],
               'thresholds': thresholds, 'devPassed': gates}, campaign/'final-report.json')
    verify_bundle(private); verify_selection(campaign); verify_campaign(campaign)
    write_new(campaign/'final-result-freeze.json', {'reportSha256': sha(campaign/'final-report.json'),
              'selectionSha256': sha(campaign/'selection.json'), 'referenceBundle': ref['bundleSha256']})
    stop(campaign, 'completed', {'diagnostic': selection['diagnostic']})
    emit({'outcome': 'completed', 'candidate': result['results']['candidate']})

def status(campaign, args):
    info = verify_campaign(campaign, active=False)
    result = {'campaign': info['campaignId'], 'rounds': [], 'terminal': read(campaign/'terminal.json') if (campaign/'terminal.json').exists() else None}
    for folder in rounds(campaign):
        entry = {'roundId': folder.name, 'trained': (folder/'freeze.json').exists()}
        if (folder/'prepared.json').exists():
            entry.update(read(folder/'prepared.json'))
        if entry['trained']:
            verify_bundle(folder); report = read(folder/'round-report.json')
            entry.update(candidate=report['candidate'], devGatePassed=report['operatingPoint']['gatePassed'])
        result['rounds'].append(entry)
    emit(result)

def label_kit(campaign, args):
    folder = campaign/'rounds'/check_id(args.round)
    verify_bundle(folder, 'acquisition-freeze.json')
    emit({'packet': str(folder/f'{args.role}-packet.json'), 'packetSha256': sha(folder/f'{args.role}-packet.json'),
          'rubric': str(REPO/'experiments/encoder-comparison/data/rubric.md'),
          'schema': {'schemaVersion': 2, 'packetSha256': 'exact packet file hash',
                     'actor': {'actorId': 'distinct actual agent ID', 'model': 'configured model'},
                     'decisions': [{'id': 'packet item ID', 'status': 'clear or ambiguous',
                         'label': '0 or 1; null if ambiguous', 'category': 'rubric category or ambiguous',
                         'rationale': 'brief independent explanation', 'evidence': ['literal supporting quotation']}]}})

def report(campaign, args):
    integrity = {'passed': True}
    try:
        verify_campaign(campaign, active=False)
    except Exception as error:
        integrity = {'passed': False, 'errorType': type(error).__name__}
    records = []
    earlier = []
    for folder in rounds(campaign):
        record = {'roundId': folder.name, 'queried': 40 if (folder/'selection.json').exists() else 0,
                  'trainingAttempted': (campaign/'attempts'/f'{folder.name}.json').exists()}
        verified = True
        try:
            if (folder/'freeze.json').exists():
                verify_bundle(folder)
            elif (folder/'prepared-freeze.json').exists():
                verify_bundle(folder, 'prepared-freeze.json')
            else:
                verify_bundle(folder, 'acquisition-freeze.json')
        except Exception as error:
            verified = False; integrity['passed'] = False
            record['integrityError'] = type(error).__name__
        if verified and (folder/'prepared.json').exists():
            record['preparation'] = read(folder/'prepared.json')
        if verified and (folder/'freeze.json').exists():
            data = read(folder/'round-report.json')
            record['development'] = data
            record['previousRoundComparisons'] = [{
                'roundId': old['roundId'], 'f1Delta': data['candidate']['f1']-old['candidate']['f1'],
                'falsePositiveDelta': data['candidate']['fp']-old['candidate']['fp'],
                'truePositiveDelta': data['candidate']['tp']-old['candidate']['tp']} for old in earlier]
            earlier.append(data)
        records.append(record)
    selection, final_result, final_coverage, terminal = None, None, None, None
    try:
        if (campaign/'selection.json').exists():
            selection = verify_selection(campaign)
        if (campaign/'final-report.json').exists():
            frozen = read(campaign/'final-result-freeze.json')
            if frozen['reportSha256'] != sha(campaign/'final-report.json') or frozen['selectionSha256'] != sha(campaign/'selection.json'):
                raise ValueError('Final report changed')
            final_result = read(campaign/'final-report.json')
    except Exception as error:
        integrity.update(passed=False, reportError=type(error).__name__)
    for name in ('final-coverage', 'terminal'):
        if (campaign/f'{name}.json').exists():
            try:
                if sha(campaign/f'{name}.json') != (campaign/f'{name}.sha256').read_text().strip():
                    raise ValueError('Final coverage or terminal evidence changed')
                if name == 'terminal':
                    terminal = read(campaign/'terminal.json')
                else:
                    final_coverage = read(campaign/'final-coverage.json')
            except Exception as error:
                integrity.update(passed=False, stateError=type(error).__name__)
    result = {'campaignId': campaign.name, 'integrity': integrity, 'rounds': records,
              'terminal': terminal,
              'selection': selection,
              'finalEvaluation': final_result,
              'finalCoverage': final_coverage,
              'humanReview': 'pending', 'limitations': [
                  'All labels are AI judgments; procedural separation does not remove shared model bias.',
                  'Repeated DEV contains only five scenario families and is tuning evidence.',
                  'Final references are synthetic and agreement-filtered; artificial prevalence limits precision interpretation.',
                  'No random-only training control: cannot attribute changes to active acquisition.',
                  'Historical raw heldouts were not accessed; historical disjointness is not independently verified.',
                  'No useful-finding, reliability, human-validation or deployment claim.']}
    out = Path(args.out).resolve()
    if not out.is_relative_to(ROOT):
        raise ValueError('Report output belongs inside experiment package')
    write_new(out, result)
    emit({'report': str(out), 'rounds': len(records), 'terminal': result['terminal'], 'integrity': integrity})

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--campaign', default='active-001')
    sub = parser.add_subparsers(dest='command', required=True)
    for name in ('init','start-authoring','acquire','select-final','final-evaluate','status','predict'):
        sub.add_parser(name)
    pool = sub.add_parser('freeze-pool'); pool.add_argument('--pool', required=True); pool.add_argument('--audit')
    pre = sub.add_parser('prepare'); pre.add_argument('--round', required=True); pre.add_argument('--teacher', required=True); pre.add_argument('--reviewer', required=True)
    training = sub.add_parser('train'); training.add_argument('--round', required=True)
    final = sub.add_parser('final-prepare'); final.add_argument('--private', required=True)
    kit = sub.add_parser('final-kit'); kit.add_argument('--private', required=True)
    labels = sub.add_parser('label-kit'); labels.add_argument('--round', required=True); labels.add_argument('--role', choices=('teacher','reviewer'), required=True)
    reporting = sub.add_parser('report'); reporting.add_argument('--out', required=True)
    job = sub.add_parser('_worker'); job.add_argument('--request', required=True)
    pred = sub.add_parser('_predict'); pred.add_argument('--run', required=True); pred.add_argument('--threshold', type=float, required=True)
    args = parser.parse_args()
    if args.command == '_worker':
        worker(args); return
    if args.command == '_predict':
        prediction_worker(args); return
    if args.command == 'init':
        init(args); return
    campaign = cpath(args.campaign)
    if args.command == 'status':
        status(campaign, args); return
    if args.command == 'predict':
        predict(campaign, args); return
    if args.command == 'report':
        report(campaign, args); return
    with locked(campaign):
        try:
            verify_campaign(campaign)
            handler = acquire_round if args.command == 'acquire' else globals()[args.command.replace('-', '_')]
            handler(campaign, args)
        except Exception as error:
            # Once authoring begins, failures are never silently repaired/retried.
            if (campaign/'authoring-started.json').exists():
                details = {'command': args.command, 'errorType': type(error).__name__}
                if isinstance(error, JobFailure):
                    details['workerFailure'] = error.details
                stop(campaign, 'execution_or_integrity_failure', details)
            raise

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        emit({'errorType': type(error).__name__, 'error': 'Operation refused or failed; input text omitted.'})
        raise SystemExit(1) from None
