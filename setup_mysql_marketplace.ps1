# Quick Setup Script for Land Marketplace MySQL Database
# Run this in PowerShell

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Ropani AI - Land Marketplace MySQL Setup" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
# MySQL Configuration for Land Marketplace
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=ropani_marketplace

# Existing configurations...
"@
    
    Add-Content -Path ".env" -Value $envContent
    Write-Host "✅ .env file created. Please edit it and add your MySQL password!" -ForegroundColor Green
    Write-Host ""
    
    # Open .env in notepad
    notepad .env
    
    $continue = Read-Host "Have you added your MySQL password in .env? (y/n)"
    if ($continue -ne "y") {
        Write-Host "❌ Setup cancelled. Please update .env and run this script again." -ForegroundColor Red
        exit
    }
}

Write-Host "Step 1: Installing Python dependencies..." -ForegroundColor Cyan
pip install pymysql cryptography
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Some dependencies may have failed to install" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 2: Initializing MySQL database..." -ForegroundColor Cyan
python init_mysql_db.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database initialized successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Database initialization failed. Please check:" -ForegroundColor Red
    Write-Host "   - MySQL is running" -ForegroundColor Yellow
    Write-Host "   - Correct password in .env file" -ForegroundColor Yellow
    Write-Host "   - MySQL port 3306 is available" -ForegroundColor Yellow
    exit
}
Write-Host ""

Write-Host "Step 3: Testing API connection..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/marketplace/stats" -Method GET -ErrorAction Stop
    Write-Host "✅ API is responding!" -ForegroundColor Green
    Write-Host "   Active Listings: $($response.total_active_listings)" -ForegroundColor White
    Write-Host "   Sold Properties: $($response.sold_properties)" -ForegroundColor White
} catch {
    Write-Host "⚠️  Backend is not running. Start it with:" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d" -ForegroundColor White
    Write-Host "   OR" -ForegroundColor White
    Write-Host "   uvicorn app.main:app --reload" -ForegroundColor White
}
Write-Host ""

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! 🎉" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Ensure backend is running: docker-compose up -d" -ForegroundColor White
Write-Host "2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Open browser: http://localhost:3000/marketplace" -ForegroundColor White
Write-Host ""
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Database: ropani_marketplace on MySQL" -ForegroundColor Cyan
Write-Host ""
Write-Host "View setup guide: MYSQL_SETUP_GUIDE.md" -ForegroundColor Magenta
Write-Host ""
