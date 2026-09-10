import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const runtimeFile = path => path.endsWith('.ts') && !/\.(?:test|spec)\.ts$/.test(path)
  && !path.split('/').some(part => ['__fixtures__', '__tests__', 'fixtures'].includes(part));

export function getEngineManifest({ root, revision } = {}) {
  const git = args => execFileSync('git', args, { cwd: root });
  const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]);
  const paths = (revision
    ? git(['ls-tree', '-r', '--name-only', revision, '--', 'web/src/engine']).toString('utf8').trim().split('\n')
    : walk(join(root, 'web/src/engine')).map(path => relative(root, path).split('\\').join('/')))
    .filter(runtimeFile).sort();
  const files = paths.map(path => ({
    path,
    sha256: digest(revision ? git(['show', revision + ':' + path]) : readFileSync(join(root, path))),
  }));
  if (!files.length) throw new Error('No runtime engine files found.');
  return { schemaVersion: 1, files, sha256: digest(JSON.stringify(files) + '\n') };
}
