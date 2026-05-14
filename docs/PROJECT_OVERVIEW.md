# MES COZY ART — Полное описание проекта

> Живой документ. Описывает фактически реализованную систему по состоянию на **2026-05-14**.
> При добавлении новых модулей/таблиц/правил — обновляйте соответствующий раздел и дату в шапке.

---

## 1. Назначение

MES (Manufacturing Execution System) для производства изделий из архитектурного бетона
(столешницы, раковины, ступени, подоконники, фартуки и др.). Объединяет:

- расчёт стоимости изделия по параметрам;
- продажи (лиды → заказы → отгрузка);
- производство (партии, этапы, статусы);
- склад и резервирование;
- партнёрский кабинет (дилер / дизайнер);
- расчёт зарплаты сотрудников производства;
- интеграции (1С, WordPress, Telegram через n8n).

## 2. Технологический стек

| Слой | Технологии |
|------|------------|
| Frontend | React 18, TypeScript (strict), Vite 5, Tailwind CSS, shadcn/ui |
| Состояние | TanStack Query, react-hook-form + zod |
| Backend | Lovable Cloud (Supabase) — PostgreSQL, Auth, Storage, Edge Functions |
| Безопасность | RLS на всех таблицах, обёртка `public.is_admin()`, DOMPurify, HIBP |
| AI | Lovable AI Gateway (`google/gemini-*`, `openai/gpt-*`) — без сторонних ключей |
| Деплой | Lovable Cloud + Docker self-hosting (см. `DEPLOY.md`) |

## 3. Архитектурные принципы

1. **Никакого хардкода в БД.** Статусы, этапы, типы — в `dictionary_types` / `dictionary_items`.
   CHECK-констрейнты заменены триггерами-валидаторами.
2. **Soft delete.** Удаление = `is_active = false`. Жёсткое удаление только админом и
   только в админке.
3. **Роли только в `user_roles`.** Запрещено хранить роль в `profiles` (защита от
   privilege escalation). Проверка через `has_role()` / `is_admin()` (SECURITY DEFINER).
4. **Доступ по модулям.** `has_module_access(user_id, module)` — RBAC через
   `access_groups` + `group_permissions` + `user_group_assignments`.
5. **Документы — HTML-Edge Function.** Никогда не клиентский PDF; всегда серверная
   генерация, сертифицированные шрифты, DOMPurify на инпуты.
6. **Партнёрские данные изолированы.** RLS гарантирует, что партнёр видит только свои
   заказы/расчёты/чаты.

## 4. Карта ролей

| Роль | Где живёт | Доступ |
|------|-----------|--------|
| `admin` | `user_roles.role = 'admin'` | Всё |
| `manager` / `sales` | `user_groups` + модули `clients`, `sales_leads` | CRM, продажи, склад |
| `production` | модуль `calculator` | Производственные заказы и этапы |
| `partner` (дилер/дизайнер) | `profiles.pending_role` + `clients.user_id` | Партнёрский кабинет `/partner/*` |
| `agent` | `clients.client_type='agent'` | Свои заказы и комиссии |
| `client` | `profiles.role='user'` | Личный кабинет (минимальный) |

## 5. Модули приложения

### 5.1 Калькулятор (`/calculator`)
Параметрический расчёт цены изделия по типу (раковина, столешница, ступень,
подоконник, фартук, лестница). Логика — в `src/lib/calculator.ts`. Автосохранение
расчёта в `saved_calculations`.

### 5.2 CRM (`/admin` → CRM, `src/components/crm/*`)
Сделки (`deals`), задачи (`tasks`), pipeline (`pipeline_stages`), карточки клиентов,
заявки от партнёров. Канбан-доска `PipelineBoard`.

### 5.3 Продажи (`src/components/sales/*`)
- **Лиды** — `LeadsTab`, `LeadDetailDialog`. Карточка лида показывает контакты,
  привязанный расчёт, клиента, созданный заказ, прогресс по статусам.
- **Заказы** — `OrdersTab`. Номер `ORD-YYYYMMDD-XXX`. 9 статусов из справочника.
- **Конвертация** — `useLeadConversion`: лид → клиент → черновик заказа.

### 5.4 Партнёрский портал (`/partner/*`)
- `PartnerWaitingPage` — комната ожидания одобрения.
- `PartnerDashboardPage` — сводка.
- `PartnerNewRequestPage` / `PartnerRequestsPage` / `PartnerRequestDetailPage` —
  заявки `PR-YYYYMMDD-XXX` со статусами и чатом (`partner_request_messages`,
  bucket `partner-attachments`, **private**).
- `PartnerOrdersPage` — отслеживание заказов с прогресс-баром производства.
- `PartnerPriceListPage` — прайс с ценами уровня партнёра.

### 5.5 Производство (`/production`)
- `production_orders` (BATCH-YYYYMMDD-XXX) — генерируются триггером из
  `order_items.production_required = true` через `create_production_order_from_sales()`.
- `production_stages` — этапы из словаря `production_stage`.
- При завершении всех этапов триггер `update_sales_order_from_production()` переводит
  заказ в `ready`.

### 5.6 Склад (`/warehouse`)
`inventory`, `stock_movements`, `reservations`. Резервы по часам из
`system_settings.reserve_hours_paid` / `reserve_hours_unpaid`. Cron
`release-expired-reservations` снимает просроченные.

