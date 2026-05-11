@echo off
setlocal

REM Change to the repository root and then the native app folder
cd /d "%~dp0nebula-webos"

if not exist node_modules (
  echo Installing dependencies...
  npm install
)

echo Starting Nebula WebOS in development mode...
npm run dev
