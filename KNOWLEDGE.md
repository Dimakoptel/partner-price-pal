# KNOWLEDGE.md — Контекст проекта MES COZY ART

> Этот файл используется как контекст для всех последующих промптов разработки.

---

## 1. О проекте

**Название:** MES COZY ART  
**Тип:** Веб-система управления производством и продажами архитектурного бетона  
**Стек:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion  
**Бэкенд:** Lovable Cloud (Supabase) — БД, авторизация, Edge Functions, Storage  
**Проект Supabase ID:** `lpmdonabwaseculhjnlz`

---

## 2. Архитектура приложения

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
| `/auth` | AuthPage | Публичный |

### Навигация (src/components/AppLayout.tsx)

Боковая панель с группами: Калькуляторы, Продажи, Производство, Склад + standalone: Прайс-лист, Инструкция, Администрирование.

---

## 3. Система доступа (RBAC)

- **Роли:** `admin`, `user` (enum `app_role` в таблице `user_roles`)
- **Группы доступа:** таблица `access_groups` → `group_permissions` (модуль + allowed)
- **Назначение:** `user_group_assignments` (user_id + group_id)
- **Проверка:** функция `has_module_access(_user_id, _module)` — админы всегда имеют доступ
- **Модули:** `calculator`, `history`, `clients`, `docs`

---

## 4. Таблицы базы данных

### Основные бизнес-таблицы

| Таблица | Описание |
|---------|----------|
| `profiles` | Профили пользователей (full_name, phone, telegram, role, is_approved) |
| `user_roles` | Роли (admin/user) |
| `clients` | Контрагенты (B2C, B2B, Agent и др.) с ценовыми категориями |
| `leads` | Лиды с воронкой статусов и конвертацией |
| `orders` | Заказы продаж |
| `deals` | Сделки CRM |
| `deal_activities` | Лог активности по сделкам |
| `tasks` | Задачи CRM |
| `saved_calculations` | Сохранённые расчёты калькулятора |

### Справочники

| Таблица | Описание |
|---------|----------|
| `nomenclature` | Номенклатура товаров (SKU, цены, фото, чертежи) |
| `nomenclature_colors` | Связь номенклатуры с цветами (junction) |
| `standard_colors` | Палитра цветов (name, image_url, show_in_print) |
| `product_categories` | Категории товаров |
| `pricing_settings` | Ценовые и физические константы (key-value) |
| `company_settings` | Настройки компании (контакты, соцсети, условия) |
| `pipeline_stages` | Стадии воронки CRM |

### RBAC

| Таблица | Описание |
|---------|----------|
| `access_groups` | Группы доступа |
| `group_permissions` | Права группы на модули |
| `user_group_assignments` | Назначение пользователей в группы |

---

## 5. Модуль «Продажи» (текущее состояние)

### Лиды (leads)

**Статусы воронки:**
```
new → qualified → proposal_sent → negotiation → won / lost
```

**Конвертация:**
- Лид → Клиент: создаёт запись в `clients`, привязывает `client_id`
- Лид → Заказ: создаёт `orders`, привязывает `lead_id` + `client_id`, статус лида → `won`

**Поля:** client_name, client_phone, client_email, source, region, product_interest, budget, amount, calculation_id, assigned_manager_id, lost_reason, converted_to_order_id

### Заказы (orders)

**Статусы:**
```
draft → pending_approval → confirmed → in_production → ready → shipped → paid → completed / cancelled
```

**Типы:** serial_stock, serial_production, custom, project  
**Доставка:** self_pickup, city_delivery, to_tc, to_door  
**Поля:** number (auto: ORD-YYYYMMDD-NNN), items (JSONB), total_amount, paid_amount, discount_percent, delivery_address, tracking_number, warranty_months

### Клиенты (clients)

**Типы:** b2c, b2b, agent, designer, architect  
**Ценовые категории:** retail, wholesale, dealer, partner  
**Условия оплаты:** prepay, postpay, installment, credit  
**Поля:** name, phone, email, telegram, company, address, inn, region, source, discount_default, credit_limit, commission_rate, manager_id

---

## 6. Модуль «Калькулятор»

Типы изделий: столешница, подоконник, мойка, ступень, лестница, транспортировочный ящик (box).  
Все калькуляторы на одной странице `/calculator` с выбором через ProductSelector.  
Калькулятор ящиков (BoxCalculatorInline) — отдельный компонент.  
Параметры расчёта загружаются из `pricing_settings`.

