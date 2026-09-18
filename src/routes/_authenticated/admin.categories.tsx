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
import { AdminSection } from "@/components/admin/AdminSection";
import { MediaPicker } from "@/components/admin/MediaPicker";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [{ title: "Categorías — Panel" }, { name: "robots", content: "noindex" }] }),
  component: CategoriesPage,
});

type Category = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_media_id: string | null;
  sort_order: number;
  is_active: boolean;
};

function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("title");
    if (error) toast.error(error.message);
    setRows((data as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function toggleActive(row: Category) {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else reload();
  }

  async function move(row: Category, dir: -1 | 1) {
    const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((r) => r.id === row.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("categories").update({ sort_order: swap.sort_order }).eq("id", row.id),
      supabase.from("categories").update({ sort_order: row.sort_order }).eq("id", swap.id),
    ]);
    reload();
  }

  async function remove(row: Category) {
    if (!confirm(`¿Eliminar categoría "${row.title}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Categoría eliminada");
      reload();
    }
  }

  function openNew() {
    setEditing({
      id: "",
      slug: "",
      title: "",
      description: "",
      cover_media_id: null,
      sort_order: rows.length,
      is_active: true,
    });
    setOpen(true);
  }

  function openEdit(row: Category) {
    setEditing({ ...row });
    setOpen(true);
  }

  async function save() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim()) {
      toast.error("Título y slug son obligatorios");
      return;
    }
    if (editing.id) {
      const { error } = await supabase
        .from("categories")
        .update({
          slug: editing.slug,
          title: editing.title,
          description: editing.description,
          cover_media_id: editing.cover_media_id,
          sort_order: editing.sort_order,
          is_active: editing.is_active,
        })
        .eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("categories").insert({
        slug: editing.slug,
        title: editing.title,
        description: editing.description,
        cover_media_id: editing.cover_media_id,
        sort_order: editing.sort_order,
        is_active: editing.is_active,
      });
      if (error) return toast.error(error.message);
    }
    toast.success(editing.id ? `Categoría "${editing.title}" guardada` : `Categoría "${editing.title}" creada`);
    setOpen(false);
    setEditing(null);
    reload();
  }

  const filtered = q ? rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()) || r.slug.includes(q.toLowerCase())) : rows;

  return (
    <AdminSection
      title="Categorías"
      description="Estructura principal del sitio."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>Nueva categoría</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={editing.slug}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                      placeholder="identity"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={editing.description ?? ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imagen de portada</Label>
                  <MediaPicker
                    value={editing.cover_media_id}
                    onChange={(id) => setEditing({ ...editing, cover_media_id: id })}
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editing.is_active}
                      onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                    />
                    Activa
                  </label>
                  <div className="flex items-center gap-2 text-sm">
                    <Label>Orden</Label>
                    <Input
                      type="number"
                      className="w-24"
                      value={editing.sort_order}
                      onChange={(e) =>
                        setEditing({ ...editing, sort_order: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={save}>Guardar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      <Input
        placeholder="Buscar…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-xs"
      />
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-widest text-neutral-500">
            <tr>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Sin categorías.</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => move(row, -1)} className="rounded border px-2 text-xs hover:bg-neutral-50">↑</button>
                    <button onClick={() => move(row, 1)} className="rounded border px-2 text-xs hover:bg-neutral-50">↓</button>
                    <span className="ml-2 text-xs text-neutral-400">{row.sort_order}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{row.title}</td>
                <td className="px-4 py-3 text-neutral-500">{row.slug}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(row)}
                    className={
                      "rounded-full px-3 py-1 text-xs " +
                      (row.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-neutral-100 text-neutral-500")
                    }
                  >
                    {row.is_active ? "Activa" : "Inactiva"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(row)} className="mr-3 text-xs text-neutral-700 hover:underline">
                    Editar
                  </button>
                  <button onClick={() => remove(row)} className="text-xs text-red-600 hover:underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSection>
  );
}