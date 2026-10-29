# Empaquetado: APK (Android 15) e instalador (Windows 11)

Se usa lo mismo que en el juego de divisiones: **Capacitor** para el APK y **Electron** para Windows. La app (`app/`) no cambia.

## Una sola vez
```
npm install
```
Necesitas lo mismo que para el APK de divisiones: JDK 17 (el script lo busca en D:\herramientas o usa JAVA_HOME) y el SDK de Android en `D:\herramientas`.
(El proyecto de Android `celular/` ya viene creado; no hace falta `cap add android`.)

## APK (celular y pantallas Android)
En PowerShell, dentro de la carpeta del proyecto:
```
.\compilar-apk.ps1
```
Sincroniza `app/` con Android, compila en `D:\herramientas\compilacion\brighter-nexus` y deja
`instaladores\Brighter Nexus <versión>.apk`. En el panel: copiar el APK, abrirlo y aceptar "instalar de esta fuente".
Si cambias algo en `app/`, vuelve a correr el script; no hay que tocar `celular/`.

## Instalador de Windows 11
```
npm run pc            # abrir en una ventana (prueba)
npm run instalador    # crea instaladores\Brighter Nexus Setup <versión>.exe
```
La ventana abre un servidor local (solo 127.0.0.1) porque Nexus usa módulos de JavaScript, que no corren desde un archivo suelto.
Para abrir a pantalla completa en el panel: acceso directo con `--pantalla-completa`.

## Qué probar en el panel real (BTOUCH)
- Biblioteca 3D: que los visores carguen y respondan al toque (el WebView de Android 15 es el mismo Chrome del sistema).
- Pizarra, quiz, divisiones y las plantillas: guardado de progreso al cerrar y volver a abrir.
- Tamaño de la app: la Biblioteca 3D pesa varias decenas de MB (ver `npm run modelos`); si el APK pesa demasiado, usar solo los modelos ligeros.
- Firma: el APK de prueba (`debug`) se firma con la clave de depuración de Android. Para instalar versiones nuevas encima de las anteriores
  sin perder datos hay que usar SIEMPRE la misma clave: guarda `%USERPROFILE%\.android\debug.keystore`.
- Para publicar o entregar a una institución: APK de `release` firmado con una clave propia de Brighter (aún no creada).

## Datos
El progreso vive en el almacenamiento de la app (localStorage). Desinstalar borra los datos; instalar encima no.
