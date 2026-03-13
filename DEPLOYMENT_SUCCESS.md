# ✅ Деплой успешно завершён!

**Дата:** 13 марта 2026  
**IP сервера:** 77.239.103.15  
**URL:** http://77.239.103.15/

---

## 📦 Развёрнутые сервисы

| Сервис | Статус | Порт |
|--------|--------|------|
| Frontend (Nginx) | ✅ Работает | 80 |
| Backend (FastAPI) | ✅ Работает | 8000 (внутренний) |
| PostgreSQL | ✅ Работает (healthy) | 5432 (внутренний) |

---

## 🔒 Безопасность

- ✅ PostgreSQL НЕ опубликован наружу (доступен только внутри Docker сети)
- ✅ CORS настроен только на http://77.239.103.15
- ✅ Секреты хранятся в .env.prod (не в git)
- ✅ Nginx настроен как reverse proxy для API

---

## 📁 Структура развёртывания

```
/opt/analyses-app/
├── .env.prod (symlink -> backend/.env.prod)
├── backend/
│   ├── .env.prod
│   ├── docker-compose.prod.yml
│   ├── app/
│   └── ...
├── frontend/
│   ├── nginx.conf (с API reverse proxy)
│   └── ...
└── ...
```

---

## 🚀 Команды управления

```bash
# Перезапуск всех сервисов
cd /opt/analyses-app/backend
docker compose -f docker-compose.prod.yml --env-file .env.prod restart

# Просмотр логов
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f

# Остановка
docker compose -f docker-compose.prod.yml --env-file .env.prod down

# Обновление из git
cd /opt/analyses-app
git pull origin main
docker compose -f backend/docker-compose.prod.yml --env-file .env.prod up -d --build
```

---

## 🧪 Проверка работы

```bash
# Frontend
curl http://localhost/

# API health
curl http://localhost/api/health

# API docs
curl http://localhost/api/docs
```

---

## ⚠️ Важно для изменения конфигурации

1. При изменении `.env.prod` — перезапустить сервисы:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

2. При изменении `nginx.conf` — пересобрать frontend:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache frontend
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d frontend
   ```

3. При изменении кода backend — пересобрать backend:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod build backend
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d backend
   ```

---

**Статус:** ✅ Всё работает!
