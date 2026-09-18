ALTER TABLE public.courses
  ADD COLUMN storefront_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN available_for_sale boolean NOT NULL DEFAULT false;

UPDATE public.courses
SET storefront_visible = true
WHERE status = 'published';

DROP POLICY IF EXISTS "Authenticated users can view published courses" ON public.courses;

CREATE POLICY "Authenticated users can view available or enrolled courses"
ON public.courses
FOR SELECT
TO authenticated
USING (
  private.is_admin(auth.uid())
  OR (
    status = 'published'::public.course_status
    AND storefront_visible = true
  )
  OR EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.course_id = courses.id
      AND e.status = 'active'::public.enrollment_status
      AND s.auth_user_id = auth.uid()
  )
);