
-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_variant_id UUID REFERENCES public.product_variants(id),
  characteristics_override JSONB DEFAULT '{}'::jsonb,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_unit NUMERIC(10,2) NOT NULL,
  discount_line NUMERIC(5,2) DEFAULT 0,
  total_line NUMERIC(12,2) NOT NULL,
  warranty_months INTEGER NOT NULL DEFAULT 12,
  production_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(product_variant_id);

-- RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order_items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "See items of own orders" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE responsible_id = auth.uid()));

CREATE POLICY "Insert items to own orders" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE responsible_id = auth.uid()));

CREATE POLICY "Update items of own orders" ON public.order_items
  FOR UPDATE TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE responsible_id = auth.uid()));

CREATE POLICY "Delete items of own orders" ON public.order_items
  FOR DELETE TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE responsible_id = auth.uid()));

CREATE POLICY "Module access can read order_items" ON public.order_items
  FOR SELECT TO authenticated
  USING (has_module_access(auth.uid(), 'clients'));

CREATE POLICY "Module access can manage order_items" ON public.order_items
  FOR ALL TO authenticated
  USING (has_module_access(auth.uid(), 'clients'))
  WITH CHECK (has_module_access(auth.uid(), 'clients'));

-- Auto-update updated_at
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
