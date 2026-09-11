@echo off
echo ========================================
echo   POS System - Database Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
echo.

echo Step 2: Creating database and tables...
call node database/init-database.js
echo.

echo Step 3: Seeding sample data...
call node database/seed-data.js
echo.

echo Step 4: Creating admin users...
call node database/create-admin.js
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo You can now start the server with: npm run dev
echo.
pause
