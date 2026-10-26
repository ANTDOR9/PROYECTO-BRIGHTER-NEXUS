// Biblioteca 3D: catálogo con miniaturas, visor a pantalla completa y créditos.
//
//  • Catálogo ......... #/modulo/biblioteca3d        (este módulo: tarjetas con foto, filtro por tema y buscador)
//  • Visor ............ #/biblioteca3d/ver/:id       (el visor propio de cada modelo, en un marco a pantalla completa)
//  • Créditos ......... #/biblioteca3d/creditos      (autor, licencia y cambios de cada modelo)
//
// Los modelos descargados los prepara `npm run modelos` (ver herramientas/modelos.js) y quedan en
// contenido/modelos3d/. El catálogo se lee de contenido/modelos3d/catalogo.json: para agregar un modelo
// NO hay que tocar este archivo. Los modelos armados en código (sistema solar, cubo) están en modelos.js.
import { MODELOS } from './modelos.js';
import { montarVisorCodigo } from './visor-codigo.js';
import { aplicarEscena } from '../../nucleo/fondo.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const el = (tag, clase, texto) => {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
};

const DIMENSION = {
  vida: { nombre: 'Ciencias de la vida', color: 'var(--lima)', icono: '🧬' },
  'fisica-quimica': { nombre: 'Física y química', color: 'var(--naranja)', icono: '⚗️' },
  'tierra-universo': { nombre: 'Tierra y universo', color: 'var(--violeta)', icono: '🌍' },
  matematica: { nombre: 'Matemática', color: 'var(--cian)', icono: '📐' },
  'sin-clasificar': { nombre: 'Sin clasificar', color: 'var(--suave)', icono: '🧊' }
};
// Modelos armados en código que se esconden cuando ya existe uno real equivalente
const REEMPLAZADO_POR = { corazon: 'corazon-humano' };

// ───────────── datos ─────────────

let cache = null;
export async function cargarCatalogo() {
  if (cache) return cache;
  let reales = [], modo = 'desarrollo';
  try {
    const r = await fetch('contenido/modelos3d/catalogo.json');
    if (r.ok) { const j = await r.json(); reales = j.modelos || []; modo = j.modo || 'desarrollo'; }
  } catch (e) { /* sin catálogo: solo se ven los modelos armados en código */ }
  const ids = new Set(reales.map(m => m.id));
  const items = reales.map(m => ({
    id: m.id, tipo: 'html', titulo: m.titulo, dimension: DIMENSION[m.dimension] ? m.dimension : 'sin-clasificar',
    nivel: [].concat(m.nivel || []),
    descripcion: m.descripcion || (m.partes && m.partes.length ? `${m.partes.length} partes para explorar` : `${m.paginasInfo || 0} páginas de información`),
    miniatura: m.archivos && m.archivos.miniatura ? `contenido/modelos3d/${m.archivos.miniatura}` : null,
    licencia: m.licencia, credito: m.credito, partes: m.partes || []
  }));
  MODELOS.filter(m => !(REEMPLAZADO_POR[m.id] && ids.has(REEMPLAZADO_POR[m.id]))).forEach(m => items.push({
    id: m.id, tipo: 'codigo', titulo: m.nombre, dimension: m.dimension || 'matematica', nivel: [m.nivel],
    descripcion: m.descripcion, miniatura: null, licencia: null, credito: null, partes: []
  }));
  // Dos modelos con el mismo nombre (de autores distintos) se distinguen por el autor
  const repetidos = new Map();
  items.forEach(m => repetidos.set(m.titulo, (repetidos.get(m.titulo) || 0) + 1));
  items.forEach(m => { if (repetidos.get(m.titulo) > 1 && m.credito && m.credito.autor) m.descripcion += ` · de ${m.credito.autor}`; });
  cache = { items, modo };
  return cache;
}

const CLAVE_CALIDAD = 'brighterNexus.calidad3d';
const calidad = () => { try { return localStorage.getItem(CLAVE_CALIDAD) || 'auto'; } catch (e) { return 'auto'; } };
const guardarCalidad = v => { try { localStorage.setItem(CLAVE_CALIDAD, v); } catch (e) { /* se queda en automática */ } };

