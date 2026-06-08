# 🐳 Локальное развёртывание MES COZY ART в Docker

Пошаговая инструкция для запуска проекта на локальном хосте через Docker.
Подходит как для разработки, так и для self-hosting в production.

> Краткий вариант есть в [DOCKER_SETUP.md](./DOCKER_SETUP.md). Этот документ — расширенный.

---

## 📋 Требования

| Инструмент | Минимальная версия | Проверка |
|---|---|---|
| Docker | 24+ | `docker --version` |
| Docker Compose | v2.20+ | `docker compose version` |
| Git | 2.30+ | `git --version` |
| Node.js (опционально) | 20+ | для локальной разработки без Docker |
| Свободные порты | 8080, 54321-54324 | `lsof -i :8080` |
| RAM | 4 ГБ минимум | |
| Диск | 10 ГБ свободно | |

---

## 🧭 Архитектура

```
┌────────────────────────────────────────────────────────┐
│              MES COZY ART (Frontend)                   │
│      React 18 + Vite 5 + TS + Tailwind                 │
│              http://localhost:8080                     │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTPS / WebSocket
        ┌──────────────┴────────────────┐
        ▼                               ▼
┌───────────────────┐         ┌──────────────────┐
│  Lovable Cloud    │   ИЛИ   │  Local Supabase  │
│  (managed prod)   │         │  (self-hosted)   │
└───────────────────┘         └──────────────────┘
```

Frontend — это статическое SPA. Бэкенд — Supabase (Postgres + Auth + Edge Functions + Storage).

---

# Сценарий A — Docker + Lovable Cloud (рекомендуется)

Самый быстрый способ. Бэкенд уже работает в облаке Lovable. В Docker запускается только фронтенд.

## A1. Клонирование

```bash
git clone <your-repo-url> mes-cozyart
cd mes-cozyart
```

## A2. Переменные окружения

Создайте `.env` в корне:

```env
VITE_SUPABASE_URL=https://lpmdonabwaseculhjnlz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbWRvbmFid2FzZWN1bGhqbmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODc2NDcsImV4cCI6MjA4NjI2MzY0N30.JdCXxJauw04eWvCL5SYbITfQcEQCG2iNG41WTKOQS_Q
VITE_SUPABASE_PROJECT_ID=lpmdonabwaseculhjnlz
```

> Эти значения берутся из вкладки **Connectors → Lovable Cloud** в редакторе.

## A3. `Dockerfile` (production build)

```dockerfile
# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json bun.lockb* ./
RUN npm ci --silent
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
RUN npm run build

# ---- runtime stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## A4. `docker/nginx.conf` (SPA fallback)

```nginx
server {
  listen 8080;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;

  location / {
    try_files $uri /index.html;
  }

  location ~* \.(?:js|css|woff2?|svg|png|jpg|ico)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
}
```

## A5. `docker-compose.yml`

```yaml
services:
  app:
    build:
      context: .
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
        VITE_SUPABASE_PUBLISHABLE_KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY}
        VITE_SUPABASE_PROJECT_ID: ${VITE_SUPABASE_PROJECT_ID}
    ports:
      - "8080:8080"
    restart: unless-stopped
    env_file: .env
```

## A6. Запуск

```bash
docker compose up -d --build
```

Откройте http://localhost:8080. Регистрация/логин уже работают через Lovable Cloud.

---

# Сценарий B — Полностью локально (Docker + Supabase CLI)

Подходит, если нужен изолированный стенд без облака.

## B1. Установите Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase
# Linux
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz \
  | tar -xz && sudo mv supabase /usr/local/bin/
# Windows (scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Проверка: `supabase --version` (≥ 1.150).

## B2. Запуск локального Supabase

В корне проекта:

```bash
supabase start
```

CLI развернёт через Docker:

| Сервис | Порт | URL |
|---|---|---|
| Postgres | 54322 | `postgresql://postgres:postgres@localhost:54322/postgres` |
| API (REST + Auth) | 54321 | http://localhost:54321 |
| Studio (админка БД) | 54323 | http://localhost:54323 |
| Inbucket (тестовые письма) | 54324 | http://localhost:54324 |

После запуска CLI выведет `anon key` и `service_role key` — сохраните.

## B3. Применение миграций и сидов

```bash
supabase db reset    # применит все миграции из supabase/migrations/
```

Это создаст всю схему: `dictionary_items`, `system_settings`, `orders`, `production_orders`, RLS-политики и т.д.

## B4. Деплой edge functions локально

```bash
supabase functions serve
```

## B5. `.env` для локального стенда

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key из supabase start>
VITE_SUPABASE_PROJECT_ID=local
```

## B6. Запуск фронтенда (тот же Dockerfile)

```bash
docker compose up -d --build
```

Откройте http://localhost:8080. Создайте первого пользователя через UI — он автоматически получит роль `user`. Чтобы выдать `admin`:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c \
  "UPDATE user_roles SET role='admin' WHERE user_id=(SELECT id FROM auth.users ORDER BY created_at LIMIT 1);"
```

## B7. Первичная настройка через UI

После входа админом откройте:

1. **Админ-панель → Системные настройки** — проверьте/измените: НДС, гарантия, часы резерва, порог согласования скидки.
2. **Админ-панель → Справочники** — статусы заказов, этапы производства и т.д. (управляются через `dictionary_items` + `semantic_tags`).
3. **Админ-панель → Калькуляторы → Цены** — базовые цены и коэффициенты.
4. **Админ-панель → Система → Контакты компании** — реквизиты для документов.

---

## 🔄 Обновление приложения

```bash
git pull
docker compose up -d --build
# при наличии новых миграций (Сценарий B):
supabase db push
```

## 🗄️ Резервное копирование БД (Сценарий B)

```bash
# Бэкап
docker exec -t supabase_db_$(basename $PWD) pg_dump -U postgres postgres > backup.sql
# Восстановление
cat backup.sql | docker exec -i supabase_db_$(basename $PWD) psql -U postgres
```

## 🐞 Диагностика

| Проблема | Решение |
|---|---|
| `port already in use` | `lsof -i :8080` → убить процесс или сменить порт в `docker-compose.yml` |
| Белый экран | `docker logs <container>` + проверить, что VITE_ переменные были переданы при `build` |
| 401/403 при запросах | Проверить `VITE_SUPABASE_PUBLISHABLE_KEY` и что RLS-политики применены |
| Логин не работает | Сценарий B: в Studio → Auth → Providers включить Email; отключить «Confirm email» |
| Edge functions 404 | Запустите `supabase functions serve` или задеплойте: `supabase functions deploy <name>` |
| Долгая сборка | Используйте `bun` вместо `npm` в Dockerfile (`bun install` + `bun run build`) |

## 🔐 Production-чек-лист

- [ ] Заменить `VITE_SUPABASE_PUBLISHABLE_KEY` на production-anon-ключ
- [ ] Включить HTTPS (reverse proxy: Caddy / Traefik / nginx-proxy)
- [ ] Настроить Storage-бакеты (`company-assets` public, `partner-attachments` private)
- [ ] Включить cron `release-expired-reservations` (Supabase → Scheduled Functions)
- [ ] Настроить SMTP для Auth (если Сценарий B)
- [ ] Включить бэкапы БД (pg_dump по расписанию)
- [ ] В **Админ-панель → Системные настройки** проверить НДС, гарантию, резервы

---

## 📚 Связанные документы

- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — архитектура и модули
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) — короткая версия
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — чек-лист запуска в продакшене
