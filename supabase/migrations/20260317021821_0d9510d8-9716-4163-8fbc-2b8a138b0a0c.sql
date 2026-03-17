
CREATE OR REPLACE FUNCTION public.recalculate_order_totals(p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total NUMERIC(12,2);
  v_warranty INTEGER;
BEGIN
  SELECT COALESCE(SUM(total_line), 0) INTO v_total
  FROM public.order_items WHERE order_id = p_order_id;

  SELECT COALESCE(MAX(warranty_months), 12) INTO v_warranty
  FROM public.order_items WHERE order_id = p_order_id;

  UPDATE public.orders 
  SET total_amount = v_total, warranty_months = v_warranty 
  WHERE id = p_order_id;
END;
$$;
