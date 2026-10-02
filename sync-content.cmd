@echo off
setlocal
cd /d "%~dp0"
set "CONTENT_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%CONTENT_NODE%" goto bundled
where node >nul 2>nul
if errorlevel 1 goto missing
node "%~dp0sync-content.js"
goto result
:bundled
"%CONTENT_NODE%" "%~dp0sync-content.js"
:result
if errorlevel 1 goto failed
echo Content updated. Refresh the HTML page.
if /i "%~1"=="--no-pause" exit /b 0
pause
exit /b 0
:missing
echo Node.js was not found. Open this project in Codex or install Node.js.
goto failed
:failed
echo Update failed. Check the error above. Existing content was preserved.
if /i "%~1"=="--no-pause" exit /b 1
pause
exit /b 1
