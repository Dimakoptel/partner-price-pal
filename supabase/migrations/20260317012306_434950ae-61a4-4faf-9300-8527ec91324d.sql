
-- Add indexes to existing dictionary_items table
CREATE INDEX IF NOT EXISTS idx_dict_items_type ON public.dictionary_items(type_id);
CREATE INDEX IF NOT EXISTS idx_dict_items_sort ON public.dictionary_items(type_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_dict_items_active ON public.dictionary_items(type_id, is_active);
