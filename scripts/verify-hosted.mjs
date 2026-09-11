import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { getEngineManifest } from './engine-manifest.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = new URL(process.env.PREVIEW_URL || '');
assert(origin.protocol === 'https:' && !origin.username && !origin.password && !origin.search && !origin.hash, 'Use a clean HTTPS preview origin.');
assert(origin.pathname === '/', 'Use the preview origin without a path.');
const dist = join(root, 'web/dist');
const paths = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? paths(join(directory, entry.name)) : [join(directory, entry.name)]);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const assets = [];
for (const file of paths(dist)) {
  const path = relative(dist, file).split('\\').join('/');
  const url = new URL(path === 'index.html' ? '/' : path, origin);
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: 'error' });
  assert.equal(response.status, 200, `Missing published asset ${path}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(digest(bytes), digest(readFileSync(file)), `Published asset differs from the reviewed local build: ${path}`);
  if (path === 'index.html') {
    assert(response.headers.get('content-security-policy')?.includes("connect-src 'none'"), 'Missing connection-blocking HTTP CSP.');
    assert(response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"), 'Missing frame policy.');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert(response.headers.get('x-robots-tag')?.includes('noindex'), 'Missing noindex header.');
    assert(response.headers.get('permissions-policy')?.includes('microphone=()'), 'Missing device permissions policy.');
  }
  assets.push({ path, bytes: bytes.length, sha256: digest(bytes) });
}
const excludedPaths = ['/AGENTS.md', '/package.json', '/.git/config', '/.env', '/src/App.tsx', '/src/engine/__fixtures__/development.ts', '/reference/vibe-signal/web/src/App.jsx', '/docs/PRODUCT_BRIEF.md'];
for (const path of excludedPaths) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(30000), redirect: 'error' });
  assert.equal(response.status, 404, `Unexpected published source/config path: ${path}`);
}
const report = {
  verifiedAt: new Date().toISOString(),
  origin: origin.origin,
  checkoutCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  engineSha256: digest(execFileSync('git', ['show', 'HEAD:web/src/engine/index.ts'], { cwd: root })),
  engineManifest: getEngineManifest({ root, revision: 'HEAD' }),
  assetCount: assets.length,
  assets,
  excludedPathsReturned404: excludedPaths,
  responseHeadersPassed: true,
  note: 'Static asset/header/source-exclusion evidence only; run the separate hosted browser suite for runtime privacy and workflow.'
};
mkdirSync(join(root, '.handoff'), { recursive: true });
writeFileSync(join(root, '.handoff/HOSTED_VERIFICATION.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Verified ${assets.length} exact hosted assets, security headers and ${excludedPaths.length} excluded source/config paths at ${origin.origin}.`);
