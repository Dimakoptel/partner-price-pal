-- Make partner-attachments bucket private and add scoped read policy
UPDATE storage.buckets SET public = false WHERE id = 'partner-attachments';

DROP POLICY IF EXISTS "Anyone can read partner attachments" ON storage.objects;

CREATE POLICY "Authorized users read partner attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-attachments' AND (
    public.is_admin(auth.uid())
    OR public.has_module_access(auth.uid(), 'sales_leads')
    OR EXISTS (
      SELECT 1 FROM public.partner_requests pr
      WHERE (pr.user_id = auth.uid() OR pr.assigned_manager_id = auth.uid())
        AND EXISTS (SELECT 1 FROM unnest(pr.attachment_urls) u WHERE u LIKE '%' || storage.objects.name || '%')
    )
    OR EXISTS (
      SELECT 1 FROM public.partner_request_messages m
      JOIN public.partner_requests pr ON pr.id = m.request_id
      WHERE (pr.user_id = auth.uid() OR pr.assigned_manager_id = auth.uid())
        AND EXISTS (SELECT 1 FROM unnest(m.attachment_urls) u WHERE u LIKE '%' || storage.objects.name || '%')
    )
  )
);

CREATE POLICY "Authorized users delete partner attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-attachments' AND (
    public.is_admin(auth.uid()) OR owner = auth.uid()
  )
);