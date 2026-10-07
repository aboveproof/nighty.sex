const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'views.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function readViews() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify({ views: 0 }, null, 2));
      return 0;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Number(parsed.views) || 0;
  } catch (err) {
    console.error('Error reading views:', err);
    return 0;
  }
}

function writeViews(count) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({ views: count }, null, 2));
  } catch (err) {
    console.error('Error writing views:', err);
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // View counter API endpoint
  if (pathname === '/api/views') {
    let current = readViews();
    if (parsedUrl.query.inc === '1') {
      current += 1;
      writeViews(current);
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    res.end(JSON.stringify({ views: current }));
    return;
  }

  // HTML page routes
  if (pathname === '/' || pathname === '/asset' || pathname === '/asset/' || pathname === '/index.html') {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error');
        return;
      }

      const host = req.headers.host || 'nighty.sex';
      const proto = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
      const imageUrl = `${proto}://${host}/asset/image.png`;
      const rendered = content.replaceAll('__IMAGE_URL__', imageUrl);

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(rendered);
    });
    return;
  }

  // Static file serving
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
