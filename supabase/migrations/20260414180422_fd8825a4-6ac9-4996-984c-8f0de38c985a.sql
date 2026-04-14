
-- Drop the existing ALL policy for webhook_endpoints
DROP POLICY IF EXISTS "Admins can do everything on webhook_endpoints" ON public.webhook_endpoints;

-- Super admins: full access (including secret_token)
CREATE POLICY "Super admins can do everything on webhook_endpoints"
ON public.webhook_endpoints
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Operational admins: read-only, but we need to mask secret_token
-- First, create a security definer function to mask the token
CREATE OR REPLACE FUNCTION public.masked_secret_token(token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN token IS NULL THEN NULL
    WHEN length(token) <= 4 THEN '****'
    ELSE repeat('*', length(token) - 4) || right(token, 4)
  END
$$;

-- Operational admins can SELECT webhook_endpoints
CREATE POLICY "Operational admins can view webhook_endpoints"
ON public.webhook_endpoints
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_operacional')
);
