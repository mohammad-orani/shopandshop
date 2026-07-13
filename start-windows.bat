@echo off
echo ========================================
echo    SHOP AND SHOP - Quick Start
echo ========================================
echo.

echo Checking if Node.js is installed...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

echo Checking if MySQL is running...
mysql -u root -e "SELECT 1" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Cannot connect to MySQL
    echo Please make sure MySQL is running
    echo If using XAMPP, start MySQL from XAMPP Control Panel
    echo.
)

echo.
echo ========================================
echo    Starting Backend Server...
echo ========================================
cd backend

if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo [IMPORTANT] Please edit backend/.env with your database credentials!
    echo.
)

echo Starting API server on port 3000...
echo.
echo Backend is running at: http://localhost:3000
echo.
echo ========================================
echo    NEXT STEPS:
echo ========================================
echo 1. Open VS Code
echo 2. Install "Live Server" extension
echo 3. Right-click frontend/index.html
echo 4. Select "Open with Live Server"
echo 5. Or open admin/index.html for admin panel
echo.
echo Press Ctrl+C to stop the backend server
echo ========================================
echo.

start http://localhost:3000/api/products

call npm start
