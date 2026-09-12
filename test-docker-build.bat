@echo off
REM Test Docker Build Script for Denla Discount Shop
REM Run this before deploying to Coolify to ensure Docker build works

echo ================================================
echo Denla Discount Shop - Docker Build Test
echo ================================================
echo.

echo [1/5] Checking Docker installation...
docker --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://docker.com
    pause
    exit /b 1
)
echo ✓ Docker found
echo.

echo [2/5] Building Docker image...
echo This may take 2-5 minutes...
docker build -t denla-shop:test .
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker build failed
    echo Please check the error messages above
    pause
    exit /b 1
)
echo ✓ Docker image built successfully
echo.

echo [3/5] Checking if port 5000 is available...
netstat -ano | findstr :5000 > nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 5000 is already in use
    echo Please stop any service using port 5000 and try again
    pause
    exit /b 1
)
echo ✓ Port 5000 is available
echo.

echo [4/5] Starting container...
docker run -d ^
  --name denla-shop-test ^
  -p 5000:5000 ^
  -e NODE_ENV=production ^
  -e PORT=5000 ^
  -e DB_HOST=host.docker.internal ^
  -e DB_PORT=3306 ^
  -e DB_USER=denla ^
  -e DB_PASSWORD=Hackifyoucan254 ^
  -e DB_NAME=denla ^
  -e JWT_SECRET=test-jwt-secret-for-local-testing ^
  -e JWT_EXPIRES_IN=7d ^
  denla-shop:test

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start container
    pause
    exit /b 1
)
echo ✓ Container started
echo.

echo [5/5] Waiting for application to start (15 seconds)...
timeout /t 15 /nobreak > nul

echo Testing health endpoint...
curl -f http://localhost:5000/health
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Health check failed
    echo Showing container logs:
    docker logs denla-shop-test
    echo.
    echo Stopping container...
    docker stop denla-shop-test
    docker rm denla-shop-test
    pause
    exit /b 1
)
echo.
echo ✓ Health check passed!
echo.

echo ================================================
echo SUCCESS! Docker build and run test completed
echo ================================================
echo.
echo Container is running at: http://localhost:5000
echo.
echo Commands:
echo   View logs:    docker logs -f denla-shop-test
echo   Stop:         docker stop denla-shop-test
echo   Remove:       docker rm denla-shop-test
echo   Shell access: docker exec -it denla-shop-test sh
echo.
echo Press any key to view logs (Ctrl+C to exit logs)
pause > nul
docker logs -f denla-shop-test
