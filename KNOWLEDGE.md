# База Знаний: MES COZY ART

## 🎯 Контекст проекта

- **Производство:** изделия из архитектурного бетона (столешницы, раковины, панели)
- **Каналы продаж:** агенты, дизайнеры, B2B, B2C, сайт
- **География:** Новосибирск (производство) → федеральные продажи РФ
- **Масштаб:** старт ~40 заказов/мес, рост до 200+ заказов/мес

---

## 🏗️ Технический стек

- **Фронтенд:** React 18 + TypeScript + Tailwind CSS + ShadCN/UI
- **State:** TanStack Query (React Query)
- **Бэкенд:** Supabase (PostgreSQL, Auth, Storage, Edge Functions, Database Functions)
- **Интеграции:** n8n (webhooks) → 1С, WordPress, Telegram
- **Мобильный:** PWA для мастеров

---

## 🔑 Принцип «Ничего в код»

❌ **НЕЛЬЗЯ:** `CHECK (status IN ('draft', 'confirmed'))`  
✅ **НУЖНО:** `status_id UUID REFERENCES dictionary_items(id)` + справочник в админке

Все статусы, типы, этапы, бизнес-правила управляются через админ-панель.

---

## 📋 Системные справочники (управляются в админке)

| Справочник | Тип (`dictionary_type`) | Примеры значений |
|------------|------------------------|------------------|
| Статусы заказа | `order_status` | Черновик, Подтверждён, В производстве, Готов, Отгружен |
| Типы заказа | `order_type` | Серийный (склад), Серийный (под заказ), Индивидуальный, Проект |
| Способы доставки | `delivery_method` | Самовывоз, По городу, До ТК, До двери |
| Типы клиентов | `client_type` | B2C, B2B, Агент, Дизайнер, Архитектор |
| Ценовые категории | `pricing_type` | Розница, Опт, Дилер, Партнёр |
| Условия оплаты | `payment_terms` | Предоплата, Постоплата, Рассрочка, Кредит |
| Источники лидов | `lead_source` | Калькулятор, Сайт, Звонок, Рекомендация, Выставка |
| Статусы лидов | `lead_status` | Новый, Квалифицирован, КП отправлено, Переговоры, Выигран, Проигран |
| Причины отказа | `lost_reason` | Цена, Сроки, Конкурент, Нет потребности |
| Единицы измерения | `unit` | шт, м², м.п., кг, комплект |
| Этапы производства | `production_stage` | Замес, Формовка, Сушка, Шлифовка, Покраска, Упаковка |
| Статусы производства | `production_order_status` | Запланировано, В работе, Завершено |

---

## 🏗️ Архитектура приложения

### Маршруты (src/App.tsx)

| Путь | Компонент | Доступ |
|------|-----------|--------|
| `/` | Index | Авторизованный |
| `/calculator` | CalculatorPage | Модуль `calculator` |
| `/history` | HistoryPage | Модуль `history` |
| `/sales` | ClientsPage | Модуль `clients` / Админ |
| `/production` | ProductionPage | Модуль `calculator` |
| `/warehouse` | WarehousePage | Модуль `calculator` |
| `/pricelist` | PriceListPage | Все авторизованные |
| `/docs` | DocsPage | Модуль `docs` |
| `/admin` | AdminPage | Только админ |
| `/admin/checklist` | AdminChecklistPage | Только админ |
| `/admin/integrations` | AdminIntegrationsPage | Только админ |
| `/auth` | AuthPage | Публичный |

### Навигация

Боковая панель с группами: Калькуляторы, Продажи, Производство, Склад + standalone: Прайс-лист, Инструкция, Администрирование, Интеграции.

---

## 🔐 Система доступа (RBAC)

- **Роли:** `admin`, `user` (enum `app_role` в таблице `user_roles`)
- **Группы доступа:** `access_groups` → `group_permissions` (модуль + allowed)
- **Назначение:** `user_group_assignments` (user_id + group_id)
- **Проверка:** функция `has_module_access(_user_id, _module)` — админы всегда имеют доступ
- **Модули:** `calculator`, `history`, `clients`, `docs`

---

## 📊 Таблицы базы данных

### Основные бизнес-таблицы

