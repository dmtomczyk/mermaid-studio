import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const rootDir = path.join(projectRoot, 'dist-harness');
const port = Number(process.env.MERMAID_STUDIO_HARNESS_PORT || 4177);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8']
]);

const server = http.createServer(async (req, res) => {
  try {
    const requestPath = req.url === '/' ? '/mermaid/index.html' : req.url || '/mermaid/index.html';
    const filePath = path.join(rootDir, requestPath.replace(/^\//, ''));
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(rootDir))) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const info = await stat(resolved);
    if (!info.isFile()) {
      res.writeHead(404).end('Not found');
      return;
    }
    const body = await readFile(resolved);
    res.writeHead(200, { 'content-type': contentTypes.get(path.extname(resolved)) || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Mermaid Studio harness server running:`);
  console.log(`  root:          ${rootDir}`);
  console.log(`  mermaid:       http://127.0.0.1:${port}/mermaid/index.html`);
  console.log(`  builder:       http://127.0.0.1:${port}/builder/index.html`);
  console.log(`  builder-real:  http://127.0.0.1:${port}/builder-real/index.html`);
  console.log(`  example real:  http://127.0.0.1:${port}/builder-real/index.html?state=flowchart-busy&viewport=must-work-360`);
});
