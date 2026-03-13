# Сравнение Анализов

Система для визуального отслеживания динамики медицинских анализов.

## 📚 Документация

- **[📋 PROJECT_STATUS.md](PROJECT_STATUS.md)** — ⭐ ТЕКУЩИЙ СТАТУС (начните отсюда!)
- **[📖 DEPLOYMENT.md](DEPLOYMENT.md)** — Инструкция по развёртыванию и хостингу
- **[🛠️ LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)** — Локальная разработка
- **[🔐 SECURITY_AUDIT.md](SECURITY_AUDIT.md)** — Аудит безопасности

## Возможности

- ✅ Регистрация/авторизация (JWT access + refresh)
- ✅ Несколько профилей пациентов на аккаунт
- ✅ Сдачи анализов с результатами
- ✅ Импорт из CSV/XLSX с распознаванием показателей
- ✅ Графики динамики по показателям (Recharts)
- ✅ Флаги LOW/HIGH/NORMAL по референсам
- ✅ Обработка ошибок и логирование
- ✅ Индикатор доступности сервера

## Структура

```
сравнение анализов/
├── backend/           # FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── api/       # API routes
│   │   ├── core/      # Config, security
│   │   ├── db/        # Models, session
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── scripts/   # Seed script
│   ├── alembic/       # Миграции
│   └── docker-compose.yml
└── frontend/          # React + TypeScript + Vite
    ├── src/
    │   ├── api/       # API clients
    │   ├── components/
    │   └── pages/
    └── package.json
```

## Быстрый старт

### 1. Запуск backend (Docker)

```bash
cd backend
docker-compose up --build -d
```

Дождаться запуска PostgreSQL и backend (~30 сек).

### 2. Применить миграции

```bash
docker-compose exec backend alembic upgrade head
```

### 3. Создать тестовые данные (опционально)

```bash
docker-compose exec backend python -m app.scripts.seed
```

Будет создано:
- Пользователь: `test@example.com` / `password123`
- Профили: "Я", "Миша"
- Показатели: Гемоглобин, Ферритин, АЛТ

### 4. Запуск frontend

```bash
cd frontend
npm install
npm run dev
```

**Frontend:** http://localhost:5173  
**Backend API:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

---

## Локальная разработка (без Docker)

### Backend

```bash
cd backend

# Установить Poetry и зависимости
pip install poetry
poetry install

# Создать .env
cp .env.example .env

# Запустить PostgreSQL (Docker)
docker run -d -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=analyses \
  -p 5432:5432 \
  postgres:15

# Применить миграции
alembic upgrade head

# Seed (опционально)
python -m app.scripts.seed

# Запустить сервер
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

---

## API Endpoints

### Auth
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/refresh` | Обновление токена |
| GET | `/api/auth/me` | Текущий пользователь |

### Profiles
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/profiles` | Список профилей |
| POST | `/api/profiles` | Создать профиль |
| PUT | `/api/profiles/:id` | Обновить профиль |
| DELETE | `/api/profiles/:id` | Удалить профиль |

### Reports
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/reports/profile/:profileId` | Список отчётов |
| POST | `/api/reports/profile/:profileId` | Создать отчёт |
| GET | `/api/reports/:id` | Детали отчёта |
| PUT | `/api/reports/:id` | Обновить отчёт |
| DELETE | `/api/reports/:id` | Удалить отчёт |
| POST | `/api/reports/:id/results/bulk` | Bulk upsert результатов |

### Analytes
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/analytes` | Справочник показателей |
| POST | `/api/analytes` | Создать показатель |
| GET | `/api/analytes/match?name=...` | Поиск по названию |
| GET | `/api/analytes/profile/:profileId` | Показатели профиля |
| GET | `/api/analytes/profile/:profileId/:analyteId/series` | Динамика показателя |

### Import
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/import/profile/:profileId/preview` | Preview импорта (multipart) |
| POST | `/api/import/profile/:profileId/confirm` | Confirm импорта |

---

## Тестирование импорта

Создайте CSV файл:

```csv
analyte,value,unit,ref_low,ref_high
Гемоглобин,145.5,г/л,130,160
Лейкоциты,6.5,10^9/л,4,9
Ферритин,50,нг/мл,30,400
```

Или XLSX с аналогичной структурой.

---

## Команды

### Backend

```bash
# Запуск через Docker
cd backend && docker-compose up --build

# Миграции
docker-compose exec backend alembic upgrade head
docker-compose exec backend alembic revision --autogenerate -m "description"

# Seed
docker-compose exec backend python -m app.scripts.seed

# Логи
docker-compose logs -f backend
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Dev-сервер
npm run build    # Сборка
npm run preview  # Preview сборки
```

---

## Обработка ошибок и отладка

### Frontend

#### Логи API клиента
В `src/api/client.ts` включено логирование (DEBUG = true). Логи отображаются в консоли браузера с префиксом `[API Client]`.

#### Отладка на странице входа
На странице `/login` есть:
- Блок с тестовыми данными
- Раскрывающийся список "Отладочная информация" с логами попытки входа
- Кнопка очистки лога

#### Просмотрщик ошибок
В правом нижнем углу приложения отображается кнопка ⚠️:
- **Серая** — ошибок нет
- **Красная** — есть сохранённые ошибки

При клике открывается панель с:
- Списком всех ошибок с временными метками
- Stack trace для каждой ошибки
- Кнопками обновления и очистки

#### Глобальные обработчики
В `src/main.tsx` установлены обработчики:
- `window.onerror` — перехватывает ошибки выполнения
- `window.onunhandledrejection` — перехватывает необработанные Promise

Ошибки сохраняются в `localStorage.error_log` (последние 50).

#### Индикатор сервера
Если backend недоступен, сверху отображается красная полоса с предупреждением.

### Backend

Логи backend отображаются в Docker контейнере:
```bash
docker-compose -f backend/docker-compose.yml logs -f backend
```

### Частые ошибки и решения

| Ошибка | Причина | Решение |
|--------|---------|---------|
| "Нет соединения с сервером" | Backend не запущен | `docker-compose up -d` |
| "Неверный email или пароль" | Ошибка учётных данных | Используйте test@example.com / password123 |
| "Not authenticated" | Токен истёк | Выйдите и войдите заново |
| "CORS policy" | Неправильный порт | Frontend должен быть на localhost:5173 |

---

## Тестовые данные (после seed)

```
Email: test@example.com
Пароль: password123

Профили:
  - Я
  - Миша

Показатели:
  - Гемоглобин (HGB, Hb) — г/л
  - Ферритин (Ferritin) — нг/мл
  - АЛТ (ALT) — Ед/л
```
