
-- Create storage bucket for company assets (logo, etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

-- Allow anyone to read company assets
CREATE POLICY "Public read access for company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Only admins can upload/update/delete company assets
CREATE POLICY "Admins can upload company assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));
