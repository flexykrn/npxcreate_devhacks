@echo off
color 0F
title ScriptED - Dual Model Launcher

echo ================================================
echo   ScriptED - AI Screenplay Enhancement
echo   Dual Model System (Llama3.2 + MiniCPM-V)
echo ================================================
echo.
echo This will start:
echo   1. Ollama Service (AI Models)
echo   2. Backend Server (Llama3.2 + MiniCPM-V)
echo   3. Frontend (Web Interface)
echo.
echo You will see 3 windows open.
echo DO NOT close any of them!
echo.
pause

REM Kill any existing processes
echo.
echo [CLEANUP] Stopping any existing services...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" 2^>nul') do taskkill /F /PID %%a >nul 2^>^&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" 2^>nul') do taskkill /F /PID %%a >nul 2^>^&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" 2^>nul') do taskkill /F /PID %%a >nul 2^>^&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" 2^>nul') do taskkill /F /PID %%a >nul 2^>^&1
taskkill /F /IM python.exe >nul 2^>^&1
taskkill /F /IM node.exe >nul 2^>^&1
taskkill /F /IM ollama.exe >nul 2^>^&1
timeout /t 3 /nobreak >nul

REM Start Ollama
echo.
echo [1/3] Starting Ollama Service...
start "Ollama Service" cmd /k "color 0E ^&^& title Ollama - AI Models ^&^& ollama serve"
timeout /t 5 /nobreak >nul

REM Start Backend with Dual Models
echo [2/3] Starting Backend with Dual Models...
echo   - Llama3.2 (2GB) for text enhancement
echo   - MiniCPM-V (2.4GB) for image analysis
start "Backend" cmd /k "color 0A ^&^& title Backend - Llama3.2 + MiniCPM-V ^&^& cd /d %~dp0backend ^&^& call venv\Scripts\activate.bat ^&^& echo. ^&^& echo ============================================ ^&^& echo   Backend Starting with Dual Models ^&^& echo ============================================ ^&^& echo. ^&^& echo TEXT MODEL: llama3.2:latest (2GB) ^&^& echo VISION MODEL: minicpm-v:latest (2.4GB) ^&^& echo. ^&^& python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 12 /nobreak >nul

REM Start Frontend
echo [3/3] Starting Frontend...
start "Frontend" cmd /k "color 0D ^&^& title Frontend - Web Interface ^&^& cd /d %~dp0scripted ^&^& npm run dev"
timeout /t 8 /nobreak >nul

echo.
echo ================================================
echo   ALL SERVICES STARTED!
echo ================================================
echo.
echo ^> Frontend: http://localhost:3001/main
echo ^> Backend API: http://localhost:8000
echo ^> API Docs: http://localhost:8000/docs
echo.
echo Models Active:
echo   [TEXT] Llama3.2 - Director-style text enhancement
echo   [VISION] MiniCPM-V - Image analysis and integration
echo.
echo This window can be closed.
echo Keep the 3 service windows open!
echo.
pause
