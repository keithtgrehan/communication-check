"""Temporary-directory controller tests; no real models, training or campaigns."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
SOURCE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('tested_active_campaign', SOURCE / 'campaign.py')
campaign = importlib.util.module_from_spec(spec)
spec.loader.exec_module(campaign)
import model_adapter


def pool_rows(families=75, prefix='pool'):
    return [dict(id=f'{prefix}-{i:03d}', group=f'{prefix}-family-{i // 4:03d}',
                 text=f'Fictional isolated {prefix} passage {i}.',
                 lengthClass='single' if i % 4 < 2 else 'multi') for i in range(families * 4)]


def base_rows():
    return [dict(id=f'base-{i:03d}', group=f'base-family-{i // 6:03d}',
                 text=f'Original fictional passage {i}.', split='train' if i < 120 else 'dev',
                 label=i % 2, category='firm_delivery' if i % 2 else 'other') for i in range(150)]


def accepted_rows(rows):
    return [dict(row, split='train', label=i % 2, category='firm_delivery' if i % 2 else 'request') for i, row in enumerate(rows)]


def round_report(identifier='round-1', number=1):
    metric = dict(f1=.6, fp=3, tp=9, recall=.6, precision=.75)
    return dict(roundId=identifier, roundNumber=number, candidate=metric,
                operatingPoint=dict(threshold=.5, gatePassed=False, chosen=metric, curve=[dict(threshold=.5, **metric)]))


class CampaignTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name).resolve()
        self.repo = self.base / 'repo'
        self.root = self.repo / 'experiments/active-learning'
        self.root.mkdir(parents=True)
        self.current = self.root / 'campaigns/mock-campaign'
        self.current.mkdir(parents=True)
        self.private = self.base / 'private-evaluator'
        self.private.mkdir()
        self.baselines = {'encoder': {'files': 67, 'bundleSha256': 'encoder'}, 'teaching': {'files': 30, 'bundleSha256': 'teaching'}}
        patches = [patch.object(campaign, 'ROOT', self.root), patch.object(campaign, 'REPO', self.repo),
                   patch.object(campaign, 'source_hashes', return_value={}),
                   patch.object(campaign, 'protected_hashes', return_value={}),
                   patch.object(model_adapter, 'baseline_integrity', return_value=self.baselines),
                   patch.object(model_adapter, 'baseline_thresholds', return_value={'A': .5, 'B': .5, 'C42': .5}),
                   patch.object(model_adapter, 'load_base_rows', side_effect=base_rows),
                   patch.object(campaign, 'emit')]
        for item in patches:
            item.start()
            self.addCleanup(item.stop)
        info = dict(campaignId='mock-campaign', protocol=campaign.PROTOCOL, sourceFiles={}, protectedFiles={}, baselines=self.baselines)
        campaign.write_new(self.current / 'campaign.json', info)
        (self.current / 'campaign.sha256').write_text(campaign.sha(self.current / 'campaign.json'))

    def make_pool(self, families=75):
        rows = pool_rows(families)
        campaign.write_new(self.current / 'pool/eligible.json', rows)
        campaign.write_new(self.current / 'pool/raw.json', {'examples': rows})
        campaign.bundle(self.current / 'pool')
        campaign.write_new(self.current / 'pool-reference.json', {'freezeSha256': campaign.sha(self.current / 'pool/freeze.json')})
        return rows

    def fake_job(self, parent, operation, payload, output, **kwargs):
        if operation == 'scores':
            result = {key: [value] * len(payload['texts']) for key, value in [('A', .8), ('B', .2), ('C42', .5), ('current', .51)]}
        elif operation == 'train':
            result = round_report()
        elif operation == 'final':
            result = {'results': {'candidate': {'metrics': {'f1': .6}}}}
        else:
            raise AssertionError('Unexpected mocked operation')
        campaign.write_new(output, result)
        return result

    def acquire(self):
        with patch.object(campaign, 'offline_job', side_effect=self.fake_job):
            campaign.acquire_round(self.current, SimpleNamespace())
        return campaign.rounds(self.current)[-1]

    def finish(self, folder, accepted=None):
        report = round_report(folder.name, len(campaign.rounds(self.current)))
        campaign.write_new(folder / 'dev-report.json', report)
        campaign.write_new(folder / 'round-report.json', report)
        campaign.write_new(folder / 'accepted.json', accepted or [])
        campaign.bundle(folder)

    def annotations(self, folder, accept_groups=None):
        selected = campaign.read(folder / 'selected.json')
        by_id = {row['id']: (i, row) for i, row in enumerate(selected)}
        paths = {}
        for role in ('teacher', 'reviewer'):
            packet = campaign.read(folder / f'{role}-packet.json')
            mapping = campaign.read(folder / f'{role}-mapping.json')
            reverse = {opaque: original for original, opaque in mapping.items()}
            decisions = []
            for item in packet['items']:
                index, row = by_id[reverse[item['id']]]
                ambiguous = accept_groups is not None and row['group'] not in accept_groups
                decisions.append(dict(id=item['id'], status='ambiguous' if ambiguous else 'clear',
                    label=None if ambiguous else index % 2,
                    category='ambiguous' if ambiguous else 'firm_delivery' if index % 2 else 'request',
                    rationale='Mock independent annotation.', evidence=[item['text']]))
            paths[role] = self.base / f'{folder.name}-{role}.json'
            campaign.write_new(paths[role], dict(schemaVersion=2, packetSha256=campaign.sha(folder / f'{role}-packet.json'),
                actor={'actorId': role, 'model': 'mock'}, decisions=decisions))
        return SimpleNamespace(round=folder.name, **paths)

    def make_selection(self):
        folder = self.current / 'rounds/round-1'
        folder.mkdir(parents=True)
        self.finish(folder)
        campaign.write_new(self.current / 'acquisition-complete.json', {'reason': 'round_cap'})
        campaign.select_final(self.current, SimpleNamespace())
        return folder

    def make_final_reference(self):
        self.make_selection()
        campaign.write_new(self.private / 'accepted.json', [{'text': 'private fixture only'}])
        campaign.bundle(self.private)
        campaign.write_new(self.current / 'private-final-ref.json', {'path': str(self.private), 'bundleSha256': campaign.verify_bundle(self.private)['bundleSha256']})
        summary = self.repo / 'experiments/encoder-comparison/artifacts/training-summary.json'
        campaign.write_new(summary, {'candidates': [{'name': name, 'operatingPoint': {'gatePassed': False}} for name in ('A', 'B', 'C42')]})

    def test_bundle_rejects_file_tampering_and_manifest_map_tampering(self):
        folder = self.root / 'bundle'
        campaign.write_new(folder / 'data.json', {'original': True})
        campaign.bundle(folder)
        campaign.verify_bundle(folder)
        (folder / 'data.json').write_text('{}')
        with self.assertRaises(ValueError):
            campaign.verify_bundle(folder)
        manifest = campaign.read(folder / 'freeze.json')
        manifest['files']['data.json'] = campaign.sha(folder / 'data.json')
        (folder / 'freeze.json').write_text(json.dumps(manifest))
        with self.assertRaisesRegex(ValueError, 'digest'):
            campaign.verify_bundle(folder)

    def test_manifest_paths_cannot_escape_by_parent_or_symlink(self):
        outside = self.base / 'outside.json'
        outside.write_text('{}')
        (self.root / 'escape.json').symlink_to(outside)
        for relative in ('../../../outside.json', 'escape.json', str(outside)):
            with self.subTest(relative=relative), self.assertRaises(ValueError):
                campaign.check_files(self.root, {relative: campaign.sha(outside)})

    def test_lock_is_exclusive_and_released_on_exception(self):
        with self.assertRaisesRegex(RuntimeError, 'mock'):
            with campaign.locked(self.current):
                with self.assertRaises(FileExistsError):
                    with campaign.locked(self.current):
                        self.fail('Concurrent lock was accepted')
                self.assertTrue((self.current / '.lock').exists())
                raise RuntimeError('mock failure')
        self.assertFalse((self.current / '.lock').exists())
        with campaign.locked(self.current):
            pass

    def test_existing_campaign_prevents_new_identifier(self):
        with self.assertRaisesRegex(ValueError, 'one campaign'):
            campaign.init(SimpleNamespace(campaign='replacement'))
        self.assertFalse((self.root / 'campaigns/replacement').exists())

    def test_three_acquisitions_remove_all_queried_families_and_refuse_fourth(self):
        self.make_pool()
        seen = set()
        for number in range(1, 4):
            folder = self.acquire()
            selection = campaign.read(folder / 'selection.json')
            groups = set(selection['groups'])
            self.assertEqual(folder.name, f'round-{number}')
            self.assertEqual(len(groups), 10)
            self.assertFalse(groups & seen)
            self.assertEqual(len(campaign.read(folder / 'selected.json')), 40)
            seen |= groups
            # Even entirely quarantined families remain queried and are not reacquired.
            self.finish(folder, accepted=[])
        with patch.object(campaign, 'offline_job') as scorer, self.assertRaisesRegex(ValueError, 'budget'):
            campaign.acquire_round(self.current, SimpleNamespace())
        scorer.assert_not_called()

    def test_unfinished_round_blocks_another_acquisition(self):
        self.make_pool()
        self.acquire()
        with self.assertRaisesRegex(ValueError, 'not completed'):
            campaign.acquire_round(self.current, SimpleNamespace())

    def test_pool_shortage_is_normal_endpoint_without_scoring(self):
        self.make_pool(9)
        with patch.object(campaign, 'offline_job') as scorer:
            campaign.acquire_round(self.current, SimpleNamespace())
        scorer.assert_not_called()
        self.assertEqual(campaign.read(self.current / 'acquisition-complete.json')['reason'], 'insufficient_pool')
        self.assertEqual(campaign.rounds(self.current), [])

    def test_prepare_preserves_originals_and_accumulates_only_accepted_additions(self):
        self.make_pool()
        first = self.acquire()
        selected_first = campaign.read(first / 'selected.json')
        accepted_first = accepted_rows(selected_first[:8])
        self.finish(first, accepted_first)
        second = self.acquire()
        selected_second = campaign.read(second / 'selected.json')
        accepted_groups = {row['group'] for row in selected_second[:8]}
        args = self.annotations(second, accepted_groups)
        campaign.prepare(self.current, args)
        data = campaign.read(second / 'data.json')
        self.assertEqual(data[:150], base_rows())
        self.assertEqual(data[150:158], accepted_first)
        self.assertEqual(len(data), 166)
        self.assertEqual([row for row in data if row['split'] == 'dev'], base_rows()[120:])
        report = campaign.read(second / 'prepared.json')
        self.assertEqual((report['accepted'], report['quarantined'], report['trainingRows']), (8, 32, 136))
        quarantine_ids = {row['id'] for row in campaign.read(second / 'quarantine.json')}
        self.assertFalse(quarantine_ids & {row['id'] for row in data})
        with self.assertRaisesRegex(ValueError, 'unprepared'):
            campaign.prepare(self.current, args)

    def test_insufficient_new_additions_ends_acquisition(self):
        self.make_pool()
        folder = self.acquire()
        one_group = {campaign.read(folder / 'selected.json')[0]['group']}
        campaign.prepare(self.current, self.annotations(folder, one_group))
        self.assertFalse(campaign.read(folder / 'prepared.json')['ready'])
        self.assertEqual(campaign.read(self.current / 'acquisition-complete.json')['reason'], 'insufficient_additions')

    def test_failed_training_attempt_cannot_be_retried(self):
        self.make_pool()
        folder = self.acquire()
        campaign.prepare(self.current, self.annotations(folder))
        with patch.object(campaign, 'offline_job', side_effect=RuntimeError('mock fit failure')) as trainer:
            with self.assertRaises(RuntimeError):
                campaign.train(self.current, SimpleNamespace(round=folder.name))
            with self.assertRaises(FileExistsError):
                campaign.train(self.current, SimpleNamespace(round=folder.name))
        self.assertEqual(trainer.call_count, 1)
        self.assertTrue((self.current / 'attempts/round-1.json').exists())

    def test_campaign_wide_attempt_limit_precedes_fit(self):
        self.make_pool()
        folder = self.acquire()
        campaign.prepare(self.current, self.annotations(folder))
        for number in range(3):
            campaign.write_new(self.current / f'attempts/attempt-{number}.json', {'startedAt': 1})
        with patch.object(campaign, 'offline_job') as trainer, self.assertRaisesRegex(ValueError, 'attempt limit'):
            campaign.train(self.current, SimpleNamespace(round=folder.name))
        trainer.assert_not_called()

    def test_final_selection_is_frozen_and_cannot_be_reselected(self):
        folder = self.make_selection()
        selection = campaign.verify_selection(self.current)
        self.assertEqual(selection['roundId'], 'round-1')
        self.assertTrue(selection['diagnostic'])
        with self.assertRaises(FileExistsError):
            campaign.select_final(self.current, SimpleNamespace())
        (folder / 'accepted.json').write_text('[{}]')
        with self.assertRaises(ValueError):
            campaign.verify_selection(self.current)

    def test_changed_selection_rejected(self):
        self.make_selection()
        selection = campaign.read(self.current / 'selection.json')
        selection['threshold'] = .55
        (self.current / 'selection.json').write_text(json.dumps(selection))
        with self.assertRaisesRegex(ValueError, 'selection changed'):
            campaign.verify_selection(self.current)

    def test_final_evaluation_replay_stays_consumed_after_failure(self):
        self.make_final_reference()
        with patch.object(campaign, 'offline_job', side_effect=RuntimeError('mock failure')) as evaluator:
            with self.assertRaises(RuntimeError):
                campaign.final_evaluate(self.current, SimpleNamespace())
            with self.assertRaises(FileExistsError):
                campaign.final_evaluate(self.current, SimpleNamespace())
        self.assertEqual(evaluator.call_count, 1)
        self.assertTrue((self.current / 'final-test-consumed.json').exists())

    def test_successful_final_evaluation_reaches_terminal_endpoint(self):
        self.make_final_reference()
        with patch.object(campaign, 'offline_job', side_effect=self.fake_job):
            campaign.final_evaluate(self.current, SimpleNamespace())
        self.assertEqual(campaign.read(self.current / 'terminal.json')['outcome'], 'completed')
        with self.assertRaisesRegex(ValueError, 'terminal'):
            campaign.verify_campaign(self.current)

    def test_private_admission_job_payload_stays_outside_repository(self):
        secret = 'Evaluator-only fictional reference should remain private.'
        output = self.private / 'admissions.json'
        captured = {}
        def subprocess_run(args, **kwargs):
            request_path = Path(args[-1])
            captured['path'] = request_path
            captured['request'] = campaign.read(request_path)
            captured['args'] = args
            campaign.write_new(output, [{'admitted': True}])
            return SimpleNamespace(returncode=0, stdout=b'', stderr=b'')
        with patch.object(campaign.subprocess, 'run', side_effect=subprocess_run):
            campaign.offline_job(self.current, 'admit', {'texts': [secret]}, output)
        self.assertTrue(captured['path'].is_relative_to(self.private))
        self.assertFalse(captured['path'].is_relative_to(self.repo))
        self.assertEqual(captured['request']['payload']['texts'], [secret])
        self.assertIn('(version 1)(allow default)(deny network*)', captured['args'])
        self.assertFalse(any(secret in p.read_text() for p in self.repo.rglob('*.json')))

    def test_final_fixture_directory_inside_repo_is_rejected_before_payload(self):
        self.make_selection()
        with patch.object(campaign, 'offline_job') as model:
            with self.assertRaisesRegex(ValueError, 'outside repository'):
                campaign.final_prepare(self.current, SimpleNamespace(private=str(self.root)))
        model.assert_not_called()
        self.assertFalse((self.current / 'final-preparation.json').exists())

    def test_prediction_text_is_stdin_only_and_not_persisted(self):
        self.make_selection()
        before = {str(p): p.read_bytes() for p in self.repo.rglob('*') if p.is_file()}
        secret = 'Current private user draft is never a job request file.'
        def subprocess_run(args, **kwargs):
            self.assertEqual(kwargs['input'], secret)
            self.assertNotIn(secret, args)
            self.assertIn('(version 1)(allow default)(deny network*)', args)
            return SimpleNamespace(returncode=0, stdout=json.dumps({'score': .6, 'label': 1}))
        with patch.object(sys, 'stdin', io.StringIO(secret)), patch.object(campaign.subprocess, 'run', side_effect=subprocess_run):
            campaign.predict(self.current, SimpleNamespace())
        after = {str(p): p.read_bytes() for p in self.repo.rglob('*') if p.is_file()}
        self.assertEqual(before, after)

    def test_main_records_terminal_incident_when_entry_integrity_check_fails(self):
        campaign.write_new(self.current / 'authoring-started.json', {'unixTime': time.time()})
        (self.current / 'campaign.json').write_text('{}')
        with patch.object(sys, 'argv', ['campaign.py', '--campaign', 'mock-campaign', 'acquire']), self.assertRaises(ValueError):
            campaign.main()
        self.assertEqual(campaign.read(self.current / 'terminal.json')['outcome'], 'execution_or_integrity_failure')
        self.assertFalse((self.current / '.lock').exists())

    def worker_request(self, *, deadline=None):
        request_path = self.private / 'jobs/admit-mock.json'
        output = self.private / 'admissions.json'
        request = dict(operation='admit', payload={'texts': ['Private synthetic evaluation text.']},
                       output=str(output), campaign=str(self.current), jobId='admit-mock',
                       deadline=deadline if deadline is not None else time.time() + 60,
                       campaignSha256=campaign.sha(self.current / 'campaign.json'))
        campaign.write_new(request_path, request)
        campaign.write_new(self.current / 'job-tickets/admit-mock.json',
                           {'request': str(request_path), 'sha256': campaign.sha(request_path)})
        return SimpleNamespace(request=str(request_path)), request_path, output

    @contextlib.contextmanager
    def mock_worker(self, denial=None):
        with patch.object(campaign, 'require_network_denial', side_effect=denial), \
                patch.object(campaign.signal, 'signal'), patch.object(campaign.signal, 'setitimer') as timer, \
                patch.object(campaign, 'worker_operation', return_value=[{'admitted': True}]) as operation:
            yield operation, timer

    def test_direct_unsandboxed_worker_refuses_before_model_operation(self):
        args, request, output = self.worker_request()
        with self.mock_worker(ValueError('OS sandbox network denial required')) as (operation, _):
            with self.assertRaisesRegex(ValueError, 'network denial'):
                campaign.worker(args)
        operation.assert_not_called()
        self.assertFalse(output.exists())
        self.assertEqual(campaign.read(request.with_suffix('.failure.json'))['reasonCode'], 'NETWORK_DENIAL_REQUIRED')

    def test_registered_worker_is_exclusive_even_if_output_is_removed(self):
        args, _, output = self.worker_request()
        with self.mock_worker() as (operation, timer):
            campaign.worker(args)
            self.assertTrue(output.exists())
            with self.assertRaisesRegex(ValueError, 'replay'):
                campaign.worker(args)
            # A new output path or deleting the prior output cannot bypass the start marker.
            output.unlink()
            with self.assertRaises(FileExistsError):
                campaign.worker(args)
        operation.assert_called_once()
        self.assertTrue((self.current / 'worker-starts/admit-mock.json').exists())
        self.assertTrue(any(call.args[1] > 0 for call in timer.call_args_list))
        self.assertEqual(timer.call_args.args[1], 0)

    def test_changed_registered_worker_request_refuses_before_model_operation(self):
        args, request, output = self.worker_request()
        value = campaign.read(request)
        value['payload']['texts'] = ['Changed text after ticket registration.']
        request.write_text(json.dumps(value))
        with self.mock_worker() as (operation, _), self.assertRaisesRegex(ValueError, 'manifest changed'):
            campaign.worker(args)
        operation.assert_not_called()
        self.assertFalse(output.exists())
        self.assertEqual(campaign.read(request.with_suffix('.failure.json'))['reasonCode'], 'INTEGRITY')

    def test_expired_registered_worker_deadline_refuses_before_model_operation(self):
        args, request, output = self.worker_request(deadline=time.time() - 1)
        with self.mock_worker() as (operation, _), self.assertRaisesRegex(ValueError, 'deadline expired'):
            campaign.worker(args)
        operation.assert_not_called()
        self.assertFalse(output.exists())
        self.assertEqual(campaign.read(request.with_suffix('.failure.json'))['reasonCode'], 'DEADLINE_EXPIRED')

    def test_unregistered_worker_request_refuses_before_model_operation(self):
        args, _, output = self.worker_request()
        (self.current / 'job-tickets/admit-mock.json').unlink()
        with self.mock_worker() as (operation, _), self.assertRaises(FileNotFoundError):
            campaign.worker(args)
        operation.assert_not_called()
        self.assertFalse(output.exists())

    def test_changed_round_report_is_omitted_and_integrity_is_false(self):
        self.make_pool()
        folder = self.acquire()
        self.finish(folder)
        changed = campaign.read(folder / 'round-report.json')
        changed['candidate']['f1'] = .999
        (folder / 'round-report.json').write_text(json.dumps(changed))
        output = self.root / 'audit.json'
        campaign.report(self.current, SimpleNamespace(out=str(output)))
        result = campaign.read(output)
        self.assertFalse(result['integrity']['passed'])
        self.assertNotIn('development', result['rounds'][0])
        self.assertNotIn('previousRoundComparisons', result['rounds'][0])
        self.assertNotIn('.999', output.read_text())

    def test_changed_final_report_is_omitted_and_integrity_is_false(self):
        self.make_final_reference()
        with patch.object(campaign, 'offline_job', side_effect=self.fake_job):
            campaign.final_evaluate(self.current, SimpleNamespace())
        self.assertTrue((self.current / 'final-result-freeze.json').exists())
        (self.current / 'final-report.json').write_text('{"results":{"candidate":{"metrics":{"f1":0.999}}}}')
        output = self.root / 'audit.json'
        campaign.report(self.current, SimpleNamespace(out=str(output)))
        result = campaign.read(output)
        self.assertFalse(result['integrity']['passed'])
        self.assertIsNone(result['finalEvaluation'])
        self.assertNotIn('.999', output.read_text())

    def test_pool_binding_rejects_rehashed_replacement_pool(self):
        self.make_pool()
        eligible = self.current / 'pool/eligible.json'
        changed = campaign.read(eligible)
        changed[0]['text'] = 'Replacement pool text.'
        eligible.write_text(json.dumps(changed))
        manifest_path = self.current / 'pool/freeze.json'
        manifest = campaign.read(manifest_path)
        manifest['files']['eligible.json'] = campaign.sha(eligible)
        manifest['bundleSha256'] = campaign.digest(manifest['files'])
        manifest_path.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(ValueError, 'pool freeze changed'):
            campaign.verify_pool(self.current)
        with self.assertRaisesRegex(ValueError, 'pool freeze changed'):
            campaign.verify_campaign(self.current)

    def test_final_semantic_audit_excludes_whole_family_before_reference_freeze(self):
        self.make_selection()
        self.make_pool()
        rows = pool_rows(30, prefix='final')
        pool = dict(schemaVersion=2, author={'actorId': 'mock-author', 'model': 'mock'}, syntheticOnly=True, examples=rows)
        campaign.write_new(self.private / 'pool.json', pool)
        campaign.final_kit(self.current, SimpleNamespace(private=str(self.private)))
        for role in ('teacher', 'reviewer'):
            campaign.write_new(self.private / f'{role}-annotation.json', {'mockRole': role})
        excluded = rows[0]['group']
        campaign.write_new(self.private / 'semantic-audit.json', {
            'poolSha256': campaign.sha(self.private / 'pool.json'), 'excludedGroups': [excluded],
            'reviewer': 'mock independent reviewer', 'note': 'Known scenario reuse.'})
        accepted = []
        negative_categories = ('qualified_delivery', 'request', 'reported', 'other')
        for index, row in enumerate(rows):
            label = int(index % 2 == 0)
            accepted.append(dict(row, label=label, category='firm_delivery' if label else negative_categories[(index // 2) % 4], split='train'))
        def admit(parent, operation, payload, output, **kwargs):
            self.assertEqual(operation, 'admit')
            result = [{'admitted': True} for _ in payload['texts']]
            campaign.write_new(output, result)
            return result
        with patch.object(campaign, 'agree', return_value=(accepted, [])), \
                patch.object(campaign, 'offline_job', side_effect=admit), \
                patch.object(model_adapter, 'contamination_rows', return_value=[]), \
                patch.object(campaign, 'overlap_reasons', return_value={r['group']: [] for r in rows}):
            campaign.final_prepare(self.current, SimpleNamespace(private=str(self.private)))
        frozen = campaign.read(self.private / 'accepted.json')
        self.assertEqual(len(frozen), 116)
        self.assertFalse(any(row['group'] == excluded for row in frozen))
        self.assertEqual(campaign.read(self.private / 'quarantine.json')['overlap'][excluded], ['identified_scenario_reuse'])
        self.assertTrue(campaign.read(self.current / 'final-coverage.json')['passed'])
        campaign.verify_bundle(self.private)


class ExplicitFailureEvidenceTests(unittest.TestCase):
    def test_explicit_adapter_codes_survive_terminal_and_report(self):
        for code in ('RELOAD_PARITY', 'INVALID_SCORES', 'OPTIMIZATION_INCOMPLETE',
                     'ENCODER_UNCHANGED', 'CPU_CONSTRAINT', 'NONFINITE_WEIGHTS'):
            with self.subTest(code=code), tempfile.TemporaryDirectory() as directory:
                error = ValueError('deliberately misleading scores message')
                error.reason_code = code
                details = campaign.failure_details('train', 'model_operation', error)
                self.assertEqual(details['reasonCode'], code)
                failure = campaign.JobFailure(details)
                root = Path(directory).resolve()
                campaign.stop(root, 'execution_or_integrity_failure', {'workerFailure': failure.details})
                self.assertEqual(campaign.read(root/'terminal.json')['details']['workerFailure']['reasonCode'], code)
                with patch.object(campaign, 'ROOT', root), patch.object(campaign, 'verify_campaign'), patch.object(campaign, 'rounds', return_value=[]), contextlib.redirect_stdout(io.StringIO()):
                    campaign.report(root, SimpleNamespace(out=str(root/'report.json')))
                self.assertEqual(campaign.read(root/'report.json')['terminal']['details']['workerFailure']['reasonCode'], code)


if __name__ == '__main__':
    unittest.main()
