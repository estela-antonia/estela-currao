import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MEDIA_BUCKET, uploadMedia, type MediaRow } from "@/lib/admin/media";
import { MediaThumb } from "./MediaThumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function MediaPicker({
  value,
  onChange,
  trigger,
  bucket = MEDIA_BUCKET,
  accept = "image/*",
}: {
  value?: string | null;
  onChange: (mediaId: string | null) => void;
  trigger?: React.ReactNode;
  bucket?: string;
  accept?: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaRow[]>([]);
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaRow | null>(null);

  useEffect(() => {
    if (!open) return;
    void reload();
  }, [open, bucket]);

  useEffect(() => {
    if (!value) {
      setSelectedMedia(null);
      return;
    }
    supabase
      .from("media")
      .select("*")
      .eq("id", value)
      .maybeSingle()
      .then(({ data }) => setSelectedMedia((data as MediaRow) ?? null));
  }, [value]);

  async function reload() {
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .eq("storage_bucket", bucket)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((data as MediaRow[]) ?? []);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const row = await uploadMedia(file, bucket);
      toast.success("Archivo subido");
      await reload();
      onChange(row.id);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error subiendo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const filtered = q
    ? items.filter((i) =>
        (i.original_filename ?? "").toLowerCase().includes(q.toLowerCase()),
      )
    : items;

  return (
    <div className="space-y-2">
      {selectedMedia && (
        <div className="flex items-center gap-3 rounded border border-neutral-200 p-2">
          <div className="h-16 w-16 overflow-hidden bg-neutral-100">
            <MediaThumb
              bucket={selectedMedia.storage_bucket}
              path={selectedMedia.storage_path}
              mime={selectedMedia.mime_type}
              className="h-16 w-16 object-cover"
            />
          </div>
          <div className="flex-1 truncate text-xs text-neutral-600">
            {selectedMedia.original_filename}
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 hover:underline"
          >
            Quitar
          </button>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button type="button" variant="outline" size="sm">
              {selectedMedia ? "Cambiar archivo" : "Seleccionar archivo"}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Media library</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Buscar por nombre…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <label className="cursor-pointer">
              <input
                type="file"
                accept={accept}
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
              <span className="inline-flex h-9 items-center rounded-md bg-neutral-900 px-3 text-xs uppercase tracking-widest text-white hover:bg-neutral-700">
                {uploading ? "Subiendo…" : "Subir nuevo"}
              </span>
            </label>
          </div>
          <div className="grid max-h-[60vh] grid-cols-4 gap-3 overflow-y-auto pr-2 md:grid-cols-6">
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
                className={
                  "group relative aspect-square overflow-hidden border " +
                  (m.id === value
                    ? "border-neutral-900"
                    : "border-neutral-200 hover:border-neutral-400")
                }
                title={m.original_filename ?? ""}
              >
                <MediaThumb
                  bucket={m.storage_bucket}
                  path={m.storage_path}
                  mime={m.mime_type}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-xs text-neutral-400">
                Sin archivos aún.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}