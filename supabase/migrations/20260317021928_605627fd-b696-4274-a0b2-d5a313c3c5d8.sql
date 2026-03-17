
CREATE OR REPLACE FUNCTION public.apply_discount_rule(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_discount NUMERIC;
  v_threshold NUMERIC;
BEGIN
  -- Load current discount
  SELECT discount_percent INTO v_discount FROM public.orders WHERE id = p_order_id;

  -- Load threshold from system_settings
  SELECT value::NUMERIC INTO v_threshold 
  FROM public.system_settings WHERE key = 'discount_approval_threshold';

  -- If discount > threshold → set status to pending_approval
  IF v_discount > COALESCE(v_threshold, 15) THEN
    UPDATE public.orders SET status = 'pending_approval' WHERE id = p_order_id;
    RETURN jsonb_build_object('status_changed', true, 'new_status', 'pending_approval');
  END IF;

  RETURN jsonb_build_object('status_changed', false);
END;
$$;
