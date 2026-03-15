
-- Nomenclature / Product catalog table
CREATE TABLE public.nomenclature (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL DEFAULT '',
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  size_mm text DEFAULT '',
  weight_kg numeric DEFAULT 0,
  characteristics text DEFAULT '',
  unit text NOT NULL DEFAULT 'шт',
  price_dealer numeric DEFAULT 0,
  price_wholesale numeric DEFAULT 0,
  price_partner numeric DEFAULT 0,
  price_rrp numeric DEFAULT 0,
  photo_url text DEFAULT '',
  drawing_url text DEFAULT '',
  description text DEFAULT '',
  show_in_pricelist boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.nomenclature ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Authenticated can read nomenclature"
  ON public.nomenclature FOR SELECT TO authenticated
  USING (true);

-- Admins full access
CREATE POLICY "Admins can manage nomenclature"
  ON public.nomenclature FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users with clients module access can insert/update
CREATE POLICY "Users with access can insert nomenclature"
  ON public.nomenclature FOR INSERT TO authenticated
  WITH CHECK (has_module_access(auth.uid(), 'clients'::text) AND auth.uid() = created_by);

CREATE POLICY "Users with access can update nomenclature"
  ON public.nomenclature FOR UPDATE TO authenticated
  USING (has_module_access(auth.uid(), 'clients'::text));
