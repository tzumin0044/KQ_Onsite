import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function createServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    }

    let filePath = path.join(DIST_DIR, reqPath);

    // 防目錄遍歷
    if (!filePath.startsWith(DIST_DIR)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // SPA Fallback to index.html
        filePath = path.join(DIST_DIR, 'index.html');
      }

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.statusCode = 500;
          res.end('Error loading ' + reqPath);
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      });
    });
  });

  server.listen(port, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log('===========================================================');
    console.log('  【理貨連動狀態看板系統】啟動成功！');
    console.log('===========================================================');
    console.log(`  > 本機網址: http://localhost:${port}`);
    console.log(`  > 本機網址: http://127.0.0.1:${port}`);
    console.log(`  > 區網網址: http://${localIp}:${port}`);
    console.log('===========================================================');
    console.log('  ★ 提醒：請保持此視窗開啟（可最小化），關閉將會停止服務。');
    console.log('===========================================================');

    // 自動開啟瀏覽器
    const url = `http://localhost:${port}`;
    exec(`start ${url}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`連接埠 ${port} 已被佔用，嘗試使用連接埠 ${port + 1}...`);
      createServer(port + 1);
    } else {
      console.error('伺服器錯誤:', err);
    }
  });
}

createServer(5173);
