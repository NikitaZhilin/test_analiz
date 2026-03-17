# QWEN_LOG — Журнал изменений проекта

---

## 2026-03-17 11:30 MSK — Создание файлов памяти проекта

**Что сделано:**
- Созданы 3 файла для сохранения контекста между сессиями
- Заполнена текущая информация о проекте

**Файлы:**
- `QWEN_CONTEXT.md` — описание проекта, стек, деплой
- `QWEN_TASKS.md` — трекер задач (Done/In Progress/Next/Blockers/Later)
- `QWEN_LOG.md` — журнал изменений (этот файл)

**Проверить:**
- [ ] Файлы корректно отображаются в репозитории
- [ ] Информация актуальна

---

## 2026-03-17 11:00 MSK — Финальный consistency pass и деплой

**Что сделано:**
- Унификация стилей по всему frontend
- Исправление TypeScript ошибок
- Деплой на VPS

**Файлы:**
- `frontend/src/App.tsx` — loading spinner, button classes
- `frontend/src/pages/Login.tsx` — alert вместо error
- `frontend/src/pages/Register.tsx` — alert вместо error
- `frontend/src/pages/Profiles.tsx` — новый дизайн
- `frontend/src/pages/Reports.tsx` — новый дизайн
- `frontend/src/pages/ReportDetail.tsx` — новый дизайн
- `frontend/src/components/ReportsTable.tsx` — новый дизайн
- `frontend/src/components/ResultsEditor.tsx` — новый дизайн
- `frontend/src/components/ImportWizard.tsx` — новый дизайн
- `frontend/src/styles.css` — button aliases, alerts, import wizard styles

**Коммит:** `d9e0d6e` — Fix TypeScript errors: remove unused vars and canonical_name reference

