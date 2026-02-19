
-- Add image_url column to standard_colors for color photo
ALTER TABLE public.standard_colors ADD COLUMN image_url text DEFAULT '';
