// Servidor local para probar la web como en Vercel: sirve dist/ y la función /api/agenda.
// Uso: node scripts/build.mjs && node scripts/dev.mjs   →   http://localhost:5600
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consultarAgenda } from '../api/agenda.js';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const PORT = Number(process.env.PORT) || 5600;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.yml': 'text/yaml', '.xml': 'application/xml', '.txt': 'text/plain',
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/agenda') {
    try {
      const { status, body } = await consultarAgenda(Object.fromEntries(url.searchParams));
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  let path = normalize(join(DIST, decodeURIComponent(url.pathname)));
  if (!path.startsWith(DIST)) { res.writeHead(403).end(); return; }
  try {
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    res.writeHead(200, { 'Content-Type': TIPOS[extname(path)] || 'application/octet-stream' }).end(await readFile(path));
  } catch {
    res.writeHead(404).end('No encontrado');
  }
}).listen(PORT, () => console.log(`Web en http://localhost:${PORT}`));
