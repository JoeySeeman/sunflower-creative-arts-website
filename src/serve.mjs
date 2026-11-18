// Tiny static server for previewing dist/.  npm run serve  → http://localhost:4321
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json', '.ico': 'image/x-icon' };
const firstPort = Number(process.env.PORT) || 4321;
// Match a build made with SITE_URL set (e.g. the GitHub Pages sub-folder): serve the site under that folder.
const BASE = process.env.SITE_URL ? new URL(process.env.SITE_URL).pathname.replace(/\/+$/, '') : '';
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (BASE && (p + '/').startsWith(BASE + '/')) p = p.slice(BASE.length) || '/';
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  try { if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html'); }
  catch { if (!path.extname(file)) file = path.join(file, 'index.html'); }
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    const nf = await fs.readFile(path.join(DIST, '404.html')).catch(() => 'Not found');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(nf);
  }
});

// If the port is taken (e.g. another preview is already running), try the next ones.
let port = firstPort;
server.on('error', err => {
  if (err.code === 'EADDRINUSE' && port < firstPort + 20) {
    console.log(`Port ${port} is busy, trying ${port + 1}…`);
    server.listen(++port);
  } else {
    console.error(err.message);
    process.exit(1);
  }
});
server.on('listening', () => console.log(`Preview: http://localhost:${port}${BASE}/`));
server.listen(port);
