# Quiz con juego · Brighter Nexus

El juego es el fondo de toda la pantalla; el quiz va sobre un cristal esmerilado a la izquierda que se disuelve hacia él.
Se puede cambiar el **tema del quiz**, **elegir juego** y **desactivar el juego** (el botón de encendido).

## Cómo se abre (ya conectada a Nexus)
Desde el menú: **Jugar → Quiz**, o desde la sesión de Ciencias («Quiz de ciencias»). Direcciones:

    #/quiz                                  el último juego y tema usados
    #/quiz/conejo?tema=seres-vivos
    #/quiz/ninguno?tema=seres-vivos         sin juego (solo el quiz)

La pantalla (`pantalla.js`) es el antiguo `main.js` conectado al enrutador de Nexus. Se sirve con `npm run servir` (no se abre con doble clic).

## Agregar un tema de quiz
1. Copiar `temas/ciencias/seres-vivos.js` y cambiar las preguntas (formato dentro del archivo).
2. En `temas/index.js`, al tema correspondiente ponerle `estado: "listo"` y `cargar: () => import("./ciencias/su-archivo.js")`.
Los 21 temas del documento ya están en la lista con la etiqueta "Pronto".

## Agregar un juego
1. Crear `juegos/<id>/<id>.js` con este contrato y sumarlo en `juegos/index.js`.
2. Nada más: el selector, los pasos y el cambio con fundido salen solos.

    export default {
      id, nombre, apoyo, icono /* id de <symbol> en index.html */, estado: "listo",
      pasos: [{ icono, texto }],            // máximo 3
      async montar(contenedor, api) {},     // api: { sonido, modoTutor }
      iniciar() {}, pausar() {}, reanudar() {}, reiniciar() {},
      destruir() {},                        // limpiar timers, listeners y canvas
      // ganchos del quiz (todos opcionales)
      alAcertar({ racha }) {}, alFallar({ vidas }) {}, alGanar() {}, alPerder() {},
      alSincronizar({ vidas, racha }) {},   // al activar el juego a mitad de partida
    }

## Notas
- Sin internet: three.js 0.76 (`vendor/`) y GSAP 1.20 (`vendor/`) son locales; la fuente Poppins también. CSP sin scripts en línea.
- El conejo conserva sus modelos originales; lo nuevo es `juegos/conejo/escena.js` (envoltorio controlado por el quiz).
- Puntaje: `js/nucleo/puntaje.js` guarda cada partida en el equipo y emite `nexus:partida`; `app/nucleo/puente-quiz.js` la suma al perfil del alumno de Nexus (`ciencias/quiz-<tema>`).
- El logo del botón Inicio es un marcador de posición (tres triángulos); reemplazar el símbolo `i-logo` en `index.html`.
- Colores y tamaños: `css/tema.css`. No se recibió ESTETICA-BRIGHTER.txt, así que los tonos son una aproximación.


## Pantalla de juego: letreros, botones y modo tutor

- Los letreros (Puntos, Pregunta, Vidas) viven sobre el juego, arriba a la derecha. Abajo a la derecha están los botones de solo ícono: pista (con la cantidad de focos), reiniciar y sonido.
- Al acertar sale confeti (`js/nucleo/confeti.js`). Al fallar tiembla la pantalla, la respuesta elegida se sacude y el corazón perdido se rompe.
- El botón "Siguiente" (y "Iniciar" / "Jugar otra vez") es el botón con destellos de `BOTON_ESTELIZADO`, en la paleta coral: se crea con `chispa()` en `js/ui.js` y sus estilos están al final de `css/pantalla.css`.
- Modo tutor: vidas infinitas (`quiz.setInfinito`) y la respuesta correcta lleva un halo dorado suave.

## Configuración y consejero

- El botón de perfil (arriba a la derecha) abre, además de los modos, la **configuración**: consejero (sí/no), volumen, música (pronto) y vidas por partida (1 a 9). Se guarda en el navegador (`nexus-config`), código en `js/nucleo/config.js` y `js/ajustes.js`.
- El **consejero** (`js/consejero.js`) es un ave de papel con un globo que aparece unos segundos en la esquina inferior izquierda, y hace brillar el botón del que habla. Uso: `consejero.decir({ id, titulo, texto, objetivo: "#selector" })`. Cada consejo con `id` se muestra una sola vez (hay un botón para verlos otra vez).
- Los juegos reciben las vidas en escala de 3 (`vidas`), más `vidasReal` y `vidasMax`, para que sigan funcionando con cualquier cantidad de vidas.
