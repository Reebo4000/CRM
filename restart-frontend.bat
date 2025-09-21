@echo off
echo 🔄 Restarting Frontend with Fixed Vite Configuration
echo.

echo 1️⃣ Stopping frontend container...
docker-compose -f docker-compose.dev.yml stop frontend

echo.
echo 2️⃣ Removing frontend container to force rebuild...
docker-compose -f docker-compose.dev.yml rm -f frontend

echo.
echo 3️⃣ Starting frontend container with new config...
docker-compose -f docker-compose.dev.yml up -d frontend

echo.
echo 4️⃣ Waiting for frontend to start...
timeout /t 15 /nobreak

echo.
echo 5️⃣ Checking container status...
docker-compose -f docker-compose.dev.yml ps frontend

echo.
echo 6️⃣ Showing frontend logs...
docker-compose -f docker-compose.dev.yml logs frontend

echo.
echo ✅ Frontend restarted! Try accessing:
echo https://chigger-definite-nominally.ngrok-free.app
echo.
echo Login credentials:
echo Email: reebo2004@gmail.com
echo Password: Reebo@2004
