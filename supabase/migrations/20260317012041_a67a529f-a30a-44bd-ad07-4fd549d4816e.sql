
-- Add missing columns to dictionary_types (already serves as "dictionaries")
ALTER TABLE public.dictionary_types 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
