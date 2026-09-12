REVOKE ALL ON FUNCTION public.prepare_webhook_endpoint_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_webhook_endpoint_secret() TO service_role;