@echo off
setlocal

cd /d "%~dp0"

echo Installing dependencies...
call npm.cmd install
if errorlevel 1 exit /b %errorlevel%

echo Starting Parola Park...
echo Open http://localhost:5173/ in your browser.
call npm.cmd run dev

