@echo off
chcp 65001 >nul
echo ============================================
echo   Остановка проекта "Сравнение Анализов"
echo ============================================
echo.

cd /d "%~dp0"

echo [1/2] Остановка Docker контейнеров...
docker-compose -f backend\docker-compose.yml down
echo.

echo [2/2] Остановка процессов...
taskkill /F /FI "WINDOWTITLE eq Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend*" >nul 2>&1

echo.
echo ============================================
echo   Проект остановлен
echo ============================================
echo.
pause
