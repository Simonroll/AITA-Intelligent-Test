@echo off
setlocal
cd /d "%~dp0"
title AITA - Stop All

echo ========================================================
echo        DANG TAT TOAN BO HE THONG AITA-INTELLIGENT
echo ========================================================
echo.

echo [1/4] Dang cap nhat trang thai OFFLINE len Supabase Registry...
call node scripts/tunnel-manager.cjs --offline

echo [2/4] Dang dung tien trinh Web, Worker va Cloudflare Tunnel...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":5000 :5173 :5555"') do (
    taskkill /PID %%a /T /F >nul 2>&1
)
taskkill /IM cloudflared.exe /F >nul 2>&1

echo [3/4] Dang dung containers Docker (Postgres va Redis)...
where docker >nul 2>&1
if not errorlevel 1 (
    docker compose stop postgres redis >nul 2>&1
)

echo [4/4] Kiem tra trang thai cong:
netstat -ano | findstr "LISTENING" | findstr ":5000 :5173 :5555" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [THANH CONG] Toan bo he thong da duoc tat an toan!
    echo Registry da duoc danh dau OFFLINE de bao cho Frontend Vercel.
) else (
    echo.
    echo [CANH BAO] Van con tien trinh chiem cong.
)

echo.
ping 127.0.0.1 -n 3 >nul
