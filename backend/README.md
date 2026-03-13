# Analyses Tracker Backend

Backend для системы отслеживания динамики медицинских анализов.

## Стек

- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Alembic
- JWT (python-jose)

## Запуск

### Через Docker Compose

```bash
docker-compose up --build
```

Backend: http://localhost:8000
API Docs: http://localhost:8000/docs

### Локальная разработка

1. Установите зависимости:
```bash
poetry install
```

2. Создайте `.env` из `.env.example`:
```bash
cp .env.example .env
```

3. Запустите PostgreSQL (например, через Docker):
```bash
docker run -d -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=analyses -p 5432:5432 postgres:15
```

4. Примените миграции:
```bash
alembic upgrade head
```

5. Запустите сервер:
```bash
uvicorn app.main:app --reload
```

## Миграции

```bash
# Создать новую миграцию
alembic revision --autogenerate -m "description"

# Применить миграции
alembic upgrade head

# Откатить миграцию
alembic downgrade -1
```

## API Endpoints

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/me` - Текущий пользователь
- `GET /api/profiles` - Список профилей
- `POST /api/profiles` - Создать профиль
- `GET /api/profiles/{id}` - Профиль
- `PUT /api/profiles/{id}` - Обновить профиль
- `DELETE /api/profiles/{id}` - Удалить профиль
- `GET /api/reports/profile/{profile_id}` - Список отчётов профиля
- `POST /api/reports/profile/{profile_id}` - Создать отчёт
- `GET /api/reports/{id}` - Детали отчёта
- `PUT /api/reports/{id}` - Обновить отчёт
- `DELETE /api/reports/{id}` - Удалить отчёт
- `POST /api/reports/{id}/results/bulk` - Bulk upsert результатов
- `GET /api/analytes` - Список справочника
- `POST /api/analytes` - Создать показатель
- `GET /api/analytes/match?name=...` - Поиск по названию
- `GET /api/analytes/profile/{profile_id}` - Показатели профиля
- `GET /api/analytes/profile/{profile_id}/{analyte_id}/series` - Динамика
- `POST /api/import/profile/{profile_id}/preview` - Preview импорта
- `POST /api/import/profile/{profile_id}/confirm` - Confirm импорта
