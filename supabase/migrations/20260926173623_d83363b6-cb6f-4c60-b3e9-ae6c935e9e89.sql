ALTER TABLE public.pack_collections
ADD COLUMN cover_ratio public.pack_item_cover_ratio NOT NULL DEFAULT '16:9';

COMMENT ON COLUMN public.pack_collections.cover_ratio IS 'Aspect ratio selected for the collection cover and consumed by Hub and Members presentations.';