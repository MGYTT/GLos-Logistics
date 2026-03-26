# fix-cache.ps1
Write-Host "Naprawiam cache winCodeSign..." -ForegroundColor Yellow

$cacheDir = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0"
$tempFile = "$env:TEMP\winCodeSign.7z"
$sevenZip = "$PSScriptRoot\node_modules\7zip-bin\win\x64\7za.exe"

# 1. Usuń stary cache
if (Test-Path "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign") {
    Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
    Write-Host "Stary cache usuniety" -ForegroundColor Green
}

# 2. Utwórz folder
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null

# 3. Pobierz
Write-Host "Pobieranie winCodeSign..." -ForegroundColor Yellow
Invoke-WebRequest `
    -Uri "https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z" `
    -OutFile $tempFile `
    -UseBasicParsing

# 4. Rozpakuj BEZ symlinków (-snld)
Write-Host "Rozpakowywanie bez symlinkow..." -ForegroundColor Yellow
& $sevenZip x $tempFile "-o$cacheDir" -snld -y

# 5. Sprawdź
if (Test-Path "$cacheDir\windows") {
    Write-Host "`nSUKCES! Mozesz teraz uruchomic: npm run build:portable" -ForegroundColor Green
} else {
    Write-Host "`nBLAD! Sprawdz czy folder $cacheDir zawiera pliki" -ForegroundColor Red
}

# 6. Ustaw zmienne i buduj od razu
Write-Host "`nUruchamiam build..." -ForegroundColor Yellow
$env:CSC_IDENTITY_AUTO_DISCOVERY     = "false"
$env:CSC_LINK                        = ""
$env:WIN_CSC_LINK                    = ""
$env:ELECTRON_BUILDER_SKIP_CODE_SIGN = "1"

node build.js
