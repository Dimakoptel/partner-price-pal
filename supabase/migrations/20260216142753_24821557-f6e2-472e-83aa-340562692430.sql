
-- Add calc_name to saved_calculations
ALTER TABLE public.saved_calculations ADD COLUMN calc_name text NOT NULL DEFAULT '';

-- Create company_settings table for dynamic contacts
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'contacts',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read company settings"
  ON public.company_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage company settings"
  ON public.company_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed company contact data
INSERT INTO public.company_settings (key, value, label, category, sort_order) VALUES
  ('phone_main', '+7 (913) 748-05-03', 'Основной телефон', 'contacts', 1),
  ('phone_extra', '+7 (923) 116-94-24', 'Доп. телефон', 'contacts', 2),
  ('phone_service', '+7 (983) 619-68-75', 'Клиентский сервис', 'contacts', 3),
  ('email', 'cozyartnsk1@gmail.com', 'Email', 'contacts', 4),
  ('telegram', '@dimakopt', 'Telegram', 'contacts', 5),
  ('telegram_channel', 't.me/cozyart_official', 'Telegram канал', 'contacts', 6),
  ('whatsapp', '+7 (983) 619-68-75', 'WhatsApp', 'contacts', 7),
  ('website', 'www.cozyart.ru', 'Сайт', 'contacts', 8),
  ('address', 'г. Новосибирск, ул. Драгомыжского, 8А, корпус 5', 'Адрес', 'contacts', 9),
  ('work_hours', 'Пн-Пт: 09:00 — 18:00', 'Часы работы', 'contacts', 10),
  ('production_days', '20', 'Срок изготовления (календарных дней)', 'production', 11),
  ('warranty_years', '1', 'Гарантия (лет)', 'production', 12);
