
-- 1. Add is_auto_saved flag to saved_calculations
ALTER TABLE public.saved_calculations ADD COLUMN IF NOT EXISTS is_auto_saved boolean NOT NULL DEFAULT false;

-- 2. Add photo_urls array to nomenclature (keep photo_url for backward compat)
ALTER TABLE public.nomenclature ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';

-- 3. Migrate existing photo_url to photo_urls
UPDATE public.nomenclature SET photo_urls = ARRAY[photo_url] WHERE photo_url IS NOT NULL AND photo_url != '' AND array_length(photo_urls, 1) IS NULL;
