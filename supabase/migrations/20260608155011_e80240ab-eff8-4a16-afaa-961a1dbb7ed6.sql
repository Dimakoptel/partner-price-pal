
-- New columns for cost-calc products
ALTER TABLE public.nomenclature
  ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS type_item_id UUID REFERENCES public.dictionary_items(id),
  ADD COLUMN IF NOT EXISTS concrete_grade_id UUID REFERENCES public.dictionary_items(id),
  ADD COLUMN IF NOT EXISTS length_mm NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS width_mm NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thickness_mm NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS volume_m3 NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight_manual_override BOOLEAN NOT NULL DEFAULT false;

-- Ensure dictionary type 'product_type' exists
INSERT INTO public.dictionary_types (code, name, description, is_system)
SELECT 'product_type', 'Тип изделия', 'Типы изделий для калькулятора себестоимости', false
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_types WHERE code = 'product_type');

-- Ensure dictionary type 'concrete_grade' exists
INSERT INTO public.dictionary_types (code, name, description, is_system)
SELECT 'concrete_grade', 'Марка бетона', 'Марки бетона с плотностью (metadata.density_kg_m3)', false
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_types WHERE code = 'concrete_grade');
