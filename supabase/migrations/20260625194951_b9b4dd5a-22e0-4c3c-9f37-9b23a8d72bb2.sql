
-- CHILDREN
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🦸',
  avatar_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  level INT NOT NULL DEFAULT 1,
  level_name TEXT NOT NULL DEFAULT 'Aprendiz',
  xp INT NOT NULL DEFAULT 0,
  xp_to_next INT NOT NULL DEFAULT 200,
  points INT NOT NULL DEFAULT 0,
  point_value NUMERIC(6,2) NOT NULL DEFAULT 0.50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_children_parent ON public.children(parent_id);
CREATE INDEX idx_children_user ON public.children(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Helper: who can access a given child
CREATE OR REPLACE FUNCTION public.can_access_child(_child_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = _child_id
      AND (c.parent_id = auth.uid() OR c.user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "children_select" ON public.children FOR SELECT TO authenticated
  USING (parent_id = auth.uid() OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "children_insert" ON public.children FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "children_update" ON public.children FOR UPDATE TO authenticated
  USING (parent_id = auth.uid() OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (parent_id = auth.uid() OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "children_delete" ON public.children FOR DELETE TO authenticated
  USING (parent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_children_updated BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TASKS
CREATE TYPE public.task_status AS ENUM ('todo','doing','done');
CREATE TYPE public.task_frequency AS ENUM ('Única','Diária','Semanal','Mensal');

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Casa',
  points INT NOT NULL DEFAULT 5,
  status public.task_status NOT NULL DEFAULT 'todo',
  frequency public.task_frequency NOT NULL DEFAULT 'Única',
  due TEXT,
  approved BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_child ON public.tasks(child_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_all" ON public.tasks FOR ALL TO authenticated
  USING (public.can_access_child(child_id))
  WITH CHECK (public.can_access_child(child_id));
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- REWARDS
CREATE TYPE public.reward_status AS ENUM ('Ativo','Solicitado','Entregue');
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  points INT NOT NULL DEFAULT 50,
  status public.reward_status NOT NULL DEFAULT 'Ativo',
  emoji TEXT NOT NULL DEFAULT '🎁',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rewards_child ON public.rewards(child_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_all" ON public.rewards FOR ALL TO authenticated
  USING (public.can_access_child(child_id))
  WITH CHECK (public.can_access_child(child_id));
CREATE TRIGGER trg_rewards_updated BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- GOALS
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target INT NOT NULL DEFAULT 100,
  current INT NOT NULL DEFAULT 0,
  emoji TEXT NOT NULL DEFAULT '🎯',
  due TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_child ON public.goals(child_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_all" ON public.goals FOR ALL TO authenticated
  USING (public.can_access_child(child_id))
  WITH CHECK (public.can_access_child(child_id));
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🏆',
  earned BOOLEAN NOT NULL DEFAULT false,
  earned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, code)
);
CREATE INDEX idx_achievements_child ON public.achievements(child_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_all" ON public.achievements FOR ALL TO authenticated
  USING (public.can_access_child(child_id))
  WITH CHECK (public.can_access_child(child_id));
CREATE TRIGGER trg_achievements_updated BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
