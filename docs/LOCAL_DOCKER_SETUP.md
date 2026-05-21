# Запуск MES COZY ART на локальном ПК в Docker

> Пошаговая инструкция для разработчика. Поднимает **весь стек локально**:
> self-hosted Supabase (PostgreSQL + Auth + REST + Storage + Studio) и
> фронтенд React. Никаких облачных сервисов не требуется.
>
> **Дата:** 2026-05-21

---

## 0. Что получится в итоге

| Сервис | URL | Порт |
|--------|-----|------|
| Фронтенд (Vite dev) | http://localhost:8080 | 8080 |
| Supabase Studio (админка БД) | http://localhost:54323 | 54323 |
| Supabase API (Kong) | http://localhost:54321 | 54321 |
| PostgreSQL | localhost:54322 | 54322 |
| Inbucket (тестовая почта) | http://localhost:54324 | 54324 |

---

## 1. Предварительные требования

Установите на ПК (Windows / macOS / Linux):

1. **Docker Desktop** ≥ 4.30 — <https://www.docker.com/products/docker-desktop/>
   - Windows: включите интеграцию WSL2.
   - Выделите Docker минимум **4 ГБ RAM** и **2 CPU** (Settings → Resources).
2. **Node.js 20 LTS** + npm ≥ 10 — <https://nodejs.org/>
3. **Git** — <https://git-scm.com/downloads>
4. **Supabase CLI** ≥ 1.180 — официальный установщик:
   - Windows (PowerShell):
     ```powershell
     iwr -useb https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.tar.gz -OutFile supabase.tar.gz
     tar -xf supabase.tar.gz; mv supabase.exe C:\Windows\System32\
     ```
   - macOS: `brew install supabase/tap/supabase`
   - Linux: `curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz && sudo mv supabase /usr/local/bin/`
5. (Опционально) **VS Code** + расширения ESLint, Tailwind CSS IntelliSense.

Проверка установки:

```bash
docker --version
node --version          # v20.x
npm --version
git --version
supabase --version      # 1.180+
```

---

## 2. Клонирование репозитория

```bash
git clone <URL_РЕПОЗИТОРИЯ> mes-cozyart
cd mes-cozyart
npm install
```

---

## 3. Запуск Supabase локально (Docker)

Supabase CLI сам поднимает **все необходимые контейнеры** одной командой
(Postgres, GoTrue, PostgREST, Storage, Studio, Kong, Realtime, Inbucket).

```bash
supabase start
```

Первый запуск занимает 3–7 минут (скачиваются образы). По завершении CLI
выводит блок с ключами — **сохраните его**:

```
API URL:            http://127.0.0.1:54321
DB URL:             postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL:         http://127.0.0.1:54323
Inbucket URL:       http://127.0.0.1:54324
anon key:           eyJhbGciOi...   ← скопируйте
service_role key:   eyJhbGciOi...   ← скопируйте
```

Полезные команды:

| Команда | Назначение |
|---------|-----------|
| `supabase status` | Показать ключи и URL текущей среды |
| `supabase stop` | Остановить контейнеры (данные сохраняются) |
| `supabase stop --no-backup` | Полный сброс БД |
| `supabase db reset` | Применить миграции с нуля + сиды |

---

## 4. Применение миграций и сидов

В репозитории уже лежат миграции в `supabase/migrations/`. Применить их:

```bash
supabase db reset
```

Эта команда:
1. Дропает локальную БД;
2. Применяет **все миграции по порядку** (включая словари, RLS, функции,
   триггеры, пробные данные);
3. Запускает Edge Functions из `supabase/functions/`.

> ⚠ Команда уничтожает локальные данные. Это нормально на dev-стенде.

---

## 5. Настройка переменных окружения фронтенда

Создайте файл `.env.local` (не коммитится) в корне:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key из вывода supabase start>
VITE_SUPABASE_PROJECT_ID=local
```

> Файл `.env` авто-генерируется Lovable Cloud и его трогать **нельзя**.
> Vite автоматически приоритезирует `.env.local` поверх `.env`.

---

## 6. Запуск фронтенда

```bash
npm run dev
```

Откроется http://localhost:8080 — приложение, подключённое к локальному
Supabase.

---

## 7. Создание первого администратора

1. На http://localhost:8080/auth зарегистрируйте email/пароль.
2. Письмо-подтверждение откройте в Inbucket → http://localhost:54324.
3. Откройте Studio → http://localhost:54323 → SQL Editor и выполните:

   ```sql
   -- Узнайте свой user_id
   SELECT id, email FROM auth.users;

   -- Назначьте роль admin (подставьте id)
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<ВАШ_UUID>', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

4. Перезайдите в приложение — будут доступны разделы Админ, Производство,
   Склад, Зарплата.

---

## 8. Edge Functions локально

Функции стартуют автоматически вместе с `supabase start`. Если нужно
разрабатывать функцию с hot-reload:

```bash
supabase functions serve generate-document --no-verify-jwt --env-file ./supabase/.env.local
```

Логи:

```bash
supabase functions logs generate-document --tail
```

---

## 9. Полезные операции

### Резервная копия БД

```bash
supabase db dump -f backup_$(date +%F).sql --data-only
```

### Восстановление

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < backup_2026-05-21.sql
```

### Подключение к БД через psql / DBeaver / TablePlus

```
Host: 127.0.0.1
Port: 54322
DB:   postgres
User: postgres
Pass: postgres
```

### Загрузка демо-данных продаж

В Studio → Edge Functions → `seed-sales-demo` → Invoke (или из админки
`/admin` → раздел «Расчёты» → «Загрузить демо-данные»).

---

## 10. Типичные проблемы

| Симптом | Решение |
|---------|---------|
| `Cannot connect to the Docker daemon` | Запустите Docker Desktop, дождитесь зелёного индикатора. |
| `port 54321 is already allocated` | `supabase stop`, либо остановите соседний проект. |
| Фронт стартует, но видна белая страница | Проверьте `.env.local` — URL/anon key совпадают с `supabase status`. |
| `JWT expired` после долгого простоя | Обновите страницу — токен пере-выпустится. |
| После `db reset` нет администратора | Повторите шаг 7. |
| Письма не приходят | Откройте Inbucket http://localhost:54324 — все письма приземляются туда. |

---

## 11. Что дальше

- Продакшен-развёртывание на собственный сервер — см. [`DEPLOY.md`](../DEPLOY.md).
- Архитектура и модули — см. [`docs/PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md).
- Бизнес-логика и формулы — см. [`KNOWLEDGE.md`](../KNOWLEDGE.md).
