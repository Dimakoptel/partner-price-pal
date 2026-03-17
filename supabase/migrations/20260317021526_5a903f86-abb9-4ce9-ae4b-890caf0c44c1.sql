
-- Product variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  sku_variant TEXT NOT NULL UNIQUE,
  size_cm TEXT,
  color TEXT,
  texture TEXT,
  characteristics JSONB DEFAULT '{}'::jsonb,
  price_base NUMERIC(10,2) NOT NULL,
  price_retail NUMERIC(10,2),
  price_wholesale NUMERIC(10,2),
  price_agent NUMERIC(10,2),
  production_time_days INTEGER DEFAULT 7,
  warranty_months_override INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku_variant);
CREATE INDEX IF NOT EXISTS idx_variants_size ON public.product_variants(size_cm) WHERE size_cm IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variants_color ON public.product_variants(color) WHERE color IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variants_characteristics_gin ON public.product_variants USING GIN (characteristics jsonb_path_ops);

-- RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read product_variants" ON public.product_variants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage product_variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
