
-- 1. Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. RLS on user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Fix profiles RLS - drop recursive policies and recreate
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix pricing_settings RLS
DROP POLICY IF EXISTS "Admins can delete pricing" ON public.pricing_settings;
DROP POLICY IF EXISTS "Admins can insert pricing" ON public.pricing_settings;
DROP POLICY IF EXISTS "Admins can update pricing" ON public.pricing_settings;

CREATE POLICY "Admins can manage pricing"
ON public.pricing_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Trigger to auto-create user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();

-- 7. Standard colors table for admin management
CREATE TABLE public.standard_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.standard_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read colors"
ON public.standard_colors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage colors"
ON public.standard_colors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default colors including terracotta
INSERT INTO public.standard_colors (name, sort_order) VALUES
  ('белоснежный', 1), ('белый', 2), ('светло-серый', 3), ('серый', 4),
  ('темно-серый', 5), ('зеленый', 6), ('бежевый', 7), ('коричневый', 8),
  ('желтый', 9), ('терракотовый', 10);

-- 8. Saved calculations table
CREATE TABLE public.saved_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_type TEXT NOT NULL,
  product_label TEXT NOT NULL,
  params JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calculations"
ON public.saved_calculations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations"
ON public.saved_calculations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations"
ON public.saved_calculations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all calculations"
ON public.saved_calculations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Migrate existing users to user_roles (if any exist)
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role FROM public.profiles WHERE role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'user'::app_role FROM public.profiles WHERE role = 'user'
ON CONFLICT DO NOTHING;
