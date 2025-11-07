#!/bin/bash

# Ropani AI - Quick Start Script for Linux/Mac
# This script starts both backend and frontend services

echo "========================================"
echo "   Ropani AI - Quick Start Script"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "[1/5] Starting backend services (PostgreSQL, Redis, Qdrant, FastAPI)..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start backend services!"
    exit 1
fi
echo "Backend services started successfully!"
echo ""

echo "[2/5] Waiting for services to be ready..."
sleep 10
echo ""

echo "[3/5] Checking if frontend dependencies are installed..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies!"
        cd ..
        exit 1
    fi
    echo "Dependencies installed successfully!"
else
    echo "Dependencies already installed."
fi
echo ""

echo "[4/5] Starting frontend development server..."
echo ""
echo "========================================"
echo "   Services are starting..."
echo "========================================"
echo ""
echo "Backend API:       http://localhost:8000"
echo "API Docs:          http://localhost:8000/docs"
echo "Frontend:          http://localhost:5173"
echo "Qdrant Dashboard:  http://localhost:6333/dashboard"
echo ""
echo "Press Ctrl+C to stop all services"
echo "========================================"
echo ""

# Trap Ctrl+C to cleanup
cleanup() {
    echo ""
    echo "Frontend stopped."
    read -p "Do you want to stop backend services too? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd ..
        echo "Stopping backend services..."
        docker-compose down
        echo "All services stopped."
    fi
    exit 0
}

trap cleanup INT

# Start frontend dev server
npm run dev

cd ..
