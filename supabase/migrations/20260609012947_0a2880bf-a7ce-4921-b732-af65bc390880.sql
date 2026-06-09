
-- Trigger function: sync inventory.quantity_reserved from active reservations
CREATE OR REPLACE FUNCTION public.sync_inventory_reserved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant_ids uuid[];
  v_variant uuid;
BEGIN
  -- Collect affected variant ids from OLD/NEW
  v_variant_ids := ARRAY[]::uuid[];
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.product_variant_id IS NOT NULL THEN
    v_variant_ids := array_append(v_variant_ids, NEW.product_variant_id);
  END IF;
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.product_variant_id IS NOT NULL THEN
    v_variant_ids := array_append(v_variant_ids, OLD.product_variant_id);
  END IF;

  FOREACH v_variant IN ARRAY v_variant_ids LOOP
    -- Ensure inventory row exists
    INSERT INTO public.inventory (product_variant_id, quantity_on_hand, quantity_reserved)
    VALUES (v_variant, 0, 0)
    ON CONFLICT (product_variant_id) DO NOTHING;

    -- Recompute reserved as sum of active reservations
    UPDATE public.inventory inv
    SET quantity_reserved = COALESCE((
      SELECT SUM(r.quantity)::int
      FROM public.reservations r
      WHERE r.product_variant_id = v_variant
        AND r.status = 'active'
    ), 0),
    updated_at = now()
    WHERE inv.product_variant_id = v_variant;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_inventory_reserved ON public.reservations;
CREATE TRIGGER trg_sync_inventory_reserved
AFTER INSERT OR UPDATE OR DELETE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.sync_inventory_reserved();

-- Release all active reservations for an order
CREATE OR REPLACE FUNCTION public.release_order_stock(p_order_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.reservations
  SET status = 'released', released_at = now()
  WHERE order_id = p_order_id AND status = 'active';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Release a single order item's active reservation
CREATE OR REPLACE FUNCTION public.release_order_item_stock(p_order_item_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.reservations
  SET status = 'released', released_at = now()
  WHERE order_item_id = p_order_item_id AND status = 'active';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- One-off reconciliation: recompute quantity_reserved for all inventory rows
UPDATE public.inventory inv
SET quantity_reserved = COALESCE(sub.q, 0),
    updated_at = now()
FROM (
  SELECT product_variant_id, SUM(quantity)::int AS q
  FROM public.reservations
  WHERE status = 'active'
  GROUP BY product_variant_id
) sub
WHERE inv.product_variant_id = sub.product_variant_id
  AND inv.quantity_reserved IS DISTINCT FROM COALESCE(sub.q, 0);

-- Variants that have no active reservations should have 0 reserved
UPDATE public.inventory inv
SET quantity_reserved = 0, updated_at = now()
WHERE inv.quantity_reserved <> 0
  AND NOT EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.product_variant_id = inv.product_variant_id
      AND r.status = 'active'
  );
