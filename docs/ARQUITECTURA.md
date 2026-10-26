# Brighter Nexus · Arquitectura

## Idea central

Una app, tres mundos (números, letras, ciencia) más tres herramientas (pizarra, biblioteca 3D, mediateca).
Todo comparte **un solo motor**: el mismo puntaje, la misma ayuda que se retira, el mismo perfil de alumno y la misma identidad visual. Lo único que cambia entre actividades es el contenido y la plantilla.

## Mapa de carpetas

```
brighter-nexus/
├─ app/
│  ├─ index.html · icono.svg
│  ├─ estilos/            tema.css (colores y fondos por sesión) · base.css · modulos.css
│  ├─ nucleo/             lo que usan TODAS las sesiones
│  │   ├─ app.js          arranque, rutas, perfil activo
│  │   ├─ enrutador.js    navegación por #/ruta (cada pantalla recibe su propio contenedor)
│  │   ├─ registro.js     sesiones y módulos registrados
│  │   ├─ intro.js        intro de inicio (espacio reservado, configurable en contenido/intro.json)
│  │   ├─ ronda.js        corre una actividad de varios ejercicios con CUALQUIER plantilla y aplica el puntaje
│  │   ├─ aviso.js        avisos cortos (medallas)
│  │   ├─ pantallas.js    inicio, sesión, juego, módulo
│  │   ├─ puntaje.js      estrellas, puntos con reloj, escalera, focos, nivel recomendado
│  │   ├─ ayuda.js        pistas que se retiran por tipo de paso
│  │   ├─ perfil.js       alumno y progreso por juego
│  │   ├─ almacen.js      guardado local + copia de seguridad
│  │   ├─ medallas.js     medallas comunes y por juego
│  │   ├─ fondo.js        escenas de fondo (cambian al entrar a una sesión)
│  │   ├─ logo.js         logo Nexus (SVG)
│  │   └─ contexto.js     perfil activo
│  ├─ plantillas/         formas reutilizables de actividad: elegir · completar · ordenar-secuencia (listas);
│  │                      las demás están pendientes (ver indice.js)
│  ├─ bibliotecas/        Three.js y OrbitControls incluidos (el visor 3D funciona sin internet)
│  ├─ sesiones/           matematica/ · lenguaje/ · ciencias/  (cada una con su manifiesto)
│  │   └─ matematica/divisiones/   primer juego a migrar desde el repositorio de divisiones
│  ├─ modulos/            pizarra/ · biblioteca3d/ (catálogo, visor, créditos) · mediateca/
│  └─ contenido/          datos: actividades (JSON), intro.json, requisitos de las bases y modelos3d/ (lo genera `npm run modelos`)
├─ herramientas/          servir.js · verificar-kit.js · modelos.js (prepara los modelos 3D)
├─ modelos-entrada/       (no se sube) aquí se dejan los visores .html nuevos antes de procesarlos
├─ pruebas/               probar-puntaje.js · probar-modelos.js · probar-prototipo.mjs (navegador real) · medir-modelos.mjs
└─ docs/
```

## Flujo de una actividad

```
manifiesto de sesión ──► ruta #/juego/:sesion/:juego ──► ronda.js (lee el JSON de la actividad)
                                                              │  por cada ejercicio:
                                                              ▼
                                          plantilla.montar(contenedor, ejercicio, ctx)
                                                              │
                                              ctx.reportar(resultado)
                                                              ▼
                                   puntaje.estrellasDe ─► perfil.terminarEjercicio ─► almacen.guardar
```

## Contratos

**Resultado** (lo que entrega cualquier actividad al terminar un ejercicio):

```js
{ errores: 0, ayuda: false, revelada: false,
  tiempo: { usado: 20, limite: 45 } | null,
  pasos: [{ tipo: 'elegir', ok: true }] }
```

`revelada` = el juego tuvo que mostrar la solución (en divisiones: al 4.º error). Da 1 estrella.

**Actividad** (un JSON en `app/contenido/`). Una actividad es una ronda de varios ejercicios con la misma plantilla:

