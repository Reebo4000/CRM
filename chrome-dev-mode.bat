@echo off
echo Starting Chrome in Development Mode (CORS Disabled)...
echo.
echo WARNING: This disables security features - only use for development!
echo.

REM Close existing Chrome instances
taskkill /f /im chrome.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start Chrome with disabled security
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\temp\chrome-dev" --disable-web-security --disable-features=VizDisplayCompositor --allow-running-insecure-content --disable-site-isolation-trials --disable-features=BlockInsecurePrivateNetworkRequests http://localhost:5173

echo Chrome started in development mode
echo You can now access: http://localhost:5173
pause
