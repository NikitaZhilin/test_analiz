# QWEN_CONTEXT — Проект "Сравнение Анализов"

## 📋 Описание проекта

Веб-приложение для отслеживания и сравнения медицинских анализов крови с возможностью импорта из PDF-файлов лабораторий (Инвитро, Гемотест).

**Основной функционал:**
- Импорт результатов анализов из PDF
- Автоматическое распознавание показателей
- Построение графиков динамики показателей
- Управление профилями пациентов
- Сравнение анализов за разные периоды

## 🛠 Технический стек

### Frontend
- **React 18** + TypeScript
- **Vite** (сборка)
- **Recharts** (графики)
- **React Router** (навигация)

### Backend
- **Python 3.11** + FastAPI
- **PostgreSQL 15** (БД)
- **SQLAlchemy 2.0** (ORM)
- **Alembic** (миграции)
- **PyMuPDF** (парсинг PDF)
- **Poetry** (менеджер зависимостей)

### DevOps
- **Docker** + Docker Compose
- **Nginx** (reverse proxy + static)
- **VPS Ubuntu 24.04** (77.239.103.15)

## 🚀 Запуск

### Локальная разработка

```bash
# Backend
cd backend
poetry install
poetry run uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# База данных (Docker)
docker compose -f backend/docker-compose.yml up -d db
```

### Production (VPS)

```bash
# SSH подключение
ssh deploy@77.239.103.15

# Перейти в директорию
cd /opt/analyses-app

# Обновить и пересобрать
git pull origin main
docker compose -f backend/docker-compose.prod.yml --env-file backend/.env.prod up -d --build

# Проверить логи
docker compose -f backend/docker-compose.prod.yml ps
docker logs backend-frontend-1 --tail 50
docker logs backend-backend-1 --tail 50
```

## 📍 Production окружение

| Параметр | Значение |
|----------|----------|
| **VPS IP** | 77.239.103.15 |
| **Путь** | `/opt/analyses-app` |
| **Пользователь** | `deploy` |
| **Docker Compose** | `backend/docker-compose.prod.yml` |
| **Env файл** | `backend/.env.prod` |
| **Домен** | http://77.239.103.15/ |

## 📁 Ключевые файлы

```
/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI приложение
│   │   ├── api/routes/          # API endpoints
│   │   ├── core/                # Конфиг, безопасность
│   │   ├── db/models/           # SQLAlchemy модели
│   │   ├── schemas/             # Pydantic схемы
│   │   └── services/importers/  # PDF парсеры
│   ├── docker-compose.prod.yml  # Production конфиг
│   ├── Dockerfile               # Backend образ
│   └── .env.prod                # Production переменные
├── frontend/
│   ├── src/
│   │   ├── pages/               # Страницы приложения
│   │   ├── components/          # React компоненты
│   │   ├── api/                 # API клиенты
│   │   └── styles.css           # Глобальные стили
│   ├── Dockerfile.prod          # Frontend образ
│   └── package.json
└── QWEN_*.md                    # Документация сессий
```

## ✅ Важные решения

1. **Тёмная премиальная тема** — единый визуальный стиль для всего приложения
2. **CSS переменные** — централизованное управление темой
3. **Унифицированные компоненты** — кнопки, alerts, формы, таблицы
4. **Docker Compose для прода** — единый файл для развёртывания
5. **Git-based деплой** — обновление через `git pull` + `docker compose up -d --build`

## ⚠️ Текущие проблемы/ограничения

1. **Аналиты API** — схема `AnalyteResponse` не включает `canonical_name` (только `id`, `display_name_ru`, `default_unit`)
2. **ImportWizard** — требует выбора аналитов для нераспознанных строк
3. **PDF парсинг** — поддерживает только форматы Инвитро/Гемотест
4. **Нет HTTPS** — пока только HTTP (77.239.103.15)

## 📝 Следующие шаги

1. ✅ Создать файлы памяти проекта (QWEN_CONTEXT, QWEN_TASKS, QWEN_LOG)
2. ⏳ Добавить HTTPS (Let's Encrypt)
3. ⏳ Улучшить парсинг PDF (другие лаборатории)
4. ⏳ Добавить экспорт данных (CSV/PDF)
5. ⏳ Unit-тесты для backend/frontend

## 🔐 Секреты

**НЕ КОММИТИТЬ:**
- `backend/.env.prod` — содержит пароли БД, JWT секреты
- `backend/.venv/` — виртуальное окружение
- `frontend/node_modules/` — зависимости
- `frontend/dist/` — билд

---

**Последнее обновление:** 2026-03-17 11:30 MSK
**Статус деплоя:** ✅ Работает (http://77.239.103.15/)
**Последний коммит:** `d9e0d6e` — Fix TypeScript errors
