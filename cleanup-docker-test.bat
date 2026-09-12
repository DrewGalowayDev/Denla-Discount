@echo off
REM Cleanup Docker Test Containers and Images for Denla Discount Shop

echo ================================================
echo Denla Discount Shop - Docker Cleanup
echo ================================================
echo.

echo Stopping test container...
docker stop denla-shop-test 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Container stopped
) else (
    echo - Container not running
)
echo.

echo Removing test container...
docker rm denla-shop-test 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Container removed
) else (
    echo - Container not found
)
echo.

echo Removing test image...
docker rmi denla-shop:test 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Image removed
) else (
    echo - Image not found
)
echo.

echo ================================================
echo Cleanup complete!
echo ================================================
echo.
echo To clean up all unused Docker resources:
echo   docker system prune -a
echo.
pause
