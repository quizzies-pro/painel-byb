CREATE OR REPLACE FUNCTION public.prepare_webhook_endpoint_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.secret_token IS DISTINCT FROM OLD.secret_token OR (TG_OP = 'INSERT' AND NEW.secret_token IS NOT NULL) THEN
    IF COALESCE(NEW.secret_token, '') = '' THEN
      NEW.secret_hash := NULL;
      NEW.secret_hint := NULL;
    ELSE
      NEW.secret_hash := extensions.crypt(NEW.secret_token, extensions.gen_salt('bf', 10));
      NEW.secret_hint := '••••' || right(NEW.secret_token, 4);
    END IF;
  END IF;

  IF NEW.is_active AND COALESCE(NEW.secret_hash, '') = '' THEN
    RAISE EXCEPTION 'Um segredo válido é obrigatório para ativar o webhook';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS require_webhook_secret_before_activation ON public.webhook_endpoints;
CREATE TRIGGER require_webhook_secret_before_activation
BEFORE INSERT OR UPDATE OF is_active, secret_hash, secret_token ON public.webhook_endpoints
FOR EACH ROW EXECUTE FUNCTION public.prepare_webhook_endpoint_secret();

CREATE OR REPLACE FUNCTION public.verify_webhook_secret(_endpoint_id uuid, _provided_secret text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT COALESCE(
    extensions.crypt(_provided_secret, secret_hash) = secret_hash,
    false
  )
  FROM public.webhook_endpoints
  WHERE id = _endpoint_id;
$$;

REVOKE ALL ON FUNCTION public.verify_webhook_secret(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_webhook_secret(uuid, text) TO service_role;