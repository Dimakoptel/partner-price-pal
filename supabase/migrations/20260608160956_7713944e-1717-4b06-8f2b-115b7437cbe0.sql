
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.operations REPLICA IDENTITY FULL;
ALTER TABLE public.nomenclature REPLICA IDENTITY FULL;
ALTER TABLE public.dictionary_items REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nomenclature;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dictionary_items;
