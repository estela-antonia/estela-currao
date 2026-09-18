ALTER TABLE public.biography
  ADD COLUMN IF NOT EXISTS body_fr text,
  ADD COLUMN IF NOT EXISTS body_es text;