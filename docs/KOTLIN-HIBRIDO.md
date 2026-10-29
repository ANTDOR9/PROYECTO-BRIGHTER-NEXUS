# App híbrida: menú en Kotlin + pantallas web

Solo en Android (APK). En Windows 11 (Electron) y en el navegador sigue el menú web de siempre.

```
Icono de la app
   └─ MenuActivity (Kotlin + Jetpack Compose)        menú nativo: 4 secciones, estrellas del perfil
         └─ toca una opción ──► WebActivity           WebView a pantalla completa con la web (assets/public)
                                   ├─ Kotlin → web:  la ruta va en la dirección  …/index.html#/quiz
                                   └─ web → Kotlin:  window.NexusNativo.cerrar()  /  .partidaTerminada(json)
```

## Archivos
| Archivo | Qué hace |
| --- | --- |
| `…/MenuActivity.kt` | Réplica fiel del menú web en Compose (`app/menu/menu.js` + `menu.css` + `tema.css`): círculo de 4 piezas con fotos, mega zoom, pantallas de sección, botón de usuario con aro y modos, consejero, botón Inicio. |
| `…/NexusFondo.kt` | Pliegues de origami del fondo (5 grandes + triangulitos que nacen y se desvanecen), en un solo Canvas. |
| `…/NexusTema.kt` | Colores de marca, Poppins, paleta estudiante/tutor y los datos de las secciones (`SECCIONES`, espejo de `app/nucleo/menu-datos.js`). |
| `…/NexusIconos.kt` | Los íconos de línea del menú (mismos trazos SVG) y el hexágono. |
| `…/WebActivity.kt` | WebView con `WebViewAssetLoader` (sirve `assets/public` en `https://appassets.androidplatform.net`) y el puente `NexusNativo`. |
| `…/Perfil.kt` | Estrellas guardadas por la parte nativa (SharedPreferences). |
| `app/nucleo/nativo.js` | Lado web del puente: `hayNativo()`, `cerrarNativo()`, `avisarPartida()`. |
| `app/nucleo/pantallas-menu.js` | Dentro de Android, el menú web no se dibuja: al llegar a `#/` o `#/seccion/..` llama a `cerrar()` y se vuelve al menú Kotlin. |
| `app/nucleo/puente-quiz.js` | Reenvía cada partida del quiz a Kotlin. |
| `celular/build.gradle`, `celular/app/build.gradle` | Plugin de Kotlin 1.9.22, Compose (BOM 2024.02), `androidx.webkit`. |
| `celular/app/src/main/AndroidManifest.xml` | `MenuActivity` es la que se abre; `WebActivity` no se exporta. |

## Para añadir una opción al menú nativo
Una línea en `SECCIONES` de `MenuActivity.kt`: `Opcion("/ruta/de/la/web", "Nombre", "Descripción")`.
Si la ruta ya existe en la web (ver `app/nucleo/app.js`), no hay que tocar nada más.

## Para pasar una pantalla web a Kotlin más adelante
1. Crear la pantalla en Compose y una `Activity` o composable nuevo.
2. En `MenuActivity` abrirla en lugar de `WebActivity.abrir(...)`.
3. Si necesita datos de la web, usar el puente (`@JavascriptInterface`) o guardarlos en `Perfil`.

## Cómo se evita el parpadeo
Todo lo que se mueve (fotos, triángulos, logo, aro, zoom) se calcula en la fase de dibujo con un único reloj de fotogramas; no hay recomposición por cuadro ni capas que se disputen el primer plano. Las fotos se decodifican antes de abrir el menú.

## Diferencias con el menú web
- Las tarjetas y la barra de modos usan el vidrio translúcido sin desenfoque del fondo (`backdrop-filter` no existe en Compose); es justo lo que más costaba al renderizar en la web.
- No se porta la pantalla de carga ni el contador de estrellas.
- El modo estudiante/tutor lo guarda Kotlin (`Perfil.modo`) y la web lo copia a su localStorage al arrancar (`app/nucleo/nativo.js`).

## Límites conocidos
- Los datos viven en dos lugares: el perfil de la web (localStorage) y `Perfil.kt`. Por ahora solo se comparten las estrellas totales.
- El botón "← Aprender" de la web vuelve al menú nativo (no a la sección abierta).
- `WebViewAssetLoader` no atiende peticiones de rango: un vídeo largo en la Mediateca puede no avanzar a mitad.
- Hay que volver a correr `.\compilar-apk.ps1` cada vez que cambie la web (copia `app/` a `assets/public`).

## Escala para pantallas interactivas (4K)
`Escala.kt` fija una escala de diseño: el lado corto de la pantalla siempre equivale a 1080 unidades (1 dp en Kotlin = 1 px CSS en el WebView).
En un panel 4K (2160 px de alto) todo se dibuja al doble que en un Full HD, con las mismas proporciones; en un teléfono horizontal se ve el menú como se verá en el panel.
Las dos actividades quedan en horizontal (`sensorLandscape`). En Windows (Electron) `pc/principal.cjs` hace lo mismo con el zoom de la ventana.
