@echo off
echo Starting Gemini CRM Servers...

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d backend && node server.js"

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this script (servers will continue running)...
pause >nul