```js
{ id, nivel: 'primaria'|'secundaria', curso: 'matematica'|'lenguaje'|'ciencias',
  tema, dimension?, modalidad: 'actividad'|'clase-juego', plantilla, titulo,
  ejercicios: [ { ...datos que pide esa plantilla } ] }
```

Cada plantilla define la forma de sus ejercicios (ver el comentario al inicio de su archivo):
`elegir` → `{pregunta, opciones, correcta, explicacion}` ·
`completar` → `{texto: "6 × {} = {}", huecos, banco, explicacion}` ·
`ordenar-secuencia` → `{instruccion, items (en orden correcto), etiquetas?, explicacion}`.

Un juego de sesión se conecta a su actividad con `actividad: 'matematica/archivo.json'` en el manifiesto,
o trae su propio código con `cargar: () => import(...)` (como divisiones).

**Manifiesto de sesión** (`app/sesiones/<id>/index.js`): `id, nombre, escena, descripcion, juegos[]`.
Cada juego: `id, nombre, plantilla, estado ('pendiente'|'por-migrar'|'listo'), cargar?()`.

## Puntaje común (heredado de divisiones, ya sin nada de divisiones)

| Pieza | Regla |
| --- | --- |
| Estrellas | 0 errores = 3 · 1-2 errores = 2 · más = 1 · con ayuda máx. 2 · revelada = 1 |
| Puntos con reloj | 10 × tramo de 3 niveles + segundos sobrantes (la mitad si hubo errores) |
| Escalera | sube con 2 buenas seguidas · baja con 2 malas seguidas · baja ya si fue revelada |
| Focos | se gastan al pedir ayuda · se recuperan cada N ejercicios seguidos sin ayuda |
| Nivel recomendado | sube con ≥75 % sin errores · baja con muchas reveladas (≥30 %) o <50 % de estrellas |

Cada juego puede cambiar los números pasando sus propias `reglas`.
Los tipos de paso (`tipos`) los define cada juego: en divisiones serán `cabe, mult, restar, bajar`; en una actividad simple basta `elegir`.

## Identidad y fondo

- Lenguaje visual heredado de divisiones: neón sobre azul petróleo oscuro, botones grandes, símbolos flotando.
- Nexus = punto donde se conectan tres mundos. Logo: un nodo central (amarillo) con tres satélites: **cian** (matemática), **rosa** (lenguaje), **lima** (ciencias).
- Cada sesión tiene su acento y su fondo: `fondo.aplicarEscena('matematica')` cambia degradado, color de acento y símbolos con un fundido de ~1 s. Las escenas se definen en `fondo.js` y los colores en `tema.css`.
- Escenas actuales: inicio, matematica, lenguaje, ciencias, biblioteca3d, pizarra, mediateca.

## Qué tomar del repositorio de divisiones

| Archivo origen | Destino en Nexus |
| --- | --- |
| `aprendizaje.js` (estrellas, reloj, focos, ayuda, nivel recomendado) | ya generalizado en `nucleo/puntaje.js`, `ayuda.js`, `perfil.js` |
| `aprendizaje.js` (GENERAR, ESCALONES, tipos de paso, tablas) | `sesiones/matematica/divisiones/` |
| `division.js`, `pistas.js` | `sesiones/matematica/divisiones/` |
| `almacen.js` | generalizado en `nucleo/almacen.js` |
| `aplicacion.js` | se reparte: pantallas comunes → `nucleo/pantallas.js`; tablero de galera → `divisiones/` |
| `informe.js` (PDF para padres) | más adelante, como módulo común |
| `estilos.css`, `fuentes.css`, `sonidos.js` | `estilos/` y `nucleo/` cuando se migren |

Al migrar se quitan los campos de autor y licencia del código de origen.

## Orden de construcción

