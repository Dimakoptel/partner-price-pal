
CREATE OR REPLACE FUNCTION public.calculate_agent_commission(p_order_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_order_amount NUMERIC;
  v_commission_rate NUMERIC;
  v_agent_id UUID;
BEGIN
  SELECT o.total_amount, c.id, c.commission_rate
  INTO v_order_amount, v_agent_id, v_commission_rate
  FROM public.orders o
  JOIN public.clients c ON o.client_id = c.id
  WHERE o.id = p_order_id
  AND c.client_type = 'agent';

  IF v_agent_id IS NULL THEN
    RETURN 0;
  END IF;

  RETURN v_order_amount * COALESCE(v_commission_rate, 0) / 100;
END;
$$;
