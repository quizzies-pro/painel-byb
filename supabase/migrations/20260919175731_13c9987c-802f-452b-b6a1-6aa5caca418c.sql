CREATE TABLE public.product_waitlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  consent_text text NOT NULL,
  consent_version text NOT NULL DEFAULT '1.0',
  privacy_policy_url text NOT NULL,
  created_by uuid,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_waitlists TO authenticated;
GRANT ALL ON public.product_waitlists TO service_role;

ALTER TABLE public.product_waitlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product waitlists"
ON public.product_waitlists
FOR ALL
TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE POLICY "Students can view active waitlists"
ON public.product_waitlists
FOR SELECT
TO authenticated
USING (
  status = 'active'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.auth_user_id = auth.uid()
  )
);

CREATE TABLE public.product_waitlist_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id uuid NOT NULL REFERENCES public.product_waitlists(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  name_snapshot text NOT NULL,
  email_snapshot text NOT NULL,
  phone_snapshot text NOT NULL,
  marketing_email boolean NOT NULL DEFAULT true,
  marketing_whatsapp boolean NOT NULL DEFAULT true,
  consent_text_snapshot text NOT NULL,
  consent_version text NOT NULL,
  privacy_policy_url_snapshot text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'members',
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (waitlist_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_waitlist_members TO authenticated;
GRANT ALL ON public.product_waitlist_members TO service_role;

ALTER TABLE public.product_waitlist_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage waitlist members"
ON public.product_waitlist_members
FOR ALL
TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE POLICY "Students can view own waitlist memberships"
ON public.product_waitlist_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = product_waitlist_members.student_id
      AND s.auth_user_id = auth.uid()
  )
);

CREATE INDEX product_waitlists_course_id_idx ON public.product_waitlists(course_id);
CREATE INDEX product_waitlists_status_idx ON public.product_waitlists(status);
CREATE INDEX product_waitlist_members_waitlist_status_idx ON public.product_waitlist_members(waitlist_id, status);
CREATE INDEX product_waitlist_members_student_id_idx ON public.product_waitlist_members(student_id);

CREATE OR REPLACE FUNCTION public.validate_product_waitlist()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.name := btrim(NEW.name);
  NEW.consent_text := btrim(NEW.consent_text);
  NEW.consent_version := btrim(NEW.consent_version);
  NEW.privacy_policy_url := btrim(NEW.privacy_policy_url);

  IF length(NEW.name) < 2 OR length(NEW.name) > 160 THEN
    RAISE EXCEPTION 'O nome da lista deve ter entre 2 e 160 caracteres';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 1000 THEN
    RAISE EXCEPTION 'A descrição deve ter no máximo 1000 caracteres';
  END IF;
  IF NEW.status NOT IN ('active', 'closed') THEN
    RAISE EXCEPTION 'Status de lista inválido';
  END IF;
  IF length(NEW.consent_text) < 20 OR length(NEW.consent_text) > 2000 THEN
    RAISE EXCEPTION 'O texto de consentimento deve ter entre 20 e 2000 caracteres';
  END IF;
  IF length(NEW.consent_version) < 1 OR length(NEW.consent_version) > 50 THEN
    RAISE EXCEPTION 'A versão do consentimento deve ter entre 1 e 50 caracteres';
  END IF;
  IF length(NEW.privacy_policy_url) < 8 OR length(NEW.privacy_policy_url) > 2048 OR NEW.privacy_policy_url !~* '^https://[^[:space:]]+$' THEN
    RAISE EXCEPTION 'Informe uma URL HTTPS válida para a política de privacidade';
  END IF;

  IF NEW.status = 'closed' AND NEW.closed_at IS NULL THEN
    NEW.closed_at := now();
  ELSIF NEW.status = 'active' THEN
    NEW.closed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_product_waitlist_before_write
BEFORE INSERT OR UPDATE ON public.product_waitlists
FOR EACH ROW EXECUTE FUNCTION public.validate_product_waitlist();