| Таблица | Описание |
|---------|----------|
| `profiles` | Профили пользователей (full_name, phone, telegram, role, is_approved) |
| `user_roles` | Роли (admin/user) |
| `clients` | Контрагенты (B2C, B2B, Agent и др.) с ценовыми категориями |
| `leads` | Лиды с воронкой статусов и конвертацией |
| `orders` | Заказы продаж с авто-нумерацией |
| `order_items` | Позиции заказов с привязкой к вариантам товаров |
| `deals` | Сделки CRM |
| `deal_activities` | Лог активности по сделкам |
| `tasks` | Задачи CRM |
| `saved_calculations` | Сохранённые расчёты калькулятора |
| `agent_commissions` | Комиссии агентов по заказам |

### Товары и производство

| Таблица | Описание |
|---------|----------|
| `products` | Товары (SKU, категория, тип, гарантия) |
| `product_variants` | Варианты товара (размер, цвет, текстура, цены) |
| `production_orders` | Производственные заказы |
| `production_stages` | Этапы производства (фото, сроки) |
| `reservations` | Резервирование товаров на складе |

### Справочники

| Таблица | Описание |
|---------|----------|
| `dictionary_types` | Типы справочников |
| `dictionary_items` | Элементы справочников (код, название, цвет, метаданные) |
| `nomenclature` | Номенклатура товаров (SKU, цены, фото, чертежи) |
| `nomenclature_colors` | Связь номенклатуры с цветами (junction) |
| `standard_colors` | Палитра цветов (name, image_url, show_in_print) |
| `product_categories` | Категории товаров |
| `pricing_settings` | Ценовые и физические константы (key-value) |
| `system_settings` | Системные настройки (пороги, сроки резерва, гарантия) |
| `company_settings` | Настройки компании (контакты, соцсети, условия) |
| `pipeline_stages` | Стадии воронки CRM |

### Интеграции и аудит

| Таблица | Описание |
|---------|----------|
| `integration_queue` | Очередь обмена с 1С (to_1c / from_1c) |
| `audit_log` | Лог изменений данных |

### RBAC

| Таблица | Описание |
|---------|----------|
| `access_groups` | Группы доступа |
| `group_permissions` | Права группы на модули |
| `user_group_assignments` | Назначение пользователей в группы |

---

## 💰 Модуль «Продажи» ✅ Готов

### Лиды (leads)

**Статусы воронки:**
```
new → qualified → proposal_sent → negotiation → won / lost
```

**Конвертация:**
- Лид → Клиент: создаёт запись в `clients`, привязывает `client_id`
- Лид → Заказ: создаёт `orders`, привязывает `lead_id` + `client_id`, статус лида → `won`

### Заказы (orders)

**Статусы:**
```
draft → pending_approval → confirmed → in_production → ready → shipped → paid → completed / cancelled
```

**Типы:** serial_stock, serial_production, custom, project  
**Доставка:** self_pickup, city_delivery, to_tc, to_door  
**Авто-нумерация:** `ORD-YYYYMMDD-NNN` (trigger `generate_order_number`)

**Позиции заказа (order_items):**
- Привязка к `product_variants`
- Автоматический пересчёт total_line и итога заказа (`recalculate_order_totals`)
- Гарантия: каскадный расчёт (override → вариант → продукт → system_settings → 12)

**Бизнес-правила:**
- Скидка >15% → статус `pending_approval` (`apply_discount_rule`)
- Агентская комиссия → `calculate_agent_commission`
- Генерация документов: счёт и гарантийный талон (Edge Functions)

### Клиенты (clients)

**Типы:** b2c, b2b, agent, designer, architect  
**Ценовые категории:** retail, wholesale, dealer, partner  
**Условия оплаты:** prepay, postpay, installment, credit

---

## 🏭 Модуль «Производство» (минимум для продаж) ✅ Готов

- Создание производственных заказов из заказов продаж (`create_production_order_from_sales`)
- Автоматические этапы из справочника `production_stage`
- При завершении всех этапов → статус заказа → `ready` (`update_sales_order_from_production`)

---

## 📦 Модуль «Склад» (минимум для продаж) ✅ Готов

