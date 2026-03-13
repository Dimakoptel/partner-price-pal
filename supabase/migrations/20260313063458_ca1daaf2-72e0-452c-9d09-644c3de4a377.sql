
-- 1. Extend clients table with business fields
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS client_type text NOT NULL DEFAULT 'b2c',
  ADD COLUMN IF NOT EXISTS inn text,
  ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'retail',
  ADD COLUMN IF NOT EXISTS discount_default numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_terms text NOT NULL DEFAULT 'prepay',
  ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS manager_id uuid,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2. Extend leads table
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS assigned_manager_id uuid,
  ADD COLUMN IF NOT EXISTS budget numeric,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS converted_to_order_id uuid,
  ADD COLUMN IF NOT EXISTS product_interest text,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- 3. Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL DEFAULT '',
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  responsible_id uuid NOT NULL,
  order_type text NOT NULL DEFAULT 'serial_stock',
  status text NOT NULL DEFAULT 'draft',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  delivery_address text,
  delivery_method text DEFAULT 'self_pickup',
  delivery_date timestamp with time zone,
  tracking_number text,
  notes text,
  warranty_months integer DEFAULT 24,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- 4. RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = responsible_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = responsible_id);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = responsible_id);

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users with clients access can view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'clients'));

CREATE POLICY "Users with clients access can insert orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (public.has_module_access(auth.uid(), 'clients'));

CREATE POLICY "Users with clients access can update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_module_access(auth.uid(), 'clients'));

-- 5. Auto-generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  seq_num integer;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num 
  FROM public.orders 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  NEW.number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(seq_num::text, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.number = '' OR NEW.number IS NULL)
  EXECUTE FUNCTION public.generate_order_number();

-- 6. Updated_at trigger for orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
