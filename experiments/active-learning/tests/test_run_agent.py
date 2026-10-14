"""Fresh-agent process contract tests; never launch an actor or model fit."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('tested_active_run_agent', Path(__file__).resolve().parents[1] / 'run_agent.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class AgentRunnerTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name).resolve()
        self.prompt = self.root / 'prompt.txt'
        self.prompt.write_text('Mock fictional task; no actor may actually run.')
        self.out = self.root / 'answer.json'
        self.events = [{'type': 'thread.started', 'thread_id': 'fresh-session-123'},
                       {'type': 'item.completed', 'item': {'type': 'reasoning'}},
                       {'type': 'item.completed', 'item': {'type': 'agent_message', 'text': '{"ok":true}'}}]
        self.process = Mock(pid=424242, returncode=0)
        self.process.wait.return_value = 0
        self.create_output = True
        self.stderr = b'session id: fallback-session-789\n'
        self.argv = ['run_agent.py', '--prompt', str(self.prompt), '--out', str(self.out)]
        self.stop = Mock()
        self.fake_campaign = SimpleNamespace(
            cpath=lambda identifier: self.root / identifier,
            verify_campaign=Mock(), read=lambda path: {'unixTime': 90},
            PROTOCOL={'experimentSeconds': 50}, locked=lambda path: contextlib.nullcontext(), stop=self.stop)

    def popen(self, command, **kwargs):
        self.command, self.options = command, kwargs
        self.assertEqual(kwargs['stdin'].read(), self.prompt.read_bytes())
        self.assertTrue(kwargs['start_new_session'])
        kwargs['stdout'].write(b'not a JSON event\n')
        for entry in self.events:
            kwargs['stdout'].write((json.dumps(entry) + '\n').encode())
        kwargs['stderr'].write(self.stderr)
        if self.create_output:
            self.out.write_text('{"ok":true}\n')
        return self.process

    def run_mock(self, extra=()):
        with patch.object(sys, 'argv', self.argv + list(extra)), \
                patch.object(runner.subprocess, 'Popen', side_effect=self.popen) as launched, \
                patch.object(runner.os, 'killpg') as killed, \
                patch.dict(sys.modules, {'campaign': self.fake_campaign}), \
                contextlib.redirect_stdout(io.StringIO()) as printed:
            runner.main()
        return launched, killed, printed.getvalue()

    def metadata(self):
        return json.loads(self.out.with_suffix('.actor.json').read_text())

    def test_fresh_ephemeral_readonly_astra_actor_provenance_from_json(self):
        launched, _, printed = self.run_mock(['--no-tools', '--effort', 'xhigh'])
        launched.assert_called_once()
        for option in ('--ephemeral', '--ignore-user-config', '--json', 'gpt-6-astra', 'read-only'):
            self.assertIn(option, self.command)
        self.assertIn('model_reasoning_effort="xhigh"', self.command)
        self.assertEqual(self.command[-1], '-')
        metadata = self.metadata()
        self.assertEqual(metadata['sessionId'], 'fresh-session-123')
        self.assertEqual(metadata['configuredEffort'], 'xhigh')
        self.assertEqual(metadata['runnerVersion'], '0.162.1')
        self.assertTrue(metadata['ephemeral'])
        self.assertFalse(metadata['inheritedConversation'])
        self.assertEqual(metadata['toolTypes'], [])
        self.assertTrue(metadata['noToolsRequired'])
        self.assertIn('not independent model telemetry', metadata['scope'])
        self.assertEqual(json.loads(printed)['exitCode'], 0)

    def test_session_header_fallback_and_optional_schema(self):
        self.events = self.events[1:]
        schema = self.root / 'schema.json'
        schema.write_text('{}')
        self.run_mock(['--schema', str(schema)])
        self.assertEqual(self.metadata()['sessionId'], 'fallback-session-789')
        index = self.command.index('--output-schema')
        self.assertEqual(self.command[index + 1], str(schema))

    def test_no_tools_rejects_tool_completion_and_preserves_evidence(self):
        self.events.append({'type': 'item.completed', 'item': {'type': 'command_execution', 'command': 'mock'}})
        with patch.object(runner.time, 'time', return_value=100), self.assertRaises(RuntimeError):
            self.run_mock(['--no-tools', '--campaign', 'mock'])
        self.assertEqual(self.metadata()['toolTypes'], ['command_execution'])
        self.assertTrue(self.out.exists())
        self.assertTrue(self.out.with_suffix('.stdout.log').exists())
        self.stop.assert_called_once()
        self.assertTrue(self.stop.call_args.args[2]['unexpectedTools'])

    def test_tools_are_recorded_for_an_actor_allowed_to_inspect(self):
        self.events.append({'type': 'item.completed', 'item': {'type': 'mcp_tool_call'}})
        self.run_mock()
        self.assertEqual(self.metadata()['toolTypes'], ['mcp_tool_call'])
        self.assertFalse(self.metadata()['noToolsRequired'])

    def test_no_tools_rejects_started_or_updated_tool_without_completion(self):
        self.events.extend([{'type': 'item.started', 'item': {'type': 'command_execution'}},
                            {'type': 'item.updated', 'item': {'type': 'mcp_tool_call'}}])
        with self.assertRaises(RuntimeError):
            self.run_mock(['--no-tools'])
        self.assertEqual(self.metadata()['toolTypes'], ['command_execution', 'mcp_tool_call'])

    def test_launch_error_preserves_failure_provenance_and_stops_campaign(self):
        sensitive = 'A hypothetical launch error containing private input.'
        with patch.object(runner.time, 'time', return_value=100), \
                patch.object(sys, 'argv', self.argv + ['--campaign', 'mock']), \
                patch.dict(sys.modules, {'campaign': self.fake_campaign}), \
                patch.object(runner.subprocess, 'Popen', side_effect=OSError(sensitive)), \
                self.assertRaises(RuntimeError):
            runner.main()
        metadata = self.metadata()
        self.assertEqual(metadata['exitCode'], 127)
        self.assertEqual(metadata['launchError'], 'OSError')
        self.assertNotIn(sensitive, self.out.with_suffix('.actor.json').read_text())
        self.stop.assert_called_once()
        self.assertEqual(self.stop.call_args.args[1], 'actor_failure')
        self.assertTrue(self.out.with_suffix('.stdout.log').exists())
        self.assertTrue(self.out.with_suffix('.stderr.log').exists())

    def test_timeout_process_exit_race_still_preserves_failure_provenance(self):
        self.process.wait.side_effect = [subprocess.TimeoutExpired('mock', 1200), -15]
        self.process.returncode = -15
        with patch.object(runner.os, 'killpg', side_effect=ProcessLookupError), \
                patch.object(runner.subprocess, 'Popen', side_effect=self.popen), \
                patch.object(sys, 'argv', self.argv), self.assertRaises(RuntimeError):
            runner.main()
        self.assertTrue(self.metadata()['timedOut'])
        self.assertEqual(self.metadata()['exitCode'], -15)
        self.assertIsNone(self.metadata()['launchError'])

    def test_existing_response_or_provenance_prevents_launch_and_overwrite(self):
        for suffix in ('.json', '.actor.json'):
            existing = self.out.with_suffix(suffix)
            existing.write_text('preserve original')
            with self.subTest(suffix=suffix), patch.object(sys, 'argv', self.argv), \
                    patch.object(runner.subprocess, 'Popen') as launched, self.assertRaisesRegex(ValueError, 'immutable'):
                runner.main()
            launched.assert_not_called()
            self.assertEqual(existing.read_text(), 'preserve original')
            existing.unlink()

    def test_nonzero_actor_exit_preserves_failed_metadata_and_stops_campaign(self):
        self.process.wait.return_value = 7
        self.process.returncode = 7
        with patch.object(runner.time, 'time', return_value=100), self.assertRaises(RuntimeError):
            self.run_mock(['--campaign', 'mock'])
        self.assertEqual(self.metadata()['exitCode'], 7)
        self.assertFalse(self.metadata()['timedOut'])
        self.stop.assert_called_once()
        self.assertEqual(self.stop.call_args.args[1], 'actor_failure')

    def test_missing_output_is_failed_even_after_zero_exit(self):
        self.create_output = False
        with self.assertRaises(RuntimeError):
            self.run_mock()
        self.assertEqual(self.metadata()['exitCode'], 0)
        self.assertFalse(self.out.exists())

    def test_timeout_terminates_process_group_and_retains_metadata(self):
        self.process.wait.side_effect = [subprocess.TimeoutExpired('mock', 1200), -15]
        self.process.returncode = -15
        with patch.object(runner.os, 'killpg') as killed, \
                patch.object(runner.subprocess, 'Popen', side_effect=self.popen), \
                patch.object(sys, 'argv', self.argv), self.assertRaises(RuntimeError):
            runner.main()
        killed.assert_called_once_with(self.process.pid, signal.SIGTERM)
        self.assertEqual(self.process.wait.call_args_list[1].kwargs, {'timeout': 5})
        self.assertTrue(self.metadata()['timedOut'])
        self.assertEqual(self.metadata()['exitCode'], -15)

    def test_timeout_escalates_to_sigkill_for_stubborn_process_group(self):
        self.process.wait.side_effect = [subprocess.TimeoutExpired('mock', 1200), subprocess.TimeoutExpired('mock', 5), -9]
        self.process.returncode = -9
        with patch.object(runner.os, 'killpg') as killed, \
                patch.object(runner.subprocess, 'Popen', side_effect=self.popen), \
                patch.object(sys, 'argv', self.argv), self.assertRaises(RuntimeError):
            runner.main()
        self.assertEqual([call.args for call in killed.call_args_list], [(self.process.pid, signal.SIGTERM), (self.process.pid, signal.SIGKILL)])
        self.assertEqual(self.process.wait.call_count, 3)
        self.assertTrue(self.metadata()['timedOut'])
        self.assertEqual(self.metadata()['exitCode'], -9)

    def test_remaining_experiment_time_caps_actor_wait(self):
        with patch.object(runner.time, 'time', return_value=100):
            self.run_mock(['--campaign', 'mock'])
        self.fake_campaign.verify_campaign.assert_called_once_with(self.root / 'mock')
        self.process.wait.assert_called_once_with(timeout=40)

    def test_expired_experiment_refuses_actor_launch(self):
        with patch.object(runner.time, 'time', return_value=141), \
                patch.object(sys, 'argv', self.argv + ['--campaign', 'mock']), \
                patch.dict(sys.modules, {'campaign': self.fake_campaign}), \
                patch.object(runner.subprocess, 'Popen') as launched, self.assertRaises(TimeoutError):
            runner.main()
        launched.assert_not_called()
        self.assertFalse(self.out.exists())


if __name__ == '__main__':
    unittest.main()
