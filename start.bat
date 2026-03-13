@echo off
chcp 65001 >nul
echo ============================================
echo   Запуск проекта "Сравнение Анализов"
echo ============================================
echo.

cd /d "%~dp0"

REM Проверка Docker
echo [1/5] Проверка Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker не запущен! Запустите Docker Desktop.
    pause
    exit /b 1
)
echo OK: Docker работает
echo.

REM Запуск PostgreSQL
echo [2/5] Запуск PostgreSQL...
docker-compose -f backend\docker-compose.yml up -d db >nul 2>&1
timeout /t 5 /nobreak >nul
echo OK: PostgreSQL запущен
echo.

REM Применение миграций
echo [3/5] Применение миграций...
cd backend
call poetry run alembic upgrade head 2>nul
if errorlevel 1 (
    echo WARNING: Миграции не применены (возможно, уже применены)
)
cd ..
echo.

REM Seed (опционально)
echo [4/5] Проверка тестовых данных...
call poetry run python -m app.scripts.seed 2>nul
if errorlevel 1 (
    echo WARNING: Seed не выполнен (возможно, данные уже есть)
)
echo.

REM Запуск Backend
echo [5/5] Запуск Backend и Frontend...
echo.
echo ============================================
echo   Backend: http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Для остановки нажмите Ctrl+C
echo.

REM Запуск в двух окнах
start "Backend" cmd /k "cd backend && poetry run uvicorn app.main:app --reload"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Проект запущен!
echo.
echo Чтобы остановить:
echo   1. Закрой окна Backend и Frontend
echo   2. Или выполни: docker-compose -f backend\docker-compose.yml down
echo.
pause
