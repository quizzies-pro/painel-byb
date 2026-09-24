DROP POLICY IF EXISTS "Enrolled students can view published pack items" ON public.pack_items;

CREATE POLICY "Enrolled students can view published pack items"
ON public.pack_items
FOR SELECT
TO authenticated
USING (
  status = 'published'::public.pack_item_status
  AND (
    collection_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.pack_collections pc
      WHERE pc.id = pack_items.collection_id
        AND pc.course_id = pack_items.course_id
        AND pc.is_visible = true
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.course_id = pack_items.course_id
      AND s.auth_user_id = auth.uid()
      AND e.status = 'active'::public.enrollment_status
      AND (e.expires_at IS NULL OR e.expires_at > now())
  )
);