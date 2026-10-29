// Consejero: un ave de papel con un globo que aparece unos segundos en la esquina,
// explica algo y se desvanece. Mientras habla, el botón del que habla brilla.
import { h } from "./ui.js";
import { config, consejosVistos } from "./nucleo/config.js";

const MAX_POR_SESION = 3; // como mucho tres consejos por visita
const ESPERA_ENTRE = 150000; // y nunca dos seguidos: mínimo 2 minutos y medio
const PROBABILIDAD = 0.3; // chance de que un consejo llegue a aparecer

function ave() {
  return h("img", { class: "ave", src: new URL("../img/consejero.png", import.meta.url).href, alt: "", width: "520", height: "403" });
}

export function crearConsejero() {
  const titulo = h("strong");
  const texto = h("span");
  const nodo = h("div", { class: "consejero", role: "status", "aria-live": "polite", hidden: true }, ave(), h("div", { class: "globo" }, titulo, texto));
  document.body.appendChild(nodo);

  let cola = [];
  let corriendo = false;
  let timers = [];
  let generacion = 0;
  let resaltado = null;
  let mostrados = 0;
  let ultimo = 0;

  const esperar = (ms) => new Promise((ok) => { timers.push(setTimeout(ok, ms)); });

  function quitarBrillo() {
    if (resaltado) resaltado.classList.remove("resalta", "resalta-fuera");
    resaltado = null;
  }

  async function mostrar(c, gen) {
    titulo.textContent = c.titulo;
    texto.textContent = c.texto;
    const objetivo = c.objetivo ? (typeof c.objetivo === "string" ? document.querySelector(c.objetivo) : c.objetivo) : null;
    nodo.hidden = false;
    nodo.classList.remove("sale");
    void nodo.offsetWidth;
    nodo.classList.add("ver");
    if (objetivo) {
      objetivo.classList.remove("resalta-fuera");
      objetivo.classList.add("resalta");
      resaltado = objetivo;
    }
    if (c.id) consejosVistos.marcar(c.id);
    await esperar(c.ms ?? 5200);
    if (gen !== generacion) return;
    nodo.classList.remove("ver");
    nodo.classList.add("sale");
    if (objetivo) objetivo.classList.add("resalta-fuera");
    await esperar(800);
    if (gen !== generacion) return;
    quitarBrillo();
    nodo.hidden = true;
    nodo.classList.remove("sale");
    await esperar(450);
  }

  async function correr() {
    if (corriendo) return;
    corriendo = true;
    const gen = generacion;
    while (cola.length && gen === generacion) {
      const c = cola.shift();
      if (!config.obtener("consejero") && !c.siempre) { cola = []; break; }
      if (c.id && consejosVistos.vio(c.id) && !c.repetir) continue;
      await mostrar(c, gen);
    }
    if (gen === generacion) corriendo = false;
  }

  function cancelar() {
    generacion++;
    timers.forEach(clearTimeout);
    timers = [];
    cola = [];
    corriendo = false;
    quitarBrillo();
    nodo.classList.remove("ver", "sale");
    nodo.hidden = true;
  }

  const alConfig = (e) => { if (e.detail.clave === "consejero" && !e.detail.valor) cancelar(); };
  document.addEventListener("nexus:config", alConfig);

  return {
    /** { id?, titulo, texto, objetivo?: selector|nodo, ms?, repetir?, siempre? } */
    decir(c) {
      if (!config.obtener("consejero") && !c.siempre) return;
      if (c.id && consejosVistos.vio(c.id) && !c.repetir) return;
      if (!c.siempre) {
        // Aparece pocas veces: hay un límite por visita, una espera entre consejos y solo a veces sale.
        if (mostrados >= MAX_POR_SESION) return;
        if (ultimo && Date.now() - ultimo < ESPERA_ENTRE) return;
        if (Math.random() > (c.prob ?? PROBABILIDAD)) return;
        mostrados++;
        ultimo = Date.now();
      }
      cola.push(c);
      correr();
    },
    cancelar,
    destruir() {
      cancelar();
      document.removeEventListener("nexus:config", alConfig);
      nodo.remove();
    },
  };
}
