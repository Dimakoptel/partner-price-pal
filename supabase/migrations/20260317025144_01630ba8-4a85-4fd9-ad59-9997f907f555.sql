
-- Production orders table
CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  batch_number TEXT UNIQUE,
  status_id UUID REFERENCES public.dictionary_items(id),
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_to UUID,
  notes TEXT,
  planned_start DATE,
  planned_finish DATE,
  actual_start TIMESTAMPTZ,
  actual_finish TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_orders_sales ON public.production_orders(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_batch ON public.production_orders(batch_number);
CREATE INDEX IF NOT EXISTS idx_prod_orders_status ON public.production_orders(status_id);

-- Production stages (steps within a production order)
CREATE TABLE IF NOT EXISTS public.production_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.dictionary_items(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_stages_order ON public.production_stages(production_order_id);

-- Batch number auto-generation trigger
CREATE OR REPLACE FUNCTION public.generate_batch_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  IF NEW.batch_number IS NULL OR NEW.batch_number = '' THEN
    SELECT COUNT(*) + 1 INTO seq_num
    FROM public.production_orders
    WHERE DATE(created_at) = CURRENT_DATE;
    NEW.batch_number := 'BATCH-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(seq_num::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_batch_number
  BEFORE INSERT ON public.production_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_batch_number();

-- updated_at triggers
CREATE TRIGGER trg_production_orders_updated
  BEFORE UPDATE ON public.production_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_production_stages_updated
  BEFORE UPDATE ON public.production_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for production_orders
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage production_orders"
  ON public.production_orders FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated can read production_orders"
  ON public.production_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Module access can manage production_orders"
  ON public.production_orders FOR ALL
  TO authenticated
  USING (public.has_module_access(auth.uid(), 'calculator'))
  WITH CHECK (public.has_module_access(auth.uid(), 'calculator'));

-- RLS for production_stages
ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage production_stages"
  ON public.production_stages FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated can read production_stages"
  ON public.production_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Module access can manage production_stages"
  ON public.production_stages FOR ALL
  TO authenticated
  USING (public.has_module_access(auth.uid(), 'calculator'))
  WITH CHECK (public.has_module_access(auth.uid(), 'calculator'));
