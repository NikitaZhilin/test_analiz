# 📖 Инструкция по развёртыванию и хостингу

## 📋 Содержание
1. [Архитектура развёртывания](#архитектура-развёртывания)
2. [Требования](#требования)
3. [Настройка production сервера](#настройка-production-сервера)
4. [Настройка локальной разработки](#настройка-локальной-разработки)
5. [Workflow: локальная разработка → production](#workflow-локальная-разработка--production)
6. [Безопасность](#безопасность)
7. [Мониторинг и логи](#мониторинг-и-логи)

---

## 🏗️ Архитектура развёртывания

```
┌─────────────────────────────────────────────────────────┐
│                    Production Server                     │
│                   (ваш фиксированный IP)                 │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────┐  │
│  │    nginx    │────▶│   FastAPI   │────▶│PostgreSQL │  │
│  │  (порт 80/  │     │  (порт 8000)│     │ (порт 5432)│  │
│  │   443 SSL)  │     │   Docker    │     │  Docker   │  │
│  └─────────────┘     └─────────────┘     └───────────┘  │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTPS
                            │
                    ┌───────┴───────┐
                    │   Пользователи │
                    └───────────────┘

┌─────────────────────────────────┐
│    Local Development (ваш ПК)    │
│  ┌─────────────┐     ┌─────────┐ │
│  │   Vite Dev  │────▶│FastAPI  │ │
│  │ (порт 5173) │     │(порт 8000)│ │
│  └─────────────┘     └─────────┘ │
└─────────────────────────────────┘
```

---

## ✅ Требования

### Production сервер:
- ОС: Ubuntu 20.04+ / Debian 11+ / Windows Server
- CPU: 2+ ядра
- RAM: 4+ ГБ
- Диск: 20+ ГБ SSD
- Фиксированный IP адрес
- Открытые порты: 80 (HTTP), 443 (HTTPS)

### Локальная разработка:
- Python 3.11+
- Node.js 18+
- Docker Desktop (опционально)

---

## 🚀 Настройка production сервера

### Шаг 1: Установка зависимостей

#### Для Linux (Ubuntu/Debian):
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Установка nginx
sudo apt install -y nginx

# Установка Git
sudo apt install -y git
```

#### Для Windows Server:
```powershell
# Установить Docker Desktop для Windows
# Скачать с: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

# Установить Git для Windows
# Скачать с: https://git-scm.com/download/win
```

### Шаг 2: Клонирование проекта

```bash
# На сервере
cd /var/www
sudo git clone <your-repo-url> analyses-app
sudo chown -R $USER:$USER analyses-app
cd analyses-app
```

### Шаг 3: Настройка environment переменных

#### Backend (.env):
```bash
cd backend
cp .env.example .env
nano .env
```

```env
# Production .env
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@db:5432/analyses
SECRET_KEY=<сгенерируйте: python -c "import secrets; print(secrets.token_urlsafe(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=https://your-domain.com,http://your-fixed-ip
LOG_LEVEL=INFO
```

#### Frontend (.env):
```bash
cd ../frontend
cp .env.example .env
nano .env
```

```env
VITE_API_URL=https://your-domain.com/api
```

### Шаг 4: Настройка Docker Compose для production

Создайте `backend/docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: analyses
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  backend:
    build: .
    command: /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
    volumes:
      - .:/app
      - /app/.venv
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/analyses
      - SECRET_KEY=${SECRET_KEY}
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
      - REFRESH_TOKEN_EXPIRE_DAYS=7
      - CORS_ORIGINS=${CORS_ORIGINS}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile.prod
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Шаг 5: Настройка nginx

```bash
sudo nano /etc/nginx/sites-available/analyses
```

```nginx
server {
    listen 80;
    server_name your-domain.com your-fixed-ip;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com your-fixed-ip;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend (static files)
    location / {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload limits
        client_max_body_size 10M;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

```bash
# Включить конфигурацию
sudo ln -s /etc/nginx/sites-available/analyses /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Получить SSL сертификат
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Шаг 6: Запуск production

```bash
cd /var/www/analyses-app/backend

# Сборка и запуск
docker-compose -f docker-compose.prod.yml up --build -d

# Применить миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Создать начальные данные
docker-compose -f docker-compose.prod.yml exec backend python -m app.scripts.seed

# Проверить логи
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 💻 Настройка локальной разработки

### Шаг 1: Клонирование

```bash
# На локальном ПК
git clone <your-repo-url> analyses-app-local
cd analyses-app-local
```

### Шаг 2: Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Установить зависимости
pip install poetry
poetry install

# Создать .env
cp .env.example .env
# Отредактировать .env для локальной разработки

# Запустить (если не используете Docker)
uvicorn app.main:app --reload --port 8000
```

### Шаг 3: Frontend

```bash
cd ../frontend

# Установить зависимости
npm install

# Создать .env
cp .env.example .env
# VITE_API_URL=http://localhost:8000

# Запустить dev сервер
npm run dev
```

### Шаг 4: Локальный Docker (опционально)

```bash
cd backend
docker-compose up --build
```

---

## 🔄 Workflow: локальная разработка → production

### Вариант 1: Git-based deployment

#### Структура веток:
```
main (production)
  ↑
develop (staging)
  ↑
feature/* (локальные изменения)
```

#### Процесс:

1. **Локальная разработка:**
```bash
# Создать ветку для фичи
git checkout -b feature/new-feature

# Внести изменения, закоммитить
git add .
git commit -m "Add new feature"

# Push в remote
git push origin feature/new-feature
```

2. **Тестирование локально:**
```bash
# Backend
cd backend
poetry install
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

3. **Merge в production:**
```bash
# Переключиться на main
git checkout main
git pull origin main

# Влить изменения
git merge feature/new-feature

# Push на сервер
git push origin main
```

4. **Deploy на сервер:**
```bash
# На сервере
cd /var/www/analyses-app
git pull origin main

# Пересобрать контейнеры
docker-compose -f docker-compose.prod.yml up --build -d

# Применить миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Вариант 2: CI/CD с GitHub Actions

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/analyses-app
            git pull origin main
            docker-compose -f docker-compose.prod.yml up --build -d
            docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

---

## 🔐 Безопасность

### 1. Firewall

```bash
# Ubuntu
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Windows Firewall
# Открыть порты 22, 80, 443
```

### 2. SSH ключи

```bash
# На локальном ПК
ssh-keygen -t ed25519 -C "your-email@example.com"
ssh-copy-id user@your-server-ip

# Отключить парольную аутентификацию на сервере
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no
sudo systemctl restart sshd
```

### 3. Database security

```bash
# Не открывать порт 5432 наружу!
# В docker-compose.prod.yml:
# ports: # ЗАКОММЕНТИРОВАТЬ!
#   - "5432:5432"
```

### 4. Regular backups

Создайте `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups/analyses_$DATE"

mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres analyses > $BACKUP_DIR/db.sql

# Backup files
tar -czf $BACKUP_DIR/files.tar.gz ./backend ./frontend

# Upload to remote storage (например, S3)
# aws s3 cp $BACKUP_DIR s3://your-bucket/backups/

# Удалить старые бэкапы (>30 дней)
find /backups -type f -mtime +30 -delete
```

```bash
# Добавить в crontab
crontab -e
# 0 2 * * * /var/www/analyses-app/backup.sh
```

---

## 📊 Мониторинг и логи

### Docker логи

```bash
# Все логи
docker-compose -f docker-compose.prod.yml logs -f

# Только backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Последние 100 строк
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Health check

```bash
# Backend health
curl http://localhost:8000/health

# Frontend
curl http://localhost:5174

# Database
docker-compose -f docker-compose.prod.yml exec db pg_isready -U postgres
```

### Auto-restart

```bash
# В docker-compose.prod.yml уже указано:
# restart: unless-stopped

# Проверить статус
docker-compose -f docker-compose.prod.yml ps

# Перезапустить упавшие контейнеры
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Чек-лист перед запуском

- [ ] Смените `SECRET_KEY` на уникальный
- [ ] Смените пароль PostgreSQL
- [ ] Настройте HTTPS (Let's Encrypt)
- [ ] Закройте порт 5432 для внешнего доступа
- [ ] Настройте firewall (только 22, 80, 443)
- [ ] Настройте автоматические бэкапы
- [ ] Протестируйте локальную версию
- [ ] Проверьте CORS настройки
- [ ] Настройте логирование

---

## 🆘 Troubleshooting

### Backend не запускается
```bash
docker-compose -f docker-compose.prod.yml logs backend
# Проверить .env файл
# Проверить что БД запущена
docker-compose -f docker-compose.prod.yml ps
```

### Frontend не видит API
```bash
# Проверить VITE_API_URL в .env
# Проверить CORS в backend .env
# Пересобрать frontend
docker-compose -f docker-compose.prod.yml up --build frontend
```

### Ошибки миграций
```bash
# Сбросить и применить заново
docker-compose -f docker-compose.prod.yml exec backend alembic downgrade base
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## 📞 Контакты

При возникновении проблем:
1. Проверьте логи
2. Проверьте `.env` файлы
3. Убедитесь что все порты открыты
4. Перезапустите контейнеры
