
CREATE TABLE IF NOT EXISTS public.integration_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ
);

-- Validation trigger instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_integration_queue()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.direction NOT IN ('to_1c', 'from_1c') THEN
    RAISE EXCEPTION 'Invalid direction: %', NEW.direction;
  END IF;
  IF NEW.status NOT IN ('pending', 'sent', 'confirmed', 'error') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_integration_queue
  BEFORE INSERT OR UPDATE ON public.integration_queue
  FOR EACH ROW EXECUTE FUNCTION public.validate_integration_queue();

CREATE INDEX IF NOT EXISTS idx_queue_status ON public.integration_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_queue_entity ON public.integration_queue(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_queue_pending ON public.integration_queue(created_at) WHERE status = 'pending';

ALTER TABLE public.integration_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage integration_queue"
  ON public.integration_queue FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMENT ON TABLE public.integration_queue IS 'Очередь для обмена данными с 1С. Записи создаются триггерами при изменении сущностей.';