1. **Núcleo** (hecho en este esqueleto): puntaje, perfil, almacén, fondo, rutas, 1 plantilla de ejemplo.
2. **Prototipo para BTOUCH** (según el informe): pizarra básica, 1 actividad de matemática, 1 de lenguaje y 1 de ciencias, visor 3D con 3 modelos. Probar en pantalla.
3. **Migrar divisiones** como primer juego de matemática.
4. **Plantillas** una por una: elegir → completar → clasificar → emparejar → ordenar → etiquetar → manipulativo → simulación → clase-juego → observar y expresar.
5. **Contenido**: llenar `app/contenido/` hasta cumplir `kit-requisitos.json` (se mide con `npm run kit`).
6. **Empaquetado**: Windows (Electron) y Android (Capacitor), como en divisiones.

## Decisiones abiertas

- **Multitáctil y equipos:** el motor actual es de un alumno por vez. Las clases-juego por equipos necesitan un perfil de equipo.
- **Visor 3D:** resuelto con visores por modelo (ver «Biblioteca 3D y modelos»). Falta probar en una BTOUCH real y definir si algún día se unifican en un solo visor compartido.
- **Mínimos de las bases:** los números en `kit-requisitos.json` vienen del informe técnico. Confirmar con las bases originales.
- **Fuentes y sonidos:** reusar los de divisiones o definir nuevos para Nexus.

## Prototipo v0.3: lo que hay y cómo se probó

- **Intro:** al abrir la app se ve una vez por sesión. Hoy es un marco 16:9 con el logo y la etiqueta "Espacio reservado para la intro". Se cambia por video o imagen desde `intro.json`.
- **Pizarra:** los trazos se guardan con coordenadas relativas al ancho, así la clase se ve igual en cualquier pantalla. Cada dedo dibuja su propio trazo. La clase se guarda sola y se restaura al volver. Falta insertar imagen, PDF o video, varias páginas y texto.
- **Biblioteca 3D:** los 3 modelos se arman en código con figuras simples (corazón y sistema solar son versiones simplificadas). El contrato en `modelos.js` permite cambiarlos por archivos glTF/GLB más adelante sin tocar el visor. El panel de información no cambia de tamaño al elegir una parte, para que el modelo no "salte".
- **Actividades:** las tres pasan por `ronda.js` y el mismo motor de puntaje; el progreso queda por juego (`matematica/multiplicacion`, `lenguaje/cuento`, `ciencias/vida`).
- **Pruebas:** 12 del motor de puntaje y 10 de licencias (`npm run pruebas`), y 70 de extremo a extremo en Chromium (`npm run prueba:prototipo`).

## Biblioteca 3D y modelos

La biblioteca tiene tres pantallas (rutas en `app.js`):

| Pantalla | Ruta | Qué hace |
| --- | --- | --- |
| Catálogo | `#/modulo/biblioteca3d` | Tarjetas limpias (foto, nombre y una línea), filtro por tema, buscador por nombre de modelo o de sus partes. La calidad se elige en «Ajustes de rendimiento» (recogido). Sin etiquetas de nivel ni de licencia: eso se ve solo en Créditos |
| Visor | `#/biblioteca3d/ver/:id` | El visor del modelo a pantalla completa. Nexus solo agrega el botón «← Biblioteca» (arriba al centro, donde el visor no tiene nada) |
| Créditos | `#/biblioteca3d/creditos` | Autor, licencia, fuente y cambios de cada modelo (obligatorio con CC BY) |

**Dos clases de modelo** conviven en el catálogo:
- *Descargados* (`tipo: html`): cada uno tiene su propia carpeta `contenido/modelos3d/<id>/` con `index.html` (el visor), `modelo.glb`, `modelo-ligero.glb` y `miniatura.webp`. Se muestran dentro de un `<iframe>` del mismo origen, así su interfaz propia no choca con la de Nexus.
- *En código* (`tipo: codigo`): sistema solar y cubo, armados con figuras (`modelos.js`, visor en `visor-codigo.js`). El corazón en código se oculta si existe el real.

**Catálogo y datos.** `contenido/modelos3d/catalogo.json` lo genera `npm run modelos` (no se edita a mano). Lo que sí se cura a mano está en `metadatos.json` (nivel, tema, orden) y nunca se pisa al reprocesar.

### El proceso `npm run modelos`

