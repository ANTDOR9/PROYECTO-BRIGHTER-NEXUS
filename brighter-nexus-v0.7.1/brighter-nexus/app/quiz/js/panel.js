// Pantalla de juego de Nexus: panel de quiz (izquierda) + juego (derecha).
// El panel solo conoce el contrato de cada juego (ver README.md); no sabe nada más de ellos.
import { h, ico, esperar, confirmar, reducirMovimiento, chispa } from "./ui.js";
import { juegos, buscarJuego } from "../juegos/index.js";
import { temas, buscarTema, cargarTema } from "../temas/index.js";
import { crearQuiz } from "./nucleo/quiz.js";
import { sonido } from "./nucleo/sonido.js";
import { almacen } from "./nucleo/almacen.js";
import { registrarPartida } from "./nucleo/puntaje.js";
import { lanzarConfeti, cancelarConfeti } from "./nucleo/confeti.js";
import { config } from "./nucleo/config.js";

const COLORES = ["coral", "ambar", "verde"];
const pasosQuiz = () => [
  { icono: "i-tocar", texto: "Lee la pregunta y toca una respuesta." },
  { icono: "i-corazon", texto: `Cada error cuesta una vida. Tienes ${config.obtener("vidas")}.` },
  { icono: "i-foco", texto: "Un foco te da una pista. Tienes 3." },
];
/** Los juegos usan una escala de 3 vidas; con otra cantidad se reparte en proporción. */
const escalaVidas = (v, max) => (v <= 0 ? 0 : Math.max(1, Math.round((v / max) * 3)));
const LETRAS = ["A", "B", "C", "D"];

const primerTemaListo = () => temas.find((t) => t.estado === "listo");
// La dirección del quiz: #/quiz/<juego>?tema=<tema>  (el enrutador de Nexus la conoce como /quiz/:juego)
const rutaHash = (juego, tema) => `#/quiz/${juego}?tema=${tema}`;

