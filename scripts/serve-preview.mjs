import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../web/dist/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };
const headers = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
};
createServer(async (request, response) => {
  // Serve files only. Never record request bodies, query strings or headers.
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, headers).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep) || !mime[extname(path)]) {
      response.writeHead(404, headers).end('Not found'); return;
    }
    const bytes = await readFile(path);
    response.writeHead(200, { ...headers, 'Content-Type': mime[extname(path)] });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch { response.writeHead(404, headers).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Communication Check preview: http://127.0.0.1:${port}`));
