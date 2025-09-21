@echo off
echo 🔧 Fixing Mobile Network Access Issue
echo.

echo 1️⃣ Stopping all Docker containers...
docker-compose -f docker-compose.dev.yml down

echo.
echo 2️⃣ Removing old containers to force rebuild...
docker-compose -f docker-compose.dev.yml rm -f

echo.
echo 3️⃣ Starting Docker containers with nginx proxy...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo 4️⃣ Waiting for services to start...
timeout /t 45 /nobreak

echo.
echo 5️⃣ Checking container status...
docker-compose -f docker-compose.dev.yml ps

echo.
echo 6️⃣ Testing the setup...
echo Frontend and API should both be accessible at: https://chigger-definite-nominally.ngrok-free.app
echo.
echo 7️⃣ Test login with:
echo Email: reebo2004@gmail.com
echo Password: Reebo@2004
echo.
echo 8️⃣ The app should now work on mobile networks!
echo.

echo 9️⃣ Showing logs (press Ctrl+C to exit)...
docker-compose -f docker-compose.dev.yml logs -f
