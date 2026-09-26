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

  IF NEW.product_type = 'course'::public.product_type AND (NEW.drive_root_folder_id IS NOT NULL OR NEW.drive_root_folder_name IS NOT NULL) THEN
    RAISE EXCEPTION 'Produtos do tipo Curso não podem possuir pasta do Google Drive.';
  END IF;

  IF NEW.product_type = 'pack'::public.product_type AND NEW.pack_format IS NULL THEN
    RAISE EXCEPTION 'Escolha o formato de entrega do Pack.';
  END IF;

  IF NEW.product_type = 'pack'::public.product_type AND NEW.pack_format <> 'drive'::public.pack_format
    AND (NEW.drive_root_folder_id IS NOT NULL OR NEW.drive_root_folder_name IS NOT NULL) THEN
    RAISE EXCEPTION 'A pasta do Google Drive só pode ser definida em Packs do formato Google Drive.';
  END IF;

  RETURN NEW;
END;
$function$;