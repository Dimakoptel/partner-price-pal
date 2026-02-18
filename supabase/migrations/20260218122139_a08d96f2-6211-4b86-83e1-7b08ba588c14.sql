
-- Drop the existing ALL policy and replace with explicit per-operation policies
DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings;

-- Explicit SELECT for admins (they also get read via the other policy, but this covers admin-specific needs)
CREATE POLICY "Admins can insert company settings"
ON public.company_settings
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update company settings"
ON public.company_settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete company settings"
ON public.company_settings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
