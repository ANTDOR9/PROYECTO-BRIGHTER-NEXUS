# Brighter Nexus

Plataforma educativa para pantallas interactivas BTOUCH (Android 15 y Windows 11 OPS).
Una sola app para el profesor con: **pizarra digital**, **kit de actividades** (matemática, lenguaje y ciencias) y **biblioteca de modelos 3D**. Funciona sin internet.

## Estado: prototipo (v0.3)

| Pieza | Estado |
| --- | --- |
| Intro de inicio | Espacio reservado, configurable en `app/contenido/intro.json` |
| Pizarra | Lápiz, borrador, línea, rectángulo, círculo, colores, grosores, deshacer/rehacer, fondo oscuro/blanco, multitáctil, guardado automático y exportar PNG |
| Biblioteca 3D | Catálogo con miniaturas y filtros; 9 modelos descargados (5 aptos para licitación), sistema solar y cubo en código; créditos y licencias |
| Actividades | Una por curso: multiplicación (completar), el cuento (ordenar), la célula (elegir) |
| Motor de puntaje | Común a todas las actividades, con progreso por juego |
| Divisiones | Por migrar (ver `app/sesiones/matematica/divisiones/index.js`) |

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
npm run prueba:prototipo            # 25 comprobaciones; capturas en pruebas/capturas/
```

## Agregar modelos 3D

1. Copia los visores `.html` nuevos a `modelos-entrada/` (o usa otra carpeta: `npm run modelos -- "C:\ruta\MODELOS 3D"`).
2. `npm install` (una sola vez) y `npm run modelos`. Comprime los modelos, revisa las licencias, quita duplicados, crea las miniaturas y actualiza el catálogo.
   - Para las miniaturas hace falta `npx playwright install chromium` (una sola vez). Sin eso, el proceso igual funciona y la tarjeta muestra un ícono.
3. Revisa `app/contenido/modelos3d/metadatos.json` (nivel y tema de cada modelo nuevo).
4. Para la versión de la licitación: `npm run modelos:licitacion` (saca los de uso no comercial).

## Poner la intro

Cuando exista la intro real, copia el video o la imagen a `app/contenido/intro/` y cambia `app/contenido/intro.json`
(`"tipo": "video"` o `"imagen"`, y `"archivo": "mi-intro.mp4"`). No hay que tocar código.
Se muestra una vez por sesión; en el inicio hay un enlace "Ver la intro otra vez".

## Dónde está cada cosa

Ver `docs/ARQUITECTURA.md`.
