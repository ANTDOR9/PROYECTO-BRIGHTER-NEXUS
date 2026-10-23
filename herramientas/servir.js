// Servidor local mínimo para abrir la app en el navegador: http://localhost:5173
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const puerto = Number(process.env.PORT) || 5173;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4'
};

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const ruta = normalize(join(raiz, url === '/' ? 'index.html' : url));
  if (!ruta.startsWith(raiz)) { res.writeHead(403).end(); return; } // no salir de la carpeta app
  try {
    const datos = await readFile(ruta);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' }).end(datos);
  } catch {
    res.writeHead(404).end('No encontrado');
  }
}).listen(puerto, () => console.log(`Brighter Nexus en http://localhost:${puerto}`));
