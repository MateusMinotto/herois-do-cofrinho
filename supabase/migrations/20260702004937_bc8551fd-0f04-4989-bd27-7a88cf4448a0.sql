
-- 1. sprints table
CREATE TABLE public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, week_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprints TO authenticated;
GRANT ALL ON public.sprints TO service_role;

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sprints access" ON public.sprints
  FOR ALL TO authenticated
  USING (public.can_access_child(child_id))
  WITH CHECK (public.can_access_child(child_id));

CREATE TRIGGER sprints_touch BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. tasks: novas colunas
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_date date,
  ADD COLUMN IF NOT EXISTS approval text NOT NULL DEFAULT 'not_required'
    CHECK (approval IN ('not_required','pending','approved','rejected'));

CREATE INDEX IF NOT EXISTS tasks_sprint_idx ON public.tasks(sprint_id);
CREATE INDEX IF NOT EXISTS tasks_child_date_idx ON public.tasks(child_id, task_date);
