CREATE POLICY "Super admins can delete lesson_messages"
ON public.lesson_messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));