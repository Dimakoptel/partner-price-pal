
ALTER TABLE public.operations
  ADD COLUMN IF NOT EXISTS norm_minutes NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complexity_coef NUMERIC(6,3) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_skill_level TEXT;

-- Backfill norm_minutes from norm_hours when empty
UPDATE public.operations
   SET norm_minutes = COALESCE(norm_hours, 0) * 60
 WHERE norm_minutes IS NULL OR norm_minutes = 0;

-- Constrain min_skill_level to allowed values (when not null)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'operations_min_skill_level_check'
  ) THEN
    ALTER TABLE public.operations
      ADD CONSTRAINT operations_min_skill_level_check
      CHECK (min_skill_level IS NULL OR min_skill_level IN ('junior','middle','senior','master'));
  END IF;
END $$;

ALTER TABLE public.nomenclature
  ADD COLUMN IF NOT EXISTS complexity_coef NUMERIC(6,3) NOT NULL DEFAULT 1;
