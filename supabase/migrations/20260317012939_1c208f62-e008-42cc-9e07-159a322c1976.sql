
-- Add missing column
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS changed_fields jsonb;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
