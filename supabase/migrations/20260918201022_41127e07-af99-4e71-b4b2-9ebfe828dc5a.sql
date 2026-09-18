CREATE OR REPLACE FUNCTION public.validate_course_sale_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.available_for_sale AND NULLIF(BTRIM(COALESCE(NEW.checkout_url, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Um link de checkout é obrigatório para disponibilizar o produto para venda';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_course_sale_settings_before_write
BEFORE INSERT OR UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.validate_course_sale_settings();