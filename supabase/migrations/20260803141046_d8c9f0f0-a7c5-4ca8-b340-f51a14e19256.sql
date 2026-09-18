GRANT SELECT ON public.biography TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.biography TO authenticated;
GRANT ALL ON public.biography TO service_role;