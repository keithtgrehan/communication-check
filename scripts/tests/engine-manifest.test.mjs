import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { getEngineManifest } from '../engine-manifest.mjs';

test('engine identity includes imported runtime modules and keeps committed evidence separate from working edits', () => {
  const root = mkdtempSync(join(tmpdir(), 'communication-check-manifest-'));
  const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  try {
    const directory = join(root, 'web/src/engine');
    mkdirSync(join(directory, '__fixtures__'), { recursive: true });
    writeFileSync(join(directory, 'index.ts'), "export { check } from './grammar';\n");
    writeFileSync(join(directory, 'grammar.ts'), 'export const check = () => 1;\n');
    writeFileSync(join(directory, 'types.ts'), 'export const LIMIT = 12000;\n');
    writeFileSync(join(directory, 'index.test.ts'), '// development test\n');
    writeFileSync(join(directory, '__fixtures__/development.ts'), '// fictional fixture\n');
    git(['init', '--quiet']);
    git(['add', '.']);
    git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'Fixture']);
    const committed = getEngineManifest({ root, revision: 'HEAD' });
    assert.deepEqual(committed, getEngineManifest({ root }));
    assert.deepEqual(committed.files.map(file => file.path), [
      'web/src/engine/grammar.ts', 'web/src/engine/index.ts', 'web/src/engine/types.ts',
    ]);
    writeFileSync(join(directory, 'grammar.ts'), 'export const check = () => 2;\n');
    const edited = getEngineManifest({ root });
    assert.notEqual(edited.sha256, committed.sha256, 'An imported-module edit must change engine identity.');
    assert.equal(edited.files.find(file => file.path.endsWith('/index.ts')).sha256,
      committed.files.find(file => file.path.endsWith('/index.ts')).sha256);
    assert.deepEqual(getEngineManifest({ root, revision: 'HEAD' }), committed);
    writeFileSync(join(directory, '__fixtures__/development.ts'), '// changed fictional fixture\n');
    assert.deepEqual(getEngineManifest({ root }), edited, 'Test fixtures are not runtime engine identity.');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
