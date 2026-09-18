-- 1. Move SECURITY DEFINER logic out of the exposed public API schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- public.has_role becomes a thin SECURITY INVOKER wrapper (kept for existing policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.has_role(_user_id, _role)
$$;

CREATE OR REPLACE FUNCTION private.bootstrap_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _email TEXT;
BEGIN
  IF _uid IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _uid;

  IF _email = 'ecurrao@yahoo.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION private.bootstrap_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.bootstrap_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.bootstrap_admin()
$$;

REVOKE ALL ON FUNCTION public.bootstrap_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated, service_role;

-- 2. Restrict media reads to files belonging to published/public content
DROP POLICY IF EXISTS "media public read" ON public.media;

CREATE POLICY "media public read published only"
ON public.media
FOR SELECT
TO anon, authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.works w WHERE w.featured_media_id = media.id AND w.status = 'published')
  OR EXISTS (
    SELECT 1 FROM public.work_images wi
    JOIN public.works w ON w.id = wi.work_id
    WHERE wi.media_id = media.id AND w.status = 'published'
  )
  OR EXISTS (SELECT 1 FROM public.news n WHERE n.cover_media_id = media.id AND n.status = 'published')
  OR EXISTS (
    SELECT 1 FROM public.news_images ni
    JOIN public.news n ON n.id = ni.news_id
    WHERE ni.media_id = media.id AND n.status = 'published'
  )
  OR EXISTS (
    SELECT 1 FROM public.publications p
    WHERE (p.cover_media_id = media.id OR p.pdf_media_id = media.id) AND p.status = 'published'
  )
  OR EXISTS (SELECT 1 FROM public.categories c WHERE c.cover_media_id = media.id AND c.is_active)
  OR EXISTS (SELECT 1 FROM public.subcategories s WHERE s.cover_media_id = media.id AND s.is_active)
  OR EXISTS (
    SELECT 1 FROM public.biography b
    WHERE b.portrait_media_id = media.id OR b.documents::text LIKE '%' || media.id::text || '%'
  )
  OR EXISTS (
    SELECT 1 FROM public.site_settings ss
    WHERE media.id IN (
      ss.logo_media_id, ss.favicon_media_id, ss.seo_og_media_id, ss.press_dossier_media_id,
      ss.home_image_desktop_media_id, ss.home_image_tablet_media_id, ss.home_image_mobile_media_id,
      ss.contact_photo_media_id
    )
  )
);

-- 3. Storage: only objects whose media row is publicly visible
DROP POLICY IF EXISTS "site media public read" ON storage.objects;

CREATE POLICY "site media public read published only"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = ANY (ARRAY['site-media'::text, 'site-docs'::text])
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.media m
      WHERE m.storage_bucket = storage.objects.bucket_id
        AND m.storage_path = storage.objects.name
    )
  )
);

-- 4. media_slots: hide draft work ids from the public
DROP POLICY IF EXISTS "media_slots public read" ON public.media_slots;

CREATE POLICY "media_slots public read published only"
ON public.media_slots
FOR SELECT
TO anon, authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR work_id IS NULL
  OR EXISTS (SELECT 1 FROM public.works w WHERE w.id = media_slots.work_id AND w.status = 'published')
);

-- 5. media_seo: writes restricted to admins
DROP POLICY IF EXISTS "Admins can manage media SEO" ON public.media_seo;

CREATE POLICY "media_seo admin write"
ON public.media_seo
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));