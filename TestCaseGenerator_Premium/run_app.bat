@echo off
echo ==========================================
echo    AI Test Crafter - Premium Edition
echo ==========================================
echo.

echo [1/3] Checking dependencies...
pip install -r requirements.txt

echo.
echo [2/3] Starting Backend (FastAPI)...
echo Backend will run at http://localhost:8000
start /b python backend/main.py

echo.
echo [3/3] Opening Frontend...
echo Frontend will open in your default browser.
timeout /t 3
start frontend/index.html

echo.
echo System started successfully!
echo Close this window to stop (note: backend runs in background).
pause