CREATE TRIGGER update_product_waitlists_updated_at
BEFORE UPDATE ON public.product_waitlists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_product_waitlist_member()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.name_snapshot := btrim(NEW.name_snapshot);
  NEW.email_snapshot := lower(btrim(NEW.email_snapshot));
  NEW.phone_snapshot := btrim(NEW.phone_snapshot);
  NEW.source := btrim(NEW.source);

  IF NEW.status NOT IN ('active', 'withdrawn') THEN
    RAISE EXCEPTION 'Status de inscrição inválido';
  END IF;
  IF length(NEW.name_snapshot) < 2 OR length(NEW.name_snapshot) > 160 THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;
  IF length(NEW.email_snapshot) < 3 OR length(NEW.email_snapshot) > 255 OR position('@' in NEW.email_snapshot) = 0 THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;
  IF length(NEW.phone_snapshot) < 8 OR length(NEW.phone_snapshot) > 40 THEN
    RAISE EXCEPTION 'Telefone inválido';
  END IF;
  IF NEW.marketing_email IS DISTINCT FROM true OR NEW.marketing_whatsapp IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'O consentimento deve incluir e-mail e WhatsApp';
  END IF;
  IF length(NEW.source) < 1 OR length(NEW.source) > 80 THEN
    RAISE EXCEPTION 'Origem inválida';
  END IF;
  IF NEW.status = 'withdrawn' AND NEW.withdrawn_at IS NULL THEN
    NEW.withdrawn_at := now();
  ELSIF NEW.status = 'active' THEN
    NEW.withdrawn_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_product_waitlist_member_before_write
BEFORE INSERT OR UPDATE ON public.product_waitlist_members
FOR EACH ROW EXECUTE FUNCTION public.validate_product_waitlist_member();

CREATE TRIGGER update_product_waitlist_members_updated_at
BEFORE UPDATE ON public.product_waitlist_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.close_product_waitlists_when_sale_opens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.available_for_sale = true AND OLD.available_for_sale IS DISTINCT FROM true THEN
    UPDATE public.product_waitlists
    SET status = 'closed', closed_at = now()
    WHERE course_id = NEW.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER close_waitlists_when_course_sale_opens
AFTER UPDATE OF available_for_sale ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.close_product_waitlists_when_sale_opens();

CREATE OR REPLACE FUNCTION public.log_product_waitlist_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_name text;
  row_id uuid;
