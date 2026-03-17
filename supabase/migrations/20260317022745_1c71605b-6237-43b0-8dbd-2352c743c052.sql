
CREATE OR REPLACE FUNCTION public.apply_discount_rule(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_discount NUMERIC;
  v_threshold NUMERIC;
BEGIN
  SELECT discount_percent INTO v_discount FROM public.orders WHERE id = p_order_id;

  SELECT value::NUMERIC INTO v_threshold 
  FROM public.system_settings WHERE key = 'discount_approval_threshold';

  IF v_discount > COALESCE(v_threshold, 15) THEN
    UPDATE public.orders 
    SET status = 'pending_approval',
        approval_requested_at = NOW()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
      'status_changed', true, 
      'new_status', 'pending_approval',
      'requires_approval', true
    );
  END IF;

  RETURN jsonb_build_object('status_changed', false, 'requires_approval', false);
END;
$$;
