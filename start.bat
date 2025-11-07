@echo off
REM Ropani AI - Quick Start Script for Windows
REM This script starts both backend and frontend services

echo ========================================
echo    Ropani AI - Quick Start Script
echo ========================================
echo.

REM Check if Docker is running
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/5] Starting backend services (PostgreSQL, Redis, Qdrant, FastAPI)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start backend services!
    pause
    exit /b 1
)
echo Backend services started successfully!
echo.

echo [2/5] Waiting for services to be ready...
timeout /t 10 /nobreak > nul
echo.

echo [3/5] Checking if frontend dependencies are installed...
cd frontend
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        cd ..
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
) else (
    echo Dependencies already installed.
)
echo.

echo [4/5] Starting frontend development server...
echo.
echo ========================================
echo    Services are starting...
echo ========================================
echo.
echo Backend API:       http://localhost:8000
echo API Docs:          http://localhost:8000/docs
echo Frontend:          http://localhost:5173
echo Qdrant Dashboard:  http://localhost:6333/dashboard
echo.
echo Press Ctrl+C to stop all services
echo ========================================
echo.

REM Start frontend dev server
call npm run dev

REM If user stops the frontend, offer to stop backend too
echo.
echo Frontend stopped.
choice /C YN /M "Do you want to stop backend services too?"
if %errorlevel% equ 1 (
    cd ..
    echo Stopping backend services...
    docker-compose down
    echo All services stopped.
)

cd ..
pause
