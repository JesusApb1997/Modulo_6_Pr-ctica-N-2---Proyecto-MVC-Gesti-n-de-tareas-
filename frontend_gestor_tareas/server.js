// ============================================================
// server.js - Servidor estático del FRONTEND (sin dependencias)
// ============================================================
// Sirve la SPA de frontend_gestor_tareas/public en:
//   http://localhost:5500
//
// NOTA: el frontend es 100% estático (HTML + Tailwind + JS).
// Este servidor existe solo para "servir" la carpeta public y
// evitar problemas de CORS con file://. No es obligatorio:
// también puedes abrir public/index.html directamente.
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 5500;
const ROOT = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // Quitar query string y normalizar la ruta
  let ruta = decodeURIComponent((req.url || '/').split('?')[0]);
  if (ruta === '/') ruta = '/index.html';

  const archivo = path.normalize(path.join(ROOT, ruta));

  // Protección básica contra path traversal
  if (!archivo.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('403 Forbidden');
  }

  fs.readFile(archivo, (err, data) => {
    if (err) {
      // Fallback: cualquier ruta desconocida sirve el index (SPA)
      return fs.readFile(path.join(ROOT, 'index.html'), (e2, html) => {
        if (e2) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('404 — Archivo no encontrado');
        }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(html);
      });
    }
    const ext = path.extname(archivo).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('=============================================');
  console.log('  🎨 Frontend — Gestor de Tareas activo');
  console.log('=============================================');
  console.log(`  🌐 Abre:     http://localhost:${PORT}`);
  console.log(`  🔌 API en:   http://localhost:9000/api/tareas`);
  console.log('=============================================');
});
