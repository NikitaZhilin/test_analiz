# 🛠️ Локальная разработка

## 📋 Быстрый старт для разработки

### 1. Клонирование

```bash
git clone <your-repo-url> analyses-app-local
cd analyses-app-local
```

### 2. Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv .venv

# Активировать (Windows)
.venv\Scripts\activate

# Активировать (Linux/Mac)
source .venv/bin/activate

# Установить Poetry
pip install poetry

# Установить зависимости
poetry install

# Создать .env из примера
cp .env.example .env

# Запустить базу данных (Docker)
docker run -d -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=analyses -p 5432:5432 postgres:15

# Применить миграции
alembic upgrade head

# Создать тестовые данные
python -m app.scripts.seed

# Запустить сервер разработки
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd ../frontend

# Установить зависимости
npm install

# Создать .env
cp .env.example .env

# Запустить dev сервер
npm run dev
```

### 4. Открыть в браузере

```
http://localhost:5173
```

**Тестовые данные:**
- Email: `test@example.com`
- Пароль: `password123`

---

## 🔄 Workflow разработки

### Внесение изменений

1. **Создать ветку для фичи:**
```bash
git checkout -b feature/my-new-feature
```

2. **Внести изменения** в код

3. **Протестировать локально:**
```bash
# Backend тесты (если есть)
cd backend
pytest

# Frontend
cd frontend
npm run build
```

4. **Закоммитить:**
```bash
git add .
git commit -m "Add my new feature"
```

5. **Отправить в remote:**
```bash
git push origin feature/my-new-feature
```

### Слияние с production

1. **Создать Pull Request** на GitHub/GitLab

2. **Code review**

3. **Merge в main**

4. **Deploy на сервер:**
```bash
# На production сервере
cd /var/www/analyses-app
./deploy.sh
```

---

## 🐛 Отладка

### Backend логи

```bash
# В режиме разработки
uvicorn app.main:app --reload --log-level debug

# Просмотр логов
docker logs <container-id>
```

### Frontend отладка

```bash
# React DevTools в браузере
# Console: F12 → Console
# Network: F12 → Network

# Логирование API запросов
# См. frontend/src/api/client.ts (DEBUG = true)
```

### Database

```bash
# Подключиться к локальной БД
docker exec -it <postgres-container> psql -U postgres -d analyses

# Команды:
# \dt - показать таблицы
# SELECT * FROM users;
# \q - выйти
```

---

## 🧪 Тестирование

### Backend

```bash
cd backend
pytest
pytest --cov=app
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

---

## 📦 Docker для локальной разработки

Если не хотите устанавливать зависимости локально:

```bash
cd backend
docker-compose up --build
```

Backend будет доступен на `http://localhost:8000`

---

## 🔧 Частые проблемы

### "Module not found" на frontend

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### "Connection refused" к базе данных

```bash
# Проверить что БД запущена
docker ps | grep postgres

# Перезапустить
docker restart <postgres-container>
```

### "Port already in use"

```bash
# Найти процесс на порту
# Windows:
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :8000

# Убить процесс
taskkill /F /PID <pid>  # Windows
kill -9 <pid>           # Linux/Mac
```

### Миграции не применяются

```bash
# Сбросить и применить заново
alembic downgrade base
alembic upgrade head
```

---

## 📝 Environment переменные

### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analyses
SECRET_KEY=your-secret-key-for-development
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
LOG_LEVEL=DEBUG
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

---

## 🚀 Production vs Development

| Параметр | Development | Production |
|----------|-------------|------------|
| Backend порт | 8000 | 8000 (за nginx) |
| Frontend порт | 5173 (Vite) | 5174 (nginx) |
| Database | localhost:5432 | db:5432 (Docker network) |
| CORS | localhost | your-domain.com |
| Log level | DEBUG | INFO |
| Reload | Yes | No |
| HTTPS | No | Yes |

---

## 💡 Советы

1. **Используйте .env.local** для локальных настроек (он в .gitignore)
2. **Запускайте pre-commit хуки** для проверки кода
3. **Тестируйте изменения** перед коммитом
4. **Делайте маленькие коммиты** с понятными сообщениями
5. **Синхронизируйтесь с production** регулярно: `git pull origin main`
