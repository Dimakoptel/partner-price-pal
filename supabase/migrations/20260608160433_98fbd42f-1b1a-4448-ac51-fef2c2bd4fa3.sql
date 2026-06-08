
DO $$
DECLARE v_type_id UUID;
BEGIN
  INSERT INTO public.dictionary_types (code, name, description, is_system)
  VALUES ('pricing_scenario', 'Сценарии ценообразования', 'Готовые пресеты маржи / скидки / НДС', true)
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_type_id;
  IF v_type_id IS NULL THEN
    SELECT id INTO v_type_id FROM public.dictionary_types WHERE code = 'pricing_scenario';
  END IF;
  INSERT INTO public.dictionary_items (type_id, code, name, color, sort_order, is_active, metadata) VALUES
    (v_type_id, 'entry',    'Вход на рынок', '#10b981', 1, true, '{"margin_pct":15,"volume_discount_pct":5,"vat_pct":20}'::jsonb),
    (v_type_id, 'standard', 'Стандарт',      '#3b82f6', 2, true, '{"margin_pct":35,"volume_discount_pct":3,"vat_pct":20}'::jsonb),
    (v_type_id, 'premium',  'Премиум',       '#a855f7', 3, true, '{"margin_pct":70,"volume_discount_pct":0,"vat_pct":20}'::jsonb)
  ON CONFLICT (type_id, code) DO UPDATE SET metadata = EXCLUDED.metadata;
END $$;

INSERT INTO public.system_settings (key, label, value, description, category)
VALUES ('default_vat_pct', 'НДС по умолчанию, %', '20'::jsonb, 'НДС по умолчанию для модуля ценообразования', 'general')
ON CONFLICT (key) DO NOTHING;
