
CREATE OR REPLACE FUNCTION public.create_production_order_from_sales(p_order_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_production_order_id UUID;
  v_last_id UUID;
  v_item RECORD;
  v_status_planned_id UUID;
BEGIN
  SELECT di.id INTO v_status_planned_id
  FROM dictionary_items di
  JOIN dictionary_types dt ON di.type_id = dt.id
  WHERE dt.code = 'production_order_status' AND di.code = 'planned'
  LIMIT 1;

  FOR v_item IN
    SELECT id FROM order_items
    WHERE order_id = p_order_id AND production_required = true
  LOOP
    INSERT INTO production_orders (
      sales_order_id, order_item_id, status_id, planned_start, planned_finish
    ) VALUES (
      p_order_id, v_item.id, v_status_planned_id, CURRENT_DATE, CURRENT_DATE + 14
    ) RETURNING id INTO v_production_order_id;

    -- Link back to order_items
    UPDATE order_items SET production_order_id = v_production_order_id WHERE id = v_item.id;

    -- Create stages from dictionary
    INSERT INTO production_stages (production_order_id, stage_id, status, sort_order, planned_start, planned_end)
    SELECT v_production_order_id, di.id, 'pending', di.sort_order,
           CURRENT_DATE + (di.sort_order - 1), CURRENT_DATE + di.sort_order
    FROM dictionary_items di
    JOIN dictionary_types dt ON di.type_id = dt.id
    WHERE dt.code = 'production_stage' AND di.is_active = true
    ORDER BY di.sort_order;

    v_last_id := v_production_order_id;
  END LOOP;

  -- Update sales order status to in_production
  UPDATE orders SET status = 'in_production', updated_at = NOW()
  WHERE id = p_order_id AND status IN ('confirmed', 'draft');

  RETURN v_last_id;
END;
$$;
