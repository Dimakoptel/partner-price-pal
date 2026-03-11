
-- Create leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  calculation_id uuid REFERENCES public.saved_calculations(id) ON DELETE SET NULL,
  client_name text NOT NULL DEFAULT '',
  client_phone text,
  client_email text,
  source text NOT NULL DEFAULT 'calculator',
  status text NOT NULL DEFAULT 'new',
  amount numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own leads" ON public.leads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users with clients module access can also view/manage leads
CREATE POLICY "Users with clients access can view leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'clients'));

CREATE POLICY "Users with clients access can update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.has_module_access(auth.uid(), 'clients'));

-- Updated_at trigger
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
