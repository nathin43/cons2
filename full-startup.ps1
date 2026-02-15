#!/usr/bin/env pwsh
# Electric Shop - Complete Startup Script
# This script ensures backend is running before starting frontend

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ELECTRIC SHOP - COMPLETE STARTUP SCRIPT" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BACKEND_PORT = 50004
$BACKEND_HEALTH_URL = "http://localhost:$BACKEND_PORT/api/health"
$FRONTEND_PORT = 3003
$BROWSER_URL = "http://localhost:$FRONTEND_PORT"
$MAX_WAIT_TIME = 60  # Maximum seconds to wait for backend
$HEALTH_CHECK_INTERVAL = 2  # Seconds between health checks

# Validation: Check for required .env files
Write-Host "📋 Checking configuration files..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "❌ ERROR: backend\.env file not found!" -ForegroundColor Red
    Write-Host "Create backend\.env with required variables:" -ForegroundColor Yellow
    Write-Host "  MONGODB_URI, JWT_SECRET, PORT=50004" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✅ backend\.env found" -ForegroundColor Green

if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "⚠️  frontend\.env.local not found. Creating..." -ForegroundColor Yellow
    @"
VITE_API_URL=http://localhost:50004
VITE_GOOGLE_CLIENT_ID=736784299634-41e6n7sk2253u5h8qs1kbkv0v7kfld60.apps.googleusercontent.com
"@ | Out-File -FilePath "frontend\.env.local" -Encoding UTF8 -Force
    Write-Host "✅ Created frontend\.env.local" -ForegroundColor Green
}

Write-Host ""

# Step 1: Install dependencies if needed
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    Push-Location "backend"
    npm install --legacy-peer-deps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    Push-Location "frontend"
    npm install --legacy-peer-deps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
}

Write-Host ""

# Step 2: Start Backend
Write-Host "🚀 Starting Backend Server on port $BACKEND_PORT..." -ForegroundColor Cyan
Write-Host "  (Running: cd backend && npm run dev)" -ForegroundColor Gray

Push-Location "backend"
$backendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow -PassThru
Pop-Location

Write-Host "⏳ Backend PID: $($backendProcess.Id)" -ForegroundColor Gray

# Step 3: Wait for backend to be ready
Write-Host ""
Write-Host "⏳ Waiting for backend to be ready (max $MAX_WAIT_TIME seconds)..." -ForegroundColor Yellow

$elapsedSeconds = 0
$backendReady = $false

while ($elapsedSeconds -lt $MAX_WAIT_TIME) {
    try {
        $response = Invoke-WebRequest -Uri $BACKEND_HEALTH_URL -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is ready!" -ForegroundColor Green
            $backendReady = $true
            break
        }
    } catch {
        # Backend not ready yet, wait and retry
    }
    
    Start-Sleep -Seconds $HEALTH_CHECK_INTERVAL
    $elapsedSeconds += $HEALTH_CHECK_INTERVAL
    Write-Host "  Checking... ($elapsedSeconds/$MAX_WAIT_TIME seconds)" -ForegroundColor Gray
}

if (-not $backendReady) {
    Write-Host "❌ ERROR: Backend failed to start after $MAX_WAIT_TIME seconds" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check backend\.env variables" -ForegroundColor Gray
    Write-Host "  2. Verify MongoDB connection string" -ForegroundColor Gray
    Write-Host "  3. Check if port $BACKEND_PORT is available" -ForegroundColor Gray
    Write-Host "  4. Run: npm run validate" -ForegroundColor Gray
    
    # Kill the backend process
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 4: Start Frontend
Write-Host "🎨 Starting Frontend Server on port $FRONTEND_PORT..." -ForegroundColor Cyan
Write-Host "  (Running: cd frontend && npm run dev)" -ForegroundColor Gray

Push-Location "frontend"
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow -PassThru
Pop-Location

Write-Host "⏳ Frontend PID: $($frontendProcess.Id)" -ForegroundColor Gray
Write-Host ""

# Step 5: Success message and open browser
Write-Host "================================================" -ForegroundColor Green
Write-Host "  ✅ ALL SYSTEMS READY!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:$BACKEND_PORT" -ForegroundColor Green
Write-Host "Frontend: http://localhost:$FRONTEND_PORT" -ForegroundColor Green
Write-Host ""
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

try {
    Start-Process $BROWSER_URL
    Write-Host "✅ Browser opened" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not open browser automatically" -ForegroundColor Yellow
    Write-Host "   Please visit: $BROWSER_URL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Yellow
Write-Host "  - Backend logs: Backend terminal" -ForegroundColor Gray
Write-Host "  - Frontend logs: Frontend terminal" -ForegroundColor Gray
Write-Host "  - Press Ctrl+C in either terminal to stop" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  - Close the terminal windows or press Ctrl+C" -ForegroundColor Gray
Write-Host ""

# Keep script running and monitor processes
Write-Host "Monitoring services..." -ForegroundColor Cyan
$scriptRunning = $true

try {
    while ($scriptRunning) {
        # Check if backend is still running
        if ($backendProcess.HasExited) {
            Write-Host ""
            Write-Host "❌ Backend process has stopped!" -ForegroundColor Red
            Write-Host "   PID: $($backendProcess.Id) - Exit Code: $($backendProcess.ExitCode)" -ForegroundColor Red
            
            # Kill frontend if still running
            if (-not $frontendProcess.HasExited) {
                Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
            }
            break
        }
        
        # Check if frontend is still running
        if ($frontendProcess.HasExited) {
            Write-Host ""
            Write-Host "⚠️  Frontend process has stopped!" -ForegroundColor Yellow
            Write-Host "   PID: $($frontendProcess.Id) - Exit Code: $($frontendProcess.ExitCode)" -ForegroundColor Yellow
            break
        }
        
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "Error monitoring services: $_" -ForegroundColor Red
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "🛑 Shutting down services..." -ForegroundColor Yellow
    
    if (-not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Backend stopped" -ForegroundColor Green
    }
    
    if (-not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Frontend stopped" -ForegroundColor Green
    }
    
    Write-Host "Done!" -ForegroundColor Green
}