---

## 7. Storage

**Bucket:** `company-assets` (public)  
Используется для: фото товаров, чертежей, логотипов, образцов цветов.

---

## 8. Edge Functions / Secrets

| Secret | Назначение |
|--------|-----------|
| LOVABLE_API_KEY | AI-функции Lovable |
| SUPABASE_URL | URL проекта |
| SUPABASE_PUBLISHABLE_KEY | Анонимный ключ |
| SUPABASE_SERVICE_ROLE_KEY | Сервисный ключ |
| SUPABASE_DB_URL | Прямое подключение к БД |

---

## 9. Ключевые хуки

| Хук | Файл | Описание |
|-----|------|----------|
| `useAuth` | hooks/useAuth.tsx | Авторизация, профиль, isAdmin |
| `usePermissions` | hooks/usePermissions.ts | Проверка доступа к модулям |
| `useLeads` | hooks/useLeads.ts | CRUD лидов + convertToClient/convertToOrder |
| `useOrders` | hooks/useOrders.ts | CRUD заказов |
| `useClients` | hooks/useClients.ts | CRUD клиентов |
| `useDeals` | hooks/useDeals.ts | CRUD сделок |
| `useTasks` | hooks/useTasks.ts | CRUD задач |
| `useNomenclature` | hooks/useNomenclature.ts | Номенклатура |
| `useNomenclatureColors` | hooks/useNomenclatureColors.ts | Связь номенклатура-цвета |
| `useProductCategories` | hooks/useProductCategories.ts | Категории товаров |
| `usePricing` | hooks/usePricing.ts | Ценовые настройки |
| `useColors` | hooks/useColors.ts | Цвета |
| `useCompanySettings` | hooks/useCompanySettings.ts | Настройки компании |
| `useCalculations` | hooks/useCalculations.ts | Сохранённые расчёты |

---

## 10. Админ-панель (AdminPage)

**Секции:**
1. **Продукты и цены:** Цены, Цвета, Иконки
2. **Пользователи и доступ:** Пользователи, Расчёты, Группы доступа
3. **Справочники:** Контрагенты (заглушка), Номенклатура, Категории товаров
4. **Настройки и документы:** Контакты компании, Шаблон печати

---

## 11. Дорожная карта (TODO)

### БЛОК 1: Продажи — Фундамент
- [ ] Справочники + system_settings + audit_log
- [ ] Таблицы products + product_variants
- [ ] Таблица order_items + бизнес-логика

### БЛОК 2: Продажи — Интерфейс и логика
- [ ] Форма заказа с позициями (добавление/удаление, автопересчёт)
- [ ] Бизнес-правила (скидка >15% → согласование, комиссии агентов)
- [ ] Генерация документов (счёт, гарантия) + конвертация лида в заказ

### БЛОК 3: Продажи — Завершение
- [ ] Админ-панель для справочников (статусы, типы)
- [ ] Тесты + чек-лист приёмки

### БЛОК 4: Производство (минимум для продаж)
- [ ] production_orders + production_stages
- [ ] Статусы производства → обновление заказа

### БЛОК 5: Склады (минимум для продаж)
- [ ] Резервирование товаров + проверка наличия

### БЛОК 6: Финализация
- [ ] Интеграции-заглушки (1С, WordPress)
- [ ] Документация + миграции + чек-лист запуска

### БЛОК 7+: Полные модули
- [ ] Производство (полный)
- [ ] Склады (полный)
- [ ] Финансы
- [ ] ЛК клиента
- [ ] Мобильный PWA

---

## 12. Соглашения кода

- **Компоненты:** PascalCase, `.tsx`
- **Хуки:** camelCase с префиксом `use`, `.ts`/`.tsx`
- **Стили:** Tailwind CSS с семантическими токенами из `index.css`
- **Импорт Supabase:** всегда `import { supabase } from "@/integrations/supabase/client"`
- **Типы:** НЕ редактировать `src/integrations/supabase/types.ts` — генерируется автоматически
- **Конфиг:** НЕ редактировать `supabase/config.toml`, `.env`, `client.ts` — автогенерация
- **Миграции:** использовать инструмент `supabase--migration`
- **RLS:** обязательно для всех таблиц, проверка через `has_role` / `has_module_access`
- **Casting:** для таблиц не в types.ts использовать `as any` при запросах
