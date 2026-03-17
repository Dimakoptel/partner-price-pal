
CREATE OR REPLACE FUNCTION public.create_reservation_for_item(
  p_order_id UUID,
  p_order_item_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reservation_id UUID;
  v_duration_hours INTEGER;
  v_has_payment BOOLEAN;
BEGIN
  SELECT paid_amount > 0 INTO v_has_payment FROM orders WHERE id = p_order_id;

  IF v_has_payment THEN
    SELECT COALESCE(value::INTEGER, 168) INTO v_duration_hours
    FROM system_settings WHERE key = 'reserve_hours_paid';
  ELSE
    SELECT COALESCE(value::INTEGER, 72) INTO v_duration_hours
    FROM system_settings WHERE key = 'reserve_hours_unpaid';
  END IF;

  IF v_duration_hours IS NULL THEN
    v_duration_hours := CASE WHEN v_has_payment THEN 168 ELSE 72 END;
  END IF;

  INSERT INTO reservations (order_id, order_item_id, product_variant_id, quantity, reserved_until, status)
  VALUES (p_order_id, p_order_item_id, p_variant_id, p_quantity, NOW() + (v_duration_hours || ' hours')::INTERVAL, 'active')
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;
