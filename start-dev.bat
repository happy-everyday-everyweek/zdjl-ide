@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo    自动精灵IDE 开发服务器启动脚本
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查依赖...

set NEED_INSTALL=0

if not exist "node_modules" (
    echo [!] 未检测到 node_modules 目录
    set NEED_INSTALL=1
) else (
    echo [*] 检查核心依赖...
    
    if not exist "node_modules\react" (
        echo [!] 缺少依赖: react
        set NEED_INSTALL=1
    )
    if not exist "node_modules\react-dom" (
        echo [!] 缺少依赖: react-dom
        set NEED_INSTALL=1
    )
    if not exist "node_modules\electron" (
        echo [!] 缺少依赖: electron
        set NEED_INSTALL=1
    )
    if not exist "node_modules\vite" (
        echo [!] 缺少依赖: vite
        set NEED_INSTALL=1
    )
    if not exist "node_modules\typescript" (
        echo [!] 缺少依赖: typescript
        set NEED_INSTALL=1
    )
    if not exist "node_modules\monaco-editor" (
        echo [!] 缺少依赖: monaco-editor
        set NEED_INSTALL=1
    )
    if not exist "node_modules\@monaco-editor" (
        echo [!] 缺少依赖: @monaco-editor/react
        set NEED_INSTALL=1
    )
    if not exist "node_modules\concurrently" (
        echo [!] 缺少依赖: concurrently
        set NEED_INSTALL=1
    )
    if not exist "node_modules\jszip" (
        echo [!] 缺少依赖: jszip
        set NEED_INSTALL=1
    )
    if not exist "node_modules\electron-store" (
        echo [!] 缺少依赖: electron-store
        set NEED_INSTALL=1
    )
    if not exist "node_modules\react-icons" (
        echo [!] 缺少依赖: react-icons
        set NEED_INSTALL=1
    )
)

if "%NEED_INSTALL%"=="1" (
    echo.
    echo [!] 正在安装缺失的依赖...
    call npm install
    if errorlevel 1 (
        echo [X] 依赖安装失败，请检查网络连接或 npm 配置
        pause
        exit /b 1
    )
    echo [√] 依赖安装完成
) else (
    echo [√] 所有依赖已存在，跳过安装
)

echo.
echo [2/3] 启动开发服务器...
echo [!] 服务器将在 http://localhost:3000 启动
echo.

start "" "http://localhost:3000"

echo [3/3] 正在启动...
call npm run dev

pause
