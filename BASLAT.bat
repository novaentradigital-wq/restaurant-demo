@echo off
chcp 65001 >nul
title QR Menu - Demo

cd /d "%~dp0"

REM Explorer'dan dbl-click ile acildiginda PATH eksik kalabilir, ekleyelim
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm;%LOCALAPPDATA%\pnpm"

set "LOGFILE=%~dp0baslat-log.txt"
echo [%date% %time%] BASLAT calistirildi > "%LOGFILE%"

echo.
echo ============================================================
echo   QR MENU - DEMO
echo ============================================================
echo.

REM ----- Node kontrolu -----
where node >nul 2>&1
if errorlevel 1 (
  echo [HATA] Node.js bulunamadi. Kurulum: https://nodejs.org/
  echo [HATA] node yok >> "%LOGFILE%"
  goto :error
)

REM ----- pnpm kontrolu -----
where pnpm >nul 2>&1
if errorlevel 1 (
  echo [HATA] pnpm bulunamadi. Kurulum: npm install -g pnpm
  echo [HATA] pnpm yok >> "%LOGFILE%"
  goto :error
)

REM ----- Port 3789 musait mi -----
netstat -ano | findstr ":3789 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo [UYARI] Port 3789 zaten kullanimda - eski sunucu kapatiliyor.
  for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3789 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%P >nul 2>&1
  )
  timeout /t 2 /nobreak >nul
)

REM ----- Bagimliliklar -----
if not exist "node_modules" (
  echo [1/3] Bagimliliklar yukleniyor...
  call pnpm install --reporter=append-only
  if errorlevel 1 goto :error
) else (
  echo [1/3] Bagimliliklar mevcut.
)

REM ----- Build -----
if not exist "apps\customer\.next\BUILD_ID" (
  echo [2/3] Ilk derleme yapiliyor...
  call pnpm --filter @qrmenu/customer build
  if errorlevel 1 goto :error
) else (
  echo [2/3] Derleme mevcut.
)

REM ----- Sunucu -----
echo [3/3] Sunucu baslatiliyor...
echo.
echo   Tarayici 4 saniyede acilacak: http://localhost:3789/demo
echo   ! Bu pencereyi KAPATMA, uygulama burada calisiyor.
echo.

start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3789/demo"

call pnpm --filter @qrmenu/customer start

echo.
echo Uygulama durdu.
pause
exit /b 0

:error
echo.
echo ============================================================
echo   HATA olustu. Detaylar: %LOGFILE%
echo ============================================================
echo.
pause
exit /b 1
