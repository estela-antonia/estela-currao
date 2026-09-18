import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminSection, AdminCard } from "@/components/admin/AdminSection";
import { MediaPicker } from "@/components/admin/MediaPicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/contact")({
  head: () => ({ meta: [{ title: "CONTACT — Panel" }, { name: "robots", content: "noindex" }] }),
  component: ContactAdminPage,
});

type ContactLink = { title: string; url: string };
type ContactIntro = { en: string; fr: string; es: string };
type ContactState = {
  id: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  contact_photo_media_id: string | null;
  contact_instagram_color: string | null;
  contact_instagram_bw: string | null;
  contact_intro: ContactIntro;
  contact_links: ContactLink[];
};

function ContactAdminPage() {
  const [s, setS] = useState<ContactState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, contact_email, contact_phone, contact_address, contact_photo_media_id, contact_instagram_color, contact_instagram_bw, contact_intro, contact_links")
        .eq("singleton", true)
        .maybeSingle();
      if (error) { toast.error(error.message); return; }
      if (!data) { toast.error("No se encontró la configuración"); return; }
      const r: any = data;
      setS({
        id: r.id,
        contact_email: r.contact_email,
        contact_phone: r.contact_phone,
        contact_address: r.contact_address,
        contact_photo_media_id: r.contact_photo_media_id ?? null,
        contact_instagram_color: r.contact_instagram_color ?? null,
        contact_instagram_bw: r.contact_instagram_bw ?? null,
        contact_intro: {
          en: r.contact_intro?.en ?? "",
          fr: r.contact_intro?.fr ?? "",
          es: r.contact_intro?.es ?? "",
        },
        contact_links: Array.isArray(r.contact_links) ? (r.contact_links as ContactLink[]) : [],
      });
    })();
  }, []);

  async function save() {
    if (!s) return;
    const schema = z.object({
      contact_email: z.string().trim().email("Email inválido").max(255).or(z.literal("")),
      contact_instagram_color: z.string().trim().url("URL inválida").max(500).or(z.literal("")),
      contact_instagram_bw: z.string().trim().url("URL inválida").max(500).or(z.literal("")),
      contact_links: z.array(z.object({
        title: z.string().trim().min(1, "Título requerido").max(120),
        url: z.string().trim().url("URL inválida").max(500),
      })),
    });
    const parsed = schema.safeParse({
      contact_email: s.contact_email ?? "",
      contact_instagram_color: s.contact_instagram_color ?? "",
      contact_instagram_bw: s.contact_instagram_bw ?? "",
      contact_links: s.contact_links,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("site_settings").update({
      contact_email: s.contact_email,
      contact_phone: s.contact_phone,
      contact_address: s.contact_address,
      contact_photo_media_id: s.contact_photo_media_id,
      contact_instagram_color: s.contact_instagram_color,
      contact_instagram_bw: s.contact_instagram_bw,
      contact_intro: s.contact_intro,
      contact_links: s.contact_links,
    }).eq("id", s.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("CONTACT guardado");
  }

  if (!s) return <p className="text-sm text-neutral-400">Cargando…</p>;

  return (
    <AdminSection
      title="CONTACT"
      description="Email, teléfono, dirección, foto, Instagram, cita e enlaces."
      actions={<Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>}
    >
      <AdminCard>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Email</Label>
            <Input type="email" value={s.contact_email ?? ""} onChange={(e)=>setS({...s,contact_email:e.target.value})} />
          </div>
          <div className="space-y-2"><Label>Teléfono</Label>
            <Input value={s.contact_phone ?? ""} onChange={(e)=>setS({...s,contact_phone:e.target.value})} />
          </div>
          <div className="space-y-2 md:col-span-2"><Label>Dirección</Label>
            <Textarea rows={2} value={s.contact_address ?? ""} onChange={(e)=>setS({...s,contact_address:e.target.value})} />
          </div>
          <div className="space-y-2 md:col-span-2"><Label>Foto</Label>
            <MediaPicker value={s.contact_photo_media_id} onChange={(id)=>setS({...s,contact_photo_media_id:id})} />
          </div>
          <div className="space-y-2"><Label>Instagram — Color (URL)</Label>
            <Input value={s.contact_instagram_color ?? ""} onChange={(e)=>setS({...s,contact_instagram_color:e.target.value})} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2"><Label>Instagram — Blanco y Negro (URL)</Label>
            <Input value={s.contact_instagram_bw ?? ""} onChange={(e)=>setS({...s,contact_instagram_bw:e.target.value})} placeholder="https://instagram.com/..." />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Cita / Introducción</p>
          <div className="space-y-2"><Label>Inglés</Label>
            <Textarea rows={4} value={s.contact_intro.en} onChange={(e)=>setS({...s,contact_intro:{...s.contact_intro, en:e.target.value}})} />
          </div>
          <div className="space-y-2"><Label>Francés</Label>
            <Textarea rows={4} value={s.contact_intro.fr} onChange={(e)=>setS({...s,contact_intro:{...s.contact_intro, fr:e.target.value}})} />
          </div>
          <div className="space-y-2"><Label>Español</Label>
            <Textarea rows={4} value={s.contact_intro.es} onChange={(e)=>setS({...s,contact_intro:{...s.contact_intro, es:e.target.value}})} />
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Enlaces (galerías, asociaciones…)</p>
            <NewLinkButton onCreate={(link) => setS({ ...s, contact_links: [...s.contact_links, link] })} />
          </div>
          {s.contact_links.length === 0 ? <p className="text-xs text-neutral-400">Sin enlaces.</p> : (
            <SortableContactLinks
              links={s.contact_links}
              onChange={(next)=>setS({ ...s, contact_links: next })}
            />
          )}
          <p className="mt-2 text-[11px] text-neutral-400">Arrastrá el ícono <GripVertical className="inline h-3 w-3" /> para reordenar.</p>
        </div>
      </AdminCard>
    </AdminSection>
  );
}

function SortableContactLinks({
  links,
  onChange,
}: {
  links: ContactLink[];
  onChange: (next: ContactLink[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = links.map((_, i) => `link-${i}`);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChange(arrayMove(links, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {links.map((ln, i) => (
            <SortableLinkRow
              key={ids[i]}
              id={ids[i]}
              link={ln}
              onTitleChange={(v) => {
                const next = links.slice();
                next[i] = { ...next[i], title: v };
                onChange(next);
              }}
              onUrlChange={(v) => {
                const next = links.slice();
                next[i] = { ...next[i], url: v };
                onChange(next);
              }}
              onRemove={() => onChange(links.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableLinkRow({
  id,
  link,
  onTitleChange,
  onUrlChange,
  onRemove,
}: {
  id: string;
  link: ContactLink;
  onTitleChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-2 rounded border border-transparent bg-white hover:border-neutral-200"
    >
      <button
        type="button"
        className="cursor-grab touch-none px-1 text-neutral-400 hover:text-neutral-700 active:cursor-grabbing"
        aria-label="Reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input placeholder="Título (ej: Galería X)" value={link.title} onChange={(e) => onTitleChange(e.target.value)} />
      <Input placeholder="https://…" value={link.url} onChange={(e) => onUrlChange(e.target.value)} />
      <button type="button" className="text-xs text-red-600 hover:underline" onClick={onRemove}>Quitar</button>
    </div>
  );
}

const contactLinkSchema = z.object({
  title: z.string().trim().min(1, { message: "El título es obligatorio" }).max(80, { message: "Máximo 80 caracteres" }),
  url: z.string().trim().min(1, { message: "La URL es obligatoria" }).max(500, { message: "Máximo 500 caracteres" }).url({ message: "URL inválida (ej: https://…)" }),
});

function NewLinkButton({ onCreate }: { onCreate: (link: ContactLink) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});

  function reset() { setTitle(""); setUrl(""); setErrors({}); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactLinkSchema.safeParse({ title, url });
    if (!parsed.success) {
      const fieldErrors: { title?: string; url?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "title" | "url";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onCreate(parsed.data);
    toast.success("Enlace agregado. Recordá guardar los cambios.");
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Nuevo enlace
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo enlace</DialogTitle>
          <DialogDescription>
            Agregá un enlace de galería, asociación u otra referencia. Título y URL son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-link-title">Título</Label>
            <Input id="new-link-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Galería X" maxLength={80} autoFocus />
            {errors.title ? <p className="text-xs text-red-600">{errors.title}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-link-url">URL</Label>
            <Input id="new-link-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" maxLength={500} />
            {errors.url ? <p className="text-xs text-red-600">{errors.url}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Agregar enlace</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}