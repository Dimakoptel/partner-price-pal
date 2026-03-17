
-- Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  reserved_until TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_reservation_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'released', 'fulfilled') THEN
    RAISE EXCEPTION 'Invalid reservation status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_reservation_status
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.validate_reservation_status();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_order ON public.reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_variant ON public.reservations(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_until ON public.reservations(reserved_until) WHERE status = 'active';

-- RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reservations"
  ON public.reservations FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "See reservations of own orders"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT id FROM public.orders WHERE responsible_id = auth.uid()
  ));

CREATE POLICY "Module access can manage reservations"
  ON public.reservations FOR ALL
  TO authenticated
  USING (public.has_module_access(auth.uid(), 'clients'))
  WITH CHECK (public.has_module_access(auth.uid(), 'clients'));

-- Function: reserve stock for an order
CREATE OR REPLACE FUNCTION public.reserve_order_stock(p_order_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_reserve_hours INTEGER;
  v_paid BOOLEAN;
  v_count INTEGER := 0;
BEGIN
  -- Check if order is paid to determine reserve duration
  SELECT (o.paid_amount >= o.total_amount AND o.total_amount > 0) INTO v_paid
  FROM orders o WHERE o.id = p_order_id;

  -- Get reserve hours from system_settings
  IF v_paid THEN
    SELECT COALESCE(value::INTEGER, 168) INTO v_reserve_hours
    FROM system_settings WHERE key = 'reserve_hours_paid';
  ELSE
    SELECT COALESCE(value::INTEGER, 72) INTO v_reserve_hours
    FROM system_settings WHERE key = 'reserve_hours_unpaid';
  END IF;

  IF v_reserve_hours IS NULL THEN
    v_reserve_hours := CASE WHEN v_paid THEN 168 ELSE 72 END;
  END IF;

  -- Release existing active reservations for this order
  UPDATE reservations SET status = 'released', released_at = NOW()
  WHERE order_id = p_order_id AND status = 'active';

  -- Create reservations for stock items
  FOR v_item IN
    SELECT id, product_variant_id, quantity
    FROM order_items
    WHERE order_id = p_order_id
      AND product_variant_id IS NOT NULL
      AND production_required = false
  LOOP
    INSERT INTO reservations (order_id, order_item_id, product_variant_id, quantity, reserved_until)
    VALUES (p_order_id, v_item.id, v_item.product_variant_id, v_item.quantity, NOW() + (v_reserve_hours || ' hours')::INTERVAL);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Function: release expired reservations
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE reservations
  SET status = 'released', released_at = NOW()
  WHERE status = 'active' AND reserved_until < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
