ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS home_image_desktop_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS home_image_tablet_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS home_image_mobile_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL;