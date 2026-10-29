# PROMPT · Sesión de LENGUAJE de Brighter Nexus

> Pégalo completo al inicio de un chat nuevo. Si la IA puede leer archivos, adjunta además la carpeta del proyecto (o al menos `docs/ARQUITECTURA.md`, `app/plantillas/`, `app/sesiones/` y `app/contenido/lenguaje/`).

---

## 1. Quién eres y qué vas a hacer

Eres un desarrollador front-end y diseñador instruccional. Vas a construir **la sesión de Lenguaje** de **Brighter Nexus**, una plataforma educativa offline para pantallas interactivas táctiles. La sesión se escribe en **HTML + CSS + JavaScript puro (módulos ES)**, sin librerías externas: el "framework" es el propio motor de Nexus (plantillas, rondas, puntaje y perfil que ya existen y se describen abajo). Debes entregar archivos que se copian al repositorio sin romper nada de lo que ya funciona.

## 2. Contexto del proyecto (léelo, es parte de algo grande)

- **Qué es Nexus:** una sola app con tres mundos (Matemática, Lenguaje, Ciencias) y tres herramientas (Pizarra, Biblioteca 3D, Mediateca). Comparte un solo motor: mismo puntaje, misma ayuda que se retira, mismo perfil de alumno, misma identidad visual.
- **Para quién:** la empresa Brighter Perú (distribuidor de pantallas interactivas BTOUCH) la ofrece en licitaciones a colegios. La usan **el profesor frente al grupo y los estudiantes tocando la pantalla**. Es para estudiantes en general: **no pongas etiquetas, botones ni textos de "primaria" o "secundaria"**, ni lenguaje infantilizado ni corporativo. Tono amable, claro y profesional.
- **Dónde corre:** Android 15 (APK, dentro de un WebView) y Windows 11 (Electron) y navegador. **Todo funciona sin internet**: nada de CDN, fuentes web, iframes externos ni peticiones de red.
- **Pantalla objetivo:** paneles táctiles grandes (hasta 4K). El diseño se hace para **1080 unidades en el lado corto de la pantalla** (1920×1080); la app escala todo por igual en pantallas mayores. Por eso: botones y zonas táctiles grandes (mínimo ~64 px de alto, mejor 72–96), texto legible a 3 metros (cuerpo ≥ 22 px, instrucciones ≥ 28 px), nada de elementos diminutos, nada que dependa de hover. Debe funcionar con varios dedos sin romperse (no asumas un solo puntero).
- **Idioma:** español neutro latinoamericano (Perú). Contenido **original** o libre de derechos; **no copies** textos de libros o sitios con copyright (ni de los temarios de Efecto Educativo ni de otros). Inventa textos propios.

## 3. Requisitos de las bases (lo que Lenguaje debe cumplir)

Las bases de la licitación exigen, para Lenguaje, estos **5 temas con estos nombres exactos**:

1. **El cuento**
2. **La noticia**
3. **La fábula**
4. **El periodismo**
5. **Expresar lo observado**

Además, el kit pide en total **10 actividades de matemática y lenguaje** (entre ambas materias), **manual de orientaciones pedagógicas** y manual de instalación. Tu parte: que cada tema tenga **3 unidades** con actividades interactivas táctiles (arrastrar, elegir, completar, ordenar, clasificar, emparejar), una **guía del docente** por unidad, y un contador visible de avance ("x de 15 unidades listas"). Si una unidad aún no tiene contenido, se muestra "Próximamente" (así la estructura se ve completa).

## 4. Estructura pedagógica a construir

```
LENGUAJE
 └─ Tema (los 5 de arriba)
     └─ Unidad (3 por tema)  → muestra objetivo + materiales
         └─ Clase de 4 pasos con barra de avance:
              Inicio → Aprende → Practica → Reflexiona      (+ botón "Guía del docente")
```

- **Inicio:** gancho breve (imagen, pregunta o mini-lectura) que activa saberes previos.
- **Aprende:** explicación corta y visual (≤ 60 palabras por pantalla, ejemplos concretos).
- **Practica:** la actividad interactiva (aquí corre la plantilla y se aplica el puntaje).
- **Reflexiona:** 1–2 preguntas de cierre ("¿qué aprendí?", "¿dónde lo uso?") y resumen de estrellas.
- **Guía del docente** (por unidad): objetivo, materiales, secuencia (inicio/desarrollo/cierre), errores frecuentes, cómo evaluar.

Mecánica de Lenguaje: **trabajar con textos** (ordenar partes de un cuento, identificar partes de una noticia, emparejar fábula con moraleja, clasificar hecho/opinión, describir una imagen). Sugerencia de unidades:

