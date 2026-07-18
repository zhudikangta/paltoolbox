@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE="
where node.exe >nul 2>nul
if not errorlevel 1 (
    for /f "delims=" %%i in ('where node.exe') do (
        set "NODE_EXE=%%i"
        goto :found_node
    )
)

if exist "C:\AI\Node.js\node.exe" (
    set "NODE_EXE=C:\AI\Node.js\node.exe"
    goto :found_node
)

echo Node.js was not found.
echo.
echo Please install Node.js or add it to PATH, then run this file again.
echo.
pause
exit /b 1

:found_node
"%NODE_EXE%" "local-preview-server.js"
echo.
pause
