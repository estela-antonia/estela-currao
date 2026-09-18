import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AdminSection, AdminCard } from "@/components/admin/AdminSection";

export const Route = createFileRoute("/_authenticated/admin/media-seo")({
  head: () => ({ meta: [{ title: "SEO Media — Panel" }, { name: "robots", content: "noindex" }] }),
  component: MediaSeoAdminPage,
});

type MediaType = "sculpture" | "painting" | "photography";

const TYPES: MediaType[] = ["sculpture", "painting", "photography"];
const LABELS: Record<MediaType, string> = {
  sculpture: "Sculpture",
  painting: "Painting",
  photography: "Photography",
};

const DEFAULTS: Record<MediaType, Record<string, string>> = {
  sculpture: {
    h1_fr: "Sculpture contemporaine",
    h1_es: "Escultura contemporánea",
    keyword: "sculpture contemporaine",
    seo_title: "Sculpture contemporaine — Estela Currao | Escultura contemporánea",
    seo_description: "Sculpture contemporaine d'Estela Currao — escultura contemporánea de la artista visual y arquitecta. Series en bronce, obra figurativa y abstracta. Sculpture contemporaine, sculpture abstraite, escultura orgánica.",
    intro_fr: "Sculpture contemporaine d'Estela Currao — artiste visuelle et architecte. Une pratique tournée vers la matière, le corps et le vide : sculpture figurative en bronze, sculpture abstraite et sculpture organique. Chaque série interroge l'identité et le rythme des formes.",
    intro_es: "Escultura contemporánea de Estela Currao — artista visual y arquitecta. Una práctica atenta a la materia, al cuerpo y al vacío: escultura figurativa en bronce, escultura abstracta y escultura orgánica. Cada serie interroga la identidad y el ritmo de las formas.",
  },
  painting: {
    h1_fr: "Peinture contemporaine",
    h1_es: "Pintura contemporánea",
    keyword: "peinture contemporaine",
    seo_title: "Peinture contemporaine — Estela Currao | Pintura contemporánea abstracta",
    seo_description: "Peinture contemporaine d'Estela Currao — pintura contemporánea abstracta y matérica. Obra pictórica de la artista visual y arquitecta: geste, rythme, matière. Peinture abstraite, pintura gestual.",
    intro_fr: "Peinture contemporaine d'Estela Currao — artiste visuelle et architecte. Une peinture abstraite qui explore la matière, le geste et le rythme, entre matrices rythmiques et zones d'influence. Peinture contemporaine française et internationale, gestuelle et matiériste.",
    intro_es: "Pintura contemporánea de Estela Currao — artista visual y arquitecta. Una pintura abstracta que explora la materia, el gesto y el ritmo, entre matrices rítmicas y zonas de influencia. Pintura contemporánea gestual y matérica, en diálogo con la arquitectura.",
  },
  photography: {
    h1_fr: "Photographie artistique",
    h1_es: "Fotografía artística",
    keyword: "photographie artistique",
    seo_title: "Photographie artistique — Estela Currao | Fotografía artística contemporánea",
    seo_description: "Photographie artistique d'Estela Currao — fotografía artística contemporánea entre arquitectura, umbral y heterotopía. Obra fotográfica de la artista visual y arquitecta: photographie urbaine, architecturale et conceptuelle.",
    intro_fr: "Photographie artistique d'Estela Currao — artiste visuelle et architecte. Une photographie contemporaine qui interroge l'architecture, le seuil et l'hétérotopie. Photographie urbaine, photographie architecturale et instants suspendus.",
    intro_es: "Fotografía artística de Estela Currao — artista visual y arquitecta. Una fotografía contemporánea que interroga la arquitectura, el umbral y la heterotopía. Fotografía urbana, arquitectónica e instantes suspendidos.",
  },
};

type Row = {
  id?: string;
  type: MediaType;
  h1_fr: string;
  h1_es: string;
  keyword: string;
  seo_title: string;
  seo_description: string;
  intro_fr: string;
  intro_es: string;
  status: "draft" | "published";
};

