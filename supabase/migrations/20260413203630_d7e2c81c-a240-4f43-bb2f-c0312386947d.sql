
-- Create lesson_messages table
CREATE TABLE public.lesson_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  course_id UUID NOT NULL,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'student',
  admin_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Validation trigger for sender_type
CREATE OR REPLACE FUNCTION public.validate_lesson_message_sender()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_type NOT IN ('student', 'admin') THEN
    RAISE EXCEPTION 'sender_type must be student or admin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_lesson_message_sender
BEFORE INSERT OR UPDATE ON public.lesson_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_lesson_message_sender();

-- Updated_at trigger
CREATE TRIGGER update_lesson_messages_updated_at
BEFORE UPDATE ON public.lesson_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.lesson_messages ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on lesson_messages"
ON public.lesson_messages
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Students can view own messages only
CREATE POLICY "Students can view own messages"
ON public.lesson_messages
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can insert messages (if enrolled)
CREATE POLICY "Students can insert own messages"
ON public.lesson_messages
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND sender_type = 'student'
  AND EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.course_id = lesson_messages.course_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'::enrollment_status
  )
);

-- Indexes for performance
CREATE INDEX idx_lesson_messages_student_id ON public.lesson_messages (student_id);
CREATE INDEX idx_lesson_messages_lesson_id ON public.lesson_messages (lesson_id);
CREATE INDEX idx_lesson_messages_course_id ON public.lesson_messages (course_id);
CREATE INDEX idx_lesson_messages_is_read ON public.lesson_messages (is_read) WHERE is_read = false;
CREATE INDEX idx_lesson_messages_created_at ON public.lesson_messages (created_at DESC);
