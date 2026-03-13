# Analyses Tracker Frontend

Frontend для системы отслеживания динамики медицинских анализов.

## Стек

- React 18
- TypeScript
- Vite
- React Router DOM
- Recharts (графики)

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

## Сборка

```bash
npm run build
```

## Структура

```
src/
├── api/           # API клиенты
├── components/    # Переиспользуемые компоненты
├── pages/         # Страницы приложения
├── types.ts       # TypeScript типы
├── App.tsx        # Корневой компонент с роутингом
├── main.tsx       # Точка входа
└── styles.css     # Глобальные стили
```

## Страницы

- `/login` — Вход
- `/register` — Регистрация
- `/profiles` — Управление профилями
- `/profiles/:profileId/reports` — Список сдач анализов
- `/reports/:reportId` — Детали отчёта, редактирование результатов
- `/profiles/:profileId/analytes` — Список показателей профиля
- `/profiles/:profileId/analytes/:analyteId` — График динамики показателя
- `/profiles/:profileId/import` — Мастер импорта CSV/XLSX
