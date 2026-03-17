
-- Agent commissions table
CREATE TABLE IF NOT EXISTS public.agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.clients(id),
  order_id UUID REFERENCES public.orders(id),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'reserved',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Use validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_commission_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('reserved', 'accrued', 'paid', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid commission status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_commission_status
  BEFORE INSERT OR UPDATE ON public.agent_commissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_commission_status();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON public.agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON public.agent_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.agent_commissions(status);

-- RLS
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commissions" ON public.agent_commissions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users with clients access can read commissions" ON public.agent_commissions
  FOR SELECT TO authenticated
  USING (has_module_access(auth.uid(), 'clients'));
