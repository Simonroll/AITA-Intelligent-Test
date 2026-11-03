@echo off
setlocal
cd /d "%~dp0"
title AITA - Start System with Dynamic Tunnel

echo ========================================================
echo        KHOI DONG HE THONG AITA-INTELLIGENT
echo ========================================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Khong tim thay Docker. Hay bat Docker Desktop truoc.
  pause
  exit /b 1
)

echo [1/5] Dang don dep cac tien trinh cu tren cong 5000, 5173, 5555...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":5000 :5173 :5555"') do (
    taskkill /PID %%a /T /F >nul 2>&1
)
taskkill /IM cloudflared.exe /F >nul 2>&1

echo [2/5] Dang khoi dong PostgreSQL va Redis...
docker compose up -d --wait postgres redis
if errorlevel 1 (
  echo [ERROR] Khong the khoi dong Docker containers.
  pause
  exit /b 1
)

echo [3/5] Dang cap nhat Database va Prisma Client...
call npm.cmd run db:setup
if errorlevel 1 (
  echo [ERROR] Loi cap nhat database.
  pause
  exit /b 1
)

echo [4/5] Dang khoi dong Backend API, Worker va Frontend Local...
start "AITA - Core Services" cmd /k "npm.cmd start"

echo [5/5] Dang khoi dong Cloudflare Tunnel Manager va cap nhat Registry...
start "AITA - Tunnel Manager" cmd /k "node scripts/tunnel-manager.cjs"

echo.
echo ========================================================
echo [THANH CONG] He thong dang khoi dong trong cac cua so rieng!
echo - Core Services: Backend (5000), Frontend (5173), Worker
echo - Tunnel Manager: Tu dong tim link Tunnel moi va day len Supabase Registry
echo.
echo Khi muon tat he thong, hay chay file Stop_AITA.bat (hoac stop-all.bat)
echo ========================================================
ping 127.0.0.1 -n 4 >nul
