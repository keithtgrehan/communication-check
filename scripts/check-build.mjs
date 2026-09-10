import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function files(directory) {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
const sourceFiles = files(join(root, 'web/src')).filter(path => !path.includes('__fixtures__') && !path.endsWith('.test.ts'));
const forbidden = /\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon\s*\(|localStorage|sessionStorage|indexedDB|serviceWorker|document\.cookie|console\.(?:log|info|debug|warn|error)\s*\()/;
for (const path of sourceFiles) {
  const source = readFileSync(path, 'utf8');
  assert(!forbidden.test(source), `Unexpected network, persistence or logging API in ${relative(root, path)}`);
  assert(!/from\s*['"][^'"]*reference\//.test(source), 'Reference sources must not be runtime imports.');
}
const dist = resolve(root, 'web/dist');
const built = files(dist);
assert(built.some(path => path.endsWith('.js')) && built.some(path => path.endsWith('.css')), 'Missing JS/CSS assets.');
for (const path of built) {
  assert(/\.(html|js|css|svg|txt)$/.test(path), `Unexpected published artifact: ${path}`);
  const contents = readFileSync(path, 'utf8');
  assert(!/vibe-signal\.onrender\.com|api\.openai\.com|googletagmanager\.com|VERCEL_TOKEN|BEGIN PRIVATE KEY/.test(contents), `Unexpected upstream or secret marker in ${path}`);
  assert(!/\.test\.[tj]s|__fixtures__|reference\/vibe-signal/.test(contents), `Test or reference material in ${path}`);
}
const html = readFileSync(join(dist, 'index.html'), 'utf8');
assert(html.includes("connect-src 'none'"), 'Missing strict production connection policy.');
assert(html.includes('noindex, nofollow'), 'Preview must not invite indexing.');
assert(!/<(?:script|link)[^>]+(?:src|href)=["']https?:/.test(html), 'External runtime resource in HTML.');
console.log(`Source/build regression guards passed (${sourceFiles.length} source files, ${built.length} published assets). Runtime privacy still requires browser verification.`);
