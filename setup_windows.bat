@echo off
REM ResumeIQ Setup Script for Windows

echo.
echo ========================================
echo ResumeIQ - Intelligent Hiring Assistant
echo Setup Script for Windows
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if Node.js is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js/npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Python and Node.js detected!
echo.

REM Setup Backend
echo Setting up Backend...
cd backend

REM Create virtual environment
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Back to parent directory
cd ..

echo.
echo Backend setup complete!
echo.

REM Setup Frontend
echo Setting up Frontend...
cd frontend

REM Install npm dependencies
echo Installing Node.js dependencies...
call npm install

cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   venv\Scripts\activate
echo   python -m app.main
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm start
echo.
echo Frontend will open at http://localhost:3000
echo Backend API at http://localhost:5000
echo.
pause
