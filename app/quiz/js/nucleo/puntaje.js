// Punto de enlace con el motor común de puntaje de Nexus (estrellas, niveles, medallas).
// Mientras ese motor no esté conectado, las partidas quedan guardadas en este equipo.
import { almacen } from "./almacen.js";

export function registrarPartida(partida) {
  const registro = Object.assign({ fecha: new Date().toISOString() }, partida);
  let lista = [];
  try {
    lista = JSON.parse(almacen.leer("nexus-partidas", "[]"));
  } catch (e) {
    lista = [];
  }
  lista.push(registro);
  almacen.guardar("nexus-partidas", JSON.stringify(lista.slice(-100)));
  window.dispatchEvent(new CustomEvent("nexus:partida", { detail: registro }));
}
