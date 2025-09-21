@echo off
echo Checking Gemini CRM Servers...

echo.
echo Checking Backend Server (http://localhost:5000)...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend Server is running
) else (
    echo ✗ Backend Server is NOT running
)

echo.
echo Checking Frontend Server (http://localhost:5173)...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend Server is running
) else (
    echo ✗ Frontend Server is NOT running
)

echo.
pause
