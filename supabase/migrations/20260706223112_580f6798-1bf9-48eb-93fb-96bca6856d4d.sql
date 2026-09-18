
CREATE TABLE public.media_slots (
  slot_key TEXT PRIMARY KEY,
  work_id UUID REFERENCES public.works(id) ON DELETE SET NULL,
  alt_override TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.media_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_slots TO authenticated;
GRANT ALL ON public.media_slots TO service_role;

ALTER TABLE public.media_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_slots public read"
  ON public.media_slots FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "media_slots admin write"
  ON public.media_slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER media_slots_set_updated_at
  BEFORE UPDATE ON public.media_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.media_slots (slot_key, sort_order) VALUES
  ('sculpture-1', 0), ('sculpture-2', 1), ('sculpture-3', 2),
  ('painting-1', 3), ('painting-2', 4), ('painting-3', 5),
  ('photography-1', 6), ('photography-2', 7), ('photography-3', 8);
