// Juego del conejo para Nexus. Contrato completo en README.md.
// El conejo corre solo; el quiz decide si salta (acierto) o si el lobo se acerca (fallo).
import { cargarScript } from "../../js/nucleo/cargar.js";

let escena = null;

export default {
  id: "conejo",
  nombre: "Conejo",
  apoyo: "Ayuda al conejo a escapar del lobo",
  icono: "i-conejo",
  estado: "listo",
  pasos: [
    { icono: "i-tocar", texto: "Acierta y el conejo salta y gana ventaja." },
    { icono: "i-corazon", texto: "Si fallas, pierdes una vida y el lobo se acerca." },
    { icono: "i-estrella", texto: "Llega al final sin que te atrape y gana estrellas." },
  ],
  apoyoTutor: "El conejo da retroalimentación visual inmediata: la ventaja sobre el lobo refleja el desempeño del grupo.",

  async montar(contenedor) {
    await cargarScript(new URL("../../vendor/three.min.js", import.meta.url).href);
    await cargarScript(new URL("../../vendor/TweenMax.min.js", import.meta.url).href);
    const { crearEscena } = await import("./escena.js");
    escena = crearEscena(contenedor); // lanza un error si el equipo no tiene WebGL
  },

  iniciar() { escena && escena.reanudar(); },
  pausar() { escena && escena.pausar(); },
  reanudar() { escena && escena.reanudar(); },
  reiniciar() { escena && escena.reiniciar(); },
  destruir() {
    if (escena) escena.destruir();
    escena = null;
  },

  // Ganchos del quiz
  alAcertar(info) { escena && escena.acertar(info); },
  alFallar(info) { escena && escena.fallar(info); },
  alGanar() { escena && escena.ganar(); },
  alPerder() { escena && escena.perder(); },
  alSincronizar(info) { escena && escena.sincronizar(info); },
};
