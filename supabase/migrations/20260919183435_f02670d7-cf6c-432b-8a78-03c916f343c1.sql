CREATE TYPE public.product_type AS ENUM ('course', 'pack');

ALTER TABLE public.courses
  ADD COLUMN product_type public.product_type NOT NULL DEFAULT 'course';

CREATE OR REPLACE FUNCTION public.validate_course_product_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.product_type IS DISTINCT FROM OLD.product_type THEN
    RAISE EXCEPTION 'O tipo do produto não pode ser alterado após a criação.';
  END IF;

  IF NEW.product_type = 'pack' AND (
    NEW.status <> 'draft'::public.course_status
    OR NEW.storefront_visible
    OR NEW.available_for_sale
  ) THEN
    RAISE EXCEPTION 'Packs devem permanecer em rascunho, fora da vitrine e fora de venda até a entrega estar disponível.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_course_product_type_before_write
BEFORE INSERT OR UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.validate_course_product_type();

CREATE OR REPLACE FUNCTION public.require_course_product_for_learning_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_type public.product_type;
BEGIN
  SELECT product_type
    INTO target_type
    FROM public.courses
   WHERE id = NEW.course_id;

  IF target_type IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado.';
  END IF;

  IF target_type <> 'course'::public.product_type THEN
    RAISE EXCEPTION 'Módulos e aulas estão disponíveis somente para produtos do tipo Curso.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER require_course_product_before_module_write
BEFORE INSERT OR UPDATE OF course_id ON public.course_modules
FOR EACH ROW
EXECUTE FUNCTION public.require_course_product_for_learning_content();

CREATE TRIGGER require_course_product_before_lesson_write
BEFORE INSERT OR UPDATE OF course_id ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.require_course_product_for_learning_content();