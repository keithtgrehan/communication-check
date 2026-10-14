import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const runner = new URL('../runner.mjs', import.meta.url).pathname;
const row = { id: 'development-runner-oracle', group: 'development-runner-oracle', split: 'dev',
  text: 'We will ship the connector on Friday.', label: 1, category: 'firm_delivery' };

test('evaluation uses real checker quote suppression and emits aggregates only', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'classifier-runner-test-'));
  try {
    const data = join(dir, 'data.json'), out = join(dir, 'out.json');
    await writeFile(data, JSON.stringify([row, { ...row, id: 'quoted-development-oracle', label: 0,
      category: 'reported', text: '> We will ship the connector on Friday.' }]));
    const result = spawnSync(process.execPath, [runner, '--data', data, '--out', out], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const reportText = await readFile(out, 'utf8');
    const report = JSON.parse(reportText);
    assert.deepEqual([report.existingRules.tp, report.existingRules.fp, report.existingRules.tn], [1, 0, 1]);
    assert.ok(!reportText.includes(row.text) && !result.stdout.includes(row.id));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('invalid evaluation schema fails before writing output or echoing text', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'classifier-invalid-test-'));
  try {
    const data = join(dir, 'data.json'), out = join(dir, 'out.json');
    await writeFile(data, JSON.stringify([{ ...row, label: null, text: 'DO_NOT_LOG_PRIVATE_TEXT' }]));
    const result = spawnSync(process.execPath, [runner, '--data', data, '--out', out], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.ok(!result.stdout.includes('DO_NOT_LOG_PRIVATE_TEXT') && !result.stderr.includes('DO_NOT_LOG_PRIVATE_TEXT'));
    await assert.rejects(readFile(out), { code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('test data overlapping a training scenario group is refused', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'classifier-leak-test-'));
  try {
    const training = JSON.parse(await readFile(new URL('../data/train-dev.json', import.meta.url)));
    const data = join(dir, 'data.json'), out = join(dir, 'out.json');
    await writeFile(data, JSON.stringify([{ ...row, split: 'test', group: training[0].group }]));
    const result = spawnSync(process.execPath, [runner, '--data', data, '--out', out], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /overlap detected/);
    await assert.rejects(readFile(out), { code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true, force: true }); }
});
