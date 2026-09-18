ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_photo_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_instagram_color text,
  ADD COLUMN IF NOT EXISTS contact_instagram_bw text,
  ADD COLUMN IF NOT EXISTS contact_intro jsonb NOT NULL DEFAULT '{"en":"","fr":"","es":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_links jsonb NOT NULL DEFAULT '[]'::jsonb;