
-- Access groups table
CREATE TABLE public.access_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage access groups"
  ON public.access_groups FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read access groups"
  ON public.access_groups FOR SELECT
  TO authenticated
  USING (true);

-- Group permissions per module
CREATE TABLE public.group_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.access_groups(id) ON DELETE CASCADE NOT NULL,
  module text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  UNIQUE(group_id, module)
);

ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group permissions"
  ON public.group_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read group permissions"
  ON public.group_permissions FOR SELECT
  TO authenticated
  USING (true);

-- User to group assignments
CREATE TABLE public.user_group_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid REFERENCES public.access_groups(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

ALTER TABLE public.user_group_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user group assignments"
  ON public.user_group_assignments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own assignments"
  ON public.user_group_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Security definer function to check module access
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins always have access
    CASE WHEN public.has_role(_user_id, 'admin') THEN true
    ELSE EXISTS (
      SELECT 1 
      FROM public.user_group_assignments uga
      JOIN public.group_permissions gp ON gp.group_id = uga.group_id
      WHERE uga.user_id = _user_id 
        AND gp.module = _module 
        AND gp.allowed = true
    )
    END
$$;
