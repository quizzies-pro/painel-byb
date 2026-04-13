
-- Create lesson_ratings table
CREATE TABLE public.lesson_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  rating SMALLINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_id)
);

-- Validation trigger for rating 1-5
CREATE OR REPLACE FUNCTION public.validate_lesson_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_lesson_rating
BEFORE INSERT OR UPDATE ON public.lesson_ratings
FOR EACH ROW
EXECUTE FUNCTION public.validate_lesson_rating();

-- Updated_at trigger
CREATE TRIGGER update_lesson_ratings_updated_at
BEFORE UPDATE ON public.lesson_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on lesson_ratings"
ON public.lesson_ratings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Students can view own ratings
CREATE POLICY "Students can view own ratings"
ON public.lesson_ratings
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can insert own ratings (if enrolled)
CREATE POLICY "Students can insert own ratings"
ON public.lesson_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM enrollments e
    JOIN lessons l ON l.course_id = e.course_id
    WHERE l.id = lesson_ratings.lesson_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'::enrollment_status
  )
);

-- Students can update own ratings
CREATE POLICY "Students can update own ratings"
ON public.lesson_ratings
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Index for performance
CREATE INDEX idx_lesson_ratings_lesson_id ON public.lesson_ratings (lesson_id);
CREATE INDEX idx_lesson_ratings_student_id ON public.lesson_ratings (student_id);
