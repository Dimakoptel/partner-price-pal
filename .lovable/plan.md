
## Личный кабинет партнёра — MVP

### Этап 1: База данных

**1.1 Новая роль `partner` в enum `app_role`**
- ALTER TYPE app_role ADD VALUE 'partner'

**1.2 Связь пользователя с клиентом (clients)**
- Добавить `user_id UUID` в таблицу `clients` — привязка аккаунта партнёра к карточке клиента
- Когда админ подтверждает регистрацию партнёра, он привязывает его к записи в clients

**1.3 Таблица `partner_discounts` — скидки по категориям**
- `client_id UUID` (FK → clients)
- `category_id UUID` (FK → product_categories)
- `discount_percent NUMERIC`
- Уникальный ключ (client_id, category_id)

**1.4 Таблица `partner_requests` — запросы на расчёт**
- `id, number (auto), client_id, user_id`
- `category_id` (FK → product_categories)
- `product_type TEXT` (countertop, sink, etc.)
- `params JSONB` (размеры, тип слива, цвет и т.д. — из калькуляторов)
- `status TEXT` (new, in_progress, quoted, approved, rejected, ordered)
- `retail_price, partner_price NUMERIC`
- `assigned_manager_id UUID`
- `attachment_urls TEXT[]` (чертежи, фото, до 5шт)
- `created_at, updated_at`

**1.5 Таблица `partner_request_messages` — обсуждение запроса**
- `request_id UUID` (FK → partner_requests)
- `user_id UUID` (автор сообщения)
- `message TEXT`
- `attachment_urls TEXT[]`
- `created_at`

**1.6 Storage bucket `partner-attachments`**
- Для чертежей и фото

### Этап 2: RLS политики
- Партнёр видит только свои запросы и сообщения
- Менеджер видит запросы привязанных к нему партнёров
- Админ видит всё

### Этап 3: Роутинг и авторизация
- `/partner` — главная кабинета партнёра
- `/partner/requests` — список запросов
- `/partner/requests/:id` — детали запроса + обсуждение
- `/partner/pricelist` — прайс с ценами партнёра
- `ProtectedRoute` → проверка роли `partner`
- После входа: если роль partner → редирект на `/partner`

### Этап 4: UI партнёра
- **Дашборд**: статистика запросов, последние заказы
- **Создание запроса**: выбор категории → динамическая форма (поля из калькулятора) → загрузка файлов → отправка
- **Список запросов**: с пагинацией, фильтрами по статусу
- **Детали запроса**: параметры, цены (розница/партнёр), чат с менеджером, статус
- **Прайс-лист**: номенклатура с ценой партнёра (розница минус скидка по категории)

### Этап 5: Интеграция с CRM (сторона менеджера)
- Новые запросы партнёров видны в CRM
- Менеджер может ответить, указать цены, перевести в заказ
- При переводе в заказ → создаётся запись в `orders`

### Этап 6: Админка
- Управление скидками партнёра по категориям (в карточке клиента)
- Справочник `partner_types` в dictionary_items
- Назначение роли partner при подтверждении пользователя
