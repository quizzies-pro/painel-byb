
-- Students can view their own message threads
CREATE POLICY "Students can view own message_threads"
ON public.message_threads
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can create their own message threads (only for courses they're enrolled in)
CREATE POLICY "Students can insert own message_threads"
ON public.message_threads
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = message_threads.course_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'::enrollment_status
  )
);

-- Students can update their own message threads
CREATE POLICY "Students can update own message_threads"
ON public.message_threads
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());