**Проверить:**
- [x] Сайт доступен (http://77.239.103.15/ — 200 OK)
- [x] API health работает (/health — 200 OK)
- [x] Контейнеры запущены (backend, frontend, db)

---

## 2026-03-17 10:30 MSK — Исправление TypeScript ошибок

**Что сделано:**
- Удалены unused переменные в ImportWizard.tsx
- Удалено упоминание canonical_name в AnalyteDetail.tsx (нет в API схеме)

**Файлы:**
- `frontend/src/components/ImportWizard.tsx` — убраны `index`, `selectedAnalyte`
- `frontend/src/pages/AnalyteDetail.tsx` — убран canonical_name из meta

**Ошибки:**
```
src/components/ImportWizard.tsx(237,36): error TS6133: 'index' is declared but its value is never read.
src/components/ImportWizard.tsx(240,25): error TS6133: 'selectedAnalyte' is declared but its value is never read.
src/pages/AnalyteDetail.tsx(108,64): error TS2339: Property 'canonical_name' does not exist on type...
```

**Проверить:**
- [x] Сборка проходит без ошибок
- [x] Функциональность не нарушена

---

## 2026-03-17 09:15 MSK — Деплой редизайна аналитов

**Что сделано:**
- Деплой новых страниц Analytes и AnalyteDetail
- Проверка доступности

**Файлы:**
- `frontend/src/pages/Analytes.tsx`
- `frontend/src/pages/AnalyteDetail.tsx`
- `frontend/src/styles.css`

**Коммит:** `1eebd9a` — Redesign analytes pages: premium analytics UI with improved charts

**Проверить:**
- [x] Сборка успешна
- [x] Контейнеры запущены

---

## 2026-03-17 08:16 MSK — Деплай Import Page редизайна

**Что сделано:**
- Деплой новой страницы импорта
- Проверка сборки

**Файлы:**
- `frontend/src/pages/ImportPage.tsx`
- `frontend/src/styles.css`

**Коммит:** `f862261` — Redesign import page: better structure, modern alerts, improved table UX

**Проверить:**
- [x] Сборка успешна (12.14s)
- [x] Контейнеры запущены

---

## 2026-03-16 15:51 MSK — Деплой consistency pass

**Что сделано:**
- Унификация таблиц, форм, кнопок
- Деплой на VPS

**Файлы:**
- `frontend/src/styles.css` — +210 строк стилей

**Коммит:** `02f43ef` — Improve tables, forms, and buttons styling

**Проверить:**
- [x] Сборка успешна
- [x] Сайт доступен

---

## 2026-03-16 15:37 MSK — Деплой Auth редизайна

**Что сделано:**
- Деплой новых Login/Register страниц
- Проверка сборки

**Файлы:**
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`
- `frontend/src/styles.css`

**Коммит:** `9377b06` — Redesign auth pages: modern premium login/register UI

**Проверить:**
- [x] Сборка успешна (11.85s)
- [x] Контейнеры запущены

---

## 2026-03-16 13:32 MSK — Деплой полного редизайна

**Что сделано:**
- Деплой тёмной премиальной темы
- Проверка сборки

**Файлы:**
- `frontend/src/styles.css` — полный редизайн

**Коммит:** `e34d6a2` / `c2492d3` — Complete visual redesign

**Проверить:**
- [x] Сборка успешна
- [x] Сайт доступен

---

## 2026-03-16 11:50 MSK — Финальный Import UX

**Что сделано:**
- Добавлено filtered_out_rows_count
- Улучшены предупреждения

**Файлы:**
- `backend/app/api/routes/import_files.py`
- `backend/app/schemas/import_preview.py`
- `frontend/src/types.ts`
- `frontend/src/pages/ImportPage.tsx`

**Коммит:**cff8581` — Improve preview UX: add filtered_out_rows_count

**Проверить:**
- [x] API возвращает filtered_out_rows_count
- [x] Frontend отображает статистику

---

## 2026-03-16 10:30 MSK — Улучшение matching аналитов

**Что сделано:**
- Расширены синонимы для ОАК показателей
- Улучшена нормализация названий
- Добавлена фильтрация metadata

**Файлы:**
- `backend/app/core/analytes_whitelist.py`
- `backend/app/services/analyte_matcher.py`
- `backend/app/services/importers/pdf_importer.py`

**Коммит:** `69279c5` — Improve analyte matching for CBC

**Проверить:**
- [x] "Возраст" не попадает в preview
- [x] ОАК показатели матчатся автоматически

---

## 2026-03-16 09:15 MSK — Добавлен логотип

**Что сделано:**
- Создан SVG логотип с графиком
- Интеграция в header

**Файлы:**
- `frontend/src/components/Logo.tsx`
- `frontend/src/styles.css`

**Коммит:** `e7d71dd` — Add minimalist logo with chart/medical theme

**Проверить:**
- [x] Логотип отображается в header
- [x] Адаптивность (скрыт на < 375px)

---

## 2026-03-15 22:00 MSK — Очистка тестовых данных

**Что сделано:**
- Удалены тестовые credentials из Login page
- Улучшены placeholder'ы

**Файлы:**
- `frontend/src/pages/Login.tsx`

**Коммит:** `413112f` — Remove test credentials from login UI

**Проверить:**
- [x] Нет тестовых email/паролей в UI

---

## 2026-03-15 21:30 MSK — PDF Import фильтрация

**Что сделано:**
- Предфильтрация metadata строк в PDF парсере
- Игнорирование паспортных данных

**Файлы:**
- `backend/app/services/importers/pdf_importer.py`
- `backend/app/core/analytes_whitelist.py`

**Коммит:** `80230ca` — Add strict PDF metadata filtering

**Проверить:**
- [x] "Возраст" отфильтрован
- [x] Только реальные анализы в preview

---

## 2026-03-15 20:00 MSK — Настройка VPS и первый деплой

**Что сделано:**
- Docker установлен на VPS
- Пользователь deploy создан
- Репозиторий склонирован
- Production конфиг создан
- Первый деплой выполнен

**Файлы:**
- `backend/docker-compose.prod.yml`
- `backend/.env.prod`
- `frontend/Dockerfile.prod`
- `frontend/nginx.conf`

**Сервер:**
- IP: 77.239.103.15
- Путь: /opt/analyses-app
- Пользователь: deploy

**Проверить:**
- [x] Docker работает
- [x] Контейнеры запущены
- [x] Сайт доступен (http://77.239.103.15/)
- [x] API health работает (/health)

---

## 2026-03-15 19:00 MSK — Начало работы над проектом

**Что сделано:**
- Анализ текущей кодовой базы
- Определение типа проекта (Python + Node.js)
- Планирование работ

**Файлы:**
- Изучены: `backend/app/main.py`, `frontend/src/App.tsx`, `pyproject.toml`, `package.json`

**Проверить:**
- [x] Проект понят
- [x] План работ составлен

---

**Всего записей:** 15
**Первая запись:** 2026-03-15 19:00 MSK
**Последняя запись:** 2026-03-17 11:30 MSK
