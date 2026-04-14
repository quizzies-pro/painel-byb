
-- Remove the public read policy on materials bucket
DROP POLICY IF EXISTS "Public can view materials" ON storage.objects;

-- Allow admins to access all materials
CREATE POLICY "Admins can access materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials'
  AND public.is_admin(auth.uid())
);

-- Allow enrolled students to access materials for their courses
CREATE POLICY "Enrolled students can access materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials'
  AND EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id = auth.uid()
      AND e.status = 'active'
      AND e.course_id::text = (storage.foldername(name))[1]
  )
);
