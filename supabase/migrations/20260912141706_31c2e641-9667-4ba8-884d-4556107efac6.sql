ALTER TABLE public.webhook_endpoints
  ADD COLUMN IF NOT EXISTS secret_hash text,
  ADD COLUMN IF NOT EXISTS secret_hint text,
  ADD COLUMN IF NOT EXISTS last_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_tested_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_test_status text;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS checkout_url text;

CREATE TABLE public.webhook_product_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  external_product_id text NOT NULL,
  external_product_name text,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  checkout_url text,
  revoke_on_refund boolean NOT NULL DEFAULT true,
  revoke_on_chargeback boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (webhook_endpoint_id, external_product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_product_mappings TO authenticated;
GRANT ALL ON public.webhook_product_mappings TO service_role;
ALTER TABLE public.webhook_product_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage product mappings"
ON public.webhook_product_mappings FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role));
CREATE POLICY "Operational admins view product mappings"
ON public.webhook_product_mappings FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin_operacional'::public.app_role));
CREATE TRIGGER update_webhook_product_mappings_updated_at
BEFORE UPDATE ON public.webhook_product_mappings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  event_type text NOT NULL,
  external_transaction_id text,
  external_product_id text,
  buyer_email text,
  status text NOT NULL DEFAULT 'received',
  sanitized_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (webhook_endpoint_id, event_key)
);
GRANT SELECT ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view webhook events"
ON public.webhook_events FOR SELECT TO authenticated
USING (private.is_admin(auth.uid()));
CREATE POLICY "Service processes webhook events"
ON public.webhook_events FOR ALL TO service_role
USING (true) WITH CHECK (true);
CREATE TRIGGER update_webhook_events_updated_at
BEFORE UPDATE ON public.webhook_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS webhook_endpoint_id uuid REFERENCES public.webhook_endpoints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS webhook_event_id uuid REFERENCES public.webhook_events(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_endpoint_external_payment_unique
ON public.payments (webhook_endpoint_id, external_payment_id)
WHERE webhook_endpoint_id IS NOT NULL AND external_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS webhook_events_endpoint_created_idx
ON public.webhook_events (webhook_endpoint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_product_mappings_course_idx
ON public.webhook_product_mappings (course_id);

DROP POLICY IF EXISTS "Admins can manage webhook endpoints" ON public.webhook_endpoints;
DROP POLICY IF EXISTS "Admins can view webhook endpoints" ON public.webhook_endpoints;
DROP POLICY IF EXISTS "Super admins manage webhook endpoints" ON public.webhook_endpoints;
DROP POLICY IF EXISTS "Super admins can do everything on webhook_endpoints" ON public.webhook_endpoints;
CREATE POLICY "Super admins manage webhook endpoints"
ON public.webhook_endpoints FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role));

UPDATE public.webhook_endpoints
SET is_active = false
WHERE is_active = true AND COALESCE(secret_hash, '') = '';

INSERT INTO public.webhook_product_mappings (
  webhook_endpoint_id, external_product_id, external_product_name, course_id
)
SELECT we.id, c.ticto_product_id, c.title, c.id
FROM public.courses c
JOIN public.webhook_endpoints we ON we.source = 'ticto'
WHERE c.ticto_product_id IS NOT NULL
ON CONFLICT (webhook_endpoint_id, external_product_id) DO NOTHING;