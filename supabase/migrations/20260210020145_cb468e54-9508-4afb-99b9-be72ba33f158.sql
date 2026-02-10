
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'partner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create pricing_settings table for admin-configurable prices
CREATE TABLE public.pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value NUMERIC NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read pricing
CREATE POLICY "Authenticated users can read pricing" ON public.pricing_settings FOR SELECT TO authenticated USING (true);

-- Only admins can modify pricing
CREATE POLICY "Admins can update pricing" ON public.pricing_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert pricing" ON public.pricing_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete pricing" ON public.pricing_settings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON public.pricing_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default pricing settings
INSERT INTO public.pricing_settings (key, value, label, category) VALUES
  ('base_price_per_m2', 53200, 'Базовая цена за м² (₽)', 'countertop'),
  ('density', 2350, 'Плотность бетона (кг/м³)', 'general'),
  ('install_price_per_kg', 112, 'Стоимость монтажа за кг (₽)', 'general'),
  ('min_install_price', 10000, 'Минимальная стоимость монтажа (₽)', 'general'),
  ('thickness_40_multiplier', 1.1, 'Наценка за толщину 40мм (множитель)', 'countertop'),
  ('ivory_color_multiplier', 1.03, 'Наценка за белоснежный цвет (множитель)', 'countertop'),
  ('custom_color_surcharge', 3000, 'Доплата за нестандартный цвет (₽)', 'general'),
  ('support_multiplier', 1.15, 'Множитель стоимости опор', 'countertop'),
  ('drop_multiplier', 1.1, 'Множитель стоимости опусков', 'countertop'),
  ('sink_base_price_per_m2', 85000, 'Базовая цена раковины за м² (₽)', 'sink'),
  ('sink_bowl_price', 15000, 'Стоимость чаши раковины (₽)', 'sink'),
  ('sink_drain_price', 5000, 'Стоимость слива (₽)', 'sink'),
  ('windowsill_price_per_m2', 45000, 'Цена подоконника за м² (₽)', 'windowsill'),
  ('backsplash_price_per_m2', 48000, 'Цена фартука за м² (₽)', 'backsplash'),
  ('stair_price_per_m2', 62000, 'Цена ступени за м² (₽)', 'stair'),
  ('stepslab_price_per_m2', 55000, 'Цена пошаговой плиты за м² (₽)', 'stepslab');
