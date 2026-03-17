
-- Fix search_path on validate_commission_status
CREATE OR REPLACE FUNCTION public.validate_commission_status()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('reserved', 'accrued', 'paid', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid commission status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
