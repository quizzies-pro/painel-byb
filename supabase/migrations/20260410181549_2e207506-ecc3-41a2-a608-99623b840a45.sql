
-- Webhook endpoints configuration
CREATE TABLE public.webhook_endpoints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  source text NOT NULL DEFAULT 'custom',
  slug text NOT NULL UNIQUE,
  secret_token text,
  is_active boolean NOT NULL DEFAULT true,
  headers_config jsonb DEFAULT '{}',
  event_mapping jsonb DEFAULT '{}',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on webhook_endpoints"
  ON public.webhook_endpoints FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Allow service role to read endpoints (for edge function)
CREATE POLICY "Service role can read webhook_endpoints"
  ON public.webhook_endpoints FOR SELECT
  TO service_role
  USING (true);

-- Link logs to endpoints
ALTER TABLE public.webhook_logs ADD COLUMN webhook_endpoint_id uuid REFERENCES public.webhook_endpoints(id) ON DELETE SET NULL;
