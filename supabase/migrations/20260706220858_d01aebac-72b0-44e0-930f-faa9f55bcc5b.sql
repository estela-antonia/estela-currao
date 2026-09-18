
DO $$ BEGIN
  CREATE TYPE public.media_type AS ENUM ('sculpture', 'painting', 'photography');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS media_type public.media_type;

UPDATE public.works
  SET media_type = layout_type::public.media_type
  WHERE media_type IS NULL
    AND layout_type IN ('sculpture', 'painting', 'photography');

CREATE INDEX IF NOT EXISTS idx_works_media_type ON public.works (media_type);
