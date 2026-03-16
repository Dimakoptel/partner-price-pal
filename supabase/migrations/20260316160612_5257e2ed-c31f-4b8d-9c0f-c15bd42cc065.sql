
-- ============================================
-- 1. dictionary_types — типы справочников
-- ============================================
CREATE TABLE public.dictionary_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dictionary_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read dictionary_types"
  ON public.dictionary_types FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage dictionary_types"
  ON public.dictionary_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 2. dictionary_items — значения справочников
-- ============================================
CREATE TABLE public.dictionary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID NOT NULL REFERENCES public.dictionary_types(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type_id, code)
);

ALTER TABLE public.dictionary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read dictionary_items"
  ON public.dictionary_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage dictionary_items"
  ON public.dictionary_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. system_settings — системные настройки
-- ============================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  value_type TEXT NOT NULL DEFAULT 'number',
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read system_settings"
  ON public.system_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage system_settings"
  ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. audit_log — аудит действий
-- ============================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert audit_log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_dictionary_items_type ON public.dictionary_items(type_id);