- **Резервирование:** `reserve_order_stock` (массовое), `create_reservation_for_item` (поштучное)
- **Проверка доступности:** `check_product_availability` (заглушка — всегда доступно)
- **Сроки резерва:** 72ч (без оплаты) / 168ч (с оплатой) — настраивается в `system_settings`
- **Авто-снятие:** `release_expired_reservations` (для будущего cron)

---

## 🔗 Интеграции ✅ Заглушки готовы

### WordPress → Лиды
- **Edge Function:** `webhook-wordpress-lead`
- **Авторизация:** Bearer-токен (`WORDPRESS_WEBHOOK_KEY`)
- **Данные:** name, phone, email, source, utm, message, product_interest
- **Логика:** поиск/создание клиента → создание лида → назначение на админа

### 1С ↔ Обмен данными
- **Таблица:** `integration_queue` (direction: to_1c / from_1c)
- **Функция:** `queue_order_for_1c_sync` (при изменении статуса заказа)
- **Триггер:** НЕ подключён (включить при запуске интеграции с 1С через n8n)
- **UI:** `/admin/integrations` — мониторинг очереди, retry ошибок

---

## 🧮 Модуль «Калькулятор»

Типы изделий: столешница, подоконник, мойка, ступень, лестница, транспортировочный ящик.  
Все калькуляторы на странице `/calculator` с выбором через ProductSelector.  
Параметры расчёта загружаются из `pricing_settings`.

---

## 📦 Storage

**Bucket:** `company-assets` (public)  
Для: фото товаров, чертежей, логотипов, образцов цветов.

---

## 🔧 Ключевые хуки

| Хук | Описание |
|-----|----------|
| `useAuth` | Авторизация, профиль, isAdmin |
| `usePermissions` | Проверка доступа к модулям |
| `useLeads` | CRUD лидов + convertToClient/convertToOrder |
| `useOrders` | CRUD заказов |
| `useOrderItems` | CRUD позиций заказа с автопересчётом |
| `useClients` | CRUD клиентов |
| `useDeals` | CRUD сделок |
| `useTasks` | CRUD задач |
| `useProducts` | Товары и варианты |
| `useReservations` | Резервирование, проверка доступности |
| `useAgentCommissions` | Комиссии агентов |
| `useIntegrationQueue` | Очередь интеграций + retry |
| `useNomenclature` | Номенклатура |
| `useNomenclatureColors` | Связь номенклатура-цвета |
| `useProductCategories` | Категории товаров |
| `usePricing` | Ценовые настройки |
| `useColors` | Цвета |
| `useCompanySettings` | Настройки компании |
| `useSystemSettings` | Системные настройки |
| `useDictionary` | Справочники |
| `useCalculations` | Сохранённые расчёты |
| `useDocumentGeneration` | Генерация счетов и гарантий |
| `useProductionOrders` | Производственные заказы |
| `useLeadConversion` | Конвертация лидов |

---

## 🔧 Database Functions

| Функция | Описание |
|---------|----------|
| `has_role(_user_id, _role)` | Проверка роли (SECURITY DEFINER) |
| `is_admin(_user_id)` | Обёртка над has_role для admin |
| `has_module_access(_user_id, _module)` | Проверка доступа к модулю |
| `generate_order_number()` | Авто-нумерация заказов (trigger) |
| `recalculate_order_totals(p_order_id)` | Пересчёт итогов заказа |
| `apply_discount_rule(p_order_id)` | Проверка скидки → согласование |
| `calculate_agent_commission(p_order_id)` | Расчёт комиссии агента |
| `calculate_warranty_months(p_variant_id)` | Каскадный расчёт гарантии |
| `create_production_order_from_sales(p_order_id)` | Создание произв. заказа |
| `update_sales_order_from_production()` | Обновление статуса при завершении производства |
| `reserve_order_stock(p_order_id)` | Массовое резервирование |
| `create_reservation_for_item(...)` | Поштучное резервирование |
| `check_product_availability(p_variant_id, p_quantity)` | Проверка доступности (заглушка) |
| `release_expired_reservations()` | Снятие просроченных резервов |
| `queue_order_for_1c_sync()` | Очередь для 1С при изменении заказа |
| `validate_reservation_status()` | Валидация статуса резерва (trigger) |
| `validate_commission_status()` | Валидация статуса комиссии (trigger) |
| `validate_integration_queue()` | Валидация direction/status очереди (trigger) |

---

## 🛠️ Edge Functions

