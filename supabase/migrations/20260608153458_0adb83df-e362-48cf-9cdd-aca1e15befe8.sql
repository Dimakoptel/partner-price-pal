
CREATE TABLE public.calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nomenclature_id UUID REFERENCES public.nomenclature(id) ON DELETE SET NULL,
  product_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  materials_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calculations TO authenticated;
GRANT ALL ON public.calculations TO service_role;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calculations"
  ON public.calculations FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER update_calculations_updated_at
  BEFORE UPDATE ON public.calculations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.calc_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calculation_id UUID NOT NULL REFERENCES public.calculations(id) ON DELETE CASCADE,
  operation_id UUID REFERENCES public.operations(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  operation_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'm2',
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  norm_hours NUMERIC(12,3) NOT NULL DEFAULT 0,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  hourly_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calc_operations TO authenticated;
GRANT ALL ON public.calc_operations TO service_role;
ALTER TABLE public.calc_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calc_operations"
  ON public.calc_operations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.calculations c WHERE c.id = calculation_id AND (c.user_id = auth.uid() OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.calculations c WHERE c.id = calculation_id AND (c.user_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE INDEX idx_calculations_user ON public.calculations(user_id, created_at DESC);
CREATE INDEX idx_calc_operations_calc ON public.calc_operations(calculation_id);
