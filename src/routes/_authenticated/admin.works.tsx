import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AdminSection } from "@/components/admin/AdminSection";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { MediaThumb } from "@/components/admin/MediaThumb";

export const Route = createFileRoute("/_authenticated/admin/works")({
  head: () => ({ meta: [{ title: "Obras — Panel" }, { name: "robots", content: "noindex" }] }),
  component: WorksPage,
});

function SeoTag({ hint }: { hint: string }) {
  return (
    <span
      title={hint}
      className="ml-1 inline-flex items-center rounded-sm border border-neutral-300 bg-neutral-100 px-1 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-neutral-500"
    >
      SEO
    </span>
  );
}


type Work = {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  year: string | null;
  technique: string | null;
  dimensions: string | null;
  format: string | null;
  cita: string | null;
  extra_text: string | null;
  featured_media_id: string | null;
  status: "draft" | "published";
  sort_order: number;
  media_type: "sculpture" | "painting" | "photography" | null;
};
type Cat = { id: string; title: string };
type Sub = { id: string; title: string; category_id: string };
type WorkImage = {
  id: string;
  work_id: string;
  media_id: string;
  sort_order: number;
  is_featured: boolean;
  caption: string | null;
  media?: {
    storage_bucket: string;
    storage_path: string;
    mime_type: string | null;
    original_filename: string | null;
  } | null;
};
type MediaLite = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  original_filename: string | null;
};

