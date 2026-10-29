// Ventana de Brighter Nexus para Windows 11. Nexus usa módulos de JavaScript, que no corren desde file://,
// así que la ventana abre un servidor local mínimo (solo en este equipo, puerto libre al azar) y carga la app desde ahí.
const { app, BrowserWindow, Menu } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

if (!app.requestSingleInstanceLock()) app.quit();

const RAIZ = path.join(__dirname, '..', 'app');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4'
};

function servir() {
  return new Promise(listo => {
    const servidor = http.createServer((req, res) => {
      let url = '/';
      try { url = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400).end(); return; }
      const ruta = path.normalize(path.join(RAIZ, url === '/' ? 'index.html' : url));
      if (!ruta.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
      fs.readFile(ruta, (error, datos) => {
        if (error) { res.writeHead(404).end('No encontrado'); return; }
        res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta).toLowerCase()] || 'application/octet-stream' }).end(datos);
      });
    });
    servidor.listen(0, '127.0.0.1', () => listo(servidor.address().port));
  });
}

let ventana = null;
async function crearVentana() {
  const puerto = await servir();
  ventana = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 500,
    backgroundColor: '#031F2B', title: 'Brighter Nexus', icon: path.join(__dirname, '..', 'recursos', 'icono.png'),
    autoHideMenuBar: true, fullscreen: process.argv.includes('--pantalla-completa'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true }
  });
  Menu.setApplicationMenu(null);
  ventana.loadURL(`http://127.0.0.1:${puerto}/`);
  // La ventana solo muestra Nexus: no abre ventanas nuevas ni navega a otras páginas
  ventana.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  ventana.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(`http://127.0.0.1:${puerto}/`)) e.preventDefault(); });
  ventana.webContents.session.setPermissionRequestHandler((c, p, responder) => responder(false));
}

app.on('second-instance', () => { if (ventana) { if (ventana.isMinimized()) ventana.restore(); ventana.focus(); } });
app.whenReady().then(crearVentana);
app.on('window-all-closed', () => app.quit());
