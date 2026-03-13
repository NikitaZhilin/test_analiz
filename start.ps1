#!/usr/bin/env pwsh
# Запуск проекта "Сравнение Анализов"

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Запуск проекта 'Сравнение Анализов'" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $projectRoot

# Проверка Docker
Write-Host "[1/6] Проверка Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "OK: Docker работает" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker не запущен! Запустите Docker Desktop." -ForegroundColor Red
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

# Запуск PostgreSQL
Write-Host ""
Write-Host "[2/6] Запуск PostgreSQL..." -ForegroundColor Yellow
docker-compose -f backend\docker-compose.yml up -d db | Out-Null
Start-Sleep -Seconds 5
Write-Host "OK: PostgreSQL запущен" -ForegroundColor Green

# Проверка БД
Write-Host ""
Write-Host "[3/6] Ожидание готовности БД..." -ForegroundColor Yellow
$retryCount = 0
while ($retryCount -lt 10) {
    $result = docker-compose -f backend\docker-compose.yml exec -T db pg_isready 2>$null
    if ($result -like "*accepting connections*") {
        Write-Host "OK: БД готова" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
    $retryCount++
}

# Применение миграций
Write-Host ""
Write-Host "[4/6] Применение миграций..." -ForegroundColor Yellow
Set-Location backend
try {
    poetry run alembic upgrade head | Out-Null
    Write-Host "OK: Миграции применены" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Миграции уже применены" -ForegroundColor Yellow
}

# Seed
Write-Host ""
Write-Host "[5/6] Создание тестовых данных..." -ForegroundColor Yellow
try {
    poetry run python -m app.scripts.seed
    Write-Host "OK: Тестовые данные созданы" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Данные уже существуют" -ForegroundColor Yellow
}

Set-Location $projectRoot

# Запуск Backend
Write-Host ""
Write-Host "[6/6] Запуск серверов..." -ForegroundColor Yellow

$backendScript = @'
cd backend
poetry run uvicorn app.main:app --reload
'@

$frontendScript = @'
cd frontend
npm run dev
'@

# Запуск в отдельных окнах
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -WindowStyle Normal
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript -WindowStyle Normal

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Проект запущен!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Вход:" -ForegroundColor Cyan
Write-Host "    Email: test@example.com" -ForegroundColor White
Write-Host "    Пароль: password123" -ForegroundColor White
Write-Host ""
Write-Host "  Для остановки:" -ForegroundColor Yellow
Write-Host "    1. Закрой окна Backend и Frontend" -ForegroundColor White
Write-Host "    2. Или выполни: .\stop.ps1" -ForegroundColor White
Write-Host ""
Read-Host "Нажмите Enter для завершения"
