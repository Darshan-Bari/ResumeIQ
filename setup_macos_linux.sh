#!/bin/bash
# ResumeIQ Setup Script for Mac/Linux

echo ""
echo "========================================"
echo "ResumeIQ - Intelligent Hiring Assistant"
echo "Setup Script for Mac/Linux"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: Node.js/npm is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Python and Node.js detected!"
echo ""

# Setup Backend
echo "Setting up Backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Back to parent directory
cd ..

echo ""
echo "Backend setup complete!"
echo ""

# Setup Frontend
echo "Setting up Frontend..."
cd frontend

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm install

cd ..

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python -m app.main"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Frontend will open at http://localhost:3000"
echo "Backend API at http://localhost:5000"
echo ""
