
-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can view own enrollment_lessons
CREATE POLICY "Students can view own enrollment_lessons"
ON public.enrollment_lessons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id = enrollment_id AND e.student_id = auth.uid()
  )
);

-- Students can view own enrollment_modules
CREATE POLICY "Students can view own enrollment_modules"
ON public.enrollment_modules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id = enrollment_id AND e.student_id = auth.uid()
  )
);

-- Anyone authenticated can view published courses
CREATE POLICY "Authenticated users can view published courses"
ON public.courses
FOR SELECT
TO authenticated
USING (status = 'published');

-- Authenticated users can view modules of published courses they're enrolled in
CREATE POLICY "Enrolled students can view course modules"
ON public.course_modules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = course_modules.course_id
    AND e.student_id = auth.uid()
    AND e.status = 'active'
  )
);

-- Enrolled students can view lessons
CREATE POLICY "Enrolled students can view lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  is_preview = true
  OR EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = lessons.course_id
    AND e.student_id = auth.uid()
    AND e.status = 'active'
  )
);

-- Enrolled students can view lesson materials
CREATE POLICY "Enrolled students can view lesson materials"
ON public.lesson_materials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = lesson_materials.course_id
    AND e.student_id = auth.uid()
    AND e.status = 'active'
  )
);

-- Students can view their own profile
CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Students can update their own profile
CREATE POLICY "Students can update own profile"
ON public.students
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Make materials bucket private
UPDATE storage.buckets SET public = false WHERE id = 'materials';
