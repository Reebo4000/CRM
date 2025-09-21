@echo off
echo Clearing Chrome Cache and Data...
echo.

REM Close Chrome
echo Closing Chrome...
taskkill /f /im chrome.exe >nul 2>&1

REM Wait
timeout /t 3 /nobreak >nul

REM Clear Chrome cache directories
echo Clearing cache directories...
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache" >nul 2>&1
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Code Cache" >nul 2>&1
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\GPUCache" >nul 2>&1
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker" >nul 2>&1
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Application Cache" >nul 2>&1

echo Cache cleared!
echo.
echo Starting Chrome...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" http://localhost:5173

echo Done! Chrome restarted with cleared cache.
pause
