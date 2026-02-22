@echo off
color 0F
title ScriptED - Groq Pipeline Launcher

echo ================================================
echo   ScriptED - AI Screenplay Enhancement
echo   Powered by Groq LLama 3.1 8B Instant
echo ================================================
echo.
echo This will start:
echo   1. Backend Server (Port 8080) - Groq Pipeline
echo   2. Frontend (Port 3000) - Node UI
echo.
echo You will see 2 windows open.
echo DO NOT close any of them!
echo.
pause

REM Kill any existing processes
echo.
echo [CLEANUP] Stopping any existing services...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" 2^>nul') do taskkill /F /PID %%a >nul 2^>^&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" 2^>nul') do taskkill /F /PID %%a >nul 2^>^&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" 2^>nul') do taskkill /F /PID %%a >nul 2^>^&1
timeout /t 2 /nobreak >nul

REM Start Backend with Groq
echo.
echo [1/2] Starting Backend with Groq...
echo   - Model: llama-3.1-8b-instant
echo   - Port: 8080
start "Backend - Groq Pipeline" cmd /k "color 0A ^&^& cd /d %~dp0backend ^&^& call venv\Scripts\activate.bat ^&^& echo. ^&^& echo ============================================ ^&^& echo   Backend Starting with Groq ^&^& echo ============================================ ^&^& echo. ^&^& echo MODEL: llama-3.1-8b-instant ^&^& echo API: Groq Cloud ^&^& echo. ^&^& python main_groq.py"
timeout /t 8 /nobreak >nul

REM Start Frontend
echo [2/2] Starting Frontend...
start "Frontend - Pipeline UI" cmd /k "color 0D ^&^& cd /d %~dp0scripted ^&^& npm run dev"
timeout /t 8 /nobreak >nul

echo.
echo ================================================
echo   ALL SERVICES STARTED!
echo ================================================
echo.
echo ^> Pipeline UI: http://localhost:3000/pipeline
echo ^> Notebook UI: http://localhost:3000/notebook
echo ^> Backend API: http://localhost:8080
echo ^> API Docs: http://localhost:8080/docs
echo.
echo Active Model:
echo   [TEXT] Llama 3.1 8B Instant - Groq Cloud
echo   - Ultra-fast inference
echo   - 8B parameters
echo   - 128K context window
echo.
echo This window can be closed.
echo Keep the 2 service windows open!
echo.
pause
