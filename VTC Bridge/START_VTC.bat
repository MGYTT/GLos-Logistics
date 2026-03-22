@echo off
title VTC Bridge v6.0
color 0A
chcp 65001 >nul 2>&1
cls

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       VTC Bridge v6.0 — Pro Edition      ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── [1/4] Node.js ─────────────────────────────
echo  [1/4] Sprawdzam Node.js...

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [BLAD] Node.js nie jest zainstalowany!
    echo  Pobierz wersje LTS z: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%v in ('node -e "process.stdout.write(process.version.slice(1))"') do set NODE_MAJOR=%%v
if not defined NODE_MAJOR goto :node_ok
if %NODE_MAJOR% LSS 18 (
    echo.
    echo  [BLAD] Node.js v%NODE_MAJOR% jest za stary! Wymagany v18+
    echo  Pobierz nowszy: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:node_ok
echo  [OK] Node.js v%NODE_MAJOR%

:: ── [2/4] Pliki Bridge ────────────────────────
echo.
echo  [2/4] Sprawdzam pliki Bridge...

set MISSING_FILES=0

if not exist "%~dp0vtc-bridge.js" (
    echo  [BLAD] Brak pliku: vtc-bridge.js
    set MISSING_FILES=1
)
if not exist "%~dp0vtc-verify.js" (
    echo  [BLAD] Brak pliku: vtc-verify.js
    set MISSING_FILES=1
)
if not exist "%~dp0vtc-save-config.js" (
    echo  [BLAD] Brak pliku: vtc-save-config.js
    set MISSING_FILES=1
)

if %MISSING_FILES%==1 (
    echo.
    echo  Upewnij sie ze wszystkie pliki sa w folderze:
    echo  %~dp0
    echo.
    pause
    exit /b 1
)

echo  [OK] Wszystkie pliki znalezione

:: ── [3/4] Konfiguracja ────────────────────────
echo.
echo  [3/4] Sprawdzam konfiguracje konta...

if exist "%~dp0vtc-config.json" (
    echo  [OK] Konfiguracja znaleziona
    goto :check_funbit
)

:: ── SETUP ─────────────────────────────────────
echo  [INFO] Brak konfiguracji — uruchamiam kreator
echo.
echo  ══════════════════════════════════════════════
echo.
echo   Witaj w konfiguracji VTC Bridge!
echo.
echo   Potrzebujesz klucza API Bridge ze strony VTC.
echo   Znajdziesz go w:
echo   Panel VTC - Profil - Sekcja "API Bridge"
echo.
echo  ══════════════════════════════════════════════
echo.

:: Adres serwera
:ask_server
set VTC_SERVER=
set /p VTC_SERVER="  Adres serwera VTC (np. https://moja-vtc.pl): "

if "%VTC_SERVER%"=="" (
    echo  [BLAD] Adres nie moze byc pusty!
    goto :ask_server
)

:: Usuń trailing slash jeśli jest
if "%VTC_SERVER:~-1%"=="/" set VTC_SERVER=%VTC_SERVER:~0,-1%

echo.

:: Klucz API
:ask_apikey
set VTC_API_KEY=
echo  ┌─────────────────────────────────────────────┐
echo  │  Wpisz swoj klucz API Bridge:               │
echo  │  Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx   │
echo  └─────────────────────────────────────────────┘
echo.
set /p VTC_API_KEY="  Klucz API: "

if "%VTC_API_KEY%"=="" (
    echo.
    echo  [BLAD] Klucz nie moze byc pusty!
    echo.
    goto :ask_apikey
)

:: Weryfikacja
echo.
echo  Weryfikuje klucz na serwerze...
echo.

node "%~dp0vtc-verify.js" "%VTC_SERVER%" "%VTC_API_KEY%" > "%~dp0_vr.tmp" 2>&1
set VERIFY_EXIT=%errorlevel%

:: Odczytaj wynik
set VERIFY_RESULT=
set /p VERIFY_RESULT=<"%~dp0_vr.tmp"
del "%~dp0_vr.tmp" >nul 2>&1

if "%VERIFY_RESULT%"=="" (
    echo  [BLAD] Brak odpowiedzi z serwera
    echo.
    echo  Sprawdz:
    echo  1. Czy adres serwera jest poprawny: %VTC_SERVER%
    echo  2. Czy masz polaczenie z internetem
    echo.
    set /p TRY_AGAIN="  Sprobowac ponownie? (T/N): "
    if /i "%TRY_AGAIN%"=="T" (
        echo.
        goto :ask_server
    )
    exit /b 1
)

:: Sprawdź czy odpowiedź zaczyna się od OK:
echo %VERIFY_RESULT% | findstr /b "OK:" >nul
if %errorlevel% neq 0 goto :verify_failed

:: ── Weryfikacja udana ──────────────────────────
:: Wyciągnij username (token 2) i rank (token 3) z "OK:username:rank"
for /f "tokens=2 delims=:" %%a in ("%VERIFY_RESULT%") do set VTC_USERNAME=%%a
for /f "tokens=3 delims=:" %%b in ("%VERIFY_RESULT%") do set VTC_RANK=%%b

echo  ╔══════════════════════════════════════════╗
echo  ║  Weryfikacja udana!                      ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Konto:  %VTC_USERNAME%
echo  Ranga:  %VTC_RANK%
echo.

:: Zapisz konfigurację
node "%~dp0vtc-save-config.js" "%VTC_API_KEY%" "%VTC_SERVER%" "%VTC_USERNAME%" "%VTC_RANK%" > "%~dp0_save.tmp" 2>&1
set SAVE_RESULT=
set /p SAVE_RESULT=<"%~dp0_save.tmp"
del "%~dp0_save.tmp" >nul 2>&1

if "%SAVE_RESULT%"=="SAVED" (
    echo  [OK] Konfiguracja zapisana w vtc-config.json
) else (
    echo  [WARN] Problem z zapisem konfiguracji
)

echo.
echo  Uruchamianie Bridge za chwile...
timeout /t 2 >nul
goto :check_funbit

:: ── Weryfikacja nieudana ───────────────────────
:verify_failed
set VTC_ERROR=%VERIFY_RESULT:~4%

echo  ╔══════════════════════════════════════════╗
echo  ║  Weryfikacja nieudana!                   ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Powod: %VTC_ERROR%
echo.
echo  Upewnij sie ze:
echo  1. Skopiowales CALY klucz API ze strony VTC
echo  2. Adres serwera jest poprawny: %VTC_SERVER%
echo  3. Masz polaczenie z internetem
echo.

set /p TRY_AGAIN="  Sprobowac ponownie? (T/N): "
if /i "%TRY_AGAIN%"=="T" (
    echo.
    goto :ask_apikey
)
exit /b 1

:: ── [4/4] Funbit ──────────────────────────────
:check_funbit
echo.
echo  [4/4] Sprawdzam Funbit Telemetry Server...

curl -s --max-time 3 "http://localhost:25555/api/ets2/telemetry" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARN] Funbit nie odpowiada
    echo  Bridge uruchomi sie i bedzie czekac na gre...
) else (
    echo  [OK] Funbit dziala!
)

:: ── START ─────────────────────────────────────
echo.
echo  ══════════════════════════════════════════════
echo   VTC Bridge uruchomiony!
echo   CTRL+C — zatrzymaj
echo   Wpisz "reset" + Enter — zmien konto
echo  ══════════════════════════════════════════════
echo.

cd /d "%~dp0"
node vtc-bridge.js

:: ── Po zatrzymaniu ────────────────────────────
echo.
echo  ══════════════════════════════════════════════
echo   Bridge zatrzymany.
echo  ══════════════════════════════════════════════
echo.

set RESTART=
set /p RESTART="  Uruchomic ponownie? (T/N): "
if /i "%RESTART%"=="T" (
    cls
    call "%~f0"
    exit /b 0
)

echo.
echo  Do zobaczenia na drodze!
timeout /t 3 >nul
exit /b 0
