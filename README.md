# MES COZY ART

Производственная MES-система для архитектурного бетона: расчёт стоимости,
продажи, производство, склад, партнёрский кабинет, расчёт зарплаты.

> **Полное описание проекта:** [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — живой документ.

## Документация

| Файл | Назначение |
|------|-----------|
| [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) | Полное описание реализованного функционала (живой документ) |
| [`docs/LOCAL_DOCKER_SETUP.md`](docs/LOCAL_DOCKER_SETUP.md) | **Локальный запуск в Docker — два сценария (Lovable Cloud / self-hosted Supabase)** |
| [`docs/DOCKER_SETUP.md`](docs/DOCKER_SETUP.md) | Короткая Docker-памятка |
| [`KNOWLEDGE.md`](KNOWLEDGE.md) | Справочник логики, формул, правил |
| [`DEPLOY.md`](DEPLOY.md) | Развёртывание на сервере (Docker + self-hosted Supabase) |
| [`docs/SALES_MODULE.md`](docs/SALES_MODULE.md) | Модуль продаж — детально |
| [`docs/ACCEPTANCE_SALES.md`](docs/ACCEPTANCE_SALES.md) | Приёмочные сценарии |
| [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) | Чек-лист релиза |
| [`docs/AUDIT_*.md`](docs/) | Журнал аудитов |

## Темы оформления

Поддерживаются **светлая и тёмная темы** (COZY.ART). Переключение — кнопка
в нижней части сайдбара. Выбор сохраняется в `localStorage` (`theme=dark|light`).
Все компоненты используют семантические токены (`bg-background`, `text-foreground`,
`bg-primary` и т.п.), новые цвета добавляются в `src/index.css` для каждой темы.

## Интеграция модулей

Все разделы работают как единая система через общие таблицы Supabase:

- **CRM → Заказы → Производство → Склад → Отгрузка** — связаны через
  `orders.id`, `order_items.id`, `production_orders.sales_order_id`,
  `reservations.order_item_id`. Изменение статуса заказа автоматически
  создаёт производственный заказ (`create_production_order_from_sales`),
  резервирует склад (`reserve_order_stock`) и ставит задачу в `integration_queue`
  для синхронизации с 1С (`queue_order_for_1c_sync`).
- **Расчёты (калькулятор) → Номенклатура → Прайс** — `calculations`,
  `nomenclature`, `product_variants` используют одни и те же справочники
  `dictionary_items` и `pricing_settings` (принцип "No Hardcoding").
- **ЗП (Payroll) → Расчёты** — `employees`, `operations`, `nomenclature`
  подписаны на Realtime: изменение ставки сотрудника мгновенно влияет на
  новые расчёты ФОТ в `CostCalcTab`.
- **Партнёрский портал → CRM → Заказы** — `partner_requests` →
  `partner_request_messages` → `orders` через `assigned_manager_id`.
- **RBAC** — единая модель `user_roles` + `has_role()` + `has_module_access()`
  применяется во всех RLS-политиках.


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
