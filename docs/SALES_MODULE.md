# Модуль Продажи — MES COZY ART

## 📋 Описание

Модуль для управления продажами изделий из архитектурного бетона: лиды, заказы, клиенты, воронка, задачи.

## 🏗️ Архитектура

- **Фронтенд**: React 18 + TypeScript + Tailwind + ShadCN/UI
- **Бэкенд**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State**: TanStack Query (React Query)

## 📦 Таблицы

| Таблица | Описание |
|---------|----------|
| `clients` | Клиенты (B2C/B2B/агенты/дизайнеры/партнёры/застройщики) |
| `leads` | Лиды с воронкой и конвертацией в заказ |
| `orders` | Заказы с типами, статусами, доставкой, гарантией |
| `order_items` | Позиции заказа с автопересчётом суммы |
| `products` / `product_variants` | Каталог товаров и вариантов |
| `agent_commissions` | Комиссии агентов с начислением и выплатой |
| `reservations` | Резервирование товаров на складе |
| `integration_queue` | Очередь для обмена с 1С и другими системами |

## 🔧 Настройки

Все бизнес-правила в таблице `system_settings`:

| Ключ | Значение | Описание |
|------|----------|----------|
| `warranty_default_months` | 12 | Стандартный срок гарантии |
| `discount_approval_threshold` | 15 | Порог согласования скидки (%) |
| `reserve_hours_unpaid` | 72 | Срок резерва без оплаты (часы) |
| `reserve_hours_paid` | 168 | Срок резерва с предоплатой (часы) |

## 🔗 Интеграции

### WordPress → Лиды
- **Endpoint:** `POST /functions/v1/webhook-wordpress-lead`
- **Авторизация:** `Authorization: Bearer <WORDPRESS_WEBHOOK_KEY>`
- **Тело запроса:**
```json
{
  "name": "Иван Петров",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "source": "website",
  "message": "Интересует столешница",
  "product_interest": "столешница",
  "utm": { "source": "google", "medium": "cpc", "campaign": "brand" }
}
```

### 1С ↔ Обмен данными
- **Таблица:** `integration_queue` (direction: `to_1c` / `from_1c`)
- **Функция:** `queue_order_for_1c_sync` — при изменении статуса заказа
- **Обработчик:** через n8n (требует настройки)

## 📊 Database Functions

| Функция | Назначение |
|---------|-----------|
| `generate_order_number()` | Авто-нумерация ORD-YYYYMMDD-NNN |
| `recalculate_order_totals()` | Пересчёт итогов заказа |
| `apply_discount_rule()` | Скидка >15% → согласование |
| `calculate_agent_commission()` | Расчёт комиссии агента |
| `calculate_warranty_months()` | Каскадный расчёт гарантии |
| `create_production_order_from_sales()` | Создание произв. заказа |
| `reserve_order_stock()` | Массовое резервирование |
| `check_product_availability()` | Проверка доступности (MVP: заглушка) |

## ⚠️ Известные ограничения

- **Генерация PDF:** только HTML (для PDF требуется внешний сервис)
- **Резервы товаров:** заглушка «всегда доступно» (нет таблицы `inventory`)
- **1С-интеграция:** очередь готова, обработчик требует n8n
- **Уведомления:** Telegram-бот — заглушка

## 🗺️ Следующие шаги

1. Подключить реальный склад (таблица `inventory`)
2. Настроить n8n для обмена с 1С
3. Добавить Telegram-уведомления менеджерам
4. PWA для мастеров производства
5. Личный кабинет клиента
