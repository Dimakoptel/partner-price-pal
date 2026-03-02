
-- Таблица клиентов
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  telegram TEXT,
  company TEXT,
  address TEXT,
  notes TEXT,
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Admins see all clients
CREATE POLICY "Admins can manage all clients"
  ON public.clients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Users with CRM access can read all clients
CREATE POLICY "Users with access can read clients"
  ON public.clients FOR SELECT
  USING (public.has_module_access(auth.uid(), 'clients'));

-- Users with CRM access can insert clients
CREATE POLICY "Users with access can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (public.has_module_access(auth.uid(), 'clients') AND auth.uid() = created_by);

-- Users with CRM access can update clients
CREATE POLICY "Users with access can update clients"
  ON public.clients FOR UPDATE
  USING (public.has_module_access(auth.uid(), 'clients'));

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for search
CREATE INDEX idx_clients_name ON public.clients USING gin(to_tsvector('russian', name));
CREATE INDEX idx_clients_phone ON public.clients (phone);
CREATE INDEX idx_clients_created_by ON public.clients (created_by);
