import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminSection } from "@/components/admin/AdminSection";
import { MediaPicker } from "@/components/admin/MediaPicker";

export const Route = createFileRoute("/_authenticated/admin/subcategories")({
  head: () => ({ meta: [{ title: "Subcategorías — Panel" }, { name: "robots", content: "noindex" }] }),
  component: SubcategoriesPage,
});

type Sub = {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_media_id: string | null;
  sort_order: number;
  is_active: boolean;
};
type Cat = { id: string; title: string };

function SubcategoriesPage() {
  const [rows, setRows] = useState<Sub[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Sub | null>(null);
  const [open, setOpen] = useState(false);

  async function reload() {
    setLoading(true);
    const [subs, catList] = await Promise.all([
      supabase.from("subcategories").select("*").order("sort_order"),
      supabase.from("categories").select("id,title").order("sort_order"),
    ]);
    if (subs.error) toast.error(subs.error.message);
    setRows((subs.data as Sub[]) ?? []);
    setCats((catList.data as Cat[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    void reload();
  }, []);

  async function toggleActive(row: Sub) {
    await supabase.from("subcategories").update({ is_active: !row.is_active }).eq("id", row.id);
    reload();
  }
  async function remove(row: Sub) {
    if (!confirm(`¿Eliminar "${row.title}"?`)) return;
    const { error } = await supabase.from("subcategories").delete().eq("id", row.id);
    if (error) toast.error(error.message); else { toast.success("Eliminada"); reload(); }
  }
  async function move(row: Sub, dir: -1 | 1) {
    const same = rows.filter((r) => r.category_id === row.category_id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = same.findIndex((r) => r.id === row.id);
    const swap = same[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("subcategories").update({ sort_order: swap.sort_order }).eq("id", row.id),
      supabase.from("subcategories").update({ sort_order: row.sort_order }).eq("id", swap.id),
    ]);
    reload();
  }

  function openNew() {
    setEditing({
      id: "",
      category_id: cats[0]?.id ?? "",
      slug: "",
      title: "",
      description: "",
      cover_media_id: null,
      sort_order: rows.length,
      is_active: true,
    });
    setOpen(true);
  }
  function openEdit(row: Sub) { setEditing({ ...row }); setOpen(true); }

  async function save() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim() || !editing.category_id) {
      toast.error("Categoría, título y slug son obligatorios");
      return;
    }
    const payload = {
      category_id: editing.category_id,
      slug: editing.slug,
      title: editing.title,
      description: editing.description,
      cover_media_id: editing.cover_media_id,
      sort_order: editing.sort_order,
      is_active: editing.is_active,
    };
    const { error } = editing.id
      ? await supabase.from("subcategories").update(payload).eq("id", editing.id)
      : await supabase.from("subcategories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? `Subcategoría "${editing.title}" guardada` : `Subcategoría "${editing.title}" creada`);
    setOpen(false); setEditing(null); reload();
  }

  const filtered = rows
    .filter((r) => filterCat === "all" || r.category_id === filterCat)
    .filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()) || r.slug.includes(q.toLowerCase()));
  const catName = (id: string) => cats.find((c) => c.id === id)?.title ?? "—";

  return (
    <AdminSection
      title="Subcategorías"
      description="Series dentro de cada categoría."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} disabled={cats.length === 0}>Nueva subcategoría</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Nueva subcategoría"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={editing.category_id}
                    onValueChange={(v) => setEditing({ ...editing, category_id: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Título</Label>
                    <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                  </div>
                  <div className="space-y-2"><Label>Slug</Label>
                    <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2"><Label>Descripción</Label>
                  <Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div className="space-y-2"><Label>Imagen de portada</Label>
                  <MediaPicker value={editing.cover_media_id} onChange={(id) => setEditing({ ...editing, cover_media_id: id })} />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                    Activa
                  </label>
                  <div className="flex items-center gap-2 text-sm">
                    <Label>Orden</Label>
                    <Input type="number" className="w-24" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={save}>Guardar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      <div className="flex flex-wrap gap-3">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filtrar por categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-widest text-neutral-500">
            <tr><th className="px-4 py-3">Orden</th><th className="px-4 py-3">Título</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Sin resultados.</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => move(row, -1)} className="rounded border px-2 text-xs hover:bg-neutral-50">↑</button>
                    <button onClick={() => move(row, 1)} className="rounded border px-2 text-xs hover:bg-neutral-50">↓</button>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{row.title}</td>
                <td className="px-4 py-3 text-neutral-500">{catName(row.category_id)}</td>
                <td className="px-4 py-3 text-neutral-500">{row.slug}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(row)} className={"rounded-full px-3 py-1 text-xs " + (row.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500")}>
                    {row.is_active ? "Activa" : "Inactiva"}
                  </button>
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
    </AdminSection>
  );
}