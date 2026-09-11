@echo off
echo.
echo ========================================
echo   M-Pesa Mock Server Launcher
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing...
    echo.
    call npm install
    echo.
)

REM Start the mock server
echo [INFO] Starting M-Pesa mock server...
echo.
echo Server will run on: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

node mock-mpesa-server.js

pause
