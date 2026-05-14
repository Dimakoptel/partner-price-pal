
-- Add cost_per_hour to operations dictionary
ALTER TABLE public.operations
  ADD COLUMN IF NOT EXISTS cost_per_hour numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description text;

-- Seed dictionary type for skill-level coefficients
INSERT INTO public.dictionary_types (code, name, description, is_system, is_active)
VALUES ('payroll_skill_coefficient', 'Коэффициенты квалификации', 'Коэффициенты к ставке по уровню квалификации сотрудника', false, true)
ON CONFLICT (code) DO NOTHING;

-- Seed default coefficient items (coefficient stored in metadata.coefficient)
WITH t AS (SELECT id FROM public.dictionary_types WHERE code = 'payroll_skill_coefficient')
INSERT INTO public.dictionary_items (type_id, code, name, sort_order, metadata, is_active)
SELECT t.id, v.code, v.name, v.sort_order, v.metadata::jsonb, true FROM t,
  (VALUES
    ('junior', 'Junior', 1, '{"coefficient": 0.8}'),
    ('middle', 'Middle', 2, '{"coefficient": 1.0}'),
    ('senior', 'Senior', 3, '{"coefficient": 1.3}'),
    ('master', 'Master', 4, '{"coefficient": 1.6}')
  ) AS v(code, name, sort_order, metadata)
ON CONFLICT DO NOTHING;
