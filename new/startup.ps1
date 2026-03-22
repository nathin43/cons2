#!/usr/bin/env pwsh
# Electric Shop - Safe Startup Script for PowerShell

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ELECTRIC SHOP - SAFE STARTUP SCRIPT" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend/.env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "ERROR: backend\.env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create backend\.env with:" -ForegroundColor Yellow
    Write-Host "  MONGODB_URI=your-mongodb-connection-string"
    Write-Host "  JWT_SECRET=your-secret-key"
    Write-Host "  PORT=5000"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if frontend/.env.local exists
if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "Creating frontend\.env.local..." -ForegroundColor Yellow
    @"
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
"@ | Out-File -FilePath "frontend\.env.local" -Encoding UTF8
    Write-Host "OK - Created frontend\.env.local" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Install backend dependencies
Write-Host "Step 1: Installing backend dependencies..." -ForegroundColor Cyan
Push-Location "backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install backend dependencies" -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Validate backend setup
Write-Host ""
Write-Host "Step 2: Validating backend setup..." -ForegroundColor Cyan
node validate-startup.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend validation failed!" -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Test database connection
Write-Host ""
Write-Host "Step 3: Testing database connection..." -ForegroundColor Cyan
node check-mongodb.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Database connection failed!" -ForegroundColor Yellow
    Write-Host "Check your MONGODB_URI in backend\.env"
    Write-Host ""
}

Pop-Location

# Step 4: Install frontend dependencies
Write-Host ""
Write-Host "Step 4: Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location "frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install frontend dependencies" -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location

# Success!
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  ✅ ALL CHECKS PASSED - READY TO START!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Open TWO new PowerShell terminals" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1 - Start Backend:" -ForegroundColor Green
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 2 - Start Frontend:" -ForegroundColor Green
Write-Host "  cd frontend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then open browser: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter when ready"
