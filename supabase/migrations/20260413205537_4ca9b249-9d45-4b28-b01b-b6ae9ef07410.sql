
-- Create enum for thread status
CREATE TYPE public.thread_status AS ENUM ('unresolved', 'resolved', 'awaiting_response');

-- Create table for conversation thread status
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  course_id UUID NOT NULL,
  status thread_status NOT NULL DEFAULT 'unresolved',
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can do everything on message_threads"
ON public.message_threads FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Index
CREATE INDEX idx_message_threads_student_lesson ON public.message_threads (student_id, lesson_id);
CREATE INDEX idx_message_threads_status ON public.message_threads (status);
