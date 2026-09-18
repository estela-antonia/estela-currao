import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminSection, AdminCard } from "@/components/admin/AdminSection";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { DOCS_BUCKET } from "@/lib/admin/media";

export const Route = createFileRoute("/_authenticated/admin/biography")({
  head: () => ({ meta: [{ title: "Biografía — Panel" }, { name: "robots", content: "noindex" }] }),
  component: BiographyPage,
});

type Doc = { title: string; media_id: string };
type Bio = {
  id: string;
  body: string | null;
  body_fr: string | null;
  body_es: string | null;
  portrait_media_id: string | null;
  documents: Doc[];
};

function BiographyPage() {
  const [bio, setBio] = useState<Bio | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("biography").select("*").eq("singleton", true).maybeSingle();
      if (error) toast.error(error.message);
      if (!data) {
        const { data: inserted, error: insErr } = await supabase.from("biography").insert({ singleton: true, body: "", documents: [] }).select().single();
        if (insErr) toast.error(insErr.message);
        else setBio({ id: inserted.id, body: inserted.body, body_fr: inserted.body_fr, body_es: inserted.body_es, portrait_media_id: inserted.portrait_media_id, documents: (inserted.documents as Doc[]) ?? [] });
      } else {
        setBio({ id: data.id, body: data.body, body_fr: data.body_fr, body_es: data.body_es, portrait_media_id: data.portrait_media_id, documents: (data.documents as Doc[]) ?? [] });
      }
    })();
  }, []);

  async function save() {
    if (!bio) return;
    setSaving(true);
    const { error } = await supabase.from("biography").update({
      body: bio.body,
      body_fr: bio.body_fr,
      body_es: bio.body_es,
      portrait_media_id: bio.portrait_media_id,
      documents: bio.documents,
    }).eq("id", bio.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("About guardado");
  }

  function addDoc() {
    if (!bio) return;
    setBio({ ...bio, documents: [...bio.documents, { title: "Documento", media_id: "" }] });
  }
  function updateDoc(i: number, patch: Partial<Doc>) {
    if (!bio) return;
    const docs = bio.documents.slice();
    docs[i] = { ...docs[i], ...patch };
    setBio({ ...bio, documents: docs });
  }
  function removeDoc(i: number) {
    if (!bio) return;
    setBio({ ...bio, documents: bio.documents.filter((_, idx) => idx !== i) });
  }
  function moveDoc(i: number, dir: -1 | 1) {
    if (!bio) return;
    const docs = bio.documents.slice();
    const j = i + dir;
    if (j < 0 || j >= docs.length) return;
    const tmp = docs[i]; docs[i] = docs[j]; docs[j] = tmp;
    setBio({ ...bio, documents: docs });
  }

  if (!bio) return <p className="text-sm text-neutral-400">Cargando…</p>;

  return (
    <AdminSection
      title="About"
      description="Texto breve de presentación de tu práctica artística (3–5 líneas). Se muestra arriba en la página Profile."
      actions={<Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>}
    >
      <AdminCard>
        <div className="space-y-2">
          <Label>Retrato</Label>
          <MediaPicker value={bio.portrait_media_id} onChange={(id) => setBio({ ...bio, portrait_media_id: id })} />
        </div>
      </AdminCard>
      <AdminCard>
        <div className="space-y-2">
          <Label>Texto About — EN</Label>
          <Textarea rows={6} value={bio.body ?? ""} onChange={(e) => setBio({ ...bio, body: e.target.value })} />
          <p className="text-xs text-neutral-400">Breve presentación (3–5 líneas). Usa saltos de línea para separar párrafos.</p>
        </div>
      </AdminCard>
      <AdminCard>
        <div className="space-y-2">
          <Label>Texto About — FR</Label>
          <Textarea rows={6} value={bio.body_fr ?? ""} onChange={(e) => setBio({ ...bio, body_fr: e.target.value })} />
        </div>
      </AdminCard>
      <AdminCard>
        <div className="space-y-2">
          <Label>Texto About — ES</Label>
          <Textarea rows={6} value={bio.body_es ?? ""} onChange={(e) => setBio({ ...bio, body_es: e.target.value })} />
        </div>
      </AdminCard>
      <AdminCard>
        <div className="mb-4 flex items-center justify-between">
          <Label>Documentos asociados (PDF)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDoc}>Añadir documento</Button>
        </div>
        {bio.documents.length === 0 ? (
          <p className="text-xs text-neutral-400">Sin documentos.</p>
        ) : (
          <div className="space-y-3">
            {bio.documents.map((d, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-3 rounded border border-neutral-200 p-3">
                <Input placeholder="Título" value={d.title} onChange={(e) => updateDoc(i, { title: e.target.value })} />
                <MediaPicker value={d.media_id || null} onChange={(id) => updateDoc(i, { media_id: id ?? "" })} bucket={DOCS_BUCKET} accept="application/pdf" />
                <div className="flex items-center gap-1">
                  <button onClick={() => moveDoc(i, -1)} className="rounded border px-2 text-xs">↑</button>
                  <button onClick={() => moveDoc(i, 1)} className="rounded border px-2 text-xs">↓</button>
                  <button onClick={() => removeDoc(i)} className="ml-2 text-xs text-red-600 hover:underline">Quitar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminSection>
  );
}