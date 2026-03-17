# ЧЕК-ЛИСТ ПРИЁМКИ: Модуль «Продажи»

> Дата создания: 2026-03-17  
> Версия: 1.0

---

## ✅ БАЗА ДАННЫХ

- [x] Таблица `clients`: все поля (client_type, pricing_type, discount_default, credit_limit, payment_terms, commission_rate, inn, region, manager_id, source)
- [x] Таблица `leads`: все поля (assigned_manager_id, budget, region, lost_reason, converted_to_order_id, product_interest, client_id)
- [x] Таблица `orders`: автогенерация номера (trigger `generate_order_number`), order_type, status, delivery_method, warranty_months, agent_id, discount_percent, approval_*
- [x] Таблица `order_items`: FK → orders + product_variants, quantity, price_unit, discount_line, total_line, warranty_months, production_required
- [x] Таблица `dictionary_items` + `dictionary_types`: справочники статусов и типов
- [x] Таблица `system_settings`: warranty_default_months, discount_approval_threshold
- [x] Таблица `products` + `product_variants`: каталог с вариантами, ценами, характеристиками
- [x] Таблица `agent_commissions`: agent_id, order_id, amount, status (reserved/accrued/paid/cancelled)
- [x] Таблица `audit_log`: фиксация изменений
- [x] Функция `is_admin()`: проверяет через `has_role` + `user_roles`
- [x] Функция `recalculate_order_totals()`: SUM(total_line) → orders.total_amount + MAX(warranty)
- [x] Функция `calculate_warranty_months()`: цепочка override → variant → product → system_settings → 12
- [x] Функция `calculate_agent_commission()`: процент от суммы для клиентов типа agent
- [x] Функция `apply_discount_rule()`: скидка > threshold → pending_approval
- [x] RLS на всех таблицах: admin=ALL, user=own records, module access через `has_module_access`

## ✅ ИНТЕРФЕЙС

- [x] Вкладка «Лиды»: таблица, фильтрация по статусу, поиск по имени/телефону, статистика (всего/новых/сумма)
- [x] Карточка лида: детали, смена статуса, «Создать клиента», «Создать заказ», причина отказа
- [x] Вкладка «Заказы»: таблица, фильтрация по статусу, поиск, статистика (всего/активных/сумма/оплата)
- [x] Форма заказа: выбор клиента, типа, доставки, адреса, скидки, гарантии, примечаний
- [x] Редактор позиций заказа: OrderItemsEditor (добавление/удаление, выбор варианта, цена, количество, скидка)
- [x] Вкладка «Клиенты»: расширенная форма с типами, ИНН, ценообразованием, кредитным лимитом, комиссией
- [x] Вкладка «Воронка»: Kanban-доска (PipelineBoard) со стадиями
- [x] Вкладка «Задачи»: список задач с приоритетами, сроками, статусами
- [x] Админ-панель «Справочники системы»: CRUD элементов, сортировка, активация/деактивация

## ✅ БИЗНЕС-ЛОГИКА

- [x] Конвертация лида → клиент: создаёт запись в clients, привязывает client_id к лиду
- [x] Конвертация лида → заказ: создаёт order, привязывает lead_id + client_id, статус лида → won
- [x] Позиции заказа: CRUD через order_items, пересчёт через `recalculate_order_totals`
- [x] Скидка > threshold: `apply_discount_rule` → status = pending_approval, фиксация approval_requested_at
- [x] Гарантия: `calculate_warranty_months` — каскадный расчёт
- [x] Комиссия агента: `calculate_agent_commission` при наличии agent-клиента
- [x] RLS: менеджер видит свои заказы (responsible_id), admin — все; модульный доступ через groups

## ✅ ДОКУМЕНТЫ

- [x] Edge function `generate-document`: генерация HTML-счёта и гарантийного талона
- [x] Переменные шаблонов: order.number, client.name, items[], company settings
- [x] Хук `useDocumentGeneration`: вызов из интерфейса

## ⬜ ИНТЕГРАЦИИ (заглушки — не реализованы для MVP)

- [ ] Webhook от WordPress → создание лида
- [ ] Очередь `failed_jobs` для ошибок
- [ ] Таблица `integration_queue` для 1С

> ℹ️ Интеграции запланированы на Блок 6 дорожной карты

## ✅ SEED / ТЕСТОВЫЕ ДАННЫЕ

- [x] Edge function `seed-sales-demo`: создаёт 3 клиента + 3 лида + 3 заказа
- [x] Кнопка «Демо-данные» в админ-панели

---

## 📋 СКВОЗНОЙ ТЕСТ (ручной)

| # | Шаг | Ожидание | Статус |
|---|-----|----------|--------|
| 1 | Создать клиента типа «Агент» с комиссией 10% | Клиент появляется в списке | ⬜ |
| 2 | Создать лид от этого клиента | Лид со статусом «Новый» | ⬜ |
| 3 | Конвертировать лид → клиент (если нет) | client_id привязан к лиду | ⬜ |
| 4 | Конвертировать лид → заказ | Заказ создан, лид → «Выигран» | ⬜ |
| 5 | Добавить 2–3 позиции в заказ | Сумма пересчитана автоматически | ⬜ |
| 6 | Применить скидку 20% | Статус → pending_approval | ⬜ |
| 7 | Сгенерировать счёт → скачать HTML | Корректные реквизиты и суммы | ⬜ |
| 8 | Сгенерировать гарантию | Корректный срок гарантии | ⬜ |
| 9 | Проверить комиссию агента | Запись в agent_commissions, статус reserved | ⬜ |
| 10 | Проверить RLS: обычный user не видит чужие заказы | 0 чужих записей | ⬜ |

---

## 📊 МЕТРИКИ КАЧЕСТВА

| Метрика | Целевое значение | Фактическое |
|---------|-----------------|-------------|
| Загрузка списка заказов | < 2 сек | — |
| Пересчёт суммы заказа | < 100 мс | — |
| Генерация документа | < 3 сек | — |
| Ошибки в консоли | 0 | — |

---

## 📝 РЕЗУЛЬТАТ ПРИЁМКИ

**Дата приёмки:** _______________

**Принял:** _______________

**Статус:** ⬜ Принято | ⬜ Требует доработки | ⬜ Отклонено

**Комментарии:**

---
