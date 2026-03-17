
CREATE OR REPLACE FUNCTION public.calculate_warranty_months(
  p_variant_id UUID,
  p_characteristics_override JSONB DEFAULT NULL
)
RETURNS INTEGER LANGUAGE plpgsql STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_warranty INTEGER;
BEGIN
  SELECT 
    COALESCE(
      (p_characteristics_override->>'warranty_months')::INTEGER,
      pv.warranty_months_override,
      p.warranty_default_months,
      (SELECT (value::text)::INTEGER FROM public.system_settings WHERE key = 'warranty_default_months'),
      12
    ) INTO v_warranty
  FROM public.product_variants pv
  JOIN public.products p ON pv.product_id = p.id
  WHERE pv.id = p_variant_id;
  
  RETURN v_warranty;
END;
$$;
