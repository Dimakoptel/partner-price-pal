
-- Inventory: current stock levels per product variant
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  location TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_variant_id)
);

-- Stock movements: receipt/dispatch documents
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL DEFAULT 'receipt',
  quantity INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  document_number TEXT DEFAULT '',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT DEFAULT ''
);

-- Validation trigger for movement_type
CREATE OR REPLACE FUNCTION public.validate_stock_movement_type()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.movement_type NOT IN ('receipt', 'dispatch', 'adjustment', 'return', 'write_off') THEN
    RAISE EXCEPTION 'Invalid movement type: %', NEW.movement_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_stock_movement
  BEFORE INSERT OR UPDATE ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.validate_stock_movement_type();

-- Auto-update inventory on stock movement
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  -- Upsert inventory row
  INSERT INTO public.inventory (product_variant_id, quantity_on_hand)
  VALUES (NEW.product_variant_id, 0)
  ON CONFLICT (product_variant_id) DO NOTHING;

  -- Apply movement
  IF NEW.movement_type IN ('receipt', 'return') THEN
    UPDATE public.inventory SET quantity_on_hand = quantity_on_hand + NEW.quantity, updated_at = now()
    WHERE product_variant_id = NEW.product_variant_id;
  ELSIF NEW.movement_type IN ('dispatch', 'write_off') THEN
    UPDATE public.inventory SET quantity_on_hand = quantity_on_hand - NEW.quantity, updated_at = now()
    WHERE product_variant_id = NEW.product_variant_id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE public.inventory SET quantity_on_hand = NEW.quantity, updated_at = now()
    WHERE product_variant_id = NEW.product_variant_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_stock_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- Update check_product_availability to use real inventory
CREATE OR REPLACE FUNCTION public.check_product_availability(p_variant_id uuid, p_quantity integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_on_hand INTEGER;
  v_reserved INTEGER;
  v_available INTEGER;
BEGIN
  SELECT COALESCE(quantity_on_hand, 0), COALESCE(quantity_reserved, 0)
  INTO v_on_hand, v_reserved
  FROM public.inventory
  WHERE product_variant_id = p_variant_id;

  IF NOT FOUND THEN
    v_on_hand := 0;
    v_reserved := 0;
  END IF;

  v_available := v_on_hand - v_reserved;

  RETURN jsonb_build_object(
    'available', v_available >= p_quantity,
    'on_hand', v_on_hand,
    'reserved', v_reserved,
    'free', v_available,
    'requested', p_quantity
  );
END;
$$;

-- RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Inventory RLS
CREATE POLICY "Authenticated can read inventory" ON public.inventory
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Warehouse access can manage inventory" ON public.inventory
  FOR ALL TO authenticated
  USING (public.has_module_access(auth.uid(), 'warehouse'))
  WITH CHECK (public.has_module_access(auth.uid(), 'warehouse'));

-- Stock movements RLS
CREATE POLICY "Authenticated can read stock_movements" ON public.stock_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage stock_movements" ON public.stock_movements
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Warehouse access can insert stock_movements" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (public.has_module_access(auth.uid(), 'warehouse') AND auth.uid() = created_by);
