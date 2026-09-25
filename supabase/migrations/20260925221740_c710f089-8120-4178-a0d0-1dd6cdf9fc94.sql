ALTER TABLE public.courses
  ADD COLUMN presentation_button_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN presentation_button_text text,
  ADD COLUMN presentation_button_url text;

CREATE OR REPLACE FUNCTION public.validate_product_presentation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.presentation_button_text := NULLIF(BTRIM(COALESCE(NEW.presentation_button_text, '')), '');
  NEW.presentation_button_url := NULLIF(BTRIM(COALESCE(NEW.presentation_button_url, '')), '');

  IF NEW.presentation_button_enabled THEN
    IF NEW.presentation_button_text IS NULL THEN
      RAISE EXCEPTION 'O texto do botão de apresentação é obrigatório quando o botão está ativo.';
    END IF;

    IF CHAR_LENGTH(NEW.presentation_button_text) > 60 THEN
      RAISE EXCEPTION 'O texto do botão de apresentação deve ter no máximo 60 caracteres.';
    END IF;

    IF NEW.presentation_button_url IS NULL OR NEW.presentation_button_url !~* '^https://[^[:space:]]+$' THEN
      RAISE EXCEPTION 'O endereço do botão de apresentação deve ser uma URL HTTPS válida.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_product_presentation_before_write
BEFORE INSERT OR UPDATE OF presentation_button_enabled, presentation_button_text, presentation_button_url
ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_presentation();