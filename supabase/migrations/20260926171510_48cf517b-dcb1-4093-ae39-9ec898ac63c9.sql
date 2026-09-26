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
  NEW.title := btrim(NEW.title);
  NEW.description := NULLIF(btrim(COALESCE(NEW.description, '')), '');

  SELECT product_type, pack_format INTO parent_type, parent_format
  FROM public.courses WHERE id = NEW.course_id;

  IF parent_type IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado.';
  END IF;
  IF parent_type <> 'pack'::public.product_type THEN
    RAISE EXCEPTION 'Coleções e itens estão disponíveis somente para produtos do tipo Pack.';
  END IF;
  IF length(NEW.title) < 2 OR length(NEW.title) > 180 THEN
    RAISE EXCEPTION 'O título deve ter entre 2 e 180 caracteres.';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 1000 THEN
    RAISE EXCEPTION 'A descrição deve ter no máximo 1000 caracteres.';
  END IF;
  IF NEW.sort_order < 0 THEN
    RAISE EXCEPTION 'A ordem não pode ser negativa.';
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
    IF NEW.format = 'canva'::public.pack_format AND (
      NULLIF(btrim(COALESCE(NEW.canva_template_url, '')), '') IS NULL
      OR length(NEW.canva_template_url) > 2048
      OR NEW.canva_template_url !~* '^https://([a-z0-9-]+\.)*(canva\.com|canva\.link|canva\.site|canva\.cn)(/[^[:space:]]*)?$'
    ) THEN
      RAISE EXCEPTION 'Informe um link HTTPS válido do Canva.';
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