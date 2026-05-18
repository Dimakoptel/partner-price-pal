-- 1. Площадь поверхности у номенклатуры (для расчета сдельной ЗП)
ALTER TABLE public.nomenclature
  ADD COLUMN IF NOT EXISTS surface_area_m2 numeric NOT NULL DEFAULT 0;

-- 2. У операций - единица измерения и ставка (м², час, шт)
ALTER TABLE public.operations
  ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'hour',
  ADD COLUMN IF NOT EXISTS rate numeric NOT NULL DEFAULT 0;

-- Перенесём существующие значения cost_per_hour в rate, если rate=0
UPDATE public.operations SET rate = cost_per_hour WHERE rate = 0 AND cost_per_hour > 0;

-- Валидация unit
CREATE OR REPLACE FUNCTION public.validate_operation_unit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.unit NOT IN ('m2','hour','piece') THEN
    RAISE EXCEPTION 'Invalid operation unit: %', NEW.unit;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_operation_unit ON public.operations;
CREATE TRIGGER trg_validate_operation_unit
BEFORE INSERT OR UPDATE ON public.operations
FOR EACH ROW EXECUTE FUNCTION public.validate_operation_unit();

-- 3. Спецификация: какие операции выполняются для каждой номенклатуры (для серийных изделий — фиксированная стоимость)
CREATE TABLE IF NOT EXISTS public.nomenclature_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomenclature_id uuid NOT NULL,
  operation_id uuid NOT NULL,
  quantity_override numeric,         -- площадь/часы/штуки на изделие (если NULL — для m2 берётся nomenclature.surface_area_m2)
  fixed_cost numeric,                 -- зафиксированная стоимость операции для серийного изделия
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nomenclature_id, operation_id)
);

ALTER TABLE public.nomenclature_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage nomenclature_operations"
  ON public.nomenclature_operations FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated read nomenclature_operations"
  ON public.nomenclature_operations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users with clients access manage nomenclature_operations"
  ON public.nomenclature_operations FOR ALL TO authenticated
  USING (public.has_module_access(auth.uid(), 'clients'))
  WITH CHECK (public.has_module_access(auth.uid(), 'clients'));

-- 4. Табель: добавим привязку к номенклатуре и сдельный объём
ALTER TABLE public.timesheets
  ADD COLUMN IF NOT EXISTS nomenclature_id uuid,
  ADD COLUMN IF NOT EXISTS units_done numeric,
  ADD COLUMN IF NOT EXISTS computed_wage numeric;
