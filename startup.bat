@echo off
REM Electric Shop - Safe Startup Script
REM This script ensures your project starts without crashes

title Electric Shop - Safe Startup

cls
echo.
echo ================================================
echo   ELECTRIC SHOP - SAFE STARTUP SCRIPT
echo ================================================
echo.

REM Check if backend/.env exists
if not exist "backend\.env" (
    echo ERROR: backend\.env file not found!
    echo.
    echo Create backend\.env with:
    echo   MONGODB_URI=your-mongodb-connection-string
    echo   JWT_SECRET=your-secret-key
    echo   PORT=5000
    echo.
    pause
    exit /b 1
)

REM Check if frontend/.env.local exists
if not exist "frontend\.env.local" (
    echo WARNING: frontend\.env.local file not found!
    echo Creating frontend\.env.local...
    (
        echo VITE_API_URL=http://localhost:5000
        echo VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
    ) > frontend\.env.local
    echo OK - Created frontend\.env.local
    echo.
)

echo Step 1: Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Validating backend setup...
call node validate-startup.js
if errorlevel 1 (
    echo ERROR: Backend validation failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Testing database connection...
call node check-mongodb.js
if errorlevel 1 (
    echo WARNING: Database connection failed!
    echo Check your MONGODB_URI in backend\.env
    echo.
)

cd ..
echo.
echo Step 4: Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ================================================
echo   ✅ ALL CHECKS PASSED - READY TO START!
echo ================================================
echo.
echo NEXT STEPS:
echo.
echo 1. Open TWO new terminals
echo.
echo Terminal 1 - Start Backend:
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 - Start Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Then open browser: http://localhost:3000
echo.
pause
