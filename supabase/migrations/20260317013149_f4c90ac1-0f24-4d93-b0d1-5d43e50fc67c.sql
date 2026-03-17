
-- Update dictionary_items SELECT policy to filter inactive for non-admins
DROP POLICY IF EXISTS "Authenticated can read dictionary_items" ON public.dictionary_items;
CREATE POLICY "Read active items or admin reads all" ON public.dictionary_items
  FOR SELECT TO authenticated
  USING (is_active = true OR public.is_admin(auth.uid()));
