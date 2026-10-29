// Lista de juegos disponibles. Agregar un juego = crear su módulo y sumarlo aquí.
import conejo from "./conejo/conejo.js";
import juego2 from "./juego2.js";

export const juegos = [conejo, juego2];
export const buscarJuego = (id) => juegos.find((j) => j.id === id) || null;
