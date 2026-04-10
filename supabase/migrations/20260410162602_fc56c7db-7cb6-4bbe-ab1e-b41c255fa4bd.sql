
DROP POLICY "Allow insert from service role" ON public.webhook_logs;

CREATE POLICY "Service role can insert webhook logs"
  ON public.webhook_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
