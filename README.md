# MES COZY ART

Производственная MES-система для архитектурного бетона: расчёт стоимости,
продажи, производство, склад, партнёрский кабинет, расчёт зарплаты.

> **Полное описание проекта:** [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — живой документ.

## Документация

| Файл | Назначение |
|------|-----------|
| [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) | Полное описание реализованного функционала (живой документ) |
| [`docs/LOCAL_DOCKER_SETUP.md`](docs/LOCAL_DOCKER_SETUP.md) | Локальный запуск на ПК в Docker (шаг-за-шагом) |
| [`KNOWLEDGE.md`](KNOWLEDGE.md) | Справочник логики, формул, правил |
| [`DEPLOY.md`](DEPLOY.md) | Развёртывание на сервере (Docker + self-hosted Supabase) |
| [`docs/SALES_MODULE.md`](docs/SALES_MODULE.md) | Модуль продаж — детально |
| [`docs/ACCEPTANCE_SALES.md`](docs/ACCEPTANCE_SALES.md) | Приёмочные сценарии |
| [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) | Чек-лист релиза |
| [`docs/AUDIT_*.md`](docs/) | Журнал аудитов |
| [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) | Чек-лист релиза |
| [`docs/AUDIT_*.md`](docs/) | Журнал аудитов |

## Стек

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **State:** TanStack Query + react-hook-form + zod
- **Backend:** Lovable Cloud (Supabase): PostgreSQL, Auth, Storage, Edge Functions
- **AI:** Lovable AI Gateway (Gemini, GPT-5)

## Локальный запуск

```sh
npm i
npm run dev
```

Требуется Node.js 18+. Переменные окружения (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`) подставляются автоматически в Lovable Cloud.

## URL

- **Preview:** https://id-preview--efafe2a2-3337-47c1-8799-7b86b112c80a.lovable.app
- **Published:** https://mes-cozyart.lovable.app
