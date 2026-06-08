# Запуск MES COZY ART в Docker — два сценария

Документ описывает **два способа** локального запуска проекта:

1. **Полный стек** — фронтенд + self-hosted Supabase (PostgreSQL, Auth, REST,
   Storage, Realtime, Edge Functions, Studio). Полноценная работа всех модулей.
2. **Только фронтенд** — UI без локальной БД, подключение к уже существующему
   удалённому Supabase (например, к Lovable Cloud-инстансу). Полезно для
   быстрого превью интерфейса/дизайна.

> ⚠️ Полностью «без Supabase» запустить приложение **нельзя**: вся бизнес-логика
> (Auth, RLS, RPC-функции, триггеры, Edge Functions) реализована в Supabase.
> Frontend-only режим всё равно требует *какой-то* инстанс Supabase, чтобы
> приложение могло авторизоваться и читать справочники.

---

## 0. Предварительные требования

| ПО | Версия | Проверка |
|----|--------|----------|
| Docker Desktop | ≥ 4.30 | `docker --version` |
| Node.js LTS | ≥ 20 | `node --version` |
| npm | ≥ 10 | `npm --version` |
| Git | любая свежая | `git --version` |
| Supabase CLI | ≥ 1.180 | `supabase --version` |

Docker Desktop: выдайте **≥ 4 ГБ RAM и 2 CPU** (Settings → Resources).

Установка Supabase CLI:

```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz \
  | tar -xz && sudo mv supabase /usr/local/bin/

# Windows (PowerShell)
iwr -useb https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.tar.gz `
  -OutFile supabase.tar.gz
tar -xf supabase.tar.gz; mv supabase.exe C:\Windows\System32\
```

Клонируем репозиторий:

```bash
git clone <URL_РЕПОЗИТОРИЯ> mes-cozyart
cd mes-cozyart
npm install
```

---

## Сценарий A. Полный стек локально (рекомендуется)

Этот сценарий поднимает **весь Supabase в Docker** одной командой Supabase CLI
и накатывает все миграции и сиды.

### A.1. Запуск Supabase

```bash
supabase start
```

Первый запуск — 3–7 минут (тянутся образы). По завершении CLI печатает:

```
API URL:            http://127.0.0.1:54321
DB URL:             postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL:         http://127.0.0.1:54323
Inbucket URL:       http://127.0.0.1:54324
anon key:           eyJhbGciOi...
service_role key:   eyJhbGciOi...
```

Сохраните `anon key` — он нужен фронтенду.

| Порт | Сервис |
|------|--------|
| 54321 | Supabase API (Kong) |
| 54322 | PostgreSQL |
| 54323 | Supabase Studio (админка БД) |
| 54324 | Inbucket (тестовая почта) |

### A.2. Применение миграций и сидов

```bash
supabase db reset
```

Команда:
1. Дропает локальную БД;
2. Прогоняет **все миграции** из `supabase/migrations/` (RLS, словари, функции,
   триггеры);
3. Запускает Edge Functions из `supabase/functions/`.

> ⚠️ Уничтожает локальные данные. Это норма на dev-стенде.

### A.3. Переменные окружения фронтенда

Создайте `.env.local` в корне (не коммитится):

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key из supabase start>
VITE_SUPABASE_PROJECT_ID=local
```

`.env` управляется Lovable Cloud — **не редактировать**. Vite автоматически
приоритезирует `.env.local`.

### A.4. Запуск фронтенда

```bash
npm run dev
```

Откроется http://localhost:8080.

### A.5. Создание первого администратора

1. Зарегистрируйте email/пароль на `/auth`.
2. Откройте письмо подтверждения в Inbucket → http://localhost:54324.
3. В Supabase Studio → SQL Editor:

   ```sql
   SELECT id, email FROM auth.users;

   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<ВАШ_UUID>', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

4. Перезайдите — появятся разделы Админ, Производство, Склад, ЗП.

### A.6. Загрузка демо-данных

`/admin` → «Расчёты» → «Загрузить демо-данные» (вызывает edge function
`seed-sales-demo`).

### A.7. Полезные команды

| Команда | Действие |
|---------|----------|
| `supabase status` | Показать URL и ключи |
| `supabase stop` | Остановить контейнеры (данные сохранятся) |
| `supabase stop --no-backup` | Полный сброс |
| `supabase db reset` | Перенакатить миграции с нуля |
| `supabase functions serve <name>` | Edge function с hot-reload |
| `supabase functions logs <name> --tail` | Логи функции |

---

## Сценарий B. Только фронтенд в Docker

Используется, когда хотите **только превью UI**, а Supabase у вас уже есть
(удалённый Lovable Cloud или другой инстанс).

### B.1. Dockerfile для фронтенда

Создайте `Dockerfile.frontend` в корне:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### B.2. docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "8080:8080"
    environment:
      VITE_SUPABASE_URL: ${SUPABASE_URL}
      VITE_SUPABASE_PUBLISHABLE_KEY: ${SUPABASE_ANON_KEY}
      VITE_SUPABASE_PROJECT_ID: ${SUPABASE_PROJECT_ID:-remote}
    volumes:
      - ./src:/app/src
      - ./public:/app/public
      - ./index.html:/app/index.html
```

### B.3. Запуск

```bash
export SUPABASE_URL="https://<ref>.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."

docker compose up --build
```

Откройте http://localhost:8080. Все данные тянутся из удалённого Supabase.

> **Важно:** Auth, Realtime, RLS, Edge Functions работают только если этот
> Supabase реально доступен и содержит миграции проекта.

---

## Сценарий C. Полный стек через docker-compose (без CLI)

Если не хотите ставить Supabase CLI — можно поднять Postgres + GoTrue +
PostgREST вручную. Этот путь сложнее и **не покрывает Edge Functions и
Realtime**. Используйте сценарий A, если возможно.

Минимальный пример (`docker-compose.db-only.yml`):

```yaml
services:
  postgres:
    image: supabase/postgres:15.1.0.117
    restart: unless-stopped
    ports:
      - "54322:5432"
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

```bash
docker compose -f docker-compose.db-only.yml up -d
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f supabase/migrations/<имя_миграции>.sql
```

⚠️ Без GoTrue/PostgREST приложение **не заработает** — это путь только для
анализа схемы БД.

---

## 4. Типичные проблемы

| Симптом | Решение |
|---------|---------|
| `Cannot connect to the Docker daemon` | Запустите Docker Desktop |
| `port 54321 already allocated` | `supabase stop` или другой проект на этом порту |
| Белая страница после `npm run dev` | Проверьте `.env.local`, URL и anon key |
| `JWT expired` | Обновите страницу — токен пере-выпустится |
| После `db reset` нет администратора | Повторите шаг A.5 |
| Письма не приходят | Откройте Inbucket http://localhost:54324 |
| Edge Function не отвечает | `supabase functions serve <name>` — проверьте логи |
| Realtime не подключается в B-сценарии | Удалённый Supabase должен иметь `REPLICA IDENTITY FULL` на нужных таблицах |

---

## 5. Резервные копии и восстановление

```bash
# Dump
supabase db dump -f backup_$(date +%F).sql --data-only

# Restore
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < backup.sql
```

---

## 6. Что дальше

- Прод-развёртывание на сервер → [`DEPLOY.md`](../DEPLOY.md)
- Архитектура и модули → [`docs/PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md)
- Бизнес-логика и формулы → [`KNOWLEDGE.md`](../KNOWLEDGE.md)
- Старая инструкция (CLI-only) → [`docs/LOCAL_DOCKER_SETUP.md`](LOCAL_DOCKER_SETUP.md)
