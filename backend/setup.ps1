# ScriptED Backend Setup Script
# Run this to set up the complete backend environment

Write-Host "🎬 ScriptED Backend Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "1. Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Python not found! Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host ""
Write-Host "2. Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "   ✓ Virtual environment already exists" -ForegroundColor Green
} else {
    python -m venv venv
    Write-Host "   ✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "3. Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
Write-Host "   ✓ Virtual environment activated" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "4. Installing dependencies (this may take several minutes)..." -ForegroundColor Yellow
pip install --upgrade pip
pip install -r requirements.txt
Write-Host "   ✓ Dependencies installed" -ForegroundColor Green

# Download spaCy model
Write-Host ""
Write-Host "5. Downloading spaCy language model..." -ForegroundColor Yellow
python -m spacy download en_core_web_lg
Write-Host "   ✓ spaCy model downloaded" -ForegroundColor Green

# Create directories
Write-Host ""
Write-Host "6. Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "context_store" | Out-Null
New-Item -ItemType Directory -Force -Path "temp_uploads" | Out-Null
Write-Host "   ✓ Directories created" -ForegroundColor Green

# Create .env file
Write-Host ""
Write-Host "7. Setting up environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✓ .env file already exists" -ForegroundColor Green
} else {
    Copy-Item ".env.example" ".env"
    Write-Host "   ✓ .env file created from template" -ForegroundColor Green
}

# Final message
Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the server:" -ForegroundColor Yellow
Write-Host "   python main.py" -ForegroundColor White
Write-Host ""
Write-Host "Or with auto-reload for development:" -ForegroundColor Yellow
Write-Host "   uvicorn main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White
Write-Host ""
Write-Host "API Documentation will be available at:" -ForegroundColor Yellow
Write-Host "   http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