export function crearPanel(raiz, { navegar, corregir, consejero }) {
  // ---- Estado ----
  let temaId = null;
  let tema = null; // datos completos del tema (con preguntas)
  let juego = null; // módulo del juego elegido (aunque esté apagado)
  let juegoActivo = true;
  let juegoListo = false; // el juego está montado y responde
  let token = 0; // evita carreras al cambiar rápido de juego
  let quiz = null;
  let fase = "intro"; // 'intro' | 'jugando' | 'fin'
  let cola = Promise.resolve();
  let tAviso = 0;
  let cerrado = false;
  let r = {}; // referencias a los nodos que cambian durante la partida

  const api = {
    get sonido() { return sonido.activo; },
    get modoTutor() { return document.body.classList.contains("tutor"); },
  };

  // ---- Esqueleto fijo (no se recarga al cambiar de juego o tema) ----
  const area = h("div", { class: "juego-area", role: "img", "aria-label": "Escena del juego" });
  const avisoJuego = h("div", { class: "juego-aviso", hidden: true });
  const capa = h("div", { class: "juego-capa" }, area, avisoJuego); // el juego es el fondo de toda la pantalla

  const selJuego = h("div", { class: "pildora", role: "group", "aria-label": "Juego" });
  const btnTema = h("button", { class: "btn btn-tema", type: "button", on: { click: elegirTema } });
  const aviso = h("p", { class: "aviso", role: "status", "aria-live": "polite" });
  const cuerpo = h("div", { class: "cuerpo" });
  const panel = h(
    "section",
    { class: "panel", "aria-label": "Quiz" },
    h("div", { class: "panel-cristal" }),
    h("div", { class: "panel-in" }, h("div", { class: "fila-sel" }, selJuego, btnTema), cuerpo)
  );

  // Letreros sobre el juego (arriba) y botones de ícono (abajo a la derecha)
  const hudPuntos = h("b", {}, "0");
  const hudPreg = h("b", {}, "0/0");
  const cajaVidas = h("div", { class: "vidas", role: "img" });
  const hud = h(
    "div",
    { class: "hud", hidden: true },
    h("div", { class: "hud-datos" },
      h("div", { class: "chip" }, hudPuntos, h("span", {}, "Puntos")),
      h("div", { class: "chip" }, hudPreg, h("span", {}, "Pregunta"))),
    cajaVidas
  );
  const insigniaFocos = h("span", { class: "insignia" }, "0");
  const btnPista = h("button", { class: "ico-btn", type: "button", "aria-label": "Pista", title: "Pista", hidden: true, on: { click: pedirPista } }, ico("i-foco"), insigniaFocos);
  const btnReiniciar = h("button", { class: "ico-btn", type: "button", "aria-label": "Reiniciar", title: "Reiniciar", hidden: true, on: { click: pedirReinicio } }, ico("i-reiniciar"));
  const btnSonido = h("button", { class: "ico-btn", type: "button", on: { click: alternarSonido } });
  const acciones = h("div", { class: "acciones" }, btnPista, btnReiniciar, btnSonido);
  const resultado = h("div", { class: "resultado", hidden: true });
  const zona = h("div", { class: "zona" }, capa, panel, hud, resultado, acciones, aviso);
  raiz.replaceChildren(zona);

  // ---- Avisos ----
  function avisar(texto) {
    aviso.textContent = texto;
    aviso.classList.add("ver");
    clearTimeout(tAviso);
    tAviso = setTimeout(() => aviso.classList.remove("ver"), 3200);
  }

  // ---- Selectores ----
  function renderSelectores() {
    const lista = juegos.map((j) => {
      const actual = juegoActivo && juego && juego.id === j.id;
      const enlace = h(
        "a",
        {
          class: "opc" + (juegoActivo ? "" : " apagado"),
          href: rutaHash(j.id, temaId),
          "aria-label": j.nombre + (j.estado === "pronto" ? " (pronto)" : ""),
          "aria-current": actual ? "true" : false,
        },
        ico(j.icono),
        j.estado === "pronto" ? h("span", { class: "pronto" }, "Pronto") : null
      );
      // Cambiar de juego no recarga la pantalla: se avisa al panel directamente (la dirección la corrige el panel)
      enlace.addEventListener("click", (e) => {
        e.preventDefault();
        if (j.estado === "pronto") avisar("Este juego llegará pronto.");
        else navegar(j.id, temaId);
      });
      return enlace;
    });
    const power = h(
      "button",
      {
        class: "opc power",
        type: "button",
        "aria-pressed": String(juegoActivo),
        "aria-label": juegoActivo ? "Desactivar juego" : "Activar juego",
        title: juegoActivo ? "Desactivar juego" : "Activar juego",
        on: { click: alternarJuego },
      },
      ico("i-power")
    );
    selJuego.replaceChildren(power, h("span", { class: "sep", "aria-hidden": "true" }), ...lista);

    const t = temaId ? buscarTema(temaId) : null;
    btnTema.replaceChildren(
      h("span", { class: "txt" }, h("small", {}, t ? t.dimension : ""), t ? t.titulo : "Elegir tema"),
      ico("i-lista")
    );
    btnTema.setAttribute("aria-label", "Cambiar tema. Tema actual: " + (t ? t.titulo : "ninguno"));
  }

  function alternarJuego() {
    const id = juego ? juego.id : "conejo";
    navegar(juegoActivo ? "ninguno" : id, temaId);
    avisar(juegoActivo ? "Juego desactivado. Solo quiz." : "Juego activado.");
  }

  async function elegirTema() {
    const dlg = h("dialog", { class: "lista", "aria-labelledby": "dlg-temas" });
    const lista = h("div", { class: "temas" });
    for (const nivel of ["Primaria", "Secundaria"]) {
      lista.append(h("h3", {}, nivel));
      for (const dim of [...new Set(temas.filter((t) => t.nivel === nivel).map((t) => t.dimension))]) {
        lista.append(h("h4", {}, dim));
        for (const t of temas.filter((x) => x.nivel === nivel && x.dimension === dim)) {
          const pronto = t.estado === "pronto";
          lista.append(
            h(
              "button",
              {
                class: "tema-op" + (pronto ? " pronto" : ""),
                type: "button",
                "aria-current": t.id === temaId ? "true" : false,
                on: {
                  click: () => {
                    dlg.close();
                    if (pronto) avisar("Este tema llegará pronto.");
                    else if (t.id !== temaId) navegar(juegoActivo ? juego.id : "ninguno", t.id);
                  },
                },
              },
              h("span", { class: "hex " + COLORES[temas.indexOf(t) % 3] }, ico(iconoDimension(t.dimension))),
              h("span", { class: "txt" }, t.titulo),
              pronto ? h("span", { class: "etq" }, "Pronto") : t.id === temaId ? ico("i-check") : null
            )
          );
        }
      }
    }
    dlg.append(
      h("h2", { id: "dlg-temas" }, "Elige un tema"),
      lista,
      h("div", { class: "controles" }, h("button", { class: "btn", type: "button", on: { click: () => dlg.close() } }, "Cerrar"))
    );
    dlg.addEventListener("close", () => dlg.remove());
    document.body.appendChild(dlg);
    dlg.showModal();
  }

  function iconoDimension(d) {
    return d.includes("vida") ? "i-hoja" : d.includes("físicas") ? "i-atomo" : "i-planeta";
  }

  // ---- Cascada de entrada (título, pasos, estado) ----
  function cascada(el) {
    if (reducirMovimiento()) return;
    el.classList.remove("cascada");
    [...el.children].forEach((c, i) => c.style.setProperty("--i", i));
    void el.offsetWidth;
    el.classList.add("cascada");
  }

  // ---- Vistas ----
  function pintarSonido() {
    btnSonido.replaceChildren(ico(sonido.activo ? "i-sonido" : "i-silencio"));
    btnSonido.setAttribute("aria-label", sonido.activo ? "Silenciar sonido" : "Activar sonido");
    btnSonido.title = sonido.activo ? "Silenciar sonido" : "Activar sonido";
  }
  function alternarSonido() {
    sonido.activo = !sonido.activo;
    almacen.guardar("nexus-sonido", sonido.activo ? "1" : "0");
    pintarSonido();
    sonido.toque();
  }

  /** Muestra u oculta los letreros y botones según lo que se está viendo. */
  function marcarFase(f) {
    fase = f;
    const jugando = f === "jugando";
    hud.hidden = !jugando;
    resultado.hidden = f !== "fin";
    cuerpo.classList.toggle("con-resultado", f === "fin");
    btnPista.hidden = !jugando;
    btnReiniciar.hidden = !jugando;
    cuerpo.classList.toggle("con-hud", jugando);
  }

  function vistaIntro(animar) {
    marcarFase("intro");
    r = {};
    const pasos = juegoActivo && juego && juego.pasos ? juego.pasos : pasosQuiz();
    const tutor = document.body.classList.contains("tutor");
    const notaTutor = [
      "Modo tutor: vidas infinitas y la respuesta correcta se insinúa con un brillo suave.",
      tema && tema.apoyoTutor,
      juegoActivo && juego && juego.apoyoTutor,
    ].filter(Boolean).join(" ");
    const intro = h(
      "div",
      { class: "intro" },
      h("div", {}, h("h1", { class: "titulo" }, tema ? tema.titulo : "Quiz"), h("p", { class: "apoyo" }, tema ? tema.apoyo : "")),
      h(
        "ol",
        { class: "pasos" },
        pasos.slice(0, 3).map((p, i) => h("li", {}, h("span", { class: "hex " + COLORES[i % 3] }, ico(p.icono)), p.texto))
      ),
      tutor && notaTutor ? h("p", { class: "nota-tutor" }, notaTutor) : null,
      h("div", { class: "controles" }, chispa("Iniciar", { onClick: iniciarPartida }).nodo)
    );
    cuerpo.replaceChildren(intro);
    if (animar) cascada(intro);
  }

  /** Letrero de vidas: un corazón y el número (o infinito en modo tutor). */
  function pintarVidas() {
    cajaVidas.replaceChildren();
    r.corazon = ico("i-corazon", "lleno vida");
    if (quiz.infinito) {
      r.numVidas = null;
      r.inf = ico("i-infinito", "inf");
      cajaVidas.append(r.corazon, r.inf);
      cajaVidas.setAttribute("aria-label", "Vidas infinitas");
    } else {
      r.inf = null;
      r.numVidas = h("b", { class: "num-vidas" }, String(quiz.vidas));
      cajaVidas.append(r.corazon, r.numVidas);
      cajaVidas.setAttribute("aria-label", quiz.vidas === 1 ? "1 vida" : quiz.vidas + " vidas");
      cajaVidas.classList.toggle("poca", quiz.vidas <= 1);
    }
  }

  function pintarHud() {
    hudPuntos.textContent = String(quiz.puntos);
    hudPreg.textContent = `${quiz.indice + 1}/${quiz.total}`;
    insigniaFocos.textContent = String(quiz.focos);
    pintarVidas();
  }

  /** Modo tutor: la respuesta correcta lleva una marca que el estilo convierte en un brillo suave. */
  function marcarTutor() {
    if (!r.opciones || !quiz) return;
    const p = quiz.actual();
    [...r.opciones.children].forEach((b, i) => {
      if (api.modoTutor && !quiz.respuesta && i === p.correcta) b.dataset.ok = "1";
      else delete b.dataset.ok;
    });
  }

  function vistaPregunta() {
    marcarFase("jugando");
    const p = quiz.actual();
    r = {};
    pintarHud();

    r.pistaTxt = h("p", { class: "pista-txt", hidden: true });
    r.opciones = h(
      "div",
      { class: "opciones", role: "group", "aria-label": "Respuestas" },
      p.opciones.map((texto, i) =>
        h(
          "button",
          { class: "opcion", type: "button", estilo: { "--i": i }, on: { click: () => responder(i) } },
          h("span", { class: "letra" }, LETRAS[i]),
          h("span", { class: "texto" }, texto),
          h("span", { class: "marca" }, ico("i-check"))
        )
      )
    );
    r.respuesta = h("div", { "aria-live": "polite" });
    const img = p.imagen ? h("img", { class: "pregunta-img", src: p.imagen, alt: "" }) : null;
    if (img) img.addEventListener("error", () => img.remove());
    const sig = chispa("Siguiente", { onClick: siguiente, disabled: true, clase: "sig" });
    r.btnSig = sig.boton;
    r.txtSig = sig.txt;
    const tarjeta = h(
      "div",
      { class: "tarjeta" },
      img,
      h("h2", { class: "pregunta" }, p.pregunta),
      r.opciones,
      h("div", { class: "retro" }, r.pistaTxt, r.respuesta),
      h("div", { class: "sigfila" }, sig.nodo)
    );
    marcarTutor();
    actualizarPista();
    cuerpo.replaceChildren(tarjeta);
    if (consejero) setTimeout(() => { if (fase === "jugando") consejero.decir({ id: "pista", titulo: "Pista", texto: "Gasta un foco y te ayuda con la respuesta.", objetivo: btnPista, ms: 4500, prob: 0.25 }); }, 1800);
  }

  function actualizarPista() {
    const p = quiz.actual();
    const puede = !quiz.respuesta && !!p.pista && (quiz.pistaUsada || quiz.focos > 0);
    btnPista.disabled = !puede;
    btnPista.setAttribute("aria-disabled", String(!puede));
  }

  function pulso(nodo) {
    nodo.classList.remove("pulso");
    void nodo.offsetWidth;
    nodo.classList.add("pulso");
  }

  function pedirPista() {
    const texto = quiz.pedirPista();
    if (!texto) return;
    sonido.toque();
    r.pistaTxt.hidden = false;
    r.pistaTxt.replaceChildren(texto);
    insigniaFocos.textContent = String(quiz.focos);
    pulso(insigniaFocos);
    actualizarPista();
  }

  function responder(i) {
    const res = quiz.responder(i);
    if (!res) return;
    const botones = [...r.opciones.children];
    r.opciones.classList.add("cerrada");
    botones[res.correcta].classList.add("correcta");
    if (!res.acierto) {
      botones[i].classList.add("elegida");
      botones[i].querySelector(".marca").replaceChildren(ico("i-cerrar"));
    }
    botones[res.correcta].append(h("span", { class: "solo-lector" }, "Respuesta correcta"));
    if (!res.acierto) botones[i].append(h("span", { class: "solo-lector" }, "Tu respuesta"));

    r.respuesta.replaceChildren(
      h(
        "div",
        { class: "respuesta " + (res.acierto ? "ok" : "mal") },
        h("strong", {}, res.acierto ? "Correcto" : "Casi"),
        res.explicacion,
        !res.acierto && res.pista ? h("span", { class: "repaso" }, "Para la próxima: " + res.pista) : null
      )
    );
    hudPuntos.textContent = String(quiz.puntos);
    if (res.acierto) pulso(hudPuntos);
    marcarTutor();
    if (res.acierto) {
      const caja = botones[i].getBoundingClientRect();
      lanzarConfeti({ x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 });
    } else {
      temblor();
      perderVida();
    }
    r.btnSig.disabled = false;
    r.txtSig.textContent = res.fin ? "Ver resultado" : "Siguiente";
    actualizarPista();
    r.btnSig.focus({ preventScroll: true });

    // Sonido y juego
    if (res.acierto) { sonido.acierto(); llamar("alAcertar", { racha: quiz.racha }); }
    else { sonido.fallo(); llamar("alFallar", { vidas: escalaVidas(quiz.vidas, quiz.vidasMax), vidasReal: quiz.vidas, vidasMax: quiz.vidasMax }); }
    if (res.fin === "gano") { setTimeout(() => sonido.gana(), 350); llamar("alGanar"); }
    if (res.fin === "perdio") { setTimeout(() => sonido.pierde(), 350); llamar("alPerder"); }
  }

  /** Sacude toda la pantalla un instante (al fallar). */
  function temblor() {
    if (reducirMovimiento()) return;
    zona.classList.remove("tiembla");
    void zona.offsetWidth;
    zona.classList.add("tiembla");
  }
  zona.addEventListener("animationend", (e) => { if (e.target === zona) zona.classList.remove("tiembla"); });

  /** Anima el letrero de vidas al fallar: el corazón se rompe, el número baja y sale un "-1". */
  function perderVida() {
    if (quiz.infinito) {
      if (r.inf) { r.inf.classList.remove("late"); void r.inf.getBoundingClientRect(); r.inf.classList.add("late"); }
      return;
    }
    const perdio = Number(r.numVidas.textContent) > quiz.vidas;
    r.numVidas.textContent = String(quiz.vidas);
    cajaVidas.setAttribute("aria-label", quiz.vidas === 1 ? "1 vida" : quiz.vidas + " vidas");
    cajaVidas.classList.toggle("poca", quiz.vidas <= 1);
    if (!perdio) return;
    for (const n of [r.corazon, r.numVidas]) {
      n.classList.remove("rompe");
      void n.getBoundingClientRect();
      n.classList.add("rompe");
      n.addEventListener("animationend", () => n.classList.remove("rompe"), { once: true });
    }
    cajaVidas.classList.remove("golpe");
    void cajaVidas.offsetWidth;
    cajaVidas.classList.add("golpe");
    const menos = h("span", { class: "menos", "aria-hidden": "true" }, "−1");
    menos.addEventListener("animationend", () => menos.remove());
    cajaVidas.append(menos);
    if (consejero) setTimeout(() => consejero.decir({ id: "vidas", titulo: "Vidas", texto: "Cada error cuesta una. Si llegan a cero, termina la partida.", objetivo: cajaVidas, ms: 4500, prob: 0.25 }), 1400);
  }

  function siguiente() {
    if (!quiz) return;
    if (quiz.resultado) return vistaFin();
    quiz.siguiente();
    vistaPregunta();
  }

  function vistaFin() {
    marcarFase("fin");
    const res = quiz.resumen();
    registrarPartida({ tema: temaId, juego: juegoActivo && juego ? juego.id : "ninguno", puntos: res.puntos, estrellas: res.estrellas, aciertos: res.aciertos, total: res.total, resultado: res.resultado });
    const gano = res.resultado === "gano";
    const titulo = gano
      ? juegoActivo ? "Llegaste a la meta" : "Completaste el quiz"
      : juegoActivo ? "El lobo te atrapó" : "Te quedaste sin vidas";
    const repaso = [...new Map(res.fallados.map((f) => [f.pregunta, f])).values()];
    resultado.replaceChildren(
      h("div", { class: "estrellas", role: "img", "aria-label": res.estrellas + " de 3 estrellas" },
        [0, 1, 2].map((i) => {
          const e = ico("i-estrella", i < res.estrellas ? "gana" : "");
          e.style.setProperty("--i", i);
          return e;
        })
      ),
      h("h1", { class: "titulo" }, titulo),
      h("p", { class: "apoyo" }, `${res.puntos} puntos y ${res.aciertos} de ${res.total} respuestas correctas`)
    );
    resultado.style.animation = "none";
    void resultado.offsetWidth;
    resultado.style.animation = "";
    const fin = h(
      "div",
      { class: "fin" },
      repaso.length
        ? h("div", {}, h("h2", { class: "subtitulo" }, "Para repasar"),
            h("ul", { class: "repasar" }, repaso.map((f) => h("li", {}, h("b", {}, f.subtema || f.pregunta), h("span", {}, `${f.pregunta} Respuesta: ${f.correcta}. ${f.explicacion}`)))))
        : null,
      h("div", { class: "controles" },
        chispa("Jugar otra vez", { onClick: iniciarPartida }).nodo,
        h("button", { class: "btn", type: "button", on: { click: volver } }, "Volver"))
    );
    cuerpo.replaceChildren(fin);
  }

  // ---- Flujo de la partida ----
  function iniciarPartida() {
    if (!tema) return;
    quiz = crearQuiz(tema, { vidas: config.obtener("vidas") });
    quiz.setInfinito(api.modoTutor);
    sonido.toque();
    llamar("reiniciar");
    vistaPregunta();
  }

  function volver() {
    quiz = null;
    llamar("reiniciar");
    vistaIntro(true);
  }

  async function pedirReinicio() {
    const si = await confirmar({ titulo: "¿Empezar de nuevo?", texto: "Se pierde el avance de esta partida.", si: "Empezar de nuevo", no: "Seguir jugando" });
    if (si) iniciarPartida();
  }

  /** Hay una partida empezada y sin terminar. */
  const enCurso = () => fase === "jugando" && quiz && quiz.resultado === null;

  // ---- Juego ----
  function llamar(gancho, dato) {
    if (!juegoActivo || !juegoListo || !juego) return;
    try {
      if (typeof juego[gancho] === "function") juego[gancho](dato);
    } catch (e) {
      console.error("Error en el juego (" + gancho + "):", e);
    }
  }

  function sincronizarJuego() {
    if (!juegoListo) return;
    llamar("iniciar");
    if (!quiz) return;
    if (fase === "fin") llamar(quiz.resultado === "gano" ? "alGanar" : "alPerder");
    else llamar("alSincronizar", { vidas: escalaVidas(quiz.vidas, quiz.vidasMax), vidasReal: quiz.vidas, vidasMax: quiz.vidasMax, racha: quiz.racha });
  }

  function mostrarAvisoJuego(contenido) {
    if (!contenido) { avisoJuego.hidden = true; avisoJuego.replaceChildren(); return; }
    avisoJuego.hidden = false;
    avisoJuego.replaceChildren(...contenido);
  }

  async function desmontar(conFundido) {
    token++;
    if (juego && juegoListo) {
      if (conFundido) { area.classList.add("saliendo"); await esperar(250); }
      try { juego.destruir && juego.destruir(); } catch (e) { console.error(e); }
    }
    juegoListo = false;
    area.replaceChildren();
    mostrarAvisoJuego(null);
    area.classList.remove("saliendo");
  }

  async function montar(nuevo) {
    const mio = ++token;
    mostrarAvisoJuego([h("div", { class: "giro" }), "Cargando juego"]);
    try {
      await nuevo.montar(area, api);
      if (mio !== token || cerrado) { nuevo.destruir && nuevo.destruir(); return; }
      juegoListo = true;
      mostrarAvisoJuego(null);
      sincronizarJuego();
    } catch (e) {
      console.error(e);
      if (mio !== token) return;
      juegoListo = false;
      area.replaceChildren();
      mostrarAvisoJuego(["No se pudo mostrar el juego en este equipo.", "El quiz funciona igual."]);
    }
  }

  async function cambiarJuego(id) {
    if (id === "ninguno") {
      if (!juegoActivo && !juegoListo) return renderSelectores();
      juegoActivo = false;
      document.body.classList.add("sin-juego");
      almacen.guardar("nexus-juego-activo", "0");
      renderSelectores();
      await desmontar(true);
      if (fase === "intro") vistaIntro(true);
      return;
    }
    const nuevo = buscarJuego(id);
    if (!nuevo || nuevo.estado !== "listo") {
      if (nuevo) avisar("Este juego llegará pronto.");
      return renderSelectores();
    }
    const yaMontado = juego === nuevo && juegoActivo && juegoListo;
    juegoActivo = true;
    document.body.classList.remove("sin-juego");
    almacen.guardar("nexus-juego-activo", "1");
    almacen.guardar("nexus-juego", id);
    if (yaMontado) return renderSelectores();
    await desmontar(true);
    juego = nuevo;
    renderSelectores();
    if (fase === "intro") vistaIntro(true);
    await montar(nuevo);
  }

  async function cambiarTema(id) {
    const datos = await cargarTema(id);
    if (!datos) { avisar("Este tema llegará pronto."); return false; }
    temaId = id;
    tema = datos;
    quiz = null;
    almacen.guardar("nexus-tema", id);
    renderSelectores();
    llamar("reiniciar");
    vistaIntro(true);
    return true;
  }

  // ---- Entrada desde la ruta (#/modulo/juegos/<juego>?tema=<id>) ----
  function aplicar(ruta) {
    cola = cola.then(() => aplicarAhora(ruta)).catch((e) => console.error(e));
    return cola;
  }

  async function aplicarAhora(ruta) {
    if (cerrado) return;
    const guardadoJuego = almacen.leer("nexus-juego", "conejo");
    const activoGuardado = almacen.leer("nexus-juego-activo", "1") === "1";
    let juegoPedido = ruta.juego || (activoGuardado ? guardadoJuego : "ninguno");
    if (juegoPedido !== "ninguno" && !buscarJuego(juegoPedido)) juegoPedido = guardadoJuego;
    let temaPedido = ruta.tema && buscarTema(ruta.tema) ? ruta.tema : temaId || almacen.leer("nexus-tema", "");
    if (!buscarTema(temaPedido) || buscarTema(temaPedido).estado !== "listo") temaPedido = primerTemaListo().id;

    if (juego === null) juego = buscarJuego(guardadoJuego) || juegos[0]; // juego recordado, aunque esté apagado

    // Cambiar de tema a mitad de partida pide confirmación; cambiar de juego no (el avance se conserva).
    if (temaId && temaPedido !== temaId && enCurso()) {
      const salir = await confirmar({ titulo: "¿Cambiar de tema?", texto: "Se pierde el avance de esta partida.", si: "Cambiar", no: "Seguir jugando" });
      if (!salir) { corregir(); return; }
    }
    if (temaPedido !== temaId) await cambiarTema(temaPedido);
    else renderSelectores();
    await cambiarJuego(juegoPedido);
    corregir();
  }

  // ---- Teclado y pestaña oculta ----
  function alTeclado(e) {
    if (document.querySelector("dialog[open]") || e.ctrlKey || e.metaKey || e.altKey) return;
    if (fase === "jugando" && quiz && !quiz.respuesta) {
      let n = "1234".indexOf(e.key);
      if (n < 0) n = "abcd".indexOf(e.key.toLowerCase());
      if (n >= 0 && n < quiz.actual().opciones.length) { e.preventDefault(); responder(n); }
    } else if (fase === "jugando" && quiz && quiz.respuesta && e.key === "Enter" && document.activeElement === document.body) {
      siguiente();
    }
  }
  function alVisibilidad() {
    llamar(document.hidden ? "pausar" : "reanudar");
  }
  document.addEventListener("keydown", alTeclado);
  document.addEventListener("visibilitychange", alVisibilidad);

  sonido.activo = almacen.leer("nexus-sonido", "1") === "1";
  pintarSonido();

  return {
    aplicar,
    enCurso,
    /** Ruta canónica del estado actual. */
    ruta() {
      return rutaHash(juegoActivo && juego ? juego.id : "ninguno", temaId || "");
    },
    refrescarModo() {
      if (fase === "intro") vistaIntro(false);
      else if (fase === "jugando" && quiz) {
        quiz.setInfinito(api.modoTutor);
        pintarVidas();
        marcarTutor();
      }
    },
    async cerrar() {
      cerrado = true;
      document.removeEventListener("keydown", alTeclado);
      document.removeEventListener("visibilitychange", alVisibilidad);
      clearTimeout(tAviso);
      cancelarConfeti();
      await desmontar(false);
      document.body.classList.remove("sin-juego");
      raiz.replaceChildren();
    },
  };
}
