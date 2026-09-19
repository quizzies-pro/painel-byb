CREATE TABLE public.storefront_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_categories TO authenticated;
GRANT ALL ON public.storefront_categories TO service_role;

ALTER TABLE public.storefront_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active storefront categories"
ON public.storefront_categories
FOR SELECT
TO authenticated
USING (is_active OR private.is_admin(auth.uid()));

CREATE POLICY "Admins can manage storefront categories"
ON public.storefront_categories
FOR ALL
TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE TRIGGER update_storefront_categories_updated_at
BEFORE UPDATE ON public.storefront_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.storefront_category_courses (
  category_id uuid NOT NULL REFERENCES public.storefront_categories(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (category_id, course_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_category_courses TO authenticated;
GRANT ALL ON public.storefront_category_courses TO service_role;

ALTER TABLE public.storefront_category_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view links from active storefront categories"
ON public.storefront_category_courses
FOR SELECT
TO authenticated
USING (
  private.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.storefront_categories category
    WHERE category.id = category_id
      AND category.is_active = true
  )
);

CREATE POLICY "Admins can manage storefront category products"
ON public.storefront_category_courses
FOR ALL
TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE INDEX storefront_categories_order_idx
ON public.storefront_categories (display_order, name);

CREATE INDEX storefront_category_courses_course_idx
ON public.storefront_category_courses (course_id);

CREATE INDEX storefront_category_courses_order_idx
ON public.storefront_category_courses (category_id, display_order);