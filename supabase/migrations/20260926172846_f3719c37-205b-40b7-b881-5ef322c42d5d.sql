CREATE TYPE public.pack_item_cover_ratio AS ENUM ('1:1', '16:9', '4:3', '3:4', '9:16');

ALTER TABLE public.pack_items
ADD COLUMN cover_ratio public.pack_item_cover_ratio NOT NULL DEFAULT '16:9';

COMMENT ON COLUMN public.pack_items.cover_ratio IS 'Aspect ratio selected for the pack item cover and consumed by Hub and Members presentations.';