| Tema | U1 | U2 | U3 |
| --- | --- | --- | --- |
| El cuento | Inicio, nudo y desenlace | Personajes y lugar | Escribe el final |
| La noticia | Qué, quién, cuándo, dónde | Titular y partes de la noticia | Hecho u opinión |
| La fábula | Personajes y animales | Enseñanza (moraleja) | Cuenta una fábula |
| El periodismo | Qué hace un reportero | Preguntas de una entrevista | Fuentes confiables |
| Expresar lo observado | Observo con los sentidos | Describo con detalle | Cuento lo que vi |

(Puedes ajustar títulos; respeta los 5 temas y las 3 unidades.)

## 5. Estética (obligatoria)

Estilo **"origami luminoso"**, el mismo del menú y del quiz de Nexus:

- **Formas:** triángulos y facetas planas (low-poly) como adornos de fondo en las esquinas; sin degradados dentro de las formas. Paneles de **vidrio esmerilado** claro (fondo blanco translúcido ~64 %, borde blanco fino, sombra suave `0 12px 34px rgba(70,80,100,.16)`), botones grandes tipo **píldora**, esquinas de 26 px en tarjetas.
- **Fondo:** claro y luminoso (`radial-gradient(ellipse at 50% 38%, #F7F8FA, #ECEEF2 52%, #D9DDE3)`). Modo tutor (opcional): gris azulado oscuro (`#4C596F → #2B3445`) con paneles de vidrio oscuro.
- **Colores de marca (medidos del logo):** verde `#2CBB92`, coral `#FE5440`, naranja `#FE6D31`, ámbar `#F6952D`, rojo `#E72624`, rojo oscuro `#C9202E`. Texto `#282828`, texto suave `#6B7280`.
- **Acento de Lenguaje:** coral `#FE5440` (es el color de Lenguaje en el menú). **Cada tema usa un color distinto de la paleta** para diferenciarse (ej. cuento = coral, noticia = ámbar, fábula = verde, periodismo = naranja, expresar lo observado = rojo oscuro), con el **mismo estilo** en todos.
- **Tipografía:** **Poppins** (pesos 500/600/700/800), ya incluida en `app/quiz/fuentes/` (`poppins-latin-<peso>-normal.woff2`). Carga con `@font-face` relativo, nunca desde internet.
- **Íconos:** SVG en línea, trazo redondeado de 1.9, dentro de un **hexágono** de color (`clip-path: polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)`).
- **Movimiento:** suave y breve (150–600 ms, curva `cubic-bezier(.3,.8,.3,1)`), solo `transform` y `opacity` (nada que fuerce repintados). Respeta `prefers-reduced-motion`. **Sin parpadeos:** no animes `filter`, `backdrop-filter` ni `box-shadow` en bucle; precarga/decodifica imágenes antes de mostrarlas.
- **Consejero opcional:** el logo de pájaro origami puede aparecer unos segundos como guía y desvanecerse; no va fijo en el título ni en la esquina.
- Referencia completa: `docs/ESTETICA-BRIGHTER.txt`, `app/menu/tema.css`, `app/menu/menu.css`.

## 6. Cómo se integra (el framework de Nexus)

**Rutas (hash):** `#/sesion/lenguaje` (lista de temas) y `#/juego/lenguaje/<id>` (una actividad). Las dos las resuelve el enrutador existente; no inventes otro.

**Manifiesto de sesión** `app/sesiones/lenguaje/index.js` (ya existe, con 5 juegos):
```js
export default { id:'lenguaje', nombre:'Lenguaje', escena:'lenguaje', descripcion:'…',
  juegos:[ { id:'cuento', nombre:'El cuento', plantilla:'ordenar-secuencia', estado:'prototipo',
             color:'#FE5440', actividad:'lenguaje/cuento-ordenar.json' }, … ] };
```
Un juego se conecta de **dos maneras**:
- `actividad: 'lenguaje/archivo.json'` → lo corre `nucleo/ronda.js` con una plantilla (preferida para actividades simples).
- `cargar: () => import('./tema/index.js')` → trae su propio código (para clases de 4 pasos o pantallas con diseño propio, como hace `matematica/divisiones`).

**Plantillas** (`app/plantillas/`, contrato en `indice.js`): `export default { id, montar(zona, ejercicio, ctx) }`, puede devolver una función de limpieza. Listas: `elegir`, `completar`, `ordenar-secuencia`, `columnas`. **Pendientes que Lenguaje necesita y debes crear:** `emparejar`, `clasificar`, `observar-expresar` (pásalas a `estado:'listo'` en `indice.js`). Reutiliza `plantillas/comun.js` (`el`, `mezclar`, `ERRORES_PARA_REVELAR`).