function MediaSeoAdminPage() {
  const [rows, setRows] = useState<Record<MediaType, Row> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<MediaType | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("media_seo")
        .select("id, type, h1_fr, h1_es, keyword, seo_title, seo_description, intro_fr, intro_es, status")
        .order("sort_order");
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const map: Record<MediaType, Row> = { ...DEFAULTS } as unknown as Record<MediaType, Row>;
      for (const r of (data ?? []) as Row[]) {
        map[r.type] = { ...DEFAULTS[r.type], ...r };
      }
      // Ensure every type exists with defaults
      for (const t of TYPES) {
        if (!map[t]) map[t] = { ...DEFAULTS[t], type: t, status: "published" } as Row;
      }
      setRows(map);
      setLoading(false);
    })();
  }, []);

  async function save(type: MediaType) {
    if (!rows) return;
    const row = rows[type];
    setSaving(type);
    const payload = {
      type,
      h1_fr: row.h1_fr,
      h1_es: row.h1_es,
      keyword: row.keyword,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      intro_fr: row.intro_fr,
      intro_es: row.intro_es,
      status: row.status,
      sort_order: TYPES.indexOf(type) + 1,
    };
    const { error } = row.id
      ? await supabase.from("media_seo").update(payload).eq("id", row.id)
      : await supabase.from("media_seo").insert(payload).select("id").single();
    setSaving(null);
    if (error) toast.error(error.message);
    else toast.success(`${LABELS[type]} guardado`);
  }

  function update(type: MediaType, patch: Partial<Row>) {
    setRows((r) => (r ? { ...r, [type]: { ...r[type], ...patch } } : r));
  }

  if (loading || !rows) {
    return (
      <AdminSection title="SEO Media" description="Textos SEO de las páginas de disciplina.">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </AdminSection>
    );
  }

  return (
    <AdminSection
      title="SEO Media"
      description="Editá los textos SEO de las páginas /media/sculpture, /media/painting y /media/photography. Estos textos son los que aparecen como H1, meta description y párrafos introductorios en cada disciplina."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {TYPES.map((type) => {
          const row = rows[type];
          return (
            <AdminCard key={type} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-[0.24em] text-neutral-900">
                  {LABELS[type]}
                </h2>
                <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  /media/{type}
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">H1 — Francés</Label>
                <Input
                  value={row.h1_fr}
                  onChange={(e) => update(type, { h1_fr: e.target.value })}
                  placeholder="Sculpture contemporaine"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">H1 — Español</Label>
                <Input
                  value={row.h1_es}
                  onChange={(e) => update(type, { h1_es: e.target.value })}
                  placeholder="Escultura contemporánea"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Palabra clave principal</Label>
                <Input
                  value={row.keyword}
                  onChange={(e) => update(type, { keyword: e.target.value })}
                  placeholder="sculpture contemporaine"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Título SEO</Label>
                <Input
                  value={row.seo_title}
                  onChange={(e) => update(type, { seo_title: e.target.value })}
                  placeholder="Sculpture contemporaine — Estela Currao"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Meta descripción</Label>
                <Textarea
                  rows={3}
                  value={row.seo_description}
                  onChange={(e) => update(type, { seo_description: e.target.value })}
                  placeholder="Descripción para Google…"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Introducción — Francés</Label>
                <Textarea
                  rows={5}
                  value={row.intro_fr}
                  onChange={(e) => update(type, { intro_fr: e.target.value })}
                  placeholder="Párrafo introductorio en francés…"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Introducción — Español</Label>
                <Textarea
                  rows={5}
                  value={row.intro_es}
                  onChange={(e) => update(type, { intro_es: e.target.value })}
                  placeholder="Párrafo introductorio en español…"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Estado</Label>
                <Select
                  value={row.status}
                  onValueChange={(v) => update(type, { status: v as "draft" | "published" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => void save(type)}
                  disabled={saving === type}
                  className="w-full"
                >
                  {saving === type ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </AdminCard>
          );
        })}
      </div>
    </AdminSection>
  );
}
