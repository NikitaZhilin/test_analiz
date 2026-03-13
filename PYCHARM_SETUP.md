# Настройка и запуск проекта в PyCharm

## 📋 Содержание

1. [Требования](#требования)
2. [Настройка Backend (Python/FastAPI)](#настройка-backend-pythonfastapi)
3. [Настройка Frontend (Node.js/React)](#настройка-frontend-nodejsreact)
4. [Настройка PostgreSQL](#настройка-postgresql)
5. [Запуск проекта](#запуск-проекта)
6. [Отладка](#отладка)
7. [Полезные команды](#полезные-команды)
8. [Возможные проблемы](#возможные-проблемы)

---

## Требования

### Обязательные
- **PyCharm Professional** (рекомендуется) или Community
- **Python 3.11+** (проверить: `python --version`)
- **Node.js 18+** (проверить: `node --version`)
- **Docker Desktop** (для PostgreSQL)

### Проверка установленных компонентов

Открой Terminal в PyCharm и выполни:
```bash
python --version
node --version
npm --version
docker --version
```

Если чего-то нет — установи:
- Python: https://www.python.org/downloads/
- Node.js: https://nodejs.org/
- Docker: https://www.docker.com/products/docker-desktop/

---

## Настройка Backend (Python/FastAPI)

### Шаг 1: Открытие проекта

1. Запусти PyCharm
2. `File → Open`
3. Выбери папку: `D:\проекты qwen\сравнение анализов`
4. Нажми **OK**

### Шаг 2: Настройка Python Interpreter

1. `File → Settings` (или `Ctrl+Alt+S`)
2. Перейди: `Project → Python Interpreter`
3. Нажми `⚙️ → Add...`

#### Вариант A: Poetry (рекомендуется)
1. Выбери **Poetry** в списке
2. Укажи путь к Poetry (если не нашёл автоматически):
   - Windows: `C:\Users\%USERNAME%\AppData\Roaming\Python\Python311\Scripts\poetry.exe`
3. Нажми **OK**

#### Вариант B: System Interpreter
1. Выбери **System Interpreter**
2. Выбери Python 3.11+ из списка
3. Нажми **OK**

### Шаг 3: Установка зависимостей

Открой Terminal в PyCharm (внизу экрана) и выполни:

```bash
cd backend
poetry install
```

Если используешь pip вместо Poetry:
```bash
cd backend
pip install -r requirements.txt
```

> ⚠️ **Примечание:** Файл `requirements.txt` нужно создать, если используешь pip:
> ```bash
> cd backend
> pip freeze > requirements.txt
> ```

### Шаг 4: Создание файла .env

1. В Project view (слева) найди `backend\.env.example`
2. Кликни правой кнопкой → `Copy` → вставь в ту же папку
3. Переименуй копию в `.env`

Или через Terminal:
```bash
cd backend
copy .env.example .env
```

### Шаг 5: Настройка конфигурации запуска

1. `Run → Edit Configurations...` (или `Ctrl+Alt+S` → Build, Execution, Deployment → Run/Debug Configurations)
2. Нажми `+` → выбери **Python**
3. Заполни поля:

| Поле | Значение |
|------|----------|
| **Name** | `Backend` |
| **Script path** | `D:\проекты qwen\сравнение анализов\backend\app\main.py` |
| **Working directory** | `D:\проекты qwen\сравнение анализов\backend` |
| **Environment variables** | См. ниже |

4. Для **Environment variables** нажми `...` и добавь:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analyses
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:5173
```

5. Поставь галочку **Store as project file** (опционально)
6. Нажми **Apply** → **OK**

---

## Настройка Frontend (Node.js/React)

### Шаг 1: Установка зависимостей

Открой Terminal в PyCharm и выполни:

```bash
cd frontend
npm install
```

> ⚠️ Если ошибка — обнови npm:
> ```bash
> npm install -g npm@latest
> ```

### Шаг 2: Настройка конфигурации запуска

1. `Run → Edit Configurations...`
2. Нажми `+` → выбери **npm**
3. Заполни поля:

| Поле | Значение |
|------|----------|
| **Name** | `Frontend` |
| **Command** | `run dev` |
| **Working directory** | `D:\проекты qwen\сравнение анализов\frontend` |
| **package.json** | (должен определиться автоматически) |

4. Нажми **Apply** → **OK**

---

## Настройка PostgreSQL

### Вариант 1: Docker (рекомендуется)

#### Через Terminal
```bash
cd backend
docker-compose up -d db
```

#### Через Docker Desktop
1. Открой Docker Desktop
2. Найди контейнер `backend-db-1`
3. Убедись, что статус **Running**

#### Проверка подключения
```bash
docker ps
# Должен видеть контейнер с postgres:15
```

### Вариант 2: Подключение базы данных в PyCharm

1. `View → Tool Windows → Database` (справа)
2. Нажми `+` → `Data Source` → `PostgreSQL`
3. Заполни:
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `analyses`
   - **User:** `postgres`
   - **Password:** `postgres`
4. Нажми **Test Connection** → **OK**

---

## Запуск проекта

### Шаг 1: Применение миграций

Открой Terminal в PyCharm:
```bash
cd backend
alembic upgrade head
```

> ⚠️ Если ошибка `alembic: command not found`:
> ```bash
> poetry run alembic upgrade head
> ```
> или
> ```bash
> python -m alembic upgrade head
> ```

### Шаг 2: Создание тестовых данных (Seed)

```bash
cd backend
python -m app.scripts.seed
```

> ⚠️ Если ошибка — проверь, что миграции применены.

### Шаг 3: Запуск Backend и Frontend

#### Через Run Dashboard (рекомендуется)
1. `View → Tool Windows → Run Dashboard`
2. Найди конфигурации `Backend` и `Frontend`
3. Выдели обе (Ctrl+клик)
4. Нажми зелёную кнопку **Run** (или `Shift+F10`)

#### По отдельности
1. Выбери `Backend` в списке конфигураций
2. Нажми `Shift+F10` (или зелёный треугольник)
3. Выбери `Frontend` в списке конфигураций
4. Нажми `Shift+F10`

### Шаг 4: Проверка

Открой в браузере:
- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://localhost:8000/docs
- **Backend Health:** http://localhost:8000/health

**Вход в систему:**
- Email: `test@example.com`
- Пароль: `password123`

---

## Отладка

### Backend (Python)

1. Открой файл, например `backend/app/api/routes/auth.py`
2. Кликни на поле слева от номера строки — появится **красная точка** (breakpoint)
3. Выбери конфигурацию `Backend`
4. Нажми `Shift+F9` (Debug)
5. Сделай запрос в API — выполнение остановится на breakpoint

#### Просмотр переменных
- Во время отладки открой `Debug` window (внизу)
- Вкладка **Variables** покажет все переменные
- Можно менять значения на лету

### Frontend (TypeScript/React)

#### Вариант 1: Отладка в PyCharm
1. Открой файл, например `frontend/src/pages/Login.tsx`
2. Поставь breakpoint (красная точка)
3. Выбери конфигурацию `Frontend`
4. Нажми `Shift+F9`
5. Открой http://localhost:5173 в браузере
6. Выполни действие — breakpoint сработает

#### Вариант 2: Chrome DevTools
1. Открой http://localhost:5173 в Chrome
2. Нажми `F12` → вкладка **Sources**
3. Найди файл в левой панели
4. Поставь breakpoint
5. Обнови страницу

---

## Полезные команды

### Backend

```bash
# Перейти в папку backend
cd backend

# Запустить сервер разработки
uvicorn app.main:app --reload

# Применить миграции
alembic upgrade head

# Создать новую миграцию
alembic revision --autogenerate -m "описание изменений"

# Откатить миграцию
alembic downgrade -1

# Запустить seed
python -m app.scripts.seed

# Запустить тесты
pytest
```

### Frontend

```bash
# Перейти в папку frontend
cd frontend

# Запустить dev-сервер
npm run dev

# Собрать проект
npm run build

# Запустить preview сборки
npm run preview

# Запустить тесты
npm test
```

### Docker

```bash
# Запустить только БД
cd backend
docker-compose up -d db

# Остановить БД
docker-compose down

# Посмотреть логи
docker-compose logs -f db

# Удалить всё (включая данные!)
docker-compose down -v
```

---

## Возможные проблемы

### 1. Backend не запускается

**Ошибка:** `ModuleNotFoundError: No module named 'fastapi'`

**Решение:**
```bash
cd backend
poetry install
# или
pip install -r requirements.txt
```

---

### 2. Ошибка подключения к базе данных

**Ошибка:** `could not connect to server: Connection refused`

**Решение:**
1. Проверь, что Docker запущен
2. Проверь, что контейнер БД работает:
   ```bash
   docker ps
   ```
3. Если нет — запусти:
   ```bash
   cd backend
   docker-compose up -d db
   ```

---

### 3. Alembic не найден

**Ошибка:** `alembic: command not found`

**Решение:**
```bash
# Через Poetry
poetry run alembic upgrade head

# Или через python -m
python -m alembic upgrade head
```

---

### 4. Frontend не запускается

**Ошибка:** `npm: command not found`

**Решение:**
1. Установи Node.js: https://nodejs.org/
2. Перезапусти PyCharm
3. Проверь в Terminal:
   ```bash
   node --version
   npm --version
   ```

---

### 5. Ошибка CORS

**Ошибка в браузере:** `Access to fetch at ... has been blocked by CORS policy`

**Решение:**
1. Проверь, что Backend запущен на http://localhost:8000
2. Проверь, что Frontend запущен на http://localhost:5173
3. Проверь в `backend/.env`:
   ```
   CORS_ORIGINS=http://localhost:5173
   ```

---

### 6. Токен не работает / 401 ошибка

**Решение:**
1. Выйди из системы (кнопка "Выйти")
2. Очисти localStorage в браузере (F12 → Console):
   ```javascript
   localStorage.clear()
   ```
3. Зайди заново с тестовыми данными:
   - Email: `test@example.com`
   - Пароль: `password123`

---

### 7. Миграции не применяются

**Ошибка:** `Table 'analyses.users' doesn't exist`

**Решение:**
```bash
cd backend

# Откатить все миграции
alembic downgrade base

# Применить заново
alembic upgrade head
```

---

### 8. PyCharm не видит зависимости

**Решение:**
1. `File → Invalidate Caches...`
2. Поставь галочки
3. Нажми **Invalidate and Restart**

---

## 📌 Шпаргалка по горячим клавишам

| Действие | Windows/Linux | macOS |
|----------|---------------|-------|
| Запустить | `Shift+F10` | `Ctrl+R` |
| Отладка | `Shift+F9` | `Ctrl+D` |
| Остановить | `Ctrl+F2` | `Cmd+F2` |
| Найти файл | `Ctrl+Shift+N` | `Cmd+Shift+O` |
| Найти текст | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| Terminal | `Alt+F12` | `Option+F12` |
| Settings | `Ctrl+Alt+S` | `Cmd+,` |

---

## 📞 Контакты и помощь

Если возникли проблемы:

1. Проверь логи в PyCharm (окно **Run** внизу)
2. Проверь логи Docker Desktop
3. Посмотри документацию API: http://localhost:8000/docs

---

**Последнее обновление:** 21 февраля 2026 г.