function WorksPage() {
  const [rows, setRows] = useState<Work[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [mediaById, setMediaById] = useState<Record<string, MediaLite>>({});
  const [filterCat, setFilterCat] = useState("all");
  const [filterSub, setFilterSub] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"table" | "grouped">("table");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Work | null>(null);
  const [images, setImages] = useState<WorkImage[]>([]);
  const [open, setOpen] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        dialogContentRef.current?.scrollTo({ top: 0 });
      });
    }
  }, [open, editing?.id]);

  async function reload() {
    setLoading(true);
    const [w, c, s, m] = await Promise.all([
      supabase.from("works").select("*").order("sort_order"),
      supabase.from("categories").select("id,title").order("sort_order"),
      supabase.from("subcategories").select("id,title,category_id").order("sort_order"),
      supabase
        .from("media")
        .select("id,storage_bucket,storage_path,mime_type,original_filename"),
    ]);
    if (w.error) toast.error(w.error.message);
    setRows((w.data as Work[]) ?? []);
    setCats((c.data as Cat[]) ?? []);
    setSubs((s.data as Sub[]) ?? []);
    setMediaById(
      Object.fromEntries(((m.data as MediaLite[]) ?? []).map((row) => [row.id, row])),
    );
    setLoading(false);
  }
  useEffect(() => { void reload(); }, []);

  async function loadImages(workId: string) {
    const { data } = await supabase
      .from("work_images")
      .select("*, media:media_id(storage_bucket,storage_path,mime_type,original_filename)")
      .eq("work_id", workId)
      .order("sort_order");
    setImages((data as WorkImage[]) ?? []);
  }

  function openNew() {
    setEditing({
      id: "", category_id: cats[0]?.id ?? "", subcategory_id: null,
      slug: "", title: "", description: "", year: "", technique: "", dimensions: "",
      format: "", cita: "", extra_text: "", featured_media_id: null, status: "draft", sort_order: rows.length,
      media_type: null,
    });
    setImages([]);
    setOpen(true);
  }
  async function openEdit(row: Work) {
    setEditing({ ...row });
    await loadImages(row.id);
    setOpen(true);
  }
  async function remove(row: Work) {
    if (!confirm(`¿Eliminar obra "${row.title}"?`)) return;
    const { error } = await supabase.from("works").delete().eq("id", row.id);
    if (error) toast.error(error.message); else { toast.success("Eliminada"); reload(); }
  }
  async function toggleStatus(row: Work) {
    const next = row.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("works").update({ status: next }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(next === "published" ? `"${row.title}" publicada` : `"${row.title}" guardada como borrador`);
    reload();
  }
  async function move(row: Work, dir: -1 | 1) {
    const sorted = [...rows].sort((a,b) => a.sort_order - b.sort_order);
    const i = sorted.findIndex((r) => r.id === row.id);
    const s = sorted[i + dir];
    if (!s) return;
    await Promise.all([
      supabase.from("works").update({ sort_order: s.sort_order }).eq("id", row.id),
      supabase.from("works").update({ sort_order: row.sort_order }).eq("id", s.id),
    ]);
    reload();
  }

  async function save() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim() || !editing.category_id) {
      toast.error("Categoría, título y slug obligatorios"); return;
    }
    const payload = {
      category_id: editing.category_id,
      subcategory_id: editing.subcategory_id || null,
      slug: editing.slug, title: editing.title,
      description: editing.description, year: editing.year,
      technique: editing.technique, dimensions: editing.dimensions,
      format: editing.format, cita: editing.cita,
      extra_text: editing.extra_text, featured_media_id: editing.featured_media_id,
      status: editing.status, sort_order: editing.sort_order,
      media_type: editing.media_type,
    };
    let id = editing.id;
    if (id) {
      const { error } = await supabase.from("works").update(payload).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("works").insert(payload).select().single();
      if (error) return toast.error(error.message);
      id = data.id;
      setEditing({ ...editing, id });
    }
    const wasNew = !editing.id;
    toast.success(wasNew ? `Obra "${editing.title}" creada` : `Obra "${editing.title}" guardada`);
    if (editing.status === "published" && !editing.featured_media_id) {
      toast.warning("Publicada sin imagen destacada — no se mostrará en la web hasta agregar una imagen.");
    }
    reload();
    setOpen(false);
  }

  async function addImage(mediaId: string | null) {
    if (!mediaId || !editing?.id) return;
    const { error } = await supabase.from("work_images").insert({
      work_id: editing.id, media_id: mediaId, sort_order: images.length,
    });
    if (error) toast.error(error.message);
    else loadImages(editing.id);
  }
  async function removeImage(img: WorkImage) {
    await supabase.from("work_images").delete().eq("id", img.id);
    if (editing?.id) loadImages(editing.id);
  }
  async function moveImage(img: WorkImage, dir: -1 | 1) {
    const sorted = [...images].sort((a,b)=>a.sort_order-b.sort_order);
    const i = sorted.findIndex((x)=>x.id===img.id);
    const s = sorted[i+dir];
    if (!s) return;
    await Promise.all([
      supabase.from("work_images").update({ sort_order: s.sort_order }).eq("id", img.id),
      supabase.from("work_images").update({ sort_order: img.sort_order }).eq("id", s.id),
    ]);
    if (editing?.id) loadImages(editing.id);
  }

  const filtered = rows
    .filter((r) => filterCat === "all" || r.category_id === filterCat)
    .filter((r) => filterSub === "all" || r.subcategory_id === filterSub)
    .filter((r) => filterStatus === "all" || r.status === filterStatus)
    .filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  const catName = (id: string) => cats.find((c) => c.id === id)?.title ?? "—";
  const workThumb = (row: Work) => {
    const media = row.featured_media_id ? mediaById[row.featured_media_id] : null;
    return media ?? null;
  };
  const subName = (id: string | null) => (id ? subs.find((s) => s.id === id)?.title ?? "—" : "—");
  const availableSubs = editing ? subs.filter((s) => s.category_id === editing.category_id) : [];
  const filterSubs = filterCat === "all" ? subs : subs.filter((s) => s.category_id === filterCat);

  return (
    <AdminSection
      title="Obras"
      description="Piezas individuales. Cada obra pertenece a una categoría y opcionalmente a una subcategoría."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} disabled={cats.length === 0}>Nueva obra</Button>
          </DialogTrigger>
          <DialogContent ref={dialogContentRef} className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 z-10 -mx-6 -mt-6 border-b border-neutral-200 bg-white px-6 py-4">
              <DialogTitle>{editing?.id ? "Editar obra" : "Nueva obra"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4 pt-4">
                {/* 1. Categoría (obligatorio) */}
                <div className="space-y-2">
                  <Label>Categoría <span className="text-red-500">*</span></Label>
                  <Select value={editing.category_id} onValueChange={(v) => setEditing({ ...editing, category_id: v, subcategory_id: null })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* 2. Subcategoría / Serie */}
                <div className="space-y-2">
                  <Label>Subcategoría / Serie</Label>
                  <Select value={editing.subcategory_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, subcategory_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna</SelectItem>
                      {availableSubs.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Título */}
                <div className="space-y-2"><Label>Título <SeoTag hint="Se usa en el título de la página, og:title y datos estructurados." /></Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>

                {/* 4. Año */}
                <div className="space-y-2"><Label>Año <SeoTag hint="Se usa como dateCreated en los datos estructurados." /></Label><Input value={editing.year ?? ""} onChange={(e) => setEditing({ ...editing, year: e.target.value })} /></div>

                {/* 5. Técnica */}
                <div className="space-y-2"><Label>Técnica <SeoTag hint="Se usa como artMedium en los datos estructurados." /></Label><Input value={editing.technique ?? ""} onChange={(e) => setEditing({ ...editing, technique: e.target.value })} /></div>

                {/* 6. Formato / Dimensiones */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Formato <SeoTag hint="Se usa como artworkSurface en los datos estructurados." /></Label><Input placeholder="Formato descriptivo (opcional)" value={editing.format ?? ""} onChange={(e) => setEditing({ ...editing, format: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Dimensiones <SeoTag hint="Aparece en la ficha técnica y en los datos estructurados." /></Label><Input value={editing.dimensions ?? ""} onChange={(e) => setEditing({ ...editing, dimensions: e.target.value })} /></div>
                </div>

                {/* 7. Media (para página MEDIA) */}
                <div className="space-y-2">
                  <Label>Media (para la página MEDIA) <SeoTag hint="Define el artform (sculpture / painting / photography) en los datos estructurados." /></Label>
                  <Select value={editing.media_type ?? "none"} onValueChange={(v) => setEditing({ ...editing, media_type: v === "none" ? null : (v as Work["media_type"]) })}>
                    <SelectTrigger><SelectValue placeholder="Sin clasificar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin clasificar</SelectItem>
                      <SelectItem value="sculpture">Sculpture</SelectItem>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 8. Descripción */}
                <div className="space-y-2"><Label>Descripción <SeoTag hint="Alternativa a la cita para la meta description de la obra." /></Label>
                  <Textarea rows={4} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </div>

                {/* 9. Cita */}
                <div className="space-y-2"><Label>Cita <SeoTag hint="Fuente principal de la meta description y og:description." /></Label>
                  <Textarea rows={3} placeholder="Cita o frase asociada a la obra" value={editing.cita ?? ""} onChange={(e) => setEditing({ ...editing, cita: e.target.value })} />
                </div>

                {/* 10. Texto adicional */}
                <div className="space-y-2"><Label>Texto adicional</Label>
                  <Textarea rows={3} value={editing.extra_text ?? ""} onChange={(e) => setEditing({ ...editing, extra_text: e.target.value })} />
                </div>

                {/* 11. Imagen destacada */}
                <div className="space-y-2"><Label>Imagen destacada <SeoTag hint="Se usa como og:image, twitter:image y en el sitemap de imágenes." /></Label>
                  <MediaPicker value={editing.featured_media_id} onChange={(id) => setEditing({ ...editing, featured_media_id: id })} />
                </div>

                {/* Estado: se controla desde el listado con el toggle. */}
                <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                  Estado actual: <span className="font-medium text-neutral-700">{editing.status === "published" ? "Publicada" : "Borrador"}</span>. Se cambia desde el toggle en el listado.
                </div>

                {/* 13. Orden */}
                <div className="space-y-2"><Label>Orden</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>

                {/* Slug — system field: forms the public URL, placed last */}
                <div className="space-y-2">
                  <Label className="text-neutral-500">
                    Slug (URL) — no tocar
                  </Label>
                  <Input
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    className="bg-neutral-50 text-neutral-500"
                  />
                  <p className="text-xs text-neutral-400">
                    Campo técnico: es la dirección web de la obra. Cambiarlo rompe los
                    enlaces ya compartidos. El título se puede editar libremente sin tocar esto.
                  </p>
                </div>

                {editing.id && (
                  <div className="space-y-3 rounded-md border border-neutral-200 p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Galería de imágenes</Label>
                      <MediaPicker value={null} onChange={addImage} trigger={<Button type="button" variant="outline" size="sm">Añadir imagen</Button>} />
                    </div>
                    {images.length === 0 ? (
                      <p className="text-xs text-neutral-400">Aún sin imágenes.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {images.map((img) => (
                          <div key={img.id} className="space-y-1">
                            <div className="aspect-square overflow-hidden bg-neutral-100">
                              {img.media && (
                                <MediaThumb bucket={img.media.storage_bucket} path={img.media.storage_path} mime={img.media.mime_type} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <p className="truncate text-[10px] text-neutral-500" title={img.media?.original_filename ?? ""}>
                              {img.media?.original_filename ?? "—"}
                            </p>
                            <div className="flex items-center justify-between text-[10px]">
                              <div className="flex gap-1">
                                <button onClick={() => moveImage(img, -1)} className="rounded border px-1.5">↑</button>
                                <button onClick={() => moveImage(img, 1)} className="rounded border px-1.5">↓</button>
                              </div>
                              <button onClick={() => removeImage(img)} className="text-red-600 hover:underline">Quitar</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
                  <Button onClick={save}>Guardar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      <div className="flex flex-wrap gap-3">
        <Select value={view} onValueChange={(v) => setView(v as "table" | "grouped")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="table">Vista tabla</SelectItem>
            <SelectItem value="grouped">Agrupadas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSub} onValueChange={setFilterSub}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las subcategorías</SelectItem>
            {filterSubs.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicadas</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>

      {view === "table" ? (
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-widest text-neutral-500">
            <tr><th className="px-4 py-3">Orden</th><th className="px-4 py-3">Imagen</th><th className="px-4 py-3">Título</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Subcategoría</th><th className="px-4 py-3">Año</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-400">Cargando…</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-400">Sin obras.</td></tr>
            : filtered.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => move(row, -1)} className="rounded border px-2 text-xs">↑</button>
                    <button onClick={() => move(row, 1)} className="rounded border px-2 text-xs">↓</button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const m = workThumb(row);
                    return m ? (
                      <div className="h-14 w-14 overflow-hidden rounded bg-neutral-100">
                        <MediaThumb
                          bucket={m.storage_bucket}
                          path={m.storage_path}
                          mime={m.mime_type}
                          alt={row.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded bg-neutral-100 text-[9px] uppercase tracking-widest text-neutral-400">
                        s/img
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 font-medium">{row.title}</td>
                <td className="px-4 py-3 text-neutral-500">{catName(row.category_id)}</td>
                <td className="px-4 py-3 text-neutral-500">{subName(row.subcategory_id)}</td>
                <td className="px-4 py-3 text-neutral-500">{row.year ?? "—"}</td>
                <td className="px-4 py-3">
                  <label className="inline-flex cursor-pointer items-center gap-2" title="Publicar / despublicar">
                    <span className="relative inline-flex h-5 w-9 items-center">
                      <input
                        type="checkbox"
                        checked={row.status === "published"}
                        onChange={() => toggleStatus(row)}
                        className="peer sr-only"
                      />
                      <span className="absolute inset-0 rounded-full bg-neutral-300 transition peer-checked:bg-emerald-500" />
                      <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                    </span>
                    <span className={"text-xs " + (row.status === "published" ? "text-emerald-700" : "text-neutral-500")}>
                      {row.status === "published" ? "Publicada" : "Borrador"}
                    </span>
                  </label>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(row)} className="mr-3 text-xs hover:underline">Editar</button>
                  <button onClick={() => remove(row)} className="text-xs text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : (
        <div className="space-y-6">
          {loading ? (
            <p className="text-center text-neutral-400">Cargando…</p>
          ) : (
            cats
              .filter((c) => filterCat === "all" || c.id === filterCat)
              .map((cat) => {
                const catWorks = filtered.filter((w) => w.category_id === cat.id);
                const catSubs = subs.filter((s) => s.category_id === cat.id);
                const orphans = catWorks.filter((w) => !w.subcategory_id);
                return (
                  <div key={cat.id} className="rounded-md border border-neutral-200 bg-white">
                    <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-700">{cat.title}</h3>
                      <span className="text-xs text-neutral-400">{catWorks.length} obra(s)</span>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {catSubs.map((sub) => {
                        const subWorks = catWorks.filter((w) => w.subcategory_id === sub.id);
                        if (subWorks.length === 0 && filterSub !== "all" && filterSub !== sub.id) return null;
                        return (
                          <div key={sub.id} className="px-4 py-3">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-xs uppercase tracking-widest text-neutral-500">↳ {sub.title}</span>
                              <span className="text-xs text-neutral-400">({subWorks.length})</span>
                            </div>
                            {subWorks.length === 0 ? (
                              <p className="pl-4 text-xs text-neutral-400">Sin obras.</p>
                            ) : (
                              <ul className="space-y-1 pl-4">
                                {subWorks.map((w) => (
                                  <li key={w.id} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-3">
                                      {(() => {
                                        const m = workThumb(w);
                                        return m ? (
                                          <span className="block h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                                            <MediaThumb bucket={m.storage_bucket} path={m.storage_path} mime={m.mime_type} alt={w.title} className="h-full w-full object-cover" />
                                          </span>
                                        ) : (
                                          <span className="block h-10 w-10 shrink-0 rounded bg-neutral-100" />
                                        );
                                      })()}
                                      <span className="font-medium">{w.title}</span>
                                      <span className="ml-2 text-xs text-neutral-400">{w.year ?? ""}</span>
                                      <span className={"ml-2 rounded-full px-2 py-0.5 text-[10px] " + (w.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                                        {w.status === "published" ? "Publicada" : "Borrador"}
                                      </span>
                                    </span>
                                    <button onClick={() => openEdit(w)} className="text-xs hover:underline">Editar</button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                      {orphans.length > 0 && (filterSub === "all") && (
                        <div className="px-4 py-3">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs uppercase tracking-widest text-neutral-400">↳ Sin subcategoría</span>
                            <span className="text-xs text-neutral-400">({orphans.length})</span>
                          </div>
                          <ul className="space-y-1 pl-4">
                            {orphans.map((w) => (
                              <li key={w.id} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-3">
                                  {(() => {
                                    const m = workThumb(w);
                                    return m ? (
                                      <span className="block h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                                        <MediaThumb bucket={m.storage_bucket} path={m.storage_path} mime={m.mime_type} alt={w.title} className="h-full w-full object-cover" />
                                      </span>
                                    ) : (
                                      <span className="block h-10 w-10 shrink-0 rounded bg-neutral-100" />
                                    );
                                  })()}
                                  <span className="font-medium">{w.title}</span>
                                  <span className="ml-2 text-xs text-neutral-400">{w.year ?? ""}</span>
                                </span>
                                <button onClick={() => openEdit(w)} className="text-xs hover:underline">Editar</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {catWorks.length === 0 && (
                        <p className="px-4 py-6 text-center text-xs text-neutral-400">Sin obras en esta categoría.</p>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </AdminSection>
  );
}