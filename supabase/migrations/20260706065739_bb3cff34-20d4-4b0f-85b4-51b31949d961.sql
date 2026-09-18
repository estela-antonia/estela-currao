
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS year TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS publications_slug_key ON public.publications (slug) WHERE slug IS NOT NULL;
