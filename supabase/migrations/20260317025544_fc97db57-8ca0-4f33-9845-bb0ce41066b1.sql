
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS production_order_id UUID REFERENCES public.production_orders(id);

CREATE INDEX IF NOT EXISTS idx_order_items_production ON public.order_items(production_order_id);
