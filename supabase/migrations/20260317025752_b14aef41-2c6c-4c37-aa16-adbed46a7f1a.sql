
CREATE OR REPLACE FUNCTION public.update_sales_order_from_production()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_all_completed BOOLEAN;
  v_completed_status_id UUID;
BEGIN
  -- Get the 'completed' status id for production orders
  SELECT di.id INTO v_completed_status_id
  FROM dictionary_items di
  JOIN dictionary_types dt ON di.type_id = dt.id
  WHERE dt.code = 'production_order_status' AND di.code = 'completed'
  LIMIT 1;

  -- Check if ALL production orders for this sales order are completed
  SELECT NOT EXISTS (
    SELECT 1 FROM production_orders
    WHERE sales_order_id = NEW.sales_order_id
      AND (status_id IS DISTINCT FROM v_completed_status_id)
  ) INTO v_all_completed;

  -- If all completed → update sales order status to 'ready'
  IF v_all_completed AND NEW.sales_order_id IS NOT NULL THEN
    UPDATE orders
    SET status = 'ready', updated_at = NOW()
    WHERE id = NEW.sales_order_id
      AND status = 'in_production';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: fires when production_order status changes
CREATE TRIGGER trg_update_sales_from_production
  AFTER UPDATE ON public.production_orders
  FOR EACH ROW
  WHEN (OLD.status_id IS DISTINCT FROM NEW.status_id)
  EXECUTE FUNCTION public.update_sales_order_from_production();
