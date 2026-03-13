# Отчёт об автоочистке проекта

**Дата/время:** 13.03.2026  
**Тип проекта:** Python (FastAPI + Poetry) + Node.js (React + Vite)

---

## Что найдено

| Категория | Путь | Статус |
|-----------|------|--------|
| Node dependencies | `frontend\node_modules\` | Найдено |
| Build output | `frontend\dist\` | Найдено |
| Python venv | `backend\.venv\` | Не найдено |
| Python cache | `backend\**\__pycache__\` | 10 папок |
| Python compiled | `backend\**\*.pyc` | Найдено |

---

## Что удалено

| Путь | Причина |
|------|---------|
| `frontend\node_modules\` | Зависимости Node.js (восстанавливается через `npm install`) |
| `frontend\dist\` | Build output (восстанавливается через `npm run build`) |
| `backend\app\__pycache__\` | Python bytecode кэш |
| `backend\app\api\__pycache__\` | Python bytecode кэш |
| `backend\app\api\routes\__pycache__\` | Python bytecode кэш |
| `backend\app\core\__pycache__\` | Python bytecode кэш |
| `backend\app\db\__pycache__\` | Python bytecode кэш |
| `backend\app\db\models\__pycache__\` | Python bytecode кэш |
| `backend\app\schemas\__pycache__\` | Python bytecode кэш |
| `backend\app\scripts\__pycache__\` | Python bytecode кэш |
| `backend\app\services\__pycache__\` | Python bytecode кэш |
| `backend\app\services\importers\__pycache__\` | Python bytecode кэш |
| `backend\**\*.pyc` | Python compiled files |

---

## Что обнаружено, но НЕ удалено

| Путь | Статус | Примечание |
|------|--------|------------|
| `_quarantine\` | **KEEP** | Пользовательский карантин (optional для удаления) |
| `backend\.env` | **KEEP** | Файл окружения (SECURITY: содержит секреты) |
| `backend\.env.example` | **KEEP** | Шаблон окружения |
| `frontend\.env.example` | **KEEP** | Шаблон окружения |
| `backend\app\` | **KEEP** | Исходный код приложения |
| `frontend\src\` | **KEEP** | Исходный код приложения |
| `backend\alembic\` | **KEEP** | Миграции БД |
| `Примеры анализов\` | **KEEP** | Примеры PDF-файлов |
| `*.md`, `*.toml`, `*.json`, `*.yml` | **KEEP** | Конфиги и документация |

---

## Команды проверки после очистки

### Frontend
```powershell
cd frontend
npm install
npm run build
```

### Backend
```powershell
cd backend
poetry install
poetry run python -m compileall app
```

---

## Статус

✅ **Автоочистка завершена успешно**
