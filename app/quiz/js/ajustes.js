// Diálogo de configuración: consejero, volumen, música (pronto) y cantidad de vidas.
import { h } from "./ui.js";
import { config, consejosVistos } from "./nucleo/config.js";
import { sonido } from "./nucleo/sonido.js";

function interruptor(valor, alCambiar, { desactivado = false, etiqueta } = {}) {
  const b = h("button", { class: "interruptor", type: "button", role: "switch", "aria-checked": String(valor), "aria-label": etiqueta, disabled: desactivado }, h("span", { class: "perilla" }));
  b.addEventListener("click", () => {
    const nuevo = b.getAttribute("aria-checked") !== "true";
    b.setAttribute("aria-checked", String(nuevo));
    alCambiar(nuevo);
  });
  return b;
}

function fila(titulo, descripcion, control, extra) {
  return h("div", { class: "ajuste" }, h("div", { class: "ajuste-txt" }, h("b", {}, titulo), descripcion ? h("span", {}, descripcion) : null, extra), control);
}

export function aplicarConfig() {
  sonido.volumen = config.obtener("volumen") / 100;
}

export function abrirAjustes({ consejero } = {}) {
  const dlg = h("dialog", { class: "ajustes", "aria-labelledby": "dlg-ajustes" });

  const swConsejero = interruptor(config.obtener("consejero"), (v) => {
    config.poner("consejero", v);
    if (v && consejero) consejero.decir({ titulo: "¡Hola!", texto: "Aquí estaré para darte consejos.", ms: 3200, siempre: true });
  }, { etiqueta: "Consejero" });

  const num = h("output", { class: "valor" }, `${config.obtener("volumen")}%`);
  const rango = h("input", { class: "rango", type: "range", min: "0", max: "100", step: "5", value: String(config.obtener("volumen")), "aria-label": "Volumen" });
  rango.addEventListener("input", () => {
    config.poner("volumen", rango.value);
    num.textContent = `${config.obtener("volumen")}%`;
    rango.style.setProperty("--p", rango.value + "%");
  });
  rango.addEventListener("change", () => sonido.toque());
  rango.style.setProperty("--p", rango.value + "%");

  const [vMin, vMax] = config.limites.vidas;
  const vidasNum = h("output", { class: "valor grande" }, String(config.obtener("vidas")));
  const menos = h("button", { class: "ico-btn mini", type: "button", "aria-label": "Una vida menos" }, "−");
  const mas = h("button", { class: "ico-btn mini", type: "button", "aria-label": "Una vida más" }, "+");
  const pintarVidas = () => {
    const v = config.obtener("vidas");
    vidasNum.textContent = String(v);
    menos.disabled = v <= vMin;
    mas.disabled = v >= vMax;
  };
  menos.addEventListener("click", () => { config.poner("vidas", config.obtener("vidas") - 1); pintarVidas(); sonido.toque(); });
  mas.addEventListener("click", () => { config.poner("vidas", config.obtener("vidas") + 1); pintarVidas(); sonido.toque(); });
  pintarVidas();

  const repetir = h("button", { class: "btn", type: "button", on: { click: () => { consejosVistos.reiniciar(); repetir.textContent = "Listo: los verás otra vez"; } } }, "Ver consejos otra vez");

  dlg.append(
    h("h2", { id: "dlg-ajustes" }, "Configuración"),
    h("div", { class: "ajustes-lista" },
      fila("Consejero", "Un ave que aparece unos segundos para explicarte los botones.", swConsejero),
      fila("Volumen", null, h("div", { class: "rango-caja" }, rango, num)),
      fila("Música", "Llegará pronto.", interruptor(false, () => {}, { desactivado: true, etiqueta: "Música" })),
      fila("Vidas por partida", "Se aplican desde la próxima partida. En modo tutor son infinitas.", h("div", { class: "paso" }, menos, vidasNum, mas))
    ),
    h("div", { class: "controles" }, repetir, h("button", { class: "btn btn-primario", type: "button", on: { click: () => dlg.close() } }, "Listo"))
  );
  dlg.addEventListener("close", () => dlg.remove());
  document.body.appendChild(dlg);
  dlg.showModal();
}

// Volumen guardado desde el arranque
aplicarConfig();
document.addEventListener("nexus:config", (e) => { if (e.detail.clave === "volumen") aplicarConfig(); });
