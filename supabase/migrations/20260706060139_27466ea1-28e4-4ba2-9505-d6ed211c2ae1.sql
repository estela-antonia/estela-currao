
-- =========================================================
-- Fase 2A — Esquema del CMS completo
-- =========================================================

-- Trigger genérico updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Enum de estado publicado / borrador
DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- MEDIA (biblioteca central de archivos)
-- =========================================================
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_bucket text NOT NULL DEFAULT 'site-media',
  storage_path text NOT NULL,
  public_url text,
  mime_type text,
  width int,
  height int,
  size_bytes bigint,
  original_filename text,
  alt_text text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media public read" ON public.media FOR SELECT USING (true);
CREATE POLICY "media admin write" ON public.media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_media_updated BEFORE UPDATE ON public.media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- CATEGORIES
-- =========================================================
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  cover_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read active" ON public.categories FOR SELECT
  USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_categories_sort ON public.categories(sort_order);

-- =========================================================
-- SUBCATEGORIES
-- =========================================================
CREATE TABLE public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  cover_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
GRANT SELECT ON public.subcategories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO authenticated;
GRANT ALL ON public.subcategories TO service_role;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategories public read active" ON public.subcategories FOR SELECT
  USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "subcategories admin write" ON public.subcategories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_subcategories_updated BEFORE UPDATE ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_subcategories_cat_sort ON public.subcategories(category_id, sort_order);

-- =========================================================
-- WORKS
-- =========================================================
CREATE TABLE public.works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  year text,
  technique text,
  dimensions text,
  extra_text text,
  featured_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, subcategory_id, slug)
);
GRANT SELECT ON public.works TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.works TO authenticated;
GRANT ALL ON public.works TO service_role;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "works public read published" ON public.works FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "works admin write" ON public.works FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_works_updated BEFORE UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_works_cat_sub_sort ON public.works(category_id, subcategory_id, sort_order);

-- =========================================================
-- WORK IMAGES
-- =========================================================
CREATE TABLE public.work_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.work_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_images TO authenticated;
GRANT ALL ON public.work_images TO service_role;
ALTER TABLE public.work_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_images public read" ON public.work_images FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.works w WHERE w.id = work_id AND w.status='published')
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "work_images admin write" ON public.work_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_work_images_updated BEFORE UPDATE ON public.work_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_work_images_work_sort ON public.work_images(work_id, sort_order);

-- =========================================================
-- PUBLICATIONS
-- =========================================================
CREATE TABLE public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  pdf_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  published_at date,
  sort_order int NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.publications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publications TO authenticated;
GRANT ALL ON public.publications TO service_role;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "publications public read published" ON public.publications FOR SELECT
  USING (status='published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "publications admin write" ON public.publications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_publications_updated BEFORE UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- NEWS
-- =========================================================
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  content text,
  cover_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  published_at date,
  status public.content_status NOT NULL DEFAULT 'draft',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news public read published" ON public.news FOR SELECT
  USING (status='published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "news admin write" ON public.news FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.news_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_images TO authenticated;
GRANT ALL ON public.news_images TO service_role;
ALTER TABLE public.news_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_images public read" ON public.news_images FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.news n WHERE n.id=news_id AND n.status='published')
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "news_images admin write" ON public.news_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_news_images_updated BEFORE UPDATE ON public.news_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_news_images_news_sort ON public.news_images(news_id, sort_order);

-- =========================================================
-- BIOGRAPHY (singleton)
-- =========================================================
CREATE TABLE public.biography (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  body text,
  portrait_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (singleton = true)
);
GRANT SELECT ON public.biography TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.biography TO authenticated;
GRANT ALL ON public.biography TO service_role;
ALTER TABLE public.biography ENABLE ROW LEVEL SECURITY;
CREATE POLICY "biography public read" ON public.biography FOR SELECT USING (true);
CREATE POLICY "biography admin write" ON public.biography FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_biography_updated BEFORE UPDATE ON public.biography
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.biography (singleton, body) VALUES (true, '');

-- =========================================================
-- SITE SETTINGS (singleton)
-- =========================================================
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  site_name text NOT NULL DEFAULT '',
  logo_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  favicon_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  contact_email text,
  contact_phone text,
  contact_address text,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_title text,
  seo_description text,
  seo_og_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  footer_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (singleton = true)
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings admin write" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.site_settings (singleton, site_name) VALUES (true, '');

-- =========================================================
-- Storage RLS: policies para site-media y site-docs
-- =========================================================
CREATE POLICY "site media public read"
ON storage.objects FOR SELECT
USING (bucket_id IN ('site-media','site-docs'));

CREATE POLICY "site media admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('site-media','site-docs') AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "site media admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('site-media','site-docs') AND public.has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id IN ('site-media','site-docs') AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "site media admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('site-media','site-docs') AND public.has_role(auth.uid(),'admin'));
