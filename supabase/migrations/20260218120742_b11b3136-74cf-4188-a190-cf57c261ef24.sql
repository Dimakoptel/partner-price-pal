
CREATE POLICY "Admins can delete all calculations"
ON public.saved_calculations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
