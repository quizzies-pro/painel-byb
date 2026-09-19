CREATE TABLE public.pack_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  status public.pack_item_status NOT NULL DEFAULT 'draft'::public.pack_item_status,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pack_videos TO authenticated;
GRANT ALL ON public.pack_videos TO service_role;

ALTER TABLE public.pack_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pack videos"
ON public.pack_videos
FOR ALL
TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE POLICY "Enrolled students can view published pack videos"
ON public.pack_videos
FOR SELECT
TO authenticated
USING (
  status = 'published'::public.pack_item_status
  AND EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.course_id = pack_videos.course_id
      AND s.auth_user_id = auth.uid()
      AND e.status = 'active'::public.enrollment_status
      AND (e.expires_at IS NULL OR e.expires_at > now())
  )
);

CREATE OR REPLACE FUNCTION public.validate_pack_video()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  parent_type public.product_type;
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.video_url := btrim(NEW.video_url);
  NEW.description := NULLIF(btrim(COALESCE(NEW.description, '')), '');

  SELECT product_type INTO parent_type
  FROM public.courses
  WHERE id = NEW.course_id;

  IF parent_type IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado.';
  END IF;
  IF parent_type <> 'pack'::public.product_type THEN
    RAISE EXCEPTION 'Vídeos explicativos estão disponíveis somente para produtos do tipo Pack.';
  END IF;
  IF length(NEW.title) < 2 OR length(NEW.title) > 180 THEN
    RAISE EXCEPTION 'O título deve ter entre 2 e 180 caracteres.';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 1000 THEN
    RAISE EXCEPTION 'A descrição deve ter no máximo 1000 caracteres.';
  END IF;
  IF length(NEW.video_url) > 2048 OR NEW.video_url !~* '^https://(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/[^[:space:]]+$' THEN
    RAISE EXCEPTION 'Informe um link HTTPS válido do YouTube ou Vimeo.';
  END IF;
  IF NEW.sort_order < 0 THEN
    RAISE EXCEPTION 'A ordem do vídeo não pode ser negativa.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_pack_video_before_write
BEFORE INSERT OR UPDATE ON public.pack_videos
FOR EACH ROW EXECUTE FUNCTION public.validate_pack_video();

CREATE TRIGGER update_pack_videos_updated_at
BEFORE UPDATE ON public.pack_videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER log_pack_video_changes
AFTER INSERT OR UPDATE OR DELETE ON public.pack_videos
FOR EACH ROW EXECUTE FUNCTION public.log_pack_content_activity();

CREATE INDEX pack_videos_course_order_idx
ON public.pack_videos(course_id, sort_order);