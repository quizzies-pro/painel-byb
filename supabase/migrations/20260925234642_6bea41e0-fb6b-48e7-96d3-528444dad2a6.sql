ALTER TABLE public.courses
  ADD COLUMN cover_16_9_url text,
  ADD COLUMN cover_4_3_url text,
  ADD COLUMN cover_1_1_url text,
  ADD COLUMN cover_3_4_url text,
  ADD COLUMN cover_9_16_url text,
  ADD COLUMN hero_16_9_url text,
  ADD COLUMN hero_4_3_url text;

COMMENT ON COLUMN public.courses.cover_16_9_url IS 'Product cover artwork in 16:9 aspect ratio';
COMMENT ON COLUMN public.courses.cover_4_3_url IS 'Product cover artwork in 4:3 aspect ratio';
COMMENT ON COLUMN public.courses.cover_1_1_url IS 'Product cover artwork in 1:1 aspect ratio';
COMMENT ON COLUMN public.courses.cover_3_4_url IS 'Product cover artwork in 3:4 aspect ratio';
COMMENT ON COLUMN public.courses.cover_9_16_url IS 'Product cover artwork in 9:16 aspect ratio';
COMMENT ON COLUMN public.courses.hero_16_9_url IS 'Hero banner artwork in 16:9 aspect ratio';
COMMENT ON COLUMN public.courses.hero_4_3_url IS 'Hero banner artwork in 4:3 aspect ratio';