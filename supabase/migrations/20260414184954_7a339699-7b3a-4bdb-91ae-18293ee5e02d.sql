
-- Drop existing student SELECT policy on materials bucket
DROP POLICY IF EXISTS "Students can view materials from enrolled courses" ON storage.objects;
DROP POLICY IF EXISTS "Enrolled students can view materials" ON storage.objects;

-- Recreate with stricter verification: file must exist in lesson_materials for an enrolled course
CREATE POLICY "Enrolled students can view materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials'
  AND EXISTS (
    SELECT 1
    FROM public.lesson_materials lm
    JOIN public.enrollments e ON e.course_id = lm.course_id
    WHERE e.student_id = auth.uid()
      AND e.status = 'active'::public.enrollment_status
      AND lm.file_url LIKE '%' || storage.objects.name
  )
);
