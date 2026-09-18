
ALTER TABLE public.subcategories ADD COLUMN IF NOT EXISTS layout_type TEXT;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS layout_type TEXT;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS cita TEXT;
