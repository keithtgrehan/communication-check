#!/usr/bin/env python3
"""Launch a fresh ephemeral Codex actor; uses existing account, never a paid API key.

This runner is for orchestration, not model fitting. Run no more than three actors
at once. Inputs and logs for final-reference actors must stay outside the repo.
"""
import argparse
import contextlib
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import time

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--prompt', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--schema')
    parser.add_argument('--effort', choices=('high','xhigh'), default='high')
    parser.add_argument('--cwd', default='/tmp')
    parser.add_argument('--campaign')
    parser.add_argument('--no-tools', action='store_true')
    args = parser.parse_args()
    out = Path(args.out).resolve()
    if out.exists() or out.with_suffix('.actor.json').exists():
        raise ValueError('Actor outputs are immutable; do not overwrite a response')
    out.parent.mkdir(parents=True, exist_ok=True)
    command = ['npm', 'exec', '--yes', '--package=@openai/codex@0.162.1', '--', 'codex', 'exec',
               '--ephemeral', '--ignore-user-config', '-m', 'gpt-6-astra',
               '-c', 'model_reasoning_effort='+json.dumps(args.effort), '-s', 'read-only',
               '--skip-git-repo-check', '-C', args.cwd, '--color', 'never', '--json', '-o', str(out)]
    if args.schema:
        command += ['--output-schema', str(Path(args.schema).resolve())]
    command += ['-']
    started = time.time()
    timeout = 1200
    if args.campaign:
        from campaign import cpath, verify_campaign, read, PROTOCOL
        campaign = cpath(args.campaign)
        verify_campaign(campaign)
        remaining = PROTOCOL['experimentSeconds']-(time.time()-read(campaign/'authoring-started.json')['unixTime'])
        if remaining <= 0:
            raise TimeoutError('Experiment timer expired')
        timeout = min(timeout, remaining)
    timed_out = False
    launch_error = None
    with Path(args.prompt).open('rb') as source, out.with_suffix('.stdout.log').open('xb') as stdout, out.with_suffix('.stderr.log').open('xb') as stderr:
        try:
            process = subprocess.Popen(command, stdin=source, stdout=stdout, stderr=stderr, start_new_session=True)
            try:
                returncode = process.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                timed_out = True
                with contextlib.suppress(ProcessLookupError):
                    os.killpg(process.pid, signal.SIGTERM)
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    with contextlib.suppress(ProcessLookupError):
                        os.killpg(process.pid, signal.SIGKILL)
                    process.wait()
                returncode = process.returncode
        except OSError as error:
            launch_error = type(error).__name__
            returncode = 127
    tool_types, session_id = [], None
    for line in out.with_suffix('.stdout.log').read_text(errors='replace').splitlines():
        try:
            entry = json.loads(line)
        except ValueError:
            continue
        if entry.get('type') == 'thread.started':
            session_id = entry.get('thread_id')
        item = entry.get('item', {})
        if entry.get('type') in ('item.started', 'item.updated', 'item.completed') and item.get('type') not in (None, 'agent_message', 'reasoning'):
            tool_types.append(item['type'])
    provenance = {'configuredModel': 'gpt-6-astra', 'configuredEffort': args.effort,
                  'ephemeral': True, 'inheritedConversation': False, 'runnerVersion': '0.162.1',
                  'startedAt': started, 'finishedAt': time.time(), 'exitCode': returncode,
                  'timedOut': timed_out, 'launchError': launch_error, 'toolTypes': tool_types, 'noToolsRequired': args.no_tools,
                  'scope': 'Codex service authoring/review, not local LLM; configured identity is not independent model telemetry.'}
    header = out.with_suffix('.stderr.log').read_text(errors='replace')
    session = re.search(r'session id:\s*([a-zA-Z0-9-]+)', header)
    provenance['sessionId'] = session_id or (session.group(1) if session else None)
    out.with_suffix('.actor.json').write_text(json.dumps(provenance, indent=2)+'\n')
    if returncode or not out.exists() or timed_out or (args.no_tools and tool_types):
        if args.campaign:
            from campaign import locked, stop
            with locked(campaign):
                stop(campaign, 'actor_failure', {'timedOut': timed_out, 'exitCode': returncode, 'unexpectedTools': bool(args.no_tools and tool_types)})
        raise RuntimeError('Fresh actor failed; inspect local stderr log')
    print(json.dumps({'output': str(out), 'exitCode': returncode, 'seconds': time.time()-started, 'sessionId': provenance['sessionId']}))

if __name__ == '__main__':
    main()
