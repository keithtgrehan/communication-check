import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/demo.mjs', ['demo.mjs', 'text/javascript; charset=utf-8']],
  ['/inference.mjs', ['inference.mjs', 'text/javascript; charset=utf-8']],
  ['/artifacts/model.mjs', ['artifacts/model.mjs', 'text/javascript; charset=utf-8']],
]);
const port = Number(process.env.CLASSIFIER_LAB_PORT ?? 4187);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local port.');
createServer(async (request, response) => {
  response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'");
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  const route = routes.get(request.url);
  if (!route || !['GET', 'HEAD'].includes(request.method)) { response.writeHead(404); response.end(); return; }
  try {
    const body = await readFile(new URL(route[0], import.meta.url));
    response.setHeader('Content-Type', route[1]); response.writeHead(200);
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(503); response.end('Local artifact unavailable.'); }
}).listen(port, '127.0.0.1', () => console.log(`Local delivery wording lab: http://127.0.0.1:${port}/`));
