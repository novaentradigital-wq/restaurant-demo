@echo off
chcp 65001 >nul
title TANI

echo.
echo ============================================================
echo   TANI - Sorunlari tespit ediyoruz
echo ============================================================
echo.

cd /d "%~dp0"

echo --- Klasor ---
echo %CD%
echo.

echo --- Node ---
where node 2>&1
node --version 2>&1
echo.

echo --- pnpm ---
where pnpm 2>&1
pnpm --version 2>&1
echo.

echo --- Calisan node sureci var mi ---
tasklist /FI "IMAGENAME eq node.exe" 2>&1
echo.

echo --- Port 3789 kullanimda mi ---
netstat -an | findstr ":3789" 2>&1
if errorlevel 1 (
  echo Port 3789 BOS - kullanilabilir.
)
echo.

echo --- Port 3010 kullanimda mi ---
netstat -an | findstr ":3010" 2>&1
if errorlevel 1 (
  echo Port 3010 BOS - kullanilabilir.
)
echo.

echo --- node_modules klasoru var mi ---
if exist "node_modules" (
  echo VAR
) else (
  echo YOK - pnpm install gerekli
)
echo.

echo --- Customer build var mi ---
if exist "apps\customer\.next\BUILD_ID" (
  echo VAR
) else (
  echo YOK - build gerekli
)
echo.

echo ============================================================
echo   TANI BITTI - bu yazilari bana yapistir
echo ============================================================
pause
