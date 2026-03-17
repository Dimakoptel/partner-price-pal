
CREATE OR REPLACE FUNCTION public.check_product_availability(p_variant_id UUID, p_quantity INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reserved INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
  FROM reservations
  WHERE product_variant_id = p_variant_id
    AND status = 'active'
    AND reserved_until > NOW();

  -- MVP: always available (no inventory table yet)
  RETURN jsonb_build_object(
    'available', true,
    'reserved', v_reserved,
    'requested', p_quantity
  );
END;
$$;
