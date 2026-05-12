-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 500.00 CHECK (hourly_rate >= 500),
  skill_level TEXT CHECK (skill_level IN ('junior','middle','senior','master')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operations dictionary
CREATE TABLE public.operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  norm_hours NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Timesheets
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  operation_id UUID REFERENCES public.operations(id),
  order_id TEXT,
  hours_worked NUMERIC(5,2) NOT NULL CHECK (hours_worked > 0),
  work_date DATE NOT NULL,
  coefficient NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (coefficient IN (0, 1.0, 1.5)),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timesheets_employee_date ON public.timesheets(employee_id, work_date);
CREATE INDEX idx_timesheets_order ON public.timesheets(order_id);

-- Timestamps trigger for employees
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- Employees: admins full access, authenticated can read
CREATE POLICY "Authenticated can view employees" ON public.employees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert employees" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update employees" ON public.employees
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete employees" ON public.employees
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Operations
CREATE POLICY "Authenticated can view operations" ON public.operations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert operations" ON public.operations
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update operations" ON public.operations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete operations" ON public.operations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Timesheets: authenticated can view+insert, admins full
CREATE POLICY "Authenticated can view timesheets" ON public.timesheets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert timesheets" ON public.timesheets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update timesheets" ON public.timesheets
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete timesheets" ON public.timesheets
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed sample operations
INSERT INTO public.operations (name, category, norm_hours) VALUES
  ('Подготовка опалубки', 'Подготовка', 2.0),
  ('Заливка бетоном', 'Производство', 1.5),
  ('Шлифовка поверхности', 'Финиш', 3.0),
  ('Покраска изделия', 'Финиш', 2.5),
  ('Контроль качества', 'QA', 0.5);
