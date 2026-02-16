@echo off
chcp 936 >nul

echo ========================================
echo    ZDJD-IDE Dev Server
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Check Node.js...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found, install Node.js first
    pause
    exit /b 1
)
echo [OK] npm found

echo.
echo [2/4] Check dependencies...
if not exist "node_modules" (
    echo [!] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
)
echo [OK] Dependencies ready

echo.
echo [3/4] Build main process...
call npm run build:main
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [OK] Build complete

echo.
echo [4/4] Start dev server...
echo.

call npm run dev

pause
