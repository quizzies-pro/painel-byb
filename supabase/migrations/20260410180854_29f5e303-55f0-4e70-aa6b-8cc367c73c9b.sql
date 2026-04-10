
-- Granular access: specific modules per enrollment
CREATE TABLE public.enrollment_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, module_id)
);

ALTER TABLE public.enrollment_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on enrollment_modules"
  ON public.enrollment_modules FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Granular access: specific lessons per enrollment
CREATE TABLE public.enrollment_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

ALTER TABLE public.enrollment_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on enrollment_lessons"
  ON public.enrollment_lessons FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
