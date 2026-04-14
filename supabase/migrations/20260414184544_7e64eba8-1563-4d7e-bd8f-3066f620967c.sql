
-- Recreate view with security_invoker = true
CREATE OR REPLACE VIEW public.webhook_endpoints_secure
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  source,
  slug,
  CASE
    WHEN public.has_role(auth.uid(), 'super_admin') THEN secret_token
    ELSE public.masked_secret_token(secret_token)
  END AS secret_token,
  is_active,
  description,
  event_mapping,
  headers_config,
  created_at,
  updated_at
FROM public.webhook_endpoints;
