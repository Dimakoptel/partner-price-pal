
-- Add approval fields to orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS approval_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_resolved_by UUID;