BEGIN
  action_name := CASE
    WHEN TG_OP = 'INSERT' THEN 'create'
    WHEN TG_OP = 'DELETE' THEN 'delete'
    ELSE CASE WHEN OLD.status = 'active' AND NEW.status = 'closed' THEN 'close' WHEN OLD.status = 'closed' AND NEW.status = 'active' THEN 'reopen' ELSE 'update' END
  END;
  row_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;

  INSERT INTO public.activity_logs(action, entity_type, entity_id, actor_id, actor_email, details)
  VALUES (
    action_name,
    'product_waitlist',
    row_id::text,
    auth.uid(),
    auth.jwt() ->> 'email',
    jsonb_build_object('course_id', CASE WHEN TG_OP = 'DELETE' THEN OLD.course_id ELSE NEW.course_id END)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_product_waitlist_changes
AFTER INSERT OR UPDATE OR DELETE ON public.product_waitlists
FOR EACH ROW EXECUTE FUNCTION public.log_product_waitlist_activity();

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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_student_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;

  SELECT s.id INTO current_student_id
  FROM public.students s
  WHERE s.auth_user_id = auth.uid();

  IF current_student_id IS NULL THEN
    RAISE EXCEPTION 'Cadastro de aluno não encontrado';
  END IF;

  RETURN QUERY
  SELECT
    w.id,
    w.course_id,
    w.name,
    w.description,
    w.consent_text,
    w.consent_version,
    w.privacy_policy_url,
    w.status,
    c.available_for_sale,
    m.status,
    nullif(btrim(s.phone), '') IS NULL,
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = s.id AND e.course_id = c.id AND e.status = 'active'
    )
  FROM public.product_waitlists w
  JOIN public.courses c ON c.id = w.course_id
  JOIN public.students s ON s.id = current_student_id
  LEFT JOIN public.product_waitlist_members m ON m.waitlist_id = w.id AND m.student_id = s.id
  WHERE w.id = _waitlist_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_product_waitlist_state(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_waitlist_state(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_waitlist_state(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.join_product_waitlist(_waitlist_id uuid, _consent boolean, _source text DEFAULT 'members')
RETURNS TABLE (member_id uuid, membership_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_student public.students%ROWTYPE;
  current_waitlist_id uuid;
  current_course_id uuid;
  current_waitlist_status text;
  current_consent_text text;
  current_consent_version text;
  current_privacy_policy_url text;
  product_is_available boolean;
  saved_member_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;
  IF _consent IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'O consentimento de marketing é obrigatório';
  END IF;
  IF _source IS NULL OR length(btrim(_source)) < 1 OR length(btrim(_source)) > 80 THEN
    RAISE EXCEPTION 'Origem inválida';
  END IF;

  SELECT * INTO current_student
  FROM public.students
  WHERE auth_user_id = auth.uid();

  IF current_student.id IS NULL THEN
    RAISE EXCEPTION 'Cadastro de aluno não encontrado';
  END IF;
  IF nullif(btrim(current_student.phone), '') IS NULL THEN
    RAISE EXCEPTION 'Cadastre seu telefone antes de entrar na lista';
  END IF;

  SELECT w.id, w.course_id, w.status, w.consent_text, w.consent_version, w.privacy_policy_url, c.available_for_sale
  INTO current_waitlist_id, current_course_id, current_waitlist_status, current_consent_text, current_consent_version, current_privacy_policy_url, product_is_available
  FROM public.product_waitlists w
  JOIN public.courses c ON c.id = w.course_id
  WHERE w.id = _waitlist_id
  FOR UPDATE OF w;

  IF current_waitlist_id IS NULL THEN
    RAISE EXCEPTION 'Lista de espera não encontrada';
  END IF;
  IF current_waitlist_status <> 'active' OR product_is_available THEN
    RAISE EXCEPTION 'Esta lista de espera está encerrada';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id = current_student.id
      AND e.course_id = current_course_id
      AND e.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Você já possui acesso a este produto';
  END IF;

  INSERT INTO public.product_waitlist_members (
    waitlist_id, student_id, status, name_snapshot, email_snapshot, phone_snapshot,
    marketing_email, marketing_whatsapp, consent_text_snapshot, consent_version,
    privacy_policy_url_snapshot, consented_at, source, withdrawn_at
  ) VALUES (
    current_waitlist_id, current_student.id, 'active', current_student.name,
    current_student.email, current_student.phone, true, true,
    current_consent_text, current_consent_version,
    current_privacy_policy_url, now(), btrim(_source), NULL
  )
  ON CONFLICT (waitlist_id, student_id) DO UPDATE SET
    status = 'active',
    name_snapshot = EXCLUDED.name_snapshot,
    email_snapshot = EXCLUDED.email_snapshot,
    phone_snapshot = EXCLUDED.phone_snapshot,
    marketing_email = true,
    marketing_whatsapp = true,
    consent_text_snapshot = EXCLUDED.consent_text_snapshot,
    consent_version = EXCLUDED.consent_version,
    privacy_policy_url_snapshot = EXCLUDED.privacy_policy_url_snapshot,
    consented_at = now(),
    source = EXCLUDED.source,
    withdrawn_at = NULL
  RETURNING id INTO saved_member_id;

  RETURN QUERY SELECT saved_member_id, 'active'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.join_product_waitlist(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_product_waitlist(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_product_waitlist(uuid, boolean, text) TO service_role;

CREATE OR REPLACE FUNCTION public.leave_product_waitlist(_waitlist_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_student_id uuid;
  changed_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;

  SELECT s.id INTO current_student_id
  FROM public.students s
  WHERE s.auth_user_id = auth.uid();

  IF current_student_id IS NULL THEN
    RAISE EXCEPTION 'Cadastro de aluno não encontrado';
  END IF;

  UPDATE public.product_waitlist_members
  SET status = 'withdrawn', withdrawn_at = now()
  WHERE waitlist_id = _waitlist_id
    AND student_id = current_student_id
    AND status = 'active';
  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN changed_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.leave_product_waitlist(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_product_waitlist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_product_waitlist(uuid) TO service_role;