### 5.7 Расчёт зарплаты (`/payroll`, только admin)
Вкладки:
- **Сотрудники** (`employees`: имя, должность, ставка ₽/час, уровень
  квалификации junior/middle/senior/master).
- **Операции** (`operations`: название, категория, норма часов,
  **стоимость работы ₽/час**, описание) — CRUD прямо в админке.
- **Табель** (`timesheets`: сотрудник, операция, заказ, дата, часы, коэффициент).
  Коэффициент **подставляется автоматически** по уровню квалификации сотрудника
  из справочника `payroll_skill_coefficient`, можно переопределить вручную.
- **Расчёт ЗП** — отчёт по месяцу: `Σ(часы × коэффициент × ставка)`, печать A4.

### 5.8 Прайс-лист (`/price-list`)
4 уровня цен (RRP / партнёр / опт / дилер) из `nomenclature`. Печать с фото —
изображения предзагружаются перед `window.print()`.

### 5.9 Админ-панель (`/admin`)
7 секций: Пользователи, Группы доступа, Справочники, Категории, Цвета, Прайсинг,
Шаблоны печати, Номенклатура, Иконки продуктов, Настройки компании, Расчёты,
Чек-листы запуска и интеграций.

## 6. База данных

Полный список таблиц — в Supabase Studio. Ключевые группы:

| Группа | Таблицы |
|--------|---------|
| Auth/RBAC | `profiles`, `user_roles`, `access_groups`, `group_permissions`, `user_group_assignments` |
| Справочники | `dictionary_types`, `dictionary_items`, `pricing_settings`, `system_settings`, `company_settings` |
| Каталог | `products`, `product_variants`, `product_categories`, `nomenclature`, `nomenclature_colors`, `standard_colors` |
| CRM | `clients`, `deals`, `deal_activities`, `pipeline_stages`, `tasks` |
| Продажи | `leads`, `orders`, `order_items`, `saved_calculations` |
| Партнёры | `partner_requests`, `partner_request_messages`, `partner_discounts` |
| Производство | `production_orders`, `production_stages` |
| Склад | `inventory`, `stock_movements`, `reservations` |
| ЗП | `employees`, `operations`, `timesheets` |
| Финансы | `agent_commissions` |
| Сервис | `audit_log`, `integration_queue` |

Все таблицы под RLS. Подробные политики — в Supabase Studio → Table Editor → каждая таблица.

### Ключевые DB-функции
`has_role`, `is_admin`, `has_module_access`, `recalculate_order_totals`,
`reserve_order_stock`, `release_expired_reservations`,
`create_production_order_from_sales`, `update_sales_order_from_production`,
`apply_stock_movement`, `apply_discount_rule`, `calculate_warranty_months`,
`calculate_agent_commission`, `queue_order_for_1c_sync`, `generate_order_number`,
`generate_batch_number`, `generate_partner_request_number`.

## 7. Edge Functions

| Функция | Назначение |
|---------|-----------|
| `generate-document` | Печатные формы (Счёт, Гарантия) с авторизацией: admin / sales_leads / responsible / partner-владелец |
| `delete-user` | Полное удаление пользователя из `auth.users` (только admin) |
| `seed-sales-demo` | Демо-данные для проверки модуля продаж |
| `webhook-wordpress-lead` | Приём лидов с сайта (WordPress) |

## 8. Интеграции

- **1С** — асинхронно через `integration_queue` (триггер `queue_order_for_1c_sync`).
- **WordPress** — webhook на лиды.
- **Telegram / n8n** — через очередь.

## 9. Безопасность (security memory)

- Bucket `partner-attachments` — **private**, доступ по RLS (admin / sales_leads /
  владелец / назначенный менеджер).
- Bucket `company-assets` — публичный (логотипы и т.п.).
- Auth-ошибки маппятся в обобщённые сообщения (нет user enumeration).
- Внутренние цены (`price_partner`, `price_dealer`, `price_wholesale`,
  `price_agent`) сейчас читаемы любым аутентифицированным — **TODO**: вынести
  в SECURITY DEFINER RPC, возвращающий только цену уровня вызывающего.

## 10. Деплой

- **Lovable Cloud** — основная среда (preview + published URL).
- **Self-hosting (Docker)** — см. `DEPLOY.md`. Внешние сети `cozy_network`.

## 11. Что менять при обновлении документа

При добавлении модуля:
1. Раздел 5 — описание модуля и где живёт код.
2. Раздел 6 — новые таблицы.
3. Раздел 7 — новые Edge Functions.
4. Шапка — обновить дату.
5. Создать запись в `docs/AUDIT_YYYY-MM-DD.md` со списком изменений.

См. также:
- `KNOWLEDGE.md` — детальный справочник логики и формул.
- `DEPLOY.md` — инструкции по развёртыванию.
- `docs/SALES_MODULE.md` — углублённое описание модуля продаж.
- `docs/ACCEPTANCE_SALES.md` — приёмочные сценарии.
- `docs/LAUNCH_CHECKLIST.md` — чек-лист готовности к релизу.
- `docs/AUDIT_*.md` — журнал аудитов и изменений.
