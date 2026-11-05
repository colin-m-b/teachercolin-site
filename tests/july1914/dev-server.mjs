// Local dev server for "37 Days": serves the static site and routes POST /api/july1914 to the real
// handler with an in-memory store. Usage: node tests/july1914/dev-server.mjs [port]
// Not used in production (Netlify runs netlify/functions/july1914.mjs instead).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handle } from '../../netlify/july1914/api.mjs';
import { memoryStore } from './memory-store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const BLOCKED = /^\/(netlify|tests|node_modules)\/|^\/package(-lock)?\.json$/; // mirrors netlify.toml

export function startServer(port = 8888, { latencyMs = 0 } = {}) {
  const store = memoryStore({ latencyMs });
  let offline = false;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/__offline') { offline = url.searchParams.get('on') === '1'; res.end('ok'); return; }
    if (url.pathname === '/api/july1914') {
      if (offline) { req.socket.destroy(); return; }
      if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
      let data = ''; for await (const c of req) data += c;
      let body; try { body = JSON.parse(data); } catch { res.writeHead(400); res.end('{}'); return; }
      const { status, json } = await handle(store, body, { teacherCode: process.env.JULY1914_TEACHER_CODE || '' });
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(json));
      return;
    }
    let p = decodeURIComponent(url.pathname);
    if (BLOCKED.test(p)) { res.writeHead(404); res.end('Not found'); return; }
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => server.listen(port, () => r({ server, store, setOffline: v => { offline = v; } })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 8888);
  await startServer(port);
  console.log(`37 Days dev server: http://localhost:${port}/37-days/`);
}
