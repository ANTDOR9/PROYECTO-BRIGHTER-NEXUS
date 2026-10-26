// Visor de los modelos 3D que se arman en código (sistema solar, cubo…): girar con un dedo, acercar con dos,
// tocar una parte para ver su nombre. Three.js está incluido en app/bibliotecas/ (funciona sin internet).
// Los modelos están en modelos.js. Los modelos descargados (GLB) NO pasan por aquí: tienen su propio visor
// (contenido/modelos3d/<id>/index.html) y se muestran desde index.js.
import { MODELOS } from './modelos.js';

const el = (tag, clase, texto) => {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
};

export function montarVisorCodigo(zona, idModelo) {
    let vivo = true;
    let limpiar = () => {};

    const raiz = el('div', 'visor solo');
    const escena = el('div', 'visor-escena');
    const lienzo = el('div', 'visor-lienzo');
    const info = el('div', 'visor-info');
    const herramientas = el('div', 'visor-herr');
    escena.append(lienzo, herramientas, info);
    raiz.append(escena);
    zona.appendChild(raiz);
    info.textContent = 'Cargando el visor 3D…';

    (async () => {
      const THREE = await import('../../bibliotecas/three.module.min.js');
      const { OrbitControls } = await import('../../bibliotecas/OrbitControls.js');
      if (!vivo) return;
      limpiar = iniciar(THREE, OrbitControls);
    })().catch(e => {
      console.error(e);
      info.textContent = 'No se pudo cargar el visor 3D en este equipo.';
    });

    function iniciar(THREE, OrbitControls) {
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch (e) {
        info.textContent = 'Este equipo no permite gráficos 3D (WebGL).';
        return () => {};
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      lienzo.appendChild(renderer.domElement);

      const camara = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
      const controles = new OrbitControls(camara, renderer.domElement);
      controles.enableDamping = true;
      controles.dampingFactor = 0.08;
      controles.autoRotateSpeed = 1.6;

      const escenaTHREE = new THREE.Scene();
      const ambiente = new THREE.AmbientLight(0xFFFFFF, 0.8);
      const direccional = new THREE.DirectionalLight(0xFFFFFF, 1.5);
      direccional.position.set(4, 6, 5);
      escenaTHREE.add(ambiente, direccional);

      let modelo = null, elegida = null, camaraInicial = null;
      let cuadro = 0, ultimo = performance.now();
      const raycaster = new THREE.Raycaster();
      const puntero = new THREE.Vector2();

      // ----- herramientas del visor -----
      const bGirar = el('button', 'herr', null);
      bGirar.type = 'button';
      bGirar.innerHTML = '<span class="ico">⟳</span><small>Girar solo</small>';
      bGirar.addEventListener('click', () => {
        controles.autoRotate = !controles.autoRotate;
        bGirar.classList.toggle('activa', controles.autoRotate);
      });
      const bVista = el('button', 'herr');
      bVista.type = 'button';
      bVista.innerHTML = '<span class="ico">⌂</span><small>Vista inicial</small>';
      bVista.addEventListener('click', () => { if (camaraInicial) ponerCamara(camaraInicial); });
      herramientas.append(bGirar, bVista);

      function ponerCamara(c) {
        camara.position.set(...c.pos);
        controles.target.set(0, 0, 0);
        controles.minDistance = c.dist[0];
        controles.maxDistance = c.dist[1];
        controles.update();
      }

      // ----- resaltar partes -----
      function marcar(parte, encendido) {
        parte.objetos.forEach(o => {
          const mt = o.material;
          if (!mt || !mt.emissive) return;
          if (!mt.userData.base) mt.userData.base = { color: mt.emissive.clone(), fuerza: mt.emissiveIntensity };
          if (encendido) { mt.emissive.setHex(0xFFFFFF); mt.emissiveIntensity = 0.55; }
          else { mt.emissive.copy(mt.userData.base.color); mt.emissiveIntensity = mt.userData.base.fuerza; }
        });
      }
      function elegir(parte) {
        if (elegida) marcar(elegida, false);
        elegida = elegida === parte ? null : parte;
        if (elegida) marcar(elegida, true);
        pintarInfo();
      }
      function pintarInfo() {
        info.innerHTML = '';
        // El bloque de texto siempre ocupa el mismo alto: así el modelo no cambia de tamaño al elegir una parte
        const texto = el('div', 'info-texto');
        if (elegida) {
          texto.append(el('b', 'info-nombre', elegida.nombre), el('p', null, elegida.texto));
        } else {
          texto.append(el('b', 'info-nombre info-ayuda', modelo.nombre), el('p', 'info-ayuda', 'Toca una parte para conocerla. Gira con un dedo y acerca con dos.'));
        }
        info.appendChild(texto);
        const chips = el('div', 'chips');
        modelo.partes.forEach(p => {
          const c = el('button', 'chip' + (p === elegida ? ' activa' : ''), p.nombre);
          c.type = 'button';
          c.addEventListener('click', () => elegir(p));
          chips.appendChild(c);
        });
        info.appendChild(chips);
        if (modelo.nota) info.appendChild(el('small', 'info-nota', modelo.nota));
      }

      // ----- cargar y descartar modelos -----
      function descartar() {
        if (!modelo) return;
        escenaTHREE.remove(modelo.grupo);
        modelo.grupo.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        });
        modelo = null; elegida = null;
      }
      function cargar(def) {
        descartar();
        modelo = def.crear(THREE);
        modelo.nombre = def.nombre;
        escenaTHREE.add(modelo.grupo);
        // Si el modelo trae su propia luz (el Sol), se baja la luz de ambiente y se quita la direccional
        direccional.visible = modelo.luces !== 'sol';
        ambiente.intensity = modelo.luces === 'sol' ? 0.35 : 0.8;
        camaraInicial = modelo.camara;
        ponerCamara(camaraInicial);
        pintarInfo();
      }

      // ----- tocar una parte (se distingue del arrastre para girar) -----
      let inicio = null;
      const lienzoPantalla = renderer.domElement;
      lienzoPantalla.addEventListener('pointerdown', e => { inicio = { x: e.clientX, y: e.clientY, t: performance.now() }; });
      lienzoPantalla.addEventListener('pointerup', e => {
        if (!inicio || !modelo) return;
        const toque = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 8 && performance.now() - inicio.t < 500;
        inicio = null;
        if (!toque) return;
        const r = lienzoPantalla.getBoundingClientRect();
        puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(puntero, camara);
        const blancos = [];
        modelo.partes.forEach(p => blancos.push(...p.pick));
        const hit = raycaster.intersectObjects(blancos, false)[0];
        if (hit && hit.object.userData.parte) elegir(hit.object.userData.parte);
        else if (elegida) elegir(elegida); // tocar el vacío quita la selección
      });

      // ----- tamaño y animación -----
      function ajustar() {
        const w = lienzo.clientWidth, h = lienzo.clientHeight;
        if (w < 2 || h < 2) return;
        renderer.setSize(w, h, false);
        lienzoPantalla.style.width = w + 'px';
        lienzoPantalla.style.height = h + 'px';
        camara.aspect = w / h;
        camara.updateProjectionMatrix();
        // Cambiar el tamaño borra el lienzo: se vuelve a dibujar de inmediato para que no parpadee
        if (modelo) renderer.render(escenaTHREE, camara);
      }
      const observador = new ResizeObserver(ajustar);
      observador.observe(lienzo);
      ajustar();

      function bucle(ahora) {
        cuadro = requestAnimationFrame(bucle);
        const dt = Math.min(0.1, (ahora - ultimo) / 1000);
        ultimo = ahora;
        if (modelo && modelo.animar) modelo.animar(dt);
        controles.update();
        renderer.render(escenaTHREE, camara);
      }
      cuadro = requestAnimationFrame(bucle);

      cargar(MODELOS.find(m => m.id === idModelo) || MODELOS[0]);

      return () => {
        cancelAnimationFrame(cuadro);
        observador.disconnect();
        controles.dispose();
        descartar();
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      };
    }

    return () => { vivo = false; limpiar(); };
}