// Los filtros se recuerdan al volver del visor
const filtros = { dimension: 'todas', texto: '' };

// ───────────── catálogo ─────────────

function insigniaLicencia(m, modo) {
  if (!m.licencia || modo === 'licitacion') return '';
  if (m.licencia.estado === 'excluir') return '<em class="insignia alerta" title="' + esc(m.licencia.motivo) + '">⚠ No apto licitación</em>';
  if (m.licencia.estado === 'revisar') return '<em class="insignia revisar" title="' + esc(m.licencia.motivo) + '">Revisar licencia</em>';
  return '';
}

function tarjetaModelo(m) {
  const d = DIMENSION[m.dimension] || DIMENSION['sin-clasificar'];
  const foto = m.miniatura
    ? `<img src="${esc(m.miniatura)}" alt="" loading="lazy" decoding="async">`
    : `<span class="mc-icono" aria-hidden="true">${d.icono}</span>`;
  return `<a class="modelo-card" href="#/biblioteca3d/ver/${encodeURIComponent(m.id)}" style="--c:${d.color}">
    <div class="mc-foto">${foto}</div>
    <div class="mc-cuerpo"><b>${esc(m.titulo)}</b><span>${esc(m.descripcion)}</span></div></a>`;
}

export default {
  id: 'biblioteca3d',
  nombre: 'Biblioteca 3D',
  escena: 'biblioteca3d',
  descripcion: 'Modelos 3D para explorar: girar, acercar y conocer sus partes.',
  estado: 'prototipo',
  compacto: true,

  montar(zona) {
    let vivo = true;
    const raiz = el('div', 'bib');
    raiz.innerHTML = '<p class="lead">Cargando la biblioteca…</p>';
    zona.appendChild(raiz);

    cargarCatalogo().then(({ items, modo }) => {
      if (!vivo) return;
      const dims = [...new Set(items.map(m => m.dimension))];
      raiz.innerHTML = `
        <div class="bib-filtros">
          <div class="chips" data-g="dimension" role="group" aria-label="Tema"></div>
          <input class="bib-buscar" type="search" placeholder="🔍  Buscar modelo…" aria-label="Buscar modelo" autocomplete="off">
        </div>
        <div class="rejilla bib-rejilla"></div>
        <p class="bib-vacio" hidden>No hay modelos con esos filtros.</p>
        <div class="bib-pie">
          <details class="bib-ajustes">
            <summary>Ajustes de rendimiento</summary>
            <p class="bib-ayuda">Si los modelos tardan en abrir, elige «Ligera».</p>
            <div class="chips" data-g="calidad" role="group" aria-label="Calidad de los modelos"></div>
          </details>
          <a class="bib-creditos" href="#/biblioteca3d/creditos">Créditos y licencias</a>
        </div>`;
      const g = nombre => raiz.querySelector(`[data-g="${nombre}"]`);
      const opciones = {
        dimension: [['todas', 'Todos'], ...dims.map(d => [d, (DIMENSION[d] || DIMENSION['sin-clasificar']).nombre])],
        calidad: [['auto', 'Automática'], ['alta', 'Alta'], ['ligera', 'Ligera']]
      };
      const buscar = raiz.querySelector('.bib-buscar');
      buscar.value = filtros.texto;

      function pintarChips() {
        for (const [grupo, lista] of Object.entries(opciones)) {
          const actual = grupo === 'calidad' ? calidad() : filtros[grupo];
          g(grupo).replaceChildren(...lista.map(([v, t]) => {
            const c = el('button', 'chip' + (v === actual ? ' activa' : ''), t);
            c.type = 'button';
            c.addEventListener('click', () => {
              if (grupo === 'calidad') guardarCalidad(v); else filtros[grupo] = v;
              pintarChips(); pintarRejilla();
            });
            return c;
          }));
        }
      }
      function pintarRejilla() {
        const t = filtros.texto.trim().toLowerCase();
        const lista = items.filter(m =>
          (filtros.dimension === 'todas' || m.dimension === filtros.dimension) &&
          (!t || (m.titulo + ' ' + m.partes.join(' ')).toLowerCase().includes(t)));
        raiz.querySelector('.bib-rejilla').innerHTML = lista.map(tarjetaModelo).join('');
        raiz.querySelector('.bib-vacio').hidden = lista.length > 0;
      }
      buscar.addEventListener('input', () => { filtros.texto = buscar.value; pintarRejilla(); });
      pintarChips();
      pintarRejilla();
    });

    return () => { vivo = false; };
  }
};

