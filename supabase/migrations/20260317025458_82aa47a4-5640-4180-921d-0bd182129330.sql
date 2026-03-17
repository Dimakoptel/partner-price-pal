
CREATE OR REPLACE FUNCTION public.create_production_order_from_sales(p_order_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_production_order_id UUID;
  v_item RECORD;
  v_status_planned_id UUID;
  v_status_pending_id UUID;
BEGIN
  -- Get status IDs from dictionaries
  SELECT di.id INTO v_status_planned_id
  FROM dictionary_items di
  JOIN dictionary_types dt ON di.type_id = dt.id
  WHERE dt.code = 'production_order_status' AND di.code = 'planned'
  LIMIT 1;

  SELECT di.id INTO v_status_pending_id
  FROM dictionary_items di
  JOIN dictionary_types dt ON di.type_id = dt.id
  WHERE dt.code = 'production_stage_status' AND di.code = 'pending'
  LIMIT 1;

  -- Create production order for each item requiring production
  FOR v_item IN
    SELECT id FROM order_items
    WHERE order_id = p_order_id AND production_required = true
  LOOP
    INSERT INTO production_orders (
      sales_order_id,
      order_item_id,
      status_id,
      planned_start,
      planned_finish
    ) VALUES (
      p_order_id,
      v_item.id,
      v_status_planned_id,
      CURRENT_DATE,
      CURRENT_DATE + 14
    ) RETURNING id INTO v_production_order_id;

    -- Create production stages from dictionary (production_stage type)
    INSERT INTO production_stages (
      production_order_id,
      stage_id,
      status,
      sort_order,
      planned_start,
      planned_end
    )
    SELECT
      v_production_order_id,
      di.id,
      'pending',
      di.sort_order,
      CURRENT_DATE + (di.sort_order - 1),
      CURRENT_DATE + di.sort_order
    FROM dictionary_items di
    JOIN dictionary_types dt ON di.type_id = dt.id
    WHERE dt.code = 'production_stage' AND di.is_active = true
    ORDER BY di.sort_order;
  END LOOP;

  RETURN v_production_order_id;
END;
$$;
