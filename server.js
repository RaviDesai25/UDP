import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const rootDirectory = resolve('dist');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405);
    response.end();
    return;
  }

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }

  let filePath = resolve(rootDirectory, `.${requestedPath}`);
  if (filePath !== rootDirectory && !filePath.startsWith(`${rootDirectory}${sep}`)) {
    response.writeHead(403);
    response.end();
    return;
  }

  let content;
  try {
    content = await readFile(filePath);
  } catch {
    if (extname(requestedPath)) {
      response.writeHead(404);
      response.end();
      return;
    }

    filePath = resolve(rootDirectory, 'index.html');
    try {
      content = await readFile(filePath);
    } catch {
      response.writeHead(500);
      response.end('Build output not found. Run npm run build first.');
      return;
    }
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(request.method === 'HEAD' ? undefined : content);
}).listen(Number(process.env.PORT || 8080), '0.0.0.0');