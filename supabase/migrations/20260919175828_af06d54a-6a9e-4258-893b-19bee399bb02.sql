REVOKE ALL ON FUNCTION public.close_product_waitlists_when_sale_opens() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.log_product_waitlist_activity() FROM PUBLIC, anon, authenticated, service_role;
ALTER FUNCTION public.close_product_waitlists_when_sale_opens() SECURITY INVOKER;
ALTER FUNCTION public.log_product_waitlist_activity() SECURITY INVOKER;

REVOKE ALL ON FUNCTION public.get_product_waitlist_state(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.join_product_waitlist(uuid, boolean, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.leave_product_waitlist(uuid) FROM PUBLIC, anon, authenticated, service_role;

ALTER FUNCTION public.get_product_waitlist_state(uuid) SET SCHEMA private;
ALTER FUNCTION public.join_product_waitlist(uuid, boolean, text) SET SCHEMA private;
ALTER FUNCTION public.leave_product_waitlist(uuid) SET SCHEMA private;

GRANT EXECUTE ON FUNCTION private.get_product_waitlist_state(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.join_product_waitlist(uuid, boolean, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.leave_product_waitlist(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_product_waitlist_state(_waitlist_id uuid)
RETURNS TABLE (
  waitlist_id uuid,
  course_id uuid,
  waitlist_name text,
  waitlist_description text,
  consent_text text,
  consent_version text,
  privacy_policy_url text,
  waitlist_status text,
  product_available_for_sale boolean,
  membership_status text,
  phone_missing boolean,
  has_active_enrollment boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT * FROM private.get_product_waitlist_state(_waitlist_id); $$;

CREATE OR REPLACE FUNCTION public.join_product_waitlist(_waitlist_id uuid, _consent boolean, _source text DEFAULT 'members')
RETURNS TABLE (member_id uuid, membership_status text)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT * FROM private.join_product_waitlist(_waitlist_id, _consent, _source); $$;

CREATE OR REPLACE FUNCTION public.leave_product_waitlist(_waitlist_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.leave_product_waitlist(_waitlist_id); $$;

REVOKE ALL ON FUNCTION public.get_product_waitlist_state(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_product_waitlist(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_product_waitlist(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_product_waitlist_state(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.join_product_waitlist(uuid, boolean, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.leave_product_waitlist(uuid) TO authenticated, service_role;