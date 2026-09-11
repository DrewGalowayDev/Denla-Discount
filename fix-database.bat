@echo off
REM Quick Database Fix Script for Windows
REM This script helps you fix the RLS policy issue

echo ========================================
echo  Database RLS Policy Fix Helper
echo ========================================
echo.

echo This script will help you fix the infinite recursion error.
echo.
echo You need to run this SQL command in your PostgreSQL database:
echo.
echo   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
echo.
echo ========================================
echo Options to run the fix:
echo ========================================
echo.
echo 1. If you have psql installed:
echo    psql -U postgres -d your_database_name -c "ALTER TABLE users DISABLE ROW LEVEL SECURITY;"
echo.
echo 2. If using pgAdmin:
echo    - Open pgAdmin
echo    - Connect to database
echo    - Query Tool (right-click database)
echo    - Run: ALTER TABLE users DISABLE ROW LEVEL SECURITY;
echo.
echo 3. If using backend code:
echo    - Add this to your backend startup code:
echo    - await pool.query('ALTER TABLE users DISABLE ROW LEVEL SECURITY');
echo.
echo ========================================
echo Press any key to open the full fix file...
pause >nul

notepad fix-rls-policy.sql
