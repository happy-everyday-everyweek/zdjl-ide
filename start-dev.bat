@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo    自动精灵IDE 开发服务器启动脚本
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 检查 Node.js 和 npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo [X] 未找到 npm，请先安装 Node.js
    echo     下载地址: https://nodejs.org/
    goto :error
)
echo [√] npm 已安装

echo.
echo [2/4] 检查依赖...

if not exist "node_modules" (
    echo [!] 未检测到 node_modules 目录，需要安装依赖
    goto :install_deps
)

echo [*] 检查核心依赖...
set MISSING=0

if not exist "node_modules\react" set MISSING=1
if not exist "node_modules\react-dom" set MISSING=1
if not exist "node_modules\electron" set MISSING=1
if not exist "node_modules\vite" set MISSING=1
if not exist "node_modules\typescript" set MISSING=1
if not exist "node_modules\monaco-editor" set MISSING=1
if not exist "node_modules\@monaco-editor" set MISSING=1
if not exist "node_modules\concurrently" set MISSING=1
if not exist "node_modules\jszip" set MISSING=1
if not exist "node_modules\electron-store" set MISSING=1
if not exist "node_modules\react-icons" set MISSING=1

if "%MISSING%"=="1" (
    echo [!] 检测到缺失的依赖
    goto :install_deps
)

echo [√] 所有依赖已存在
goto :start_server

:install_deps
echo.
echo [!] 正在安装依赖，请稍候...
call npm install
if errorlevel 1 (
    echo [X] 依赖安装失败，请检查网络连接或 npm 配置
    goto :error
)
echo [√] 依赖安装完成

:start_server
echo.
echo [3/4] 打开浏览器...
start "" "http://localhost:3000"

echo.
echo [4/4] 启动开发服务器...
echo [!] 按 Ctrl+C 可停止服务器
echo.

call npm run dev
if errorlevel 1 (
    echo [X] 启动失败
    goto :error
)

echo.
echo [√] 开发服务器已停止
goto :end

:error
echo.
echo ========================================
echo [!] 发生错误，请查看上方信息
echo ========================================
pause
exit /b 1

:end
pause
exit /b 0
