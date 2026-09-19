CREATE TYPE public.pack_format AS ENUM ('canva', 'textual', 'drive');
CREATE TYPE public.pack_item_status AS ENUM ('draft', 'published', 'hidden');

ALTER TABLE public.courses
  ADD COLUMN pack_format public.pack_format;

CREATE TABLE public.pack_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pack_collections TO authenticated;
GRANT ALL ON public.pack_collections TO service_role;
ALTER TABLE public.pack_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pack collections"
  ON public.pack_collections FOR ALL TO authenticated
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Enrolled students can view visible pack collections"
  ON public.pack_collections FOR SELECT TO authenticated
  USING (
    is_visible = true AND EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.students s ON s.id = e.student_id
      WHERE e.course_id = pack_collections.course_id
        AND s.auth_user_id = auth.uid()
        AND e.status = 'active'::public.enrollment_status
        AND (e.expires_at IS NULL OR e.expires_at > now())
    )
  );

CREATE TABLE public.pack_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.pack_collections(id) ON DELETE SET NULL,
  format public.pack_format NOT NULL,
  title text NOT NULL,
  description text,
  cover_url text,
  tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  status public.pack_item_status NOT NULL DEFAULT 'draft',
  canva_template_url text,
  textual_content text,
  textual_example text,
  drive_file_id text,
  drive_file_name text,
  drive_mime_type text,
  drive_file_size bigint,
  drive_thumbnail_url text,
  drive_modified_at timestamptz,
  drive_synced_at timestamptz,
  drive_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pack_items TO authenticated;
GRANT ALL ON public.pack_items TO service_role;
ALTER TABLE public.pack_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pack items"
  ON public.pack_items FOR ALL TO authenticated
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Enrolled students can view published pack items"
  ON public.pack_items FOR SELECT TO authenticated
  USING (
    status = 'published'::public.pack_item_status AND EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.students s ON s.id = e.student_id
      WHERE e.course_id = pack_items.course_id
        AND s.auth_user_id = auth.uid()
        AND e.status = 'active'::public.enrollment_status
        AND (e.expires_at IS NULL OR e.expires_at > now())
    )
  );

CREATE INDEX pack_collections_course_order_idx ON public.pack_collections(course_id, sort_order);
CREATE INDEX pack_items_course_order_idx ON public.pack_items(course_id, sort_order);
CREATE INDEX pack_items_collection_order_idx ON public.pack_items(collection_id, sort_order);
CREATE UNIQUE INDEX pack_items_drive_file_unique_idx
  ON public.pack_items(course_id, drive_file_id)
  WHERE drive_file_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_course_product_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.product_type IS DISTINCT FROM OLD.product_type THEN
    RAISE EXCEPTION 'O tipo do produto não pode ser alterado após a criação.';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.pack_format IS DISTINCT FROM OLD.pack_format THEN
    RAISE EXCEPTION 'O formato de entrega do Pack não pode ser alterado após a criação.';
  END IF;

  IF NEW.product_type = 'course'::public.product_type AND NEW.pack_format IS NOT NULL THEN
    RAISE EXCEPTION 'Produtos do tipo Curso não podem possuir formato de Pack.';
  END IF;

  IF NEW.product_type = 'pack'::public.product_type AND NEW.pack_format IS NULL THEN
    RAISE EXCEPTION 'Escolha o formato de entrega do Pack.';
  END IF;

  IF NEW.product_type = 'pack'::public.product_type AND (
    NEW.status <> 'draft'::public.course_status
    OR NEW.storefront_visible
    OR NEW.available_for_sale
  ) THEN
    RAISE EXCEPTION 'Packs devem permanecer em rascunho, fora da vitrine e fora de venda até a entrega estar disponível.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_pack_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  parent_type public.product_type;
  parent_format public.pack_format;
  collection_course_id uuid;
BEGIN
  SELECT product_type, pack_format INTO parent_type, parent_format
  FROM public.courses WHERE id = NEW.course_id;

  IF parent_type IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado.';
  END IF;
  IF parent_type <> 'pack'::public.product_type THEN
    RAISE EXCEPTION 'Coleções e itens estão disponíveis somente para produtos do tipo Pack.';
  END IF;

  IF TG_TABLE_NAME = 'pack_items' THEN
    IF NEW.format IS DISTINCT FROM parent_format THEN
      RAISE EXCEPTION 'O item deve usar o mesmo formato de entrega do Pack.';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.format IS DISTINCT FROM OLD.format THEN
      RAISE EXCEPTION 'O formato do item não pode ser alterado.';
    END IF;
    IF NEW.collection_id IS NOT NULL THEN
      SELECT course_id INTO collection_course_id FROM public.pack_collections WHERE id = NEW.collection_id;
      IF collection_course_id IS DISTINCT FROM NEW.course_id THEN
        RAISE EXCEPTION 'A coleção selecionada pertence a outro Pack.';
      END IF;
    END IF;
    IF NEW.format = 'canva'::public.pack_format AND NULLIF(btrim(COALESCE(NEW.canva_template_url, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Informe o link do template do Canva.';
    END IF;
    IF NEW.format = 'textual'::public.pack_format AND NULLIF(btrim(COALESCE(NEW.textual_content, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Informe o conteúdo textual.';
    END IF;
    IF NEW.format = 'drive'::public.pack_format AND NULLIF(btrim(COALESCE(NEW.drive_file_id, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Informe o arquivo do Google Drive.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_pack_collection_before_write
  BEFORE INSERT OR UPDATE ON public.pack_collections
  FOR EACH ROW EXECUTE FUNCTION public.validate_pack_content();
CREATE TRIGGER validate_pack_item_before_write
  BEFORE INSERT OR UPDATE ON public.pack_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_pack_content();
CREATE TRIGGER update_pack_collections_updated_at
  BEFORE UPDATE ON public.pack_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pack_items_updated_at
  BEFORE UPDATE ON public.pack_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.log_pack_content_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  target_id uuid;
  target_course_id uuid;
BEGIN
  target_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  target_course_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.course_id ELSE NEW.course_id END;
  INSERT INTO public.activity_logs(action, entity_type, entity_id, actor_id, actor_email, details)
  VALUES (
    lower(TG_OP),
    TG_TABLE_NAME,
    target_id::text,
    auth.uid(),
    auth.jwt() ->> 'email',
    jsonb_build_object('course_id', target_course_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE TRIGGER log_pack_collection_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.pack_collections
  FOR EACH ROW EXECUTE FUNCTION public.log_pack_content_activity();
CREATE TRIGGER log_pack_item_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.pack_items
  FOR EACH ROW EXECUTE FUNCTION public.log_pack_content_activity();