
-- ========== ВОРОНКА: Стадии (настраиваемые админом) ==========
CREATE TABLE public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pipeline stages"
  ON public.pipeline_stages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read pipeline stages"
  ON public.pipeline_stages FOR SELECT
  USING (true);

-- Стартовые стадии
INSERT INTO public.pipeline_stages (name, color, sort_order, is_closed) VALUES
  ('Новая', '#6366f1', 0, false),
  ('Расчёт', '#f59e0b', 1, false),
  ('Согласование', '#3b82f6', 2, false),
  ('Оплата', '#10b981', 3, false),
  ('Выполнено', '#22c55e', 4, true),
  ('Отказ', '#ef4444', 5, true);

-- ========== СДЕЛКИ ==========
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT,
  amount NUMERIC DEFAULT 0,
  responsible_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all deals"
  ON public.deals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users with access can read deals"
  ON public.deals FOR SELECT
  USING (public.has_module_access(auth.uid(), 'clients'));

CREATE POLICY "Users with access can insert deals"
  ON public.deals FOR INSERT
  WITH CHECK (public.has_module_access(auth.uid(), 'clients') AND auth.uid() = responsible_id);

CREATE POLICY "Users with access can update deals"
  ON public.deals FOR UPDATE
  USING (public.has_module_access(auth.uid(), 'clients'));

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_deals_client ON public.deals (client_id);
CREATE INDEX idx_deals_stage ON public.deals (stage_id);
CREATE INDEX idx_deals_responsible ON public.deals (responsible_id);

-- ========== АКТИВНОСТЬ СДЕЛОК ==========
CREATE TABLE public.deal_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage deal activities"
  ON public.deal_activities FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users with access can read deal activities"
  ON public.deal_activities FOR SELECT
  USING (public.has_module_access(auth.uid(), 'clients'));

CREATE POLICY "Users with access can insert deal activities"
  ON public.deal_activities FOR INSERT
  WITH CHECK (public.has_module_access(auth.uid(), 'clients') AND auth.uid() = user_id);

CREATE INDEX idx_deal_activities_deal ON public.deal_activities (deal_id);

-- ========== ЗАДАЧИ ==========
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  assigned_to UUID NOT NULL,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all tasks"
  ON public.tasks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read assigned tasks"
  ON public.tasks FOR SELECT
  USING (public.has_module_access(auth.uid(), 'clients') AND (auth.uid() = assigned_to OR auth.uid() = created_by));

CREATE POLICY "Users can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.has_module_access(auth.uid(), 'clients') AND auth.uid() = created_by);

CREATE POLICY "Users can update assigned tasks"
  ON public.tasks FOR UPDATE
  USING (public.has_module_access(auth.uid(), 'clients') AND (auth.uid() = assigned_to OR auth.uid() = created_by));

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tasks_client ON public.tasks (client_id);
CREATE INDEX idx_tasks_deal ON public.tasks (deal_id);
CREATE INDEX idx_tasks_assigned ON public.tasks (assigned_to);
CREATE INDEX idx_tasks_due ON public.tasks (due_date);

-- ========== СВЯЗЬ РАСЧЁТОВ С КЛИЕНТАМИ ==========
ALTER TABLE public.saved_calculations ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
CREATE INDEX idx_calculations_client ON public.saved_calculations (client_id);
