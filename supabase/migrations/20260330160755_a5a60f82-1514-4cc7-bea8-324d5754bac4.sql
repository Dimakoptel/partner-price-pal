
-- Add lead_statuses dictionary type and items
INSERT INTO dictionary_types (code, name, description, is_system) 
VALUES ('lead_statuses', 'Статусы лидов', 'Статусы воронки лидов', true)
ON CONFLICT DO NOTHING;

INSERT INTO dictionary_items (type_id, code, name, color, sort_order)
SELECT dt.id, v.code, v.name, v.color, v.sort_order
FROM dictionary_types dt,
(VALUES 
  ('new', 'Новый', '#3b82f6', 1),
  ('qualified', 'Квалифицирован', '#8b5cf6', 2),
  ('proposal_sent', 'КП отправлено', '#f59e0b', 3),
  ('negotiation', 'Переговоры', '#f97316', 4),
  ('won', 'Выигран', '#22c55e', 5),
  ('lost', 'Проигран', '#ef4444', 6)
) AS v(code, name, color, sort_order)
WHERE dt.code = 'lead_statuses'
AND NOT EXISTS (
  SELECT 1 FROM dictionary_items di WHERE di.type_id = dt.id AND di.code = v.code
);

-- Add lead_sources dictionary type and items
INSERT INTO dictionary_types (code, name, description, is_system)
VALUES ('lead_sources', 'Источники лидов', 'Каналы привлечения лидов', true)
ON CONFLICT DO NOTHING;

INSERT INTO dictionary_items (type_id, code, name, sort_order)
SELECT dt.id, v.code, v.name, v.sort_order
FROM dictionary_types dt,
(VALUES 
  ('calculator', 'Калькулятор', 1),
  ('website', 'Сайт', 2),
  ('instagram', 'Instagram', 3),
  ('phone', 'Телефон', 4),
  ('exhibition', 'Выставка', 5),
  ('agent', 'Агент', 6),
  ('referral', 'Рекомендация', 7),
  ('cold_call', 'Холодный звонок', 8),
  ('other', 'Другое', 9)
) AS v(code, name, sort_order)
WHERE dt.code = 'lead_sources'
AND NOT EXISTS (
  SELECT 1 FROM dictionary_items di WHERE di.type_id = dt.id AND di.code = v.code
);
