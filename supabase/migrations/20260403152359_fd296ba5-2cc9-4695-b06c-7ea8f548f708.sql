
-- 1. Add partner role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

-- 2. Add user_id to clients for partner account linking
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id) WHERE user_id IS NOT NULL;

-- 3. Partner discounts per category
CREATE TABLE IF NOT EXISTS public.partner_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, category_id)
);

ALTER TABLE public.partner_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage partner_discounts" ON public.partner_discounts
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Partners can read own discounts" ON public.partner_discounts
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Managers can read assigned client discounts" ON public.partner_discounts
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE manager_id = auth.uid()));

-- 4. Partner requests
CREATE TABLE IF NOT EXISTS public.partner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL DEFAULT '',
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id),
  product_type TEXT,
  params JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',
  retail_price NUMERIC,
  partner_price NUMERIC,
  assigned_manager_id UUID,
  attachment_urls TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  converted_order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Auto-generate request number
CREATE OR REPLACE FUNCTION public.generate_partner_request_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE seq_num INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.partner_requests
  WHERE DATE(created_at) = CURRENT_DATE;
  NEW.number := 'PR-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(seq_num::text, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_partner_request_number
  BEFORE INSERT ON public.partner_requests
  FOR EACH ROW EXECUTE FUNCTION public.generate_partner_request_number();

-- Auto-assign manager from client
CREATE OR REPLACE FUNCTION public.assign_manager_to_partner_request()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.assigned_manager_id IS NULL THEN
    SELECT manager_id INTO NEW.assigned_manager_id
    FROM public.clients WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_manager_partner_request
  BEFORE INSERT ON public.partner_requests
  FOR EACH ROW EXECUTE FUNCTION public.assign_manager_to_partner_request();

CREATE POLICY "Partners can read own requests" ON public.partner_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Partners can insert own requests" ON public.partner_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Partners can update own new requests" ON public.partner_requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'new');

CREATE POLICY "Managers can read assigned requests" ON public.partner_requests
  FOR SELECT TO authenticated
  USING (assigned_manager_id = auth.uid() OR public.has_module_access(auth.uid(), 'sales_leads'));

CREATE POLICY "Managers can update assigned requests" ON public.partner_requests
  FOR UPDATE TO authenticated
  USING (assigned_manager_id = auth.uid() OR public.has_module_access(auth.uid(), 'sales_leads'));

CREATE POLICY "Admins can manage all requests" ON public.partner_requests
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. Partner request messages
CREATE TABLE IF NOT EXISTS public.partner_request_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.partner_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  attachment_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_request_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages of accessible requests" ON public.partner_request_messages
  FOR SELECT TO authenticated
  USING (request_id IN (SELECT id FROM public.partner_requests WHERE user_id = auth.uid() OR assigned_manager_id = auth.uid()));

CREATE POLICY "Users can insert messages to accessible requests" ON public.partner_request_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    request_id IN (SELECT id FROM public.partner_requests WHERE user_id = auth.uid() OR assigned_manager_id = auth.uid())
  );

CREATE POLICY "Admins can manage all messages" ON public.partner_request_messages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Sales module can read messages" ON public.partner_request_messages
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'sales_leads'));

CREATE POLICY "Sales module can insert messages" ON public.partner_request_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.has_module_access(auth.uid(), 'sales_leads') AND auth.uid() = user_id);

-- 6. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('partner-attachments', 'partner-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload partner attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'partner-attachments');

CREATE POLICY "Anyone can read partner attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'partner-attachments');

-- 7. Partner can read own client record
CREATE POLICY "Partners can read own client record" ON public.clients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 8. Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_request_messages;

-- 9. Add partner_types dictionary
INSERT INTO public.dictionary_types (code, name, description, is_system)
VALUES ('partner_types', 'Типы партнёров', 'Классификация партнёров (дилер, агент, дизайнер и т.д.)', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.dictionary_items (type_id, code, name, sort_order)
SELECT dt.id, di.code, di.name, di.sort_order
FROM public.dictionary_types dt,
(VALUES ('dealer', 'Дилер', 1), ('agent', 'Агент', 2), ('designer', 'Дизайнер', 3), ('architect', 'Архитектор', 4)) AS di(code, name, sort_order)
WHERE dt.code = 'partner_types'
AND NOT EXISTS (SELECT 1 FROM public.dictionary_items WHERE type_id = dt.id AND code = di.code);
