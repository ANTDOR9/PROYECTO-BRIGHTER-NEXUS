// Configuración del usuario (se guarda en el navegador). Cambiarla avisa con el evento "nexus:config".
import { almacen } from "./almacen.js";

const CLAVE = "nexus-config";
const BASE = { consejero: true, volumen: 80, musica: false, vidas: 3 };
const LIMITES = { volumen: [0, 100], vidas: [1, 9] };

let datos = { ...BASE };
try {
  const guardado = JSON.parse(almacen.leer(CLAVE, "{}"));
  if (guardado && typeof guardado === "object") datos = { ...BASE, ...guardado };
} catch (e) {
  /* configuración dañada: se usan los valores base */
}

function limpiar(clave, valor) {
  if (typeof BASE[clave] === "boolean") return !!valor;
  const [min, max] = LIMITES[clave] || [-Infinity, Infinity];
  const n = Math.round(Number(valor));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : BASE[clave];
}

export const config = {
  limites: LIMITES,
  obtener(clave) {
    return datos[clave];
  },
  poner(clave, valor) {
    if (!(clave in BASE)) return;
    const v = limpiar(clave, valor);
    if (datos[clave] === v) return;
    datos[clave] = v;
    almacen.guardar(CLAVE, JSON.stringify(datos));
    document.dispatchEvent(new CustomEvent("nexus:config", { detail: { clave, valor: v } }));
  },
};

// Consejos que ya se mostraron (para no repetirlos cada vez).
const CLAVE_CONSEJOS = "nexus-consejos";
export const consejosVistos = {
  lista() {
    try {
      const l = JSON.parse(almacen.leer(CLAVE_CONSEJOS, "[]"));
      return Array.isArray(l) ? l : [];
    } catch (e) {
      return [];
    }
  },
  vio(id) { return this.lista().includes(id); },
  marcar(id) { if (!this.vio(id)) almacen.guardar(CLAVE_CONSEJOS, JSON.stringify([...this.lista(), id])); },
  reiniciar() { almacen.guardar(CLAVE_CONSEJOS, "[]"); },
};
