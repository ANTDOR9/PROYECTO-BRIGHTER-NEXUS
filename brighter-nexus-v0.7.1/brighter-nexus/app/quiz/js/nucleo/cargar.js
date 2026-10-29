// Carga un script de la propia app una sola vez (CSP: solo script-src 'self').
const cache = new Map();

export function cargarScript(src) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => {
          cache.delete(src);
          reject(new Error("No se pudo cargar " + src));
        };
        document.head.appendChild(s);
      })
    );
  }
  return cache.get(src);
}
