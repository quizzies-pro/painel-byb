
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin_operacional');

-- Create enum for course status
CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'hidden', 'archived');

-- Create enum for module status
CREATE TYPE public.module_status AS ENUM ('draft', 'published', 'hidden');

-- Create enum for lesson status
CREATE TYPE public.lesson_status AS ENUM ('draft', 'published', 'hidden');

-- Create enum for lesson type
CREATE TYPE public.lesson_type AS ENUM ('video', 'text', 'audio', 'download', 'hybrid');

-- Create enum for release type
CREATE TYPE public.release_type AS ENUM ('immediate', 'manual', 'drip');

-- Create enum for access type
CREATE TYPE public.access_type AS ENUM ('lifetime', 'limited');

-- Create enum for material type
CREATE TYPE public.material_type AS ENUM ('pdf', 'spreadsheet', 'document', 'image', 'link', 'other');

-- =====================
-- FUNCTION: update_updated_at_column
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================
-- TABLE: user_roles
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================
-- FUNCTION: has_role (security definer to avoid RLS recursion)
-- =====================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: is any admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin_operacional')
  )
$$;

-- RLS for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- =====================
-- TABLE: courses
-- =====================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  full_description TEXT,
  cover_url TEXT,
  banner_url TEXT,
  trailer_url TEXT,
  category TEXT,
  instructor_name TEXT,
  status course_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT false,
  access_type access_type NOT NULL DEFAULT 'lifetime',
  access_days INTEGER,
  ticto_product_id TEXT,
  tags TEXT[] DEFAULT '{}',
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  has_certificate BOOLEAN NOT NULL DEFAULT false,
  is_free BOOLEAN NOT NULL DEFAULT false,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  seo_title TEXT,
  seo_description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can do everything on courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================
-- TABLE: course_modules
-- =====================
CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status module_status NOT NULL DEFAULT 'draft',
  release_type release_type NOT NULL DEFAULT 'immediate',
  release_days INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can do everything on modules"
  ON public.course_modules FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================
-- TABLE: lessons
-- =====================
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT,
  content_html TEXT,
  lesson_type lesson_type NOT NULL DEFAULT 'video',
  video_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  is_preview BOOLEAN NOT NULL DEFAULT false,
  is_required BOOLEAN NOT NULL DEFAULT false,
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  allow_download BOOLEAN NOT NULL DEFAULT false,
  status lesson_status NOT NULL DEFAULT 'draft',
  release_type release_type NOT NULL DEFAULT 'immediate',
  release_days INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  author TEXT,
  estimated_time TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, slug)
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can do everything on lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================
-- TABLE: lesson_materials
-- =====================
CREATE TABLE public.lesson_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  external_link TEXT,
  material_type material_type NOT NULL DEFAULT 'pdf',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on materials"
  ON public.lesson_materials FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================
-- STORAGE BUCKETS
-- =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('course-covers', 'course-covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-thumbnails', 'lesson-thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

-- Storage policies: public read, admin write
CREATE POLICY "Public can view course covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-covers');

CREATE POLICY "Admins can upload course covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-covers' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update course covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-covers' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete course covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-covers' AND public.is_admin(auth.uid()));

CREATE POLICY "Public can view lesson thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lesson-thumbnails');

CREATE POLICY "Admins can upload lesson thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lesson-thumbnails' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update lesson thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lesson-thumbnails' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete lesson thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'lesson-thumbnails' AND public.is_admin(auth.uid()));

CREATE POLICY "Public can view materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materials');

CREATE POLICY "Admins can upload materials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'materials' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update materials"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'materials' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete materials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'materials' AND public.is_admin(auth.uid()));

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_display_order ON public.courses(display_order);
CREATE INDEX idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX idx_course_modules_sort_order ON public.course_modules(sort_order);
CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX idx_lessons_sort_order ON public.lessons(sort_order);
CREATE INDEX idx_lesson_materials_lesson_id ON public.lesson_materials(lesson_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