```
npm run modelos                          # procesa modelos-entrada/
npm run modelos -- "C:\ruta\MODELOS 3D"  # o cualquier otra carpeta
npm run modelos:licitacion               # deja SOLO los modelos de uso comercial
npm run medir:modelos                    # tiempos, fluidez y memoria: original contra nuevo
```

Para cada visor `.html`: saca el modelo y la configuración que traía incrustados → clasifica la licencia → detecta duplicados por contenido → comprime (normal: texturas ≤2048; ligero: texturas ≤1024 y la mitad de los triángulos; ambos con meshopt y WebP) → reescribe el visor para que cargue el modelo como archivo con barra de progreso → genera la miniatura transparente → actualiza el catálogo. Lo ya procesado y sin cambios se salta (`--forzar` lo rehace).

**Licencias** (`clasificarLicencia`, con pruebas en `probar-modelos.js`):

| Estado | Cuándo | Qué pasa |
| --- | --- | --- |
| `ok` | CC0, CC BY | Entra a la licitación |
| `revisar` | CC BY-SA, «Estándar», licencia desconocida | Entra al catálogo con aviso; hay que decidirlo a mano |
| `excluir` | cualquier NC (no comercial) o ND (sin obras derivadas) | Lleva el aviso «No apto licitación» solo en la pantalla de Créditos y en el informe del comando; `modelos:licitacion` lo saca de la app |

**Nivel (primaria/secundaria).** Se guarda en `metadatos.json` por si hace falta más adelante, pero la interfaz no lo muestra: la app es la misma para todos.

**Calidad.** El visor elige solo: «ligera» si el equipo reporta 4 GB de memoria o menos, o 4 núcleos o menos. La persona puede forzar Alta o Ligera en el catálogo (se recuerda en el equipo). También se puede abrir un visor directo con `?calidad=ligera`.

**Modelos con esqueleto.** Si un modelo trae huesos (como la célula animal de 3D_UTPL), comprimirle la geometría lo deshace. El proceso lo detecta, lo comprime sin tocar la forma y lo avisa. Además, tras comprimir cada modelo compara su tamaño con el original; si cambió, reintenta en modo seguro y, si aún falla, lo deja sin comprimir.

**Si un lote nuevo trae otro formato.** El proceso espera visores con `window.__CFG__` y `window.__GLB__`. Si el código del visor es distinto, lo copia sin optimizar y lo avisa; si ni siquiera tiene esa estructura, lo omite y lo dice. En ese caso hay que ajustar `herramientas/modelos.js`.

**Límite conocido.** Cada visor distinto trae su propia copia de three.js (unos 700 KB). Con muchos modelos conviene unificarlos en un solo visor compartido (quedaría un three.js y un lugar donde corregir la interfaz).

## Cosas a tener en cuenta al empaquetar

- **No usar `file://`.** Los módulos ES y `fetch` de los JSON no funcionan abriendo el HTML como archivo. En Windows (Electron) y Android (Capacitor) hay que servir `app/` por un esquema propio o un servidor local. Capacitor ya lo hace por defecto; en Electron conviene `protocol.handle` o un servidor interno.
- **Guardar imagen** de la pizarra usa una descarga del navegador. En Electron y en Android hay que conectarlo con el sistema de archivos (en divisiones se hizo con Capacitor Filesystem).
- **Probado:** Chromium con WebGL por software, con ratón y con toques simulados. Falta probar en una pantalla BTOUCH real, sobre todo el multitáctil con varios dedos y la velocidad del visor 3D.
- **Marcos (`iframe`) y la política de seguridad:** `index.html` permite `frame-src 'self'` para mostrar los visores de los modelos. Los visores traen scripts propios en línea; funcionan porque son documentos aparte (la política de la página principal no se hereda). Si un día se sirven con `srcdoc` o `blob:`, sí heredarían la política y dejarían de funcionar.
- **Modelos comprimidos y WebAssembly:** el decodificador meshopt es WebAssembly. Lo traen todos los navegadores actuales y WebView de Android; si algún empaquetado lo bloquea, el visor mostrará «No se pudo cargar el modelo».
