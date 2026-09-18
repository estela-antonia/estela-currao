import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminSection, AdminCard } from "@/components/admin/AdminSection";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/media-slots")({
  head: () => ({ meta: [{ title: "Slots MEDIA — Panel" }, { name: "robots", content: "noindex" }] }),
  component: MediaSlotsPage,
});

type MediaType = "sculpture" | "painting" | "photography";
const TYPES: MediaType[] = ["sculpture", "painting", "photography"];
const SLOTS: string[] = TYPES.flatMap((t) => [1, 2, 3].map((i) => `${t}-${i}`));
const AUTO = "__auto__";

type Slot = { slot_key: string; work_id: string | null; alt_override: string | null };
type Work = {
  id: string;
  title: string;
  slug: string;
  media_type: MediaType | null;
  status: "draft" | "published";
  featured_media_id: string | null;
};
type Media = { id: string; public_url: string | null };

function MediaSlotsPage() {
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const [works, setWorks] = useState<Work[]>([]);
  const [media, setMedia] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const [sRes, wRes, mRes] = await Promise.all([
      supabase.from("media_slots").select("slot_key, work_id, alt_override").order("sort_order"),
      supabase
        .from("works")
        .select("id, title, slug, media_type, status, featured_media_id")
        .eq("status", "published")
        .not("media_type", "is", null)
        .order("sort_order"),
      supabase.from("media").select("id, public_url"),
    ]);
    if (sRes.error) toast.error(sRes.error.message);
    if (wRes.error) toast.error(wRes.error.message);
    if (mRes.error) toast.error(mRes.error.message);
    const map: Record<string, Slot> = {};
    for (const s of sRes.data ?? []) map[s.slot_key] = s as Slot;
    // Ensure the 9 canonical slots exist locally even if the DB is missing rows
    for (const key of SLOTS) if (!map[key]) map[key] = { slot_key: key, work_id: null, alt_override: null };
    setSlots(map);
    setWorks((wRes.data as Work[]) ?? []);
    const m: Record<string, string> = {};
    for (const row of (mRes.data as Media[]) ?? []) if (row.public_url) m[row.id] = row.public_url;
    setMedia(m);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function saveSlot(key: string, patch: Partial<Slot>) {
    setSaving(key);
    const current = slots[key];
    const next: Slot = { ...current, ...patch };
    setSlots((s) => ({ ...s, [key]: next }));
    const { error } = await supabase
      .from("media_slots")
      .update({ work_id: next.work_id, alt_override: next.alt_override })
      .eq("slot_key", key);
    if (error) toast.error(error.message);
    else toast.success(`Slot ${key} guardado`);
    setSaving(null);
  }

  const worksByType = useMemo(() => {
    const map: Record<MediaType, Work[]> = { sculpture: [], painting: [], photography: [] };
    for (const w of works) if (w.media_type) map[w.media_type].push(w);
    return map;
  }, [works]);

  return (
    <AdminSection
      title="Slots MEDIA"
      description="Elige qué obra publicada aparece en cada uno de los 9 slots de la página /media. Dejalo vacío para que se llene automáticamente con las primeras obras publicadas del tipo correspondiente."
    >
      {loading ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TYPES.map((type) => (
            <div key={type} className="space-y-4">
              <h2 className="text-xs font-medium uppercase tracking-[0.28em] text-neutral-500">
                {type}
              </h2>
              {[1, 2, 3].map((i) => {
                const key = `${type}-${i}`;
                const slot = slots[key] ?? { slot_key: key, work_id: null, alt_override: null };
                const selectedWork = works.find((w) => w.id === slot.work_id) ?? null;
                const preview =
                  selectedWork?.featured_media_id ? media[selectedWork.featured_media_id] : null;
                const options = worksByType[type];
                return (
                  <AdminCard key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-900">
                        Slot {i}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                        {key}
                      </span>
                    </div>

                    <div className="aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                      {preview ? (
                        <img
                          src={preview}
                          alt={selectedWork?.title ?? ""}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                          Automático
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Obra</Label>
                      <Select
                        value={slot.work_id ?? AUTO}
                        onValueChange={(value) =>
                          void saveSlot(key, { work_id: value === AUTO ? null : value })
                        }
                        disabled={saving === key}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Automático" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AUTO}>Automático</SelectItem>
                          {options.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Alt (opcional)</Label>
                      <Input
                        value={slot.alt_override ?? ""}
                        onChange={(e) =>
                          setSlots((s) => ({
                            ...s,
                            [key]: { ...slot, alt_override: e.target.value },
                          }))
                        }
                        onBlur={(e) =>
                          void saveSlot(key, { alt_override: e.target.value.trim() || null })
                        }
                        placeholder={selectedWork?.title ?? "Texto alternativo"}
                        disabled={saving === key}
                      />
                    </div>
                  </AdminCard>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="pt-4">
        <Button variant="outline" size="sm" onClick={() => void reload()}>
          Recargar
        </Button>
      </div>
    </AdminSection>
  );
}