Forma de los ejercicios (JSON en `app/contenido/lenguaje/`):
```js
{ id, nivel:'primaria', curso:'lenguaje', tema, modalidad:'actividad', plantilla, titulo,
  ejercicios:[ …datos de esa plantilla… ] }
elegir            → { pregunta, opciones, correcta, explicacion }
completar         → { texto:"…{}…", huecos, banco, explicacion }
ordenar-secuencia → { instruccion, items(en orden correcto), etiquetas?, explicacion }
```

**Resultado que cada ejercicio debe reportar** con `ctx.reportar(...)` (así se calculan estrellas y perfil):
```js
{ errores:0, ayuda:false, revelada:false, tiempo:{usado:20,limite:45}|null, pasos:[{tipo:'elegir', ok:true}] }
```
`revelada` = la plantilla tuvo que mostrar la solución (tras `ERRORES_PARA_REVELAR` errores); da 1 estrella.

**Puntaje (ya implementado, no lo reescribas):** 0 errores = 3 estrellas; 1–2 = 2; más = 1; con ayuda máx. 2; revelada = 1. Puntos con reloj, escalera de dificultad, focos (ayudas). El progreso se guarda en `perfil.juegos['lenguaje/<id>']` vía `nucleo/ronda.js` / `perfil.js` / `almacen.js`.

**Estilos:** las pantallas de sesión/juego usan `app/estilos/tema.css` + `base.css`. Si haces una pantalla con diseño propio (clase de 4 pasos), crea tu hoja de estilos aislada y regístrala como grupo en `nucleo/estilos-propios.js` (`GRUPOS` + `entrarPantallaPropia('grupo')`); prefija tus clases (ej. `.leng-…`) para no pisar `.tarjeta`, `.rejilla`, `.btn`, `.hex`. **CSP:** sin scripts ni estilos en línea no permitidos por `app/index.html`; revisa antes de usar `style=""` o `eval`.

## 7. Qué entregar

1. `app/sesiones/lenguaje/` — manifiesto actualizado + una carpeta por tema (`cuento/`, `noticia/`, `fabula/`, `periodismo/`, `expresar-observado/`) con su `index.js`, CSS propio y las 3 unidades (clase de 4 pasos).
2. `app/contenido/lenguaje/*.json` — actividades de práctica por unidad (mín. 5 ejercicios cada una, de dificultad creciente, con `explicacion` en cada uno).
3. `app/contenido/lenguaje/guias/*.json` o `.md` — guía del docente por unidad.
4. `app/plantillas/emparejar.js`, `clasificar.js`, `observar-expresar.js` + actualizar `indice.js`.
5. Ilustraciones **SVG propias** (sin copyright) o emojis solo como apoyo; imágenes pesadas en `app/sesiones/lenguaje/img/` optimizadas (≤ 200 KB c/u).
6. Una nota `docs/LENGUAJE.md` con: estructura, cómo agregar una unidad nueva, y el avance (unidades listas / total).

**No toques:** `nucleo/puntaje.js`, `perfil.js`, `almacen.js`, `enrutador.js`, el menú (`app/menu/`), el quiz, Matemática, Ciencias, Pizarra, Biblioteca 3D. **No hagas commits de Git.** Mantén los nombres de archivos y rutas en minúsculas sin tildes ni espacios.

## 8. Cómo comprobar tu trabajo

- Abre con el servidor local (`npm run servir` → `http://localhost:5173/#/sesion/lenguaje`) y recorre cada tema y unidad con el mouse **y** simulando toque.
- Comprueba a 1920×1080 y 3840×2160: nada debe verse diminuto ni desbordarse.
- Sin red: no debe haber ninguna petición externa (revisa la pestaña Red).
- `npm run prueba:prototipo` debe seguir pasando todas las comprobaciones (hoy 125/125); si agregas rutas o juegos, añade sus comprobaciones al final de `pruebas/probar-prototipo.mjs`.
- Accesibilidad básica: foco visible, `aria-label` en botones de ícono, contraste AA, no usar solo el color para indicar acierto/error (agrega ícono o texto).

## 9. Forma de trabajar

Trabaja **por etapas** y no avances sin que la anterior funcione: (1) las 3 plantillas nuevas con un ejemplo cada una; (2) el tema **El cuento** completo (modelo para los demás); (3) los otros cuatro temas; (4) guías del docente y nota final. Al terminar cada etapa, resume en 3 líneas qué quedó listo y qué falta. Si algo del contrato de este prompt contradice el código real del repositorio, **gana el código**: avísalo y adáptate.
