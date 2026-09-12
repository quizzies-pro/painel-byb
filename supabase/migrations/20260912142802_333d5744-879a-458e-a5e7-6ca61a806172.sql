ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS students_auth_user_id_unique
  ON public.students (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS students_email_lower_unique
  ON public.students (lower(email));

UPDATE public.students
SET auth_user_id = id
WHERE auth_user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = public.students.id
  );

DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update own profile" ON public.students;
CREATE POLICY "Students can view own profile"
ON public.students FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());
CREATE POLICY "Students can update own profile"
ON public.students FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
CREATE POLICY "Students can view own enrollments"
ON public.enrollments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = enrollments.student_id
    AND s.auth_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Students can view own payments" ON public.payments;
CREATE POLICY "Students can view own payments"
ON public.payments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = payments.student_id
    AND s.auth_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Students can view own messages" ON public.lesson_messages;
DROP POLICY IF EXISTS "Students can insert own messages" ON public.lesson_messages;
CREATE POLICY "Students can view own messages"
ON public.lesson_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = lesson_messages.student_id
    AND s.auth_user_id = auth.uid()
));
CREATE POLICY "Students can insert own messages"
ON public.lesson_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_type = 'student'
  AND EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.enrollments e ON e.student_id = s.id
    WHERE s.id = lesson_messages.student_id
      AND s.auth_user_id = auth.uid()
      AND e.course_id = lesson_messages.course_id
      AND e.status = 'active'
  )
);

DROP POLICY IF EXISTS "Students can view own threads" ON public.message_threads;
DROP POLICY IF EXISTS "Students can create own threads" ON public.message_threads;
DROP POLICY IF EXISTS "Students can update own threads" ON public.message_threads;
CREATE POLICY "Students can view own threads"
ON public.message_threads FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = message_threads.student_id
    AND s.auth_user_id = auth.uid()
));
CREATE POLICY "Students can create own threads"
ON public.message_threads FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = message_threads.student_id
    AND s.auth_user_id = auth.uid()
));
CREATE POLICY "Students can update own threads"
ON public.message_threads FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = message_threads.student_id
    AND s.auth_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = message_threads.student_id
    AND s.auth_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Students can view own ratings" ON public.lesson_ratings;
DROP POLICY IF EXISTS "Students can insert own ratings" ON public.lesson_ratings;
DROP POLICY IF EXISTS "Students can update own ratings" ON public.lesson_ratings;
CREATE POLICY "Students can view own ratings"
ON public.lesson_ratings FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = lesson_ratings.student_id
    AND s.auth_user_id = auth.uid()
));
CREATE POLICY "Students can insert own ratings"
ON public.lesson_ratings FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.students s
  JOIN public.lessons l ON l.id = lesson_ratings.lesson_id
  JOIN public.enrollments e ON e.student_id = s.id AND e.course_id = l.course_id
  WHERE s.id = lesson_ratings.student_id
    AND s.auth_user_id = auth.uid()
    AND e.status = 'active'
));
CREATE POLICY "Students can update own ratings"
ON public.lesson_ratings FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = lesson_ratings.student_id
    AND s.auth_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = lesson_ratings.student_id
    AND s.auth_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Enrolled students can view course modules" ON public.course_modules;
CREATE POLICY "Enrolled students can view course modules"
ON public.course_modules FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.enrollments e
  JOIN public.students s ON s.id = e.student_id
  WHERE e.course_id = course_modules.course_id
    AND s.auth_user_id = auth.uid()
    AND e.status = 'active'
));

DROP POLICY IF EXISTS "Enrolled students can view lessons" ON public.lessons;
CREATE POLICY "Enrolled students can view lessons"
ON public.lessons FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.enrollments e
  JOIN public.students s ON s.id = e.student_id
  WHERE e.course_id = lessons.course_id
    AND s.auth_user_id = auth.uid()
    AND e.status = 'active'
));

DROP POLICY IF EXISTS "Enrolled students can view lesson materials" ON public.lesson_materials;
CREATE POLICY "Enrolled students can view lesson materials"
ON public.lesson_materials FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.enrollments e
  JOIN public.students s ON s.id = e.student_id
  WHERE e.course_id = lesson_materials.course_id
    AND s.auth_user_id = auth.uid()
    AND e.status = 'active'
));

DROP POLICY IF EXISTS "Students can view own enrollment_modules" ON public.enrollment_modules;
DROP POLICY IF EXISTS "Students can insert own enrollment_modules" ON public.enrollment_modules;
CREATE POLICY "Students can view own enrollment_modules"
ON public.enrollment_modules FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.enrollments e
  JOIN public.students s ON s.id = e.student_id
  WHERE e.id = enrollment_modules.enrollment_id
    AND s.auth_user_id = auth.uid()
));
CREATE POLICY "Students can insert own enrollment_modules"
ON public.enrollment_modules FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.enrollments e
  JOIN public.students s ON s.id = e.student_id
  WHERE e.id = enrollment_modules.enrollment_id
    AND s.auth_user_id = auth.uid()
    AND e.status = 'active'
));

DROP POLICY IF EXISTS "Students can view own enrollment_lessons" ON public.enrollment_lessons;
DROP POLICY IF EXISTS "Students can insert own enrollment_lessons" ON public.enrollment_lessons;
CREATE POLICY "Students can view own enrollment_lessons"
ON public.enrollment_lessons FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.enrollments e
  JOIN public.students s ON s.id = e.student_id
  WHERE e.id = enrollment_lessons.enrollment_id
    AND s.auth_user_id = auth.uid()
));
CREATE POLICY "Students can insert own enrollment_lessons"
ON public.enrollment_lessons FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.enrollments e
  JOIN public.students s ON s.id = e.student_id
  WHERE e.id = enrollment_lessons.enrollment_id
    AND s.auth_user_id = auth.uid()
    AND e.status = 'active'
));

REVOKE SELECT ON public.webhook_endpoints FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_endpoints TO authenticated;
GRANT ALL ON public.webhook_endpoints TO service_role;

CREATE OR REPLACE FUNCTION public.validate_webhook_endpoint_activation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active AND COALESCE(NEW.secret_hash, '') = '' THEN
    RAISE EXCEPTION 'Um segredo válido é obrigatório para ativar o webhook';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS require_webhook_secret_before_activation ON public.webhook_endpoints;
CREATE TRIGGER require_webhook_secret_before_activation
BEFORE INSERT OR UPDATE OF is_active, secret_hash ON public.webhook_endpoints
FOR EACH ROW EXECUTE FUNCTION public.validate_webhook_endpoint_activation();