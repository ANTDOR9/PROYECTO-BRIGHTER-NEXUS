/* BRIGHTER NEXUS · cargando.js
   Pantalla de carga: el logo con un anillo de colores. Espera unos segundos (para que se vea la animación)
   y pasa al menú. Reemplaza al marco "espacio reservado" de la intro; si en contenido/intro.json hay un video o una
   imagen, se sigue usando la intro de nucleo/intro.js.

   pantallaCargando(destino) → función (params, contenedor) para el enrutador. */
const BASE = new URL('./', import.meta.url).href;

export function montarCargando(raiz, { alTerminar, minimo = 2600 }) {
  const body = document.body;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const espera = reducido ? 900 : minimo;
  let tutor = false;
  try { tutor = localStorage.getItem('nexus-modo') === 'tutor'; } catch (e) { /* modo estudiante */ }
  body.classList.toggle('tutor', tutor);

  raiz.innerHTML = `
    <div class="fondo-tutor" aria-hidden="true"></div>
    <div class="pagina" role="status" aria-live="polite" aria-label="Cargando Brighter Nexus">
      <div class="escena">
        <a class="centro" href="#/" aria-label="Entrar">
          <span class="anillo" aria-hidden="true"></span>
          <img src="${BASE}brighter-nexus.png" alt="Brighter Nexus">
        </a>
      </div>
    </div>`;
  const centro = raiz.querySelector('.centro');
  const img = centro.querySelector('img');

  let vivo = true;
  const temporizadores = [];
  const t0 = performance.now();
  // Tocar el logo salta la espera
  centro.addEventListener('click', e => { e.preventDefault(); terminar(0); });

  const cargada = new Promise(ok => {
    if (img.complete) ok();
    else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', ok, { once: true }); }
  });
  cargada.then(() => terminar(Math.max(0, espera - (performance.now() - t0))));

  let pendiente = null, saliendo = false;
  function terminar(falta) {
    if (saliendo || !vivo) return;
    clearTimeout(pendiente);
    pendiente = setTimeout(() => {
      saliendo = true;
      body.classList.add('salida');              // el anillo se desvanece
      temporizadores.push(setTimeout(() => { if (vivo) alTerminar(); }, 450));
    }, falta);
    temporizadores.push(pendiente);
  }

  return () => {
    vivo = false;
    temporizadores.forEach(clearTimeout);
    body.classList.remove('salida');
  };
}
