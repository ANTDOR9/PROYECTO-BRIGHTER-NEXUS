# Brighter Nexus

Plataforma educativa para pantallas interactivas BTOUCH (Android 15 y Windows 11 OPS).
Una sola app para el profesor con: **pizarra digital**, **kit de actividades** (matemática, lenguaje y ciencias) y **biblioteca de modelos 3D**. Funciona sin internet.

## Estado: prototipo (v0.4)

| Pieza | Estado |
| --- | --- |
| Carga y menú | Pantalla de carga y menú circular (Aprender · Explorar 3D · Jugar · Pizarra) con diseño propio; las secciones salen del registro |
| Quiz de Ciencias | Quiz con vidas, focos y repaso, y el juego del conejo de fondo (se puede apagar); suma al perfil del alumno |
| Pizarra | Lápiz, borrador, línea, rectángulo, círculo, colores, grosores, deshacer/rehacer, fondo oscuro/blanco, multitáctil, guardado automático y exportar PNG |
| Biblioteca 3D | Catálogo con miniaturas y filtros; 9 modelos descargados (5 aptos para licitación), sistema solar y cubo en código; créditos y licencias |
| Actividades | Una por curso: multiplicación (completar), el cuento (ordenar), la célula (elegir) |
| Motor de puntaje | Común a todas las actividades, con progreso por juego |
| Multiplicación en columnas | Prototipo: plantilla `columnas` (paso a paso, color naranja) |
| Tablas de multiplicar | Prototipo (antes "Multiplicación") |
| App híbrida | Menú Android en Kotlin + web: ver `docs/KOTLIN-HIBRIDO.md` |
| Empaquetado | APK (Capacitor) y Windows (Electron): ver `docs/EMPAQUETADO.md` |
| Divisiones | Prototipo: el juego de nasa-cell completo, con su estética, dentro de un marco (`app/sesiones/matematica/divisiones/`) |

## Probar en el navegador

```
npm run servir      # abre http://localhost:5173
npm run pruebas     # pruebas del motor de puntaje (no necesitan instalar nada)
npm run kit         # cuántas actividades faltan para cumplir las bases
npm run modelos     # prepara los modelos 3D nuevos (ver abajo)
```

> El proyecto usa módulos ES. Por eso se abre con el servidor y no con doble clic en `index.html`.

### Prueba completa en un navegador real (opcional)

```
npm i -D playwright
npx playwright install chromium     # una sola vez
npm run servir                      # en otra terminal
npm run prueba:prototipo            # comprobaciones de punta a punta; capturas en pruebas/capturas/
```

## Agregar modelos 3D

1. Copia los visores `.html` nuevos a `modelos-entrada/` (o usa otra carpeta: `npm run modelos -- "C:\ruta\MODELOS 3D"`).
2. `npm install` (una sola vez) y `npm run modelos`. Comprime los modelos, revisa las licencias, quita duplicados, crea las miniaturas y actualiza el catálogo.
   - Para las miniaturas hace falta `npx playwright install chromium` (una sola vez). Sin eso, el proceso igual funciona y la tarjeta muestra un ícono.
3. Revisa `app/contenido/modelos3d/metadatos.json` (nivel y tema de cada modelo nuevo).
4. Para la versión de la licitación: `npm run modelos:licitacion` (saca los de uso no comercial).

## Poner la intro

Por ahora la entrada es la pantalla de carga (el logo con un anillo de colores). Cuando exista la intro real, copia el video o la imagen a
`app/contenido/intro/` y cambia `app/contenido/intro.json` (`"tipo": "video"` o `"imagen"`, y `"archivo": "mi-intro.mp4"`). No hay que tocar código.
Se muestra una vez por sesión.

## Menú y quiz

El menú (`app/menu/`) y el quiz con su juego (`app/quiz/`) tienen su propio diseño; Nexus apaga sus estilos mientras se ven (ver «Menú, quiz y pantallas con diseño propio» en
`docs/ARQUITECTURA.md`). El quiz se abre desde **Jugar → Quiz** y desde la sesión de Ciencias; para agregar un tema de quiz, ver `app/quiz/LEEME.md`.

## Dónde está cada cosa

Ver `docs/ARQUITECTURA.md`.
