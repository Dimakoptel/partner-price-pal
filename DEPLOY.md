# Инструкция по развёртыванию CozyArt Calculator на своём сервере

> **Дата последнего обновления:** 2026-02-19  
> **Домен:** calc.cozyart.ru  
> **Стек:** Docker + PostgreSQL + Supabase (self-hosted) + Nginx Proxy Manager

---

## Оглавление

1. [Обзор архитектуры](#1-обзор-архитектуры)
2. [Предварительные требования](#2-предварительные-требования)
3. [Шаг 1: Клонирование репозитория](#3-шаг-1-клонирование-репозитория)
4. [Шаг 2: Развёртывание Supabase (self-hosted)](#4-шаг-2-развёртывание-supabase-self-hosted)
5. [Шаг 3: Создание базы данных](#5-шаг-3-создание-базы-данных)
6. [Шаг 4: Наполнение начальными данными](#6-шаг-4-наполнение-начальными-данными)
7. [Шаг 5: Сборка и запуск фронтенда](#7-шаг-5-сборка-и-запуск-фронтенда)
8. [Шаг 6: Настройка Nginx Proxy Manager](#8-шаг-6-настройка-nginx-proxy-manager)
9. [Шаг 7: Создание первого администратора](#9-шаг-7-создание-первого-администратора)
10. [Обновление проекта](#10-обновление-проекта)
11. [Хранение файлов (Storage)](#11-хранение-файлов-storage)
12. [Калькулятор транспортировочного ящика](#12-калькулятор-транспортировочного-ящика)
13. [Устранение неполадок](#13-устранение-неполадок)

---

## 1. Обзор архитектуры

```
┌────────────────────────────────────────────────┐
│              Nginx Proxy Manager               │
│         calc.cozyart.ru → frontend:80          │
│     api.calc.cozyart.ru → supabase-kong:8000   │
└────────────────────────────────────────────────┘
          │                        │
          ▼                        ▼
┌──────────────────┐   ┌──────────────────────────┐
│  Frontend (Nginx) │   │   Supabase (self-hosted)  │
│  SPA + static     │   │  - Kong (API gateway)     │
│  Port: 3080       │   │  - GoTrue (Auth)          │
│                    │   │  - PostgREST (REST API)   │
│                    │   │  - Storage API            │
└──────────────────┘   └──────────┬───────────────┘
                                   │
                          ┌────────▼────────┐
                          │   PostgreSQL     │
                          │  (ваш контейнер) │
                          │   Port: 5432     │
                          └─────────────────┘
```

**Важно:** Проект использует Supabase не только как базу данных, но и как:
- **Auth** (аутентификация, JWT-токены, регистрация)
- **PostgREST** (REST API для таблиц с RLS)
- **Storage** (хранение логотипов и иконок)

Поэтому нужен полноценный self-hosted Supabase, а не просто PostgreSQL.

---

## 2. Предварительные требования

- Docker и Docker Compose v2+
- Git
- Node.js 18+ (для сборки фронтенда, можно собирать в Docker)
- Свободные порты: 3080 (фронтенд), 8000 (Supabase API)
- Домен calc.cozyart.ru настроен и проксируется через NPM

---

## 3. Шаг 1: Клонирование репозитория

```bash
cd /opt
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> cozyart-calc
cd cozyart-calc
```

---

## 4. Шаг 2: Развёртывание Supabase (self-hosted)

### 4.1. Скачивание Supabase Docker

```bash
cd /opt
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

### 4.2. Настройка `.env` Supabase

Отредактируйте `/opt/supabase/docker/.env`:

```env
############
# Secrets - ЗАМЕНИТЕ НА СВОИ!
############

# Генерируйте: openssl rand -base64 32
POSTGRES_PASSWORD=ваш_супер_пароль_для_postgres
JWT_SECRET=ваш_jwt_secret_минимум_32_символа

# Генерируйте JWT токены на https://supabase.com/docs/guides/self-hosting#api-keys
# или используйте: https://jwt.io/
# Payload для ANON_KEY: {"role":"anon","iss":"supabase","iat":1700000000,"exp":2000000000}
# Payload для SERVICE_ROLE_KEY: {"role":"service_role","iss":"supabase","iat":1700000000,"exp":2000000000}
ANON_KEY=eyJ...ваш_anon_key
SERVICE_ROLE_KEY=eyJ...ваш_service_role_key

############
# Database - Укажите ВАШУ PostgreSQL если хотите использовать существующую
############
POSTGRES_HOST=db           # или IP вашего существующего контейнера PostgreSQL
POSTGRES_PORT=5432
POSTGRES_DB=postgres

############
# API
############
SITE_URL=https://calc.cozyart.ru
API_EXTERNAL_URL=https://api.calc.cozyart.ru

# Или если API будет на том же домене через /api:
# API_EXTERNAL_URL=https://calc.cozyart.ru

############
# Auth
############
GOTRUE_SITE_URL=https://calc.cozyart.ru
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_DISABLE_SIGNUP=false
```

### 4.3. Подключение к существующему PostgreSQL

Если вы хотите использовать **ваш существующий контейнер PostgreSQL** (а не встроенный в Supabase):

1. Создайте базу данных `supabase` в вашем pgAdmin
2. В `/opt/supabase/docker/.env` укажите:
   ```env
   POSTGRES_HOST=ваш_postgres_контейнер   # имя контейнера или IP
   POSTGRES_PORT=5432
   POSTGRES_DB=supabase
   POSTGRES_PASSWORD=пароль_от_вашего_postgres
   ```
3. Убедитесь, что контейнеры в одной Docker-сети:
   ```bash
   docker network create app-network
   # Подключите ваш postgres к сети:
   docker network connect app-network ваш_postgres_контейнер
   ```

### 4.4. Запуск Supabase

```bash
cd /opt/supabase/docker
docker compose up -d
```

Проверьте что всё запустилось:
```bash
docker compose ps
# Все контейнеры должны быть в статусе "running"

# Проверка API:
curl http://localhost:8000/rest/v1/ -H "apikey: ваш_ANON_KEY"
```

---

## 5. Шаг 3: Создание базы данных

Подключитесь к PostgreSQL через pgAdmin или `psql` и выполните **все команды последовательно**.

### 5.1. Расширения и типы

```sql
-- Расширение для генерации UUID (обычно уже есть)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Перечисление ролей
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
```

### 5.2. Таблица `profiles`

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  phone TEXT,
  telegram TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));
```

### 5.3. Таблица `user_roles`

```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user'
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### 5.4. Таблица `pricing_settings`

```sql
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pricing" ON public.pricing_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage pricing" ON public.pricing_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### 5.5. Таблица `company_settings`

```sql
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'contacts',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read company settings" ON public.company_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert company settings" ON public.company_settings
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company settings" ON public.company_settings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company settings" ON public.company_settings
  FOR DELETE USING (has_role(auth.uid(), 'admin'));
```

### 5.6. Таблица `standard_colors`

```sql
CREATE TABLE IF NOT EXISTS public.standard_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.standard_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read colors" ON public.standard_colors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage colors" ON public.standard_colors
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### 5.7. Таблица `saved_calculations`

```sql
CREATE TABLE IF NOT EXISTS public.saved_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_type TEXT NOT NULL,
  product_label TEXT NOT NULL,
  calc_name TEXT NOT NULL DEFAULT '',
  params JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calculations" ON public.saved_calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations" ON public.saved_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations" ON public.saved_calculations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all calculations" ON public.saved_calculations
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all calculations" ON public.saved_calculations
  FOR DELETE USING (has_role(auth.uid(), 'admin'));
```

### 5.8. Функции

```sql
-- Функция проверки роли
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Функция автообновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Функция создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  RETURN NEW;
END;
$$;

-- Функция назначения роли при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
```

### 5.9. Триггеры

```sql
-- Автообновление updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_updated_at
  BEFORE UPDATE ON public.pricing_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Автосоздание профиля и роли при регистрации пользователя
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();
```

---

## 6. Шаг 4: Наполнение начальными данными

### 6.1. Настройки цен (`pricing_settings`)

```sql
INSERT INTO public.pricing_settings (key, value, label, category) VALUES
-- General
('custom_color_surcharge', 3000, 'Доплата за нестандартный цвет (₽)', 'general'),
('density', 2400, 'Плотность бетона (кг/м³)', 'general'),
('install_price_per_kg', 120, 'Стоимость монтажа за кг (₽)', 'general'),
('min_install_price', 12000, 'Минимальная стоимость монтажа (₽)', 'general'),

-- Countertop
('base_price_per_m2', 53200, 'Базовая цена за м² (₽)', 'countertop'),
('countertop_custom_color_surcharge', 3000, 'Доплата за нестандартный цвет столешницы (₽)', 'countertop'),
('countertop_density', 2350, 'Плотность бетона столешницы (кг/м³)', 'countertop'),
('countertop_install_per_kg', 112, 'Монтаж столешницы за кг (₽)', 'countertop'),
('countertop_min_install', 10000, 'Мин. стоимость монтажа столешницы (₽)', 'countertop'),
('drop_multiplier', 1.1, 'Множитель стоимости опусков', 'countertop'),
('ivory_color_multiplier', 1.03, 'Наценка за белоснежный цвет (множитель)', 'countertop'),
('support_multiplier', 1.15, 'Множитель стоимости опор', 'countertop'),
('thickness_40_multiplier', 1.1, 'Наценка за толщину 40мм (множитель)', 'countertop'),

-- Sink
('sink_base_price_per_m2', 53200, 'Базовая цена раковины за м² (₽)', 'sink'),
('sink_bowl_bottom_thickness', 20, 'Толщина дна чаши (мм)', 'sink'),
('sink_bowl_markup', 1.5, 'Наценка на чашу (множитель)', 'sink'),
('sink_bowl_price', 15000, 'Стоимость чаши раковины (₽)', 'sink'),
('sink_bowl_wall_thickness', 20, 'Толщина стенки чаши (мм)', 'sink'),
('sink_custom_color_surcharge', 3000, 'Доплата за нестандартный цвет раковины (₽)', 'sink'),
('sink_density', 2400, 'Плотность бетона раковины (кг/м³)', 'sink'),
('sink_drain_slotted_per_m', 6000, 'Щелевой слив (₽/м)', 'sink'),
('sink_edge_margin', 70, 'Отступ от края до чаши (мм)', 'sink'),
('sink_gap_between_bowls', 80, 'Зазор между чашами (мм)', 'sink'),
('sink_install_per_kg', 130, 'Монтаж раковины за кг (₽)', 'sink'),
('sink_ivory_multiplier', 1.03, 'Наценка «белоснежный» для раковины (множитель)', 'sink'),
('sink_min_install', 12000, 'Мин. стоимость монтажа раковины (₽)', 'sink'),
('sink_overhang_markup', 0.15, 'Наценка на опуски раковины (%)', 'sink'),
('sink_plate_thickness', 30, 'Толщина плиты раковины (мм)', 'sink'),
('bracket_reinforced_per_m', 1500, 'Кронштейн усиленный (₽/м)', 'sink'),
('bracket_standard_per_m', 1200, 'Кронштейн стандартный (₽/м)', 'sink'),

-- Backsplash
('backsplash_custom_color_surcharge', 3000, 'Доплата за нестандартный цвет фартука (₽)', 'backsplash'),
('backsplash_install_per_m2', 7000, 'Монтаж фартука за м² (₽)', 'backsplash'),
('backsplash_ivory_multiplier', 1.03, 'Наценка «белоснежный» для фартука (множитель)', 'backsplash'),
('backsplash_lift_threshold', 2500, 'Порог ширины для предупреждения о лифте (мм)', 'backsplash'),
('backsplash_max_element_length', 3500, 'Макс. длина элемента фартука (мм)', 'backsplash'),
('backsplash_min_install', 10000, 'Мин. стоимость монтажа фартука (₽)', 'backsplash'),
('backsplash_price_per_m2', 53200, 'Цена фартука за м² (₽)', 'backsplash'),
('backsplash_standard_thickness', 15, 'Стандартная толщина фартука (мм)', 'backsplash'),

-- Stair
('stair_custom_color_surcharge', 3000, 'Доплата за нестандартный цвет ступени (₽)', 'stair'),
('stair_density', 2400, 'Плотность бетона ступеней (кг/м³)', 'stair'),
('stair_install_per_kg', 112, 'Монтаж ступени за кг (₽)', 'stair'),
('stair_ivory_multiplier', 1.03, 'Наценка «белоснежный» для ступеней (множитель)', 'stair'),
('stair_min_install', 10000, 'Мин. стоимость монтажа ступеней (₽)', 'stair'),
('stair_price_per_m2', 62000, 'Цена ступени за м² (₽)', 'stair'),
('stair_thickness_40_multiplier', 1.1, 'Наценка за толщину 40 мм ступени (множитель)', 'stair'),

-- Step Slab
('stepslab_custom_color_surcharge', 3000, 'Доплата за нестандартный цвет плиты (₽)', 'stepslab'),
('stepslab_density', 2400, 'Плотность бетона пошаговой плиты (кг/м³)', 'stepslab'),
('stepslab_heated_price_per_m2', 33350, 'Цена пошаговой плиты за м² с обогревом (₽)', 'stepslab'),
('stepslab_ivory_multiplier', 1.03, 'Наценка «белоснежный» для плиты (множитель)', 'stepslab'),
('stepslab_price_per_m2', 25300, 'Цена пошаговой плиты за м² без обогрева (₽)', 'stepslab'),
('stepslab_substrate_thickness', 20, 'Толщина подложки обогрева (мм)', 'stepslab'),
('stepslab_watts_per_m2', 370, 'Энергопотребление обогрева (Вт/м²)', 'stepslab'),

-- Windowsill
('windowsill_custom_color_surcharge', 3000, 'Доплата за нестандартный цвет подоконника (₽)', 'windowsill'),
('windowsill_density', 2350, 'Плотность бетона подоконника (кг/м³)', 'windowsill'),
('windowsill_drop_multiplier', 1.15, 'Множитель опусков подоконника', 'windowsill'),
('windowsill_install_per_kg', 112, 'Монтаж подоконника за кг (₽)', 'windowsill'),
('windowsill_ivory_multiplier', 1.03, 'Наценка «белоснежный» для подоконника (множитель)', 'windowsill'),
('windowsill_min_install', 10000, 'Мин. стоимость монтажа подоконника (₽)', 'windowsill'),
('windowsill_price_per_m2', 53200, 'Цена подоконника за м² (₽)', 'windowsill');
```

### 6.2. Настройки компании (`company_settings`)

```sql
INSERT INTO public.company_settings (key, value, label, category, sort_order) VALUES
('phone_service', '+7 (983) 619-68-75', 'Клиентский сервис', 'contacts', 3),
('telegram_channel', 't.me/cozyart_official', 'Telegram канал', 'contacts', 6),
('website', 'www.cozyart.ru', 'Сайт', 'contacts', 8),
('address', 'г. Новосибирск, ул. Драгомыжского, 8А, корпус 5', 'Адрес', 'contacts', 9),
('work_hours', 'Пн-Пт: 09:00 — 18:00', 'Часы работы', 'contacts', 10),
('production_days', '20', 'Срок изготовления (рабочих дней)', 'production', 11),
('warranty_years', '1', 'Гарантия (лет)', 'production', 12),
('print_logo_url', '', 'URL логотипа', 'print_template', 13),
('product_icon_countertop', '', 'Иконка: Столешница', 'product_icons', 14),
('product_icon_sink', '', 'Иконка: Раковина', 'product_icons', 15);
```

> **Примечание:** URL логотипа и иконок нужно будет обновить после загрузки файлов в Storage (см. раздел 11).

### 6.3. Стандартные цвета (`standard_colors`)

```sql
INSERT INTO public.standard_colors (name, sort_order, is_active) VALUES
('белоснежный', 1, true),
('белый', 2, true),
('светло-серый', 3, true),
('серый', 4, true),
('темно-серый', 5, true),
('зеленый', 6, true),
('бежевый', 7, true),
('коричневый', 8, true),
('желтый', 9, true),
('терракотовый', 10, true);
```

---

## 7. Шаг 5: Сборка и запуск фронтенда

### 7.1. Настройка переменных окружения

Создайте файл `.env.production` в корне проекта:

```env
VITE_SUPABASE_URL=https://api.calc.cozyart.ru
VITE_SUPABASE_PUBLISHABLE_KEY=ваш_ANON_KEY
VITE_SUPABASE_PROJECT_ID=self-hosted
```

> Если Supabase API доступен по тому же домену через path (например `/api`), используйте `VITE_SUPABASE_URL=https://calc.cozyart.ru/api`.

### 7.2. Dockerfile для фронтенда

Создайте `Dockerfile` в корне проекта:

```dockerfile
# --- Этап сборки ---
FROM node:18-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Этап продакшена ---
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=build /app/dist /usr/share/nginx/html

# Конфигурация nginx для SPA
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /assets { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 7.3. Docker Compose для фронтенда

Создайте `docker-compose.yml` в корне проекта:

```yaml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cozyart-calc-frontend
    restart: unless-stopped
    ports:
      - "3080:80"
    environment:
      - NODE_ENV=production
    networks:
      - app-network

networks:
  app-network:
    external: true
```

### 7.4. Сборка и запуск

```bash
cd /opt/cozyart-calc

# Скопируйте .env.production → .env (для сборки)
cp .env.production .env

# Сборка и запуск
docker compose up -d --build

# Проверка
docker logs cozyart-calc-frontend
curl http://localhost:3080
```

---

## 8. Шаг 6: Настройка Nginx Proxy Manager

### 8.1. Фронтенд (calc.cozyart.ru)

1. В NPM добавьте **Proxy Host**:
   - **Domain Names:** `calc.cozyart.ru`
   - **Scheme:** `http`
   - **Forward Hostname:** `cozyart-calc-frontend` (имя контейнера) или `IP_сервера`
   - **Forward Port:** `3080`
   - **SSL:** Включите, выберите Let's Encrypt, Force SSL

2. В разделе **Advanced** добавьте (для SPA):
   ```nginx
   location / {
       proxy_pass http://cozyart-calc-frontend:80;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

### 8.2. API Supabase (api.calc.cozyart.ru) — если на отдельном субдомене

1. Добавьте ещё один **Proxy Host**:
   - **Domain Names:** `api.calc.cozyart.ru`
   - **Scheme:** `http`
   - **Forward Hostname:** `supabase-kong` (имя контейнера Kong)
   - **Forward Port:** `8000`
   - **SSL:** Включите, Let's Encrypt, Force SSL

2. **Advanced:**
   ```nginx
   location / {
       proxy_pass http://supabase-kong:8000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```

---

## 9. Шаг 7: Создание первого администратора

1. Откройте `https://calc.cozyart.ru` и зарегистрируйте первого пользователя
2. Подтвердите email (если не включён autoconfirm)
3. Назначьте роль admin через pgAdmin:

```sql
-- Найдите user_id зарегистрированного пользователя
SELECT id, email FROM auth.users;

-- Назначьте роль admin (замените USER_ID на реальный UUID)
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = 'USER_ID_СЮДА';

-- Одобрите пользователя
UPDATE public.profiles
SET is_approved = true
WHERE user_id = 'USER_ID_СЮДА';
```

---

## 10. Обновление проекта

При внесении изменений в код через Lovable или Git:

```bash
cd /opt/cozyart-calc

# Получение обновлений
git pull origin main

# Пересборка и перезапуск
docker compose up -d --build

# Проверка
docker logs -f cozyart-calc-frontend
```

### Автоматическое обновление (опционально)

Создайте скрипт `/opt/cozyart-calc/deploy.sh`:

```bash
#!/bin/bash
set -e

cd /opt/cozyart-calc
echo "$(date) - Pulling latest changes..."
git pull origin main

echo "$(date) - Building and restarting..."
docker compose up -d --build

echo "$(date) - Cleaning old images..."
docker image prune -f

echo "$(date) - Deploy complete!"
```

```bash
chmod +x deploy.sh
```

Можно настроить GitHub Webhook или cron для автоматического вызова.

---

## 11. Хранение файлов (Storage)

Supabase self-hosted включает Storage API. Для загрузки логотипов и иконок:

### 11.1. Создание бакета через SQL

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Политика публичного чтения
CREATE POLICY "Public read company-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Политика загрузки для админов
CREATE POLICY "Admins can upload to company-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Admins can update company-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-assets');

CREATE POLICY "Admins can delete from company-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-assets');
```

### 11.2. Загрузка файлов

Через админ-панель приложения загрузите логотип и иконки — они автоматически попадут в Storage и URL обновятся в `company_settings`.

---

## 12. Калькулятор транспортировочного ящика

В проект добавлен отдельный калькулятор для расчёта транспортировочных ящиков (маршрут `/box`). 

### Функциональность

- **Спецификация деталей** — автоматический расчёт размеров всех деталей ящика (ОСП, пеноплекс, брусок) на основе размеров изделия
- **Карта раскроя** — оптимизированное размещение деталей на листах материала (алгоритм FFDH с гильотинным резом)
- **Смета материалов** — стоимость материалов и работ

### Особенности

- Настройки материалов (размеры листов, цены) сохраняются в `localStorage` браузера пользователя (ключ `cozyBoxMaterials`)
- **Не использует базу данных** — все расчёты локальные, не требуют дополнительных таблиц
- Формулы расчёта размеров деталей основаны на производственных данных COZY ART
- Поддержка печати задания на распил

### Маршруты

| Маршрут | Страница |
|---------|----------|
| `/` | Калькулятор изделий (столешницы, раковины и т.д.) |
| `/box` | Калькулятор транспортировочного ящика |
| `/history` | История сохранённых расчётов |
| `/admin` | Панель администратора |

---

## 13. Устранение неполадок

### Проблема: "Invalid API key"
- Проверьте что `ANON_KEY` в `.env.production` совпадает с тем, что в `.env` Supabase
- Убедитесь что JWT_SECRET одинаковый для Kong и GoTrue

### Проблема: CORS ошибки
- В `/opt/supabase/docker/.env` убедитесь:
  ```env
  GOTRUE_SITE_URL=https://calc.cozyart.ru
  ```
- В Kong config добавьте allowed origins

### Проблема: RLS блокирует запросы
- Убедитесь что все функции (has_role и т.д.) созданы до политик
- Проверьте что триггеры на `auth.users` работают (профиль и роль создаются при регистрации)

### Проблема: Пользователь не видит данные после регистрации
- Убедитесь что `is_approved = true` для пользователя в таблице `profiles`
- Проверьте что триггер `on_auth_user_created` существует

### Логи

```bash
# Фронтенд
docker logs cozyart-calc-frontend

# Supabase
cd /opt/supabase/docker
docker compose logs -f kong
docker compose logs -f auth
docker compose logs -f rest
docker compose logs -f storage
```

---

## Чек-лист развёртывания

- [ ] PostgreSQL запущен и доступен
- [ ] Supabase self-hosted развёрнут (Kong, GoTrue, PostgREST, Storage)
- [ ] Все таблицы созданы (profiles, user_roles, pricing_settings, company_settings, standard_colors, saved_calculations)
- [ ] Все функции созданы (has_role, handle_new_user, handle_new_user_role, update_updated_at_column)
- [ ] Все триггеры созданы (на auth.users и на таблицах)
- [ ] RLS включён на всех таблицах
- [ ] Начальные данные загружены (pricing_settings, company_settings, standard_colors)
- [ ] Бакет company-assets создан
- [ ] Фронтенд собран с правильными ENV
- [ ] NPM настроен (calc.cozyart.ru → frontend, api.calc.cozyart.ru → kong)
- [ ] SSL сертификаты получены
- [ ] Первый администратор создан
- [ ] Логотип и иконки загружены через админ-панель
