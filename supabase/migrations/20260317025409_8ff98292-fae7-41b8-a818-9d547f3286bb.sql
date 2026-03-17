
-- Add missing columns to production_stages
ALTER TABLE public.production_stages
  ADD COLUMN IF NOT EXISTS planned_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS planned_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

-- Rename started_at/completed_at to actual_start/actual_end for consistency
ALTER TABLE public.production_stages
  RENAME COLUMN started_at TO actual_start;
ALTER TABLE public.production_stages
  RENAME COLUMN completed_at TO actual_end;
