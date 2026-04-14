
-- Create a secure view that masks secret_token for non-super-admins
CREATE OR REPLACE VIEW public.webhook_endpoints_secure AS
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

-- Grant access to the view
GRANT SELECT ON public.webhook_endpoints_secure TO authenticated;
