-- Product categories reference table
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read categories" ON public.product_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage categories" ON public.product_categories
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Nomenclature-Colors junction table
CREATE TABLE public.nomenclature_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomenclature_id uuid NOT NULL REFERENCES public.nomenclature(id) ON DELETE CASCADE,
  color_id uuid NOT NULL REFERENCES public.standard_colors(id) ON DELETE CASCADE,
  UNIQUE(nomenclature_id, color_id)
);

ALTER TABLE public.nomenclature_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read nomenclature colors" ON public.nomenclature_colors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage nomenclature colors" ON public.nomenclature_colors
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users with access can manage nomenclature colors" ON public.nomenclature_colors
  FOR ALL TO authenticated USING (has_module_access(auth.uid(), 'clients'));