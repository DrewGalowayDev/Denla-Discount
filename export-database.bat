@echo off
REM Export Denla Discount Shop Database
REM This exports the complete database with all products, images, and data

echo ================================================
echo Denla Discount Shop - Database Export
echo ================================================
echo.

set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set EXPORT_FILE=denla_database_%TIMESTAMP%.sql

echo [1/3] Checking MySQL connection...
mysql -h localhost -u root -pHackifyoucan254 -e "SELECT 'Connection OK' as status;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot connect to MySQL
    echo Please ensure MySQL is running
    pause
    exit /b 1
)
echo ✓ MySQL connection OK
echo.

echo [2/3] Exporting database 'denla'...
echo This may take 1-2 minutes...
echo.

mysqldump -h localhost -u root -pHackifyoucan254 ^
  --databases denla ^
  --single-transaction ^
  --routines ^
  --triggers ^
  --events ^
  --add-drop-database ^
  --hex-blob ^
  --default-character-set=utf8mb4 ^
  --result-file=%EXPORT_FILE%

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Database export failed
    pause
    exit /b 1
)
echo ✓ Database exported successfully
echo.

echo [3/3] Verifying export file...
if not exist %EXPORT_FILE% (
    echo ERROR: Export file not found
    pause
    exit /b 1
)

for %%A in (%EXPORT_FILE%) do set FILESIZE=%%~zA
echo ✓ Export file created: %EXPORT_FILE%
echo ✓ File size: %FILESIZE% bytes
echo.

echo ================================================
echo SUCCESS! Database exported
echo ================================================
echo.
echo Export file: %EXPORT_FILE%
echo.
echo Next steps:
echo 1. Upload this file to your Contabo server using SCP:
echo    scp %EXPORT_FILE% root@your-server-ip:/tmp/
echo.
echo 2. On Contabo server, import using:
echo    docker exec -i CONTAINER_ID mysql -u denla -pHackifyoucan254 ^< /tmp/%EXPORT_FILE%
echo.
echo 3. Or use the import-to-contabo.bat script
echo.
pause
