@echo off
REM Jalankan Sistem Kas Kelas (backend + frontend production)
REM Pastikan MySQL di Workbench connection sistemKasKelas sedang running.
start "KasKelas-Backend" cmd /k "cd /d "%~dp0backend" && node src/server.js"
timeout /t 4 /nobreak >nul
start "KasKelas-Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"
timeout /t 6 /nobreak >nul
start http://localhost:3000/register
echo Sistem Kas Kelas dijalankan. Browser dibuka otomatis.
pause
