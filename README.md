# Brighter Nexus

Plataforma educativa para pantallas interactivas BTOUCH (Android 15 y Windows 11 OPS).
Una sola app para el profesor con: **pizarra digital**, **kit de actividades** (matemática, lenguaje y ciencias) y **biblioteca de modelos 3D**. Funciona sin internet.

## Estado: primer prototipo (v0.2)

| Pieza | Estado |
| --- | --- |
| Intro de inicio | Espacio reservado, configurable en `app/contenido/intro.json` |
| Pizarra | Lápiz, borrador, línea, rectángulo, círculo, colores, grosores, deshacer/rehacer, fondo oscuro/blanco, multitáctil, guardado automático y exportar PNG |
| Biblioteca 3D | Corazón, sistema solar y cubo, con partes que se tocan para ver su nombre |
| Actividades | Una por curso: multiplicación (completar), el cuento (ordenar), la célula (elegir) |
| Motor de puntaje | Común a todas las actividades, con progreso por juego |
| Divisiones | Por migrar (ver `app/sesiones/matematica/divisiones/index.js`) |

## Probar en el navegador

```
npm run servir      # abre http://localhost:5173
npm run pruebas     # pruebas del motor de puntaje (no necesitan instalar nada)
npm run kit         # cuántas actividades faltan para cumplir las bases
```

> El proyecto usa módulos ES. Por eso se abre con el servidor y no con doble clic en `index.html`.

### Prueba completa en un navegador real (opcional)

```
npm i -D playwright
npx playwright install chromium     # una sola vez
npm run servir                      # en otra terminal
npm run prueba:prototipo            # 25 comprobaciones; capturas en pruebas/capturas/
```

## Poner la intro

Cuando exista la intro real, copia el video o la imagen a `app/contenido/intro/` y cambia `app/contenido/intro.json`
(`"tipo": "video"` o `"imagen"`, y `"archivo": "mi-intro.mp4"`). No hay que tocar código.
Se muestra una vez por sesión; en el inicio hay un enlace "Ver la intro otra vez".

## Dónde está cada cosa

Ver `docs/ARQUITECTURA.md`.
