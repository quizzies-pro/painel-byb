
CREATE POLICY "Students can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (student_id = auth.uid());
