'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { get } = require('./config.cjs');

const { PORT, API_PROXY_TARGET, BROWSER_CONFIG } = get();
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');
const API_PROXY_URL = new URL(`${API_PROXY_TARGET}/`);
const CONFIG_BLOCK_PATTERN =
  /<!-- <script>\s*{{#configJS}} \{\{\{configJS\}\}\} \{\{\/configJS\}\}\s*<\/script> -->/;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getIndexHtml() {
  const template = fs.readFileSync(INDEX_PATH, 'utf8');
  const runtimeConfig = `window._conf=${JSON.stringify(BROWSER_CONFIG)};`;

  return template.replace(
    CONFIG_BLOCK_PATTERN,
    `<script>\n${runtimeConfig}\n</script>`
  );
}

const indexHtml = getIndexHtml();

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendJavascript(res, source) {
  res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
  res.end(source);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);

  stream.on('error', () => {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Failed to read asset');
  });

  res.writeHead(200, { 'Content-Type': contentType });
  stream.pipe(res);
}

function sendIndex(res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(indexHtml);
}

function resolveAssetPath(requestPath) {
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.normalize(path.join(DIST_DIR, normalizedPath));

  if (!filePath.startsWith(DIST_DIR)) {
    return null;
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  if (!fs.statSync(filePath).isFile()) {
    return null;
  }

  return filePath;
}

function proxyRequest(req, res, pathname, search) {
  const upstreamPath = pathname.replace(/^\/api/, '') || '/';
  const upstreamUrl = new URL(`${upstreamPath}${search}`, API_PROXY_URL);
  const client = upstreamUrl.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: upstreamUrl.host };

  if (headers.origin) {
    headers.origin = upstreamUrl.origin;
  }

  const proxyReq = client.request(
    upstreamUrl,
    {
      method: req.method,
      headers,
    },
    proxyRes => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', error => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        error: 'Bad gateway',
        message: error.message,
      })
    );
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxyReq.end();
    return;
  }

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const { pathname, search } = requestUrl;

  if (pathname === '/_healthz' || pathname === '/_readyz') {
    sendJson(res, 200, { ok: 'ok' });
    return;
  }

  if (pathname === '/env-config') {
    sendJavascript(res, `window._conf=${JSON.stringify(BROWSER_CONFIG)};`);
    return;
  }

  if (pathname.startsWith('/api')) {
    proxyRequest(req, res, pathname, search);
    return;
  }

  const assetPath = resolveAssetPath(pathname);
  if (assetPath && path.basename(assetPath) !== 'index.html') {
    sendFile(res, assetPath);
    return;
  }

  sendIndex(res);
});

server.listen(PORT, () => {
  console.log(`Impetus Command Center listening on http://0.0.0.0:${PORT}`);
});
