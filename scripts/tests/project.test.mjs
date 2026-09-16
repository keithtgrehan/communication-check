import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { buildHandoff, checkSnapshot, installGitHooks, ROOT, validatePush } from '../project.mjs';

const branch = 'codex/communication-check-tone-review';
const remote = 'https://github.com/keithtgrehan/communication-check.git';
const metadata = { commit: 'abc123', branch, now: '2026-09-10T00:00:00Z' };
const update = `refs/heads/${branch} ${'a'.repeat(40)} refs/heads/${branch} ${'b'.repeat(40)}\n`;

function fixture(t) {
  mkdirSync(join(ROOT, 'work'), { recursive: true });
  const root = mkdtempSync(join(ROOT, 'work', 'setup-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'docs'));
  writeFileSync(join(root, 'docs/PRODUCT_BRIEF.md'), '# Fictional product brief\n');
  writeFileSync(join(root, 'docs/PROGRESS.md'), '# Verified setup only\n');
  return root;
}

test('handoff includes only the two allowed documents, never adjacent holdout or customer files', t => {
  const root = fixture(t);
  mkdirSync(join(root, 'evaluation/holdout'), { recursive: true });
  writeFileSync(join(root, 'evaluation/holdout/labels.txt'), 'RESERVED_CANARY_9142');
  writeFileSync(join(root, 'docs/customer-draft.txt'), 'CUSTOMER_CANARY_5196');
  writeFileSync(join(root, '.env'), 'SECRET_CANARY_8421');
  const output = buildHandoff(root, metadata);
  assert.match(output, /Fictional product brief/);
  assert.match(output, /Verified setup only/);
  assert.doesNotMatch(output, /RESERVED_CANARY|CUSTOMER_CANARY|SECRET_CANARY/);
  assert.match(output, /Checkout HEAD: abc123/);
  assert.equal((output.match(/SHA-256:/g) || []).length, 2);
});

test('handoff refresh reflects edits and labels them as working-file snapshots', t => {
  const root = fixture(t);
  const first = buildHandoff(root, metadata);
  writeFileSync(join(root, 'docs/PROGRESS.md'), '# Milestone one verified\n');
  const second = buildHandoff(root, metadata);
  assert.notEqual(first, second);
  assert.match(second, /Milestone one verified/);
  assert.match(second, /uncommitted document edits may be newer than HEAD/);
});

test('handoff refuses known credential material and symlink sources', t => {
  const root = fixture(t);
  writeFileSync(join(root, 'docs/PROGRESS.md'), '-----BEGIN PRIVATE KEY-----');
  assert.throws(() => buildHandoff(root, metadata), /Possible credential/);
  rmSync(join(root, 'docs/PROGRESS.md'));
  symlinkSync(join(root, 'docs/PRODUCT_BRIEF.md'), join(root, 'docs/PROGRESS.md'));
  assert.throws(() => buildHandoff(root, metadata), /regular file/);
});

test('push guard permits the approved branch and refuses main, wrong repo, tags and deletion', () => {
  assert.doesNotThrow(() => validatePush('origin', remote, update));
  assert.throws(() => validatePush('origin', remote, update.replaceAll(branch, 'main')), /only/);
  assert.throws(() => validatePush('origin', remote, update.replaceAll(branch, 'codex/communication-check-mvp')), /only/);
  assert.throws(() => validatePush('origin', remote, update.replace(`refs/heads/${branch} ${'b'.repeat(40)}`, `refs/heads/main ${'b'.repeat(40)}`)), /only/);
  assert.throws(() => validatePush('origin', remote.replace('communication-check', 'vibe-signal'), update), /target/);
  assert.throws(() => validatePush('upstream', remote, update), /target/);
  assert.throws(() => validatePush('origin', remote, `refs/tags/v1 ${'a'.repeat(40)} refs/tags/v1 ${'0'.repeat(40)}`), /only/);
  assert.throws(() => validatePush('origin', remote, `(delete) ${'0'.repeat(40)} refs/heads/${branch} ${'a'.repeat(40)}`), /deletion/);
});

test('all six imported reference files match their pinned upstream blobs', () => {
  assert.equal(checkSnapshot(), 6);
  const manifest = JSON.parse(readFileSync(join(ROOT, 'reference/vibe-signal/SOURCE.json'), 'utf8'));
  assert.equal(manifest.runtime, false);
});

test('hook installation preserves all existing hooks and is repeatable in a fresh repository', t => {
  const root = fixture(t);
  const run = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  run(['init', '--quiet']);
  mkdirSync(join(root, '.githooks'));
  for (const name of ['post-commit', 'pre-push']) writeFileSync(join(root, '.githooks', name), '#!/bin/sh\nexit 0\n');
  for (const name of ['pre-commit', 'commit-msg', 'post-commit', 'pre-push']) {
    const path = join(root, '.git/hooks', name);
    writeFileSync(path, '#!/bin/sh\n# Existing user check\n', { mode: 0o755 });
    assert.throws(() => installGitHooks(root), /Existing .* hook found/);
    assert.throws(() => run(['config', '--local', '--get', 'core.hooksPath']));
    assert.match(readFileSync(path, 'utf8'), /Existing user check/);
    rmSync(path);
  }
  run(['config', '--local', 'core.hooksPath', 'custom-hooks']);
  assert.throws(() => installGitHooks(root), /Existing Git hooks configuration/);
  assert.equal(run(['config', '--get', 'core.hooksPath']), 'custom-hooks');
  run(['config', '--local', '--unset', 'core.hooksPath']);
  installGitHooks(root);
  installGitHooks(root);
  assert.equal(run(['config', '--local', '--get', 'core.hooksPath']), '.githooks');
});
