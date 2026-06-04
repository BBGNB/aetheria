import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(new URL('.', import.meta.url).pathname);
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/log' && req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks).toString('utf8');
      console.log('\n=== CLIENT LOG ===\n' + body + '\n==================\n');
      res.writeHead(204).end();
      return;
    }
    let filePath = normalize(join(ROOT, urlPath === '/' ? '/index.html' : urlPath));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }
    try {
      const s = await stat(filePath);
      if (s.isDirectory()) filePath = join(filePath, 'index.html');
    } catch { res.writeHead(404).end('Not Found'); return; }
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`  http://localhost:${PORT}`);
});
