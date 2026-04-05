
-- Partners can read orders linked to their client record
CREATE POLICY "Partners can read own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Partners can read production orders linked to their sales orders
CREATE POLICY "Partners can read own production_orders"
ON public.production_orders
FOR SELECT
TO authenticated
USING (
  sales_order_id IN (
    SELECT id FROM public.orders WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

-- Partners can read production stages linked to their production orders
CREATE POLICY "Partners can read own production_stages"
ON public.production_stages
FOR SELECT
TO authenticated
USING (
  production_order_id IN (
    SELECT po.id FROM public.production_orders po
    WHERE po.sales_order_id IN (
      SELECT o.id FROM public.orders o WHERE o.client_id IN (
        SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid()
      )
    )
  )
);