// ───────────── visor a pantalla completa ─────────────

export async function pantallaVisor({ id }, cont) {
  aplicarEscena('biblioteca3d');
  const { items } = await cargarCatalogo();
  const m = items.find(x => x.id === id);
  if (!m) { location.hash = '#/modulo/biblioteca3d'; return; }

  if (m.tipo === 'codigo') {
    cont.innerHTML = `<div class="cab-compacta"><a class="volver" href="#/modulo/biblioteca3d">← Biblioteca</a><h1>${esc(m.titulo)}</h1></div>`;
    const zona = document.createElement('div');
    cont.appendChild(zona);
    return montarVisorCodigo(zona, id);
  }

  // Modelo descargado: su visor se muestra tal cual, a pantalla completa, y Nexus solo pone el botón de volver
  document.body.classList.add('en-visor3d');
  const marco = document.createElement('iframe');
  marco.className = 'visor3d-marco';
  marco.title = m.titulo;
  marco.src = `contenido/modelos3d/${encodeURIComponent(m.id)}/index.html?calidad=${calidad()}`;
  const volver = el('a', 'visor3d-volver', '← Biblioteca');
  volver.href = '#/modulo/biblioteca3d';
  cont.append(marco, volver);
  return () => {
    document.body.classList.remove('en-visor3d');
    try { marco.src = 'about:blank'; } catch (e) { /* ya cerrado */ }   // libera la memoria de video del modelo
    marco.remove();
  };
}

// ───────────── créditos ─────────────

export async function pantallaCreditos(_p, cont) {
  aplicarEscena('biblioteca3d');
  const { items, modo } = await cargarCatalogo();
  const reales = items.filter(m => m.tipo === 'html');
  const enlace = (url, texto) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(texto || url)}</a>` : esc(texto || '');
  cont.innerHTML = `
    <p class="migas"><a href="#/modulo/biblioteca3d">← Biblioteca 3D</a></p>
    <h1>Créditos y licencias</h1>
    <p class="lead">Los modelos 3D de esta biblioteca son obra de sus autores y se usan según la licencia que cada uno eligió.</p>
    <div class="creditos-lista">${reales.length ? reales.map(m => `
      <article class="credito">
        <h3>${esc(m.credito.titulo || m.titulo)} ${insigniaLicencia(m, modo)}</h3>
        <p>Autor: <b>${enlace(m.credito.autorUrl, m.credito.autor)}</b></p>
        <p>Licencia: ${enlace(m.licencia.url, m.licencia.texto || m.licencia.codigo)}</p>
        <p>Fuente: ${enlace(m.credito.fuente)}</p>
        ${m.credito.cambios ? `<p>Cambios hechos para esta app: ${esc(m.credito.cambios)}</p>` : ''}
        ${m.credito.atribucion ? `<p class="credito-atrib">${esc(m.credito.atribucion)}</p>` : ''}
      </article>`).join('') : '<p class="lead">Todavía no hay modelos descargados.</p>'}
      <article class="credito">
        <h3>Programas incluidos</h3>
        <p>three.js (licencia MIT) · meshoptimizer (licencia MIT, Arseny Kapoulkine).</p>
        <p>El sistema solar y el cubo fueron creados por Brighter Perú S.A.C. para Nexus.</p>
      </article>
    </div>`;
}
