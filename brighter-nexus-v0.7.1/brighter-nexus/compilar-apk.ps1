# Crea el APK de Brighter Nexus. Se compila en una copia en el disco D porque Gradle falla en discos FAT32 (como E:).
# Al terminar, el APK queda en la carpeta «instaladores».
# Antes, una sola vez:  npm install   (y tener JDK 17 y el SDK de Android en D:\herramientas, igual que para el juego de divisiones)
$ErrorActionPreference = "Continue"
$proyecto = $PSScriptRoot
$copia = "D:\herramientas\compilacion\brighter-nexus"
$version = (Get-Content "$proyecto\package.json" -Raw | ConvertFrom-Json).version

Set-Location $proyecto
npx cap sync android            # copia la carpeta app a la app de Android
if ($LASTEXITCODE -ne 0) { throw "Falló la sincronización con Capacitor" }

New-Item -ItemType Directory -Force "$copia\node_modules\@capacitor" | Out-Null
robocopy "$proyecto\celular" "$copia\celular" /MIR /XD build .gradle /NFL /NDL /NJH /NJS | Out-Null
robocopy "$proyecto\node_modules\@capacitor" "$copia\node_modules\@capacitor" /MIR /XD cli /NFL /NDL /NJH /NJS | Out-Null

# Gradle 8.2 necesita JDK 17 (con Java 8 falla con "compatible with Java 11"). Se busca en D:\herramientas si JAVA_HOME no apunta a uno.
function VersionJava($casa) {
  if (-not $casa -or -not (Test-Path "$casa\bin\java.exe")) { return 0 }
  $linea = (& "$casa\bin\java.exe" -version 2>&1 | Select-Object -First 1).ToString()
  if ($linea -match '"(1\.)?(\d+)') { return [int]$Matches[2] }
  return 0
}
if ((VersionJava $env:JAVA_HOME) -lt 17) {
  # Dónde suele estar un JDK: D:\herramientas, Android Studio (jbr), Program Files y los JDK que baja Gradle
  $sitios = @("D:\herramientas", "C:\Program Files\Android\Android Studio", "C:\Program Files\Eclipse Adoptium", "C:\Program Files\Java",
              "C:\Program Files\Microsoft", "C:\Program Files\Zulu", "C:\Program Files\Amazon Corretto", "$env:USERPROFILE\.gradle\jdks",
              "$env:LOCALAPPDATA\Programs") | Where-Object { Test-Path $_ }
  $jdk = $null
  foreach ($sitio in $sitios) {
    $jdk = Get-ChildItem $sitio -Directory -Recurse -Depth 3 -ErrorAction SilentlyContinue |
      Where-Object { (VersionJava $_.FullName) -ge 17 } | Select-Object -First 1
    if ($jdk) { break }
  }
  if (-not $jdk) { throw "No encontré un JDK 17 ni superior. Instala JDK 17 (Temurin, zip) y descomprímelo en D:\herramientas, o define JAVA_HOME." }
  $env:JAVA_HOME = $jdk.FullName
}
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
Write-Output "Usando Java en: $env:JAVA_HOME"

$env:GRADLE_USER_HOME = "D:\herramientas\gradle"
# SDK de Android: se usa el que ya esté definido o el primero que se encuentre (debe tener la carpeta platforms o build-tools)
function EsSdk($ruta) { return $ruta -and (Test-Path "$ruta\platforms") -and (Test-Path "$ruta\build-tools") }
$sdk = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, "D:\herramientas\android-sdk", "D:\herramientas\Android\Sdk", "D:\herramientas\sdk",
         "$env:LOCALAPPDATA\Android\Sdk", "C:\Android\Sdk", "D:\Android\Sdk") | Where-Object { EsSdk $_ } | Select-Object -First 1
if (-not $sdk) {
  $hallado = Get-ChildItem "D:\herramientas" -Directory -Recurse -Depth 3 -ErrorAction SilentlyContinue | Where-Object { EsSdk $_.FullName } | Select-Object -First 1
  if ($hallado) { $sdk = $hallado.FullName }
}
if (-not $sdk) { throw "No encontré el SDK de Android (carpeta con platforms y build-tools). Defínelo con: `$env:ANDROID_HOME = 'ruta\del\sdk'" }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
Write-Output "Usando el SDK de Android en: $sdk"
Set-Location "$copia\celular"
.\gradlew.bat :app:assembleDebug --no-daemon "-Dorg.gradle.internal.http.connectionTimeout=180000" "-Dorg.gradle.internal.http.socketTimeout=180000"
if ($LASTEXITCODE -ne 0) { throw "Falló la compilación del APK" }

New-Item -ItemType Directory -Force "$proyecto\instaladores" | Out-Null
$destino = "$proyecto\instaladores\Brighter Nexus $version.apk"
Copy-Item "$copia\celular\app\build\outputs\apk\debug\app-debug.apk" $destino -Force
Write-Output "APK listo: $destino"