| Функция | Описание |
|---------|----------|
| `generate-document` | Генерация счёта и гарантийного талона (HTML) |
| `webhook-wordpress-lead` | Приём лидов с WordPress |
| `seed-sales-demo` | Заполнение демо-данными |

---

## 🛠️ Админ-панель (AdminPage)

**Секции:**
1. **Продукты и цены:** Цены, Цвета, Иконки
2. **Пользователи и доступ:** Пользователи, Расчёты, Группы доступа
3. **Справочники:** Контрагенты, Номенклатура, Категории товаров
4. **Настройки и документы:** Контакты компании, Шаблон печати, Документация, Системные справочники, Системные настройки

---

## 🗺️ Дорожная карта

### ✅ БЛОК 1: Продажи — Фундамент
- [x] Справочники (`dictionary_items`) + `system_settings` + `audit_log`
- [x] Таблицы `products` + `product_variants`
- [x] Таблица `order_items` + бизнес-логика

### ✅ БЛОК 2: Продажи — Интерфейс и логика
- [x] Форма заказа с позициями (добавление/удаление, автопересчёт)
- [x] Бизнес-правила (скидка >15% → согласование, комиссии агентов)
- [x] Генерация документов (счёт, гарантия) + конвертация лида в заказ

### ✅ БЛОК 3: Продажи — Завершение
- [x] Админ-панель для справочников (статусы, типы)
- [x] Системные настройки

### ✅ БЛОК 4: Производство (минимум для продаж)
- [x] `production_orders` + `production_stages`
- [x] Статусы производства → обновление заказа

### ✅ БЛОК 5: Склады (минимум для продаж)
- [x] Резервирование товаров + проверка наличия

### ✅ БЛОК 6: Финализация
- [x] Интеграции-заглушки (1С, WordPress webhook)
- [x] Документация + чек-лист запуска

### БЛОК 7+: Полные модули (будущее)
- [ ] Производство (полный): фото этапов, PWA для мастеров
- [ ] Склады (полный): таблица `inventory`, реальные остатки, инвентаризация
- [ ] Финансы: оплаты, акты, сверки
- [ ] ЛК клиента: статус заказа, документы
- [ ] Интеграция 1С через n8n: реальный обмен данными
- [ ] Telegram-бот: уведомления менеджерам

---

## 👥 Роли пользователей

| Роль | Доступ |
|------|--------|
| `admin` | Полный доступ, настройки, аудит |
| `sales_manager` | Свои лиды/заказы/клиенты |
| `agent` | Только свои заказы и комиссии (ЛК) |
| `production_master` | Задачи производства, фото |
| `warehouse_manager` | Остатки, отгрузки |
| `accountant` | Документы, оплаты, 1С-обмен |

---

## 🔐 Безопасность и 152-ФЗ

- **Хостинг:** только РФ
- **Шифрование:** TLS 1.3 + RLS на всех таблицах
- **Логи доступа к ПДн:** таблица `audit_log`, хранение 2 года
- **Право на анонимизацию:** реализовано

---

## 🎨 Дизайн-система

- **Цвета:** основной `#2563EB` (синий), статусы из `metadata` справочников
- **Шрифт:** Inter
- **Компоненты:** только ShadCN/UI (Card, Dialog, Table, Form, Select, Badge, Button)
- **Токены:** семантические CSS-переменные из `index.css` (`--background`, `--primary`, `--muted` и т.д.)
- **Темы:** light / dark через класс `.dark`

---

## ⚙️ Соглашения кода

- **Компоненты:** PascalCase, `.tsx`
- **Хуки:** camelCase с `use`, `.ts`/`.tsx`
- **Стили:** Tailwind CSS с семантическими токенами из `index.css`
- **Supabase:** `import { supabase } from "@/integrations/supabase/client"`
- **Типы:** НЕ редактировать `types.ts` — автогенерация
- **Конфиг:** НЕ редактировать `config.toml`, `.env`, `client.ts`
- **Миграции:** инструмент `supabase--migration`
- **RLS:** обязательно, через `has_role` / `has_module_access` / `is_admin`
- **Справочники:** все enum-значения через таблицу `dictionary_items`, не CHECK constraints
- **Валидация:** триггеры вместо CHECK constraints для статусов
