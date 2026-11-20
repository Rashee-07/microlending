// Minimal static server for the React production build (lighter than the dev server), with single-page-app fallback.
// npm run build, then: npm run serve  (or: node scripts/serve-build.js build 3077)
const http = require('http');
const fs = require('fs');
const path = require('path');
const [root, port] = [path.resolve(process.argv[2]), Number(process.argv[3] || 3077)];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.map': 'application/json' };
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(root, urlPath);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(root, 'index.html'); // client-side route
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log('serving ' + root + ' on http://localhost:' + port));
