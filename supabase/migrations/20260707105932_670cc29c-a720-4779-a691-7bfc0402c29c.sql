CREATE TABLE public.media_seo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL UNIQUE,
  h1_fr TEXT,
  h1_es TEXT,
  keyword TEXT,
  seo_title TEXT,
  seo_description TEXT,
  intro_fr TEXT,
  intro_es TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.media_seo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_seo TO authenticated;
GRANT ALL ON public.media_seo TO service_role;

ALTER TABLE public.media_seo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published media SEO"
ON public.media_seo
FOR SELECT
TO anon, authenticated
USING (status = 'published');

CREATE POLICY "Admins can manage media SEO"
ON public.media_seo
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_media_seo_updated_at
BEFORE UPDATE ON public.media_seo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.media_seo (type, h1_fr, h1_es, keyword, seo_title, seo_description, intro_fr, intro_es, sort_order, status)
VALUES
('sculpture', 'Sculpture contemporaine', 'Escultura contemporánea', 'sculpture contemporaine', 'Sculpture contemporaine — Estela Currao | Escultura contemporánea', 'Sculpture contemporaine d''Estela Currao — escultura contemporánea de la artista visual y arquitecta. Series en bronce, obra figurativa y abstracta. Sculpture contemporaine, sculpture abstraite, escultura orgánica.', 'Sculpture contemporaine d''Estela Currao — artiste visuelle et architecte. Une pratique tournée vers la matière, le corps et le vide : sculpture figurative en bronze, sculpture abstraite et sculpture organique. Chaque série interroge l''identité et le rythme des formes.', 'Escultura contemporánea de Estela Currao — artista visual y arquitecta. Una práctica atenta a la materia, al cuerpo y al vacío: escultura figurativa en bronce, escultura abstracta y escultura orgánica. Cada serie interroga la identidad y el ritmo de las formas.', 1, 'published'),
('painting', 'Peinture contemporaine', 'Pintura contemporánea', 'peinture contemporaine', 'Peinture contemporaine — Estela Currao | Pintura contemporánea abstracta', 'Peinture contemporaine d''Estela Currao — pintura contemporánea abstracta y matérica. Obra pictórica de la artista visual y arquitecta: geste, rythme, matière. Peinture abstraite, pintura gestual.', 'Peinture contemporaine d''Estela Currao — artiste visuelle et architecte. Une peinture abstraite qui explore la matière, le geste et le rythme, entre matrices rythmiques et zones d''influence. Peinture contemporaine française et internationale, gestuelle et matiériste.', 'Pintura contemporánea de Estela Currao — artista visual y arquitecta. Una pintura abstracta que explora la materia, el gesto y el ritmo, entre matrices rítmicas y zonas de influencia. Pintura contemporánea gestual y matérica, en diálogo con la arquitectura.', 2, 'published'),
('photography', 'Photographie artistique', 'Fotografía artística', 'photographie artistique', 'Photographie artistique — Estela Currao | Fotografía artística contemporánea', 'Photographie artistique d''Estela Currao — fotografía artística contemporánea entre arquitectura, umbral y heterotopía. Obra fotográfica de la artista visual y arquitecta: photographie urbaine, architecturale et conceptuelle.', 'Photographie artistique d''Estela Currao — artiste visuelle et architecte. Une photographie contemporaine qui interroge l''architecture, le seuil et l''hétérotopie. Photographie urbaine, photographie architecturale et instants suspendus.', 'Fotografía artística de Estela Currao — artista visual y arquitecta. Una fotografía contemporánea que interroga la arquitectura, el umbral y la heterotopía. Fotografía urbana, arquitectónica e instantes suspendidos.', 3, 'published')
ON CONFLICT (type) DO NOTHING;