
-- 1. Add semantic_tags column
ALTER TABLE public.dictionary_items
  ADD COLUMN IF NOT EXISTS semantic_tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_dict_items_tags
  ON public.dictionary_items USING GIN (semantic_tags);

-- 2. Seed tags on reserved codes (idempotent)
-- production_stage_status
UPDATE public.dictionary_items di
SET semantic_tags = ARRAY['initial']::text[]
FROM public.dictionary_types dt
WHERE di.type_id = dt.id AND dt.code = 'production_stage_status' AND di.code = 'pending'
  AND NOT (di.semantic_tags @> ARRAY['initial']);

UPDATE public.dictionary_items di
SET semantic_tags = ARRAY['active']::text[]
FROM public.dictionary_types dt
WHERE di.type_id = dt.id AND dt.code = 'production_stage_status' AND di.code = 'in_progress'
  AND NOT (di.semantic_tags @> ARRAY['active']);

UPDATE public.dictionary_items di
SET semantic_tags = ARRAY['final']::text[]
FROM public.dictionary_types dt
WHERE di.type_id = dt.id AND dt.code = 'production_stage_status' AND di.code = 'completed'
  AND NOT (di.semantic_tags @> ARRAY['final']);

UPDATE public.dictionary_items di
SET semantic_tags = ARRAY['skipped']::text[]
FROM public.dictionary_types dt
WHERE di.type_id = dt.id AND dt.code = 'production_stage_status' AND di.code = 'skipped'
  AND NOT (di.semantic_tags @> ARRAY['skipped']);

-- production_order_status
UPDATE public.dictionary_items di
SET semantic_tags = ARRAY['initial']::text[]
FROM public.dictionary_types dt
WHERE di.type_id = dt.id AND dt.code = 'production_order_status' AND di.code = 'planned'
  AND NOT (di.semantic_tags @> ARRAY['initial']);

UPDATE public.dictionary_items di
SET semantic_tags = ARRAY['active']::text[]
FROM public.dictionary_types dt
WHERE di.type_id = dt.id AND dt.code = 'production_order_status' AND di.code = 'in_progress'
  AND NOT (di.semantic_tags @> ARRAY['active']);

UPDATE public.dictionary_items di
SET semantic_tags = ARRAY['final']::text[]
FROM public.dictionary_types dt
WHERE di.type_id = dt.id AND dt.code = 'production_order_status' AND di.code = 'completed'
  AND NOT (di.semantic_tags @> ARRAY['final']);

UPDATE public.dictionary_items di
SET semantic_tags = ARRAY['cancelled']::text[]
FROM public.dictionary_types dt
WHERE di.type_id = dt.id AND dt.code = 'production_order_status' AND di.code = 'cancelled'
  AND NOT (di.semantic_tags @> ARRAY['cancelled']);

UPDATE public.dictionary_items di
SET semantic_tags = ARRAY['paused']::text[]
FROM public.dictionary_types dt
WHERE di.type_id = dt.id AND dt.code = 'production_order_status' AND di.code = 'paused'
  AND NOT (di.semantic_tags @> ARRAY['paused']);
