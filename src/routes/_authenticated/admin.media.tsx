import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DOCS_BUCKET,
  MEDIA_BUCKET,
  deleteMedia,
  uploadMedia,
  type MediaRow,
} from "@/lib/admin/media";
import { MediaThumb } from "@/components/admin/MediaThumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/media")({
  head: () => ({ meta: [{ title: "Media — Panel" }, { name: "robots", content: "noindex" }] }),
  component: MediaPage,
});

const LEGACY_BUCKET = "__legacy__";

function MediaPage() {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [bucket, setBucket] = useState<string>(MEDIA_BUCKET);
  const [usage, setUsage] = useState<Record<string, { title: string; status: string }>>({});
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const isLegacy = bucket === LEGACY_BUCKET;

  async function reload() {
    setLoading(true);
    const query = supabase.from("media").select("*");
    const { data, error } = await (isLegacy
      ? query.not("storage_bucket", "in", `(${MEDIA_BUCKET},${DOCS_BUCKET})`)
      : query.eq("storage_bucket", bucket)
    ).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as MediaRow[]) ?? []);
    setLoading(false);

    // Which work uses each file (incl. drafts), so legacy/unpublished images
    // can be identified before deleting them.
    const { data: links } = await supabase
      .from("work_images")
      .select("media_id, works:work_id(title,status)");
    const map: Record<string, { title: string; status: string }> = {};
    for (const l of (links ?? []) as Array<{
      media_id: string;
      works: { title: string; status: string } | null;
    }>) {
      if (l.works && !map[l.media_id]) map[l.media_id] = l.works;
    }
    setUsage(map);
  }

  useEffect(() => {
    void reload();
  }, [bucket]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (isLegacy) {
      toast.error("Elegí la pestaña Imágenes o PDFs para subir archivos");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      for (const f of files) {
        await uploadMedia(f, bucket);
      }
      toast.success(`${files.length} archivo(s) subidos`);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error subiendo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(m: MediaRow) {
    if (!confirm(`¿Eliminar "${m.original_filename ?? m.storage_path}"?`)) return;
    try {
      await deleteMedia(m.id, m.storage_bucket, m.storage_path);
      toast.success("Archivo eliminado");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error eliminando");
    }
  }

  async function handleAltChange(m: MediaRow, alt: string) {
    const { error } = await supabase.from("media").update({ alt_text: alt }).eq("id", m.id);
    if (error) toast.error(error.message);
  }

  const filtered = q
    ? items.filter((i) =>
        (i.original_filename ?? "").toLowerCase().includes(q.toLowerCase()),
      )
    : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light">Media library</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Imágenes y documentos reutilizables en todo el sitio.
          </p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            accept={bucket === DOCS_BUCKET ? "application/pdf" : "image/*"}
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <span className="inline-flex h-10 items-center rounded-md bg-neutral-900 px-4 text-xs uppercase tracking-widest text-white hover:bg-neutral-700">
            {uploading ? "Subiendo…" : "Subir archivos"}
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-neutral-200 bg-white p-1 text-xs">
          <button
            onClick={() => setBucket(MEDIA_BUCKET)}
            className={
              "rounded px-3 py-1.5 " +
              (bucket === MEDIA_BUCKET
                ? "bg-neutral-900 text-white"
                : "text-neutral-600")
            }
          >
            Imágenes
          </button>
          <button
            onClick={() => setBucket(DOCS_BUCKET)}
            className={
              "rounded px-3 py-1.5 " +
              (bucket === DOCS_BUCKET
                ? "bg-neutral-900 text-white"
                : "text-neutral-600")
            }
          >
            PDFs
          </button>
          <button
            onClick={() => setBucket(LEGACY_BUCKET)}
            className={
              "rounded px-3 py-1.5 " +
              (isLegacy ? "bg-neutral-900 text-white" : "text-neutral-600")
            }
          >
            Originales / legacy
          </button>
        </div>
        <Input
          placeholder="Buscar por nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
          Sin archivos.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="overflow-hidden rounded-md border border-neutral-200 bg-white"
            >
              <div className="aspect-square overflow-hidden bg-neutral-100">
                <MediaThumb
                  bucket={m.storage_bucket}
                  path={m.storage_path}
                  mime={m.mime_type}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 p-3 text-xs">
                <div className="truncate font-medium" title={m.original_filename ?? ""}>
                  {m.original_filename}
                </div>
                {usage[m.id] && (
                  <div className="flex items-center gap-1 truncate text-[10px] text-neutral-500">
                    <span className="truncate" title={usage[m.id].title}>
                      {usage[m.id].title}
                    </span>
                    <span
                      className={
                        "shrink-0 rounded-full px-1.5 py-0.5 " +
                        (usage[m.id].status === "published"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700")
                      }
                    >
                      {usage[m.id].status === "published" ? "Publicada" : "Borrador"}
                    </span>
                  </div>
                )}
                <Input
                  defaultValue={m.alt_text ?? ""}
                  placeholder="Alt text"
                  className="h-8 text-xs"
                  onBlur={(e) => handleAltChange(m, e.target.value)}
                />
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>
                    {m.width && m.height ? `${m.width}×${m.height}` : "—"}
                  </span>
                  <button
                    onClick={() => handleDelete(m)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}