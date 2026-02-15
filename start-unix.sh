#!/bin/bash

echo "========================================"
echo "   KIWI E-COMMERCE - Quick Start"
echo "========================================"
echo ""

# Check Node.js
echo "Checking if Node.js is installed..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi
echo "[OK] Node.js is installed"
echo ""

# Check MySQL
echo "Checking if MySQL is running..."
if ! mysql -u root -e "SELECT 1" &> /dev/null; then
    echo "[WARNING] Cannot connect to MySQL"
    echo "Please make sure MySQL is running"
    echo ""
fi

echo ""
echo "========================================"
echo "   Starting Backend Server..."
echo "========================================"
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "[IMPORTANT] Please edit backend/.env with your database credentials!"
    echo ""
fi

echo "Starting API server on port 3000..."
echo ""
echo "Backend is running at: http://localhost:3000"
echo ""
echo "========================================"
echo "   NEXT STEPS:"
echo "========================================"
echo "1. Open VS Code"
echo "2. Install 'Live Server' extension"
echo "3. Right-click frontend/index.html"
echo "4. Select 'Open with Live Server'"
echo "5. Or open admin/index.html for admin panel"
echo ""
echo "Press Ctrl+C to stop the backend server"
echo "========================================"
echo ""

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000/api/products
elif command -v open &> /dev/null; then
    open http://localhost:3000/api/products
fi

npm start
