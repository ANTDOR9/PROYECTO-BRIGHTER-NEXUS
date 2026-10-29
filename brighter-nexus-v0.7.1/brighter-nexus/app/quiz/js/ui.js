// Ayudas mínimas para crear elementos sin plantillas en línea ni frameworks.
const SVG = "http://www.w3.org/2000/svg";

/** h('div', { class: 'x', on: { click: fn }, 'aria-label': '...' }, hijo1, 'texto') */
export function h(tag, props = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === "class") el.className = v;
    else if (k === "on") for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === "estilo") for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
    else el.setAttribute(k, v === true ? "" : v);
  }
  agregar(el, hijos);
  return el;
}

function agregar(el, hijos) {
  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    el.append(hijo.nodeType ? hijo : document.createTextNode(String(hijo)));
  }
}

/** Ícono del sprite: ico('i-conejo') */
export function ico(id, clase = "") {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", ("ico " + clase).trim());
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG, "use");
  use.setAttribute("href", "#" + id);
  svg.appendChild(use);
  return svg;
}

export const reducirMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const esperar = (ms) => new Promise((r) => setTimeout(r, reducirMovimiento() ? 0 : ms));

/** Diálogo de confirmación con dos botones. Esc o "no" devuelven false. */
export function confirmar({ titulo, texto, si, no }) {
  return new Promise((resolve) => {
    let resultado = false;
    const dlg = h(
      "dialog",
      { "aria-labelledby": "dlg-t" },
      h("h2", { id: "dlg-t" }, titulo),
      texto ? h("p", {}, texto) : null,
      h(
        "div",
        { class: "controles" },
        h("button", { class: "btn btn-primario", type: "button", on: { click: () => dlg.close() } }, no),
        h("button", { class: "btn", type: "button", on: { click: () => { resultado = true; dlg.close(); } } }, si)
      )
    );
    dlg.addEventListener("close", () => { dlg.remove(); resolve(resultado); });
    document.body.appendChild(dlg);
    dlg.showModal();
  });
}

// ---- Botón principal con destellos (adaptado de BOTON_ESTELIZADO, en la paleta coral de Brighter) ----
const CHISPAS = [
  "M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z",
  "M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z",
  "M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z",
];
const CHISPA_PARTICULA =
  "M6.937 3.846L7.75 1L8.563 3.846C8.77313 4.58114 9.1671 5.25062 9.70774 5.79126C10.2484 6.3319 10.9179 6.72587 11.653 6.936L14.5 7.75L11.654 8.563C10.9189 8.77313 10.2494 9.1671 9.70874 9.70774C9.1681 10.2484 8.77413 10.9179 8.564 11.653L7.75 14.5L6.937 11.654C6.72687 10.9189 6.3329 10.2494 5.79226 9.70874C5.25162 9.1681 4.58214 8.77413 3.847 8.564L1 7.75L3.846 6.937C4.58114 6.72687 5.25062 6.3329 5.79126 5.79226C6.3319 5.25162 6.72587 4.58214 6.936 3.847L6.937 3.846Z";

const aleatorio = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

function svgConTrazos(viewBox, clase, trazos) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("class", clase);
  svg.setAttribute("aria-hidden", "true");
  for (const d of trazos) {
    const p = document.createElementNS(SVG, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
  }
  return svg;
}

/** Botón principal con destellos. Devuelve { nodo, boton, txt }. Se activa y desactiva con boton.disabled. */
export function chispa(texto, { onClick, disabled = false, clase = "" } = {}) {
  const txt = h("span", { class: "chispa-txt" }, texto);
  const boton = h(
    "button",
    { class: "chispa-btn", type: "button", disabled, on: onClick ? { click: onClick } : {} },
    h("span", { class: "chispa-giro" }),
    h("span", { class: "chispa-fondo" }),
    svgConTrazos("0 0 24 24", "chispa-estrella", CHISPAS),
    txt
  );
  const particulas = h("span", { class: "chispa-particulas", "aria-hidden": "true" });
  for (let i = 0; i < 10; i++) {
    const p = svgConTrazos("0 0 15 15", "chispa-part", [CHISPA_PARTICULA]);
    const signo = () => (Math.random() > 0.5 ? -1 : 1);
    p.setAttribute(
      "style",
      `--x:${aleatorio(20, 80)};--y:${aleatorio(20, 80)};--duration:${aleatorio(6, 20)};--delay:${aleatorio(1, 10)};` +
        `--alpha:${aleatorio(40, 90) / 100};--origin-x:${signo() * aleatorio(300, 800)}%;--origin-y:${signo() * aleatorio(300, 800)}%;` +
        `--size:${aleatorio(40, 90) / 100}`
    );
    particulas.appendChild(p);
  }
  return { nodo: h("div", { class: ("chispa " + clase).trim() }, boton, particulas), boton, txt };
}
