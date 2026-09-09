
-- Add gender to children
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'O' CHECK (gender IN ('M','F','O'));

-- Per-child chapter progress
CREATE TABLE IF NOT EXISTS public.chapter_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, chapter_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_progress TO authenticated;
GRANT ALL ON public.chapter_progress TO service_role;
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access chapter_progress per child" ON public.chapter_progress
  FOR ALL TO authenticated
  USING (public.can_access_child(child_id))
  WITH CHECK (public.can_access_child(child_id));
CREATE TRIGGER chapter_progress_touch BEFORE UPDATE ON public.chapter_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Per-child quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access quiz_attempts per child" ON public.quiz_attempts
  FOR ALL TO authenticated
  USING (public.can_access_child(child_id))
  WITH CHECK (public.can_access_child(child_id));
