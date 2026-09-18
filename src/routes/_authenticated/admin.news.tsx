import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSection } from "@/components/admin/AdminSection";
import { MediaPicker } from "@/components/admin/MediaPicker";

export const Route = createFileRoute("/_authenticated/admin/news")({
  head: () => ({ meta: [{ title: "News — Panel" }, { name: "robots", content: "noindex" }] }),
  component: NewsPage,
});

type N = {
  id: string; slug: string; title: string; subtitle: string | null;
  content: string | null; cover_media_id: string | null;
  published_at: string | null; sort_order: number; status: "draft" | "published";
};

function NewsPage() {
  const [rows, setRows] = useState<N[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<N | null>(null);
  const [open, setOpen] = useState(false);

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase.from("news").select("*").order("sort_order");
    if (error) toast.error(error.message);
    setRows((data as N[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void reload(); }, []);

  function openNew() {
    setEditing({ id:"", slug:"", title:"", subtitle:"", content:"", cover_media_id:null, published_at:new Date().toISOString().slice(0,10), sort_order: rows.length, status: "draft" });
    setOpen(true);
  }
  function openEdit(r: N) { setEditing({...r}); setOpen(true); }

  async function save() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim()) return toast.error("Título y slug obligatorios");
    const payload = {
      slug: editing.slug, title: editing.title, subtitle: editing.subtitle,
      content: editing.content, cover_media_id: editing.cover_media_id,
      published_at: editing.published_at, sort_order: editing.sort_order, status: editing.status,
    };
    const { error } = editing.id
      ? await supabase.from("news").update(payload).eq("id", editing.id)
      : await supabase.from("news").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Guardado"); setOpen(false); reload();
  }
  async function remove(r: N) {
    if (!confirm(`¿Eliminar "${r.title}"?`)) return;
    const { error } = await supabase.from("news").delete().eq("id", r.id);
    if (error) toast.error(error.message); else { toast.success("Eliminada"); reload(); }
  }
  async function toggleStatus(r: N) {
    await supabase.from("news").update({ status: r.status === "published" ? "draft" : "published" }).eq("id", r.id);
    reload();
  }
  async function move(r: N, dir: -1 | 1) {
    const sorted = [...rows].sort((a,b)=>a.sort_order-b.sort_order);
    const i = sorted.findIndex(x=>x.id===r.id); const s = sorted[i+dir]; if (!s) return;
    await Promise.all([
      supabase.from("news").update({ sort_order: s.sort_order }).eq("id", r.id),
      supabase.from("news").update({ sort_order: r.sort_order }).eq("id", s.id),
    ]);
    reload();
  }

  const filtered = q ? rows.filter(r => r.title.toLowerCase().includes(q.toLowerCase())) : rows;

  return (
    <AdminSection
      title="News"
      description="Novedades y noticias publicadas en el sitio."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}>Nueva news</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Nueva news"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Título</Label>
                    <Input value={editing.title} onChange={(e)=>setEditing({...editing,title:e.target.value})} />
                  </div>
                  <div className="space-y-2"><Label>Slug</Label>
                    <Input value={editing.slug} onChange={(e)=>setEditing({...editing,slug:e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2"><Label>Subtítulo</Label>
                  <Input value={editing.subtitle ?? ""} onChange={(e)=>setEditing({...editing,subtitle:e.target.value})} />
                </div>
                <div className="space-y-2"><Label>Contenido</Label>
                  <Textarea rows={8} value={editing.content ?? ""} onChange={(e)=>setEditing({...editing,content:e.target.value})} />
                </div>
                <div className="space-y-2"><Label>Imagen de portada</Label>
                  <MediaPicker value={editing.cover_media_id} onChange={(id)=>setEditing({...editing,cover_media_id:id})} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Fecha</Label>
                    <Input type="date" value={editing.published_at ? editing.published_at.slice(0,10) : ""} onChange={(e)=>setEditing({...editing,published_at:e.target.value || null})} />
                  </div>
                  <div className="space-y-2"><Label>Estado</Label>
                    <Select value={editing.status} onValueChange={(v)=>setEditing({...editing,status:v as N["status"]})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="published">Publicada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Orden</Label>
                    <Input type="number" value={editing.sort_order} onChange={(e)=>setEditing({...editing,sort_order:Number(e.target.value)})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button>
                  <Button onClick={save}>Guardar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      <Input placeholder="Buscar…" value={q} onChange={(e)=>setQ(e.target.value)} className="max-w-xs" />
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-widest text-neutral-500">
            <tr><th className="px-4 py-3">Orden</th><th className="px-4 py-3">Título</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Cargando…</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Sin news.</td></tr>
            : filtered.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={()=>move(r,-1)} className="rounded border px-2 text-xs">↑</button>
                    <button onClick={()=>move(r,1)} className="rounded border px-2 text-xs">↓</button>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{r.title}</td>
                <td className="px-4 py-3 text-neutral-500">{r.published_at?.slice(0,10) ?? "—"}</td>
                <td className="px-4 py-3">
                  <button onClick={()=>toggleStatus(r)} className={"rounded-full px-3 py-1 text-xs " + (r.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                    {r.status === "published" ? "Publicada" : "Borrador"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={()=>openEdit(r)} className="mr-3 text-xs hover:underline">Editar</button>
                  <button onClick={()=>remove(r)} className="text-xs text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSection>
  );
}