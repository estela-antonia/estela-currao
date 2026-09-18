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
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Configuración — Panel" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

type Social = { label: string; url: string };
type ContactLink = { title: string; url: string };
type LegalLink = { title: string; url: string };
type ContactIntro = { en: string; fr: string; es: string };
type Settings = {
  id: string;
  site_name: string;
  logo_media_id: string | null;
  favicon_media_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  social: Social[];
  footer_text: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_media_id: string | null;
  press_dossier_media_id: string | null;
  home_image_desktop_media_id: string | null;
  home_image_tablet_media_id: string | null;
  home_image_mobile_media_id: string | null;
  contact_photo_media_id: string | null;
  contact_instagram_color: string | null;
  contact_instagram_bw: string | null;
  contact_intro: ContactIntro;
  contact_links: ContactLink[];
  footer_legal_links: LegalLink[];
};

function fromRow(r: any): Settings {
  return {
    id: r.id, site_name: r.site_name ?? "", logo_media_id: r.logo_media_id, favicon_media_id: r.favicon_media_id,
    contact_email: r.contact_email, contact_phone: r.contact_phone, contact_address: r.contact_address,
    social: (r.social as Social[]) ?? [], footer_text: r.footer_text,
    seo_title: r.seo_title, seo_description: r.seo_description, seo_og_media_id: r.seo_og_media_id,
    press_dossier_media_id: r.press_dossier_media_id ?? null,
    home_image_desktop_media_id: r.home_image_desktop_media_id ?? null,
    home_image_tablet_media_id: r.home_image_tablet_media_id ?? null,
    home_image_mobile_media_id: r.home_image_mobile_media_id ?? null,
    contact_photo_media_id: r.contact_photo_media_id ?? null,
    contact_instagram_color: r.contact_instagram_color ?? null,
    contact_instagram_bw: r.contact_instagram_bw ?? null,
    contact_intro: {
      en: r.contact_intro?.en ?? "",
      fr: r.contact_intro?.fr ?? "",
      es: r.contact_intro?.es ?? "",
    },
    contact_links: Array.isArray(r.contact_links) ? (r.contact_links as ContactLink[]) : [],
    footer_legal_links: Array.isArray(r.footer_legal_links) ? (r.footer_legal_links as LegalLink[]) : [],
  };
}

function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("singleton", true).maybeSingle();
      if (!data) {
        const { data: ins, error } = await supabase.from("site_settings").insert({ singleton: true, site_name: "Estela Currao", social: [] }).select().single();
        if (error) toast.error(error.message);
        else setS(fromRow(ins));
      } else setS(fromRow(data));
    })();
  }, []);

  async function save() {
    if (!s) return;
    // Contact validation
    const contactSchema = z.object({
      contact_email: z.string().trim().email("Email inválido").max(255).nullable().or(z.literal("")),
      contact_instagram_color: z.string().trim().url("URL inválida").max(500).nullable().or(z.literal("")),
      contact_instagram_bw: z.string().trim().url("URL inválida").max(500).nullable().or(z.literal("")),
      contact_intro: z.object({
        en: z.string().max(2000),
        fr: z.string().max(2000),
        es: z.string().max(2000),
      }).refine((v) => v.en.trim() || v.fr.trim() || v.es.trim(), {
        message: "La introducción debe tener contenido en al menos un idioma",
      }),
      contact_links: z.array(z.object({
        title: z.string().trim().min(1, "Título requerido").max(120),
        url: z.string().trim().url("URL inválida").max(500),
      })),
      footer_legal_links: z.array(z.object({
        title: z.string().trim().min(1, "Título requerido").max(120),
        url: z.string().trim().url("URL inválida").max(500),
      })),
    });
    const parsed = contactSchema.safeParse({
      contact_email: s.contact_email ?? "",
      contact_instagram_color: s.contact_instagram_color ?? "",
      contact_instagram_bw: s.contact_instagram_bw ?? "",
      contact_intro: s.contact_intro,
      contact_links: s.contact_links,
      footer_legal_links: s.footer_legal_links,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("site_settings").update({
      site_name: s.site_name, logo_media_id: s.logo_media_id, favicon_media_id: s.favicon_media_id,
      contact_email: s.contact_email, contact_phone: s.contact_phone, contact_address: s.contact_address,
      social: s.social, footer_text: s.footer_text,
      seo_title: s.seo_title, seo_description: s.seo_description, seo_og_media_id: s.seo_og_media_id,
      press_dossier_media_id: s.press_dossier_media_id,
      home_image_desktop_media_id: s.home_image_desktop_media_id,
      home_image_tablet_media_id: s.home_image_tablet_media_id,
      home_image_mobile_media_id: s.home_image_mobile_media_id,
      contact_photo_media_id: s.contact_photo_media_id,
      contact_instagram_color: s.contact_instagram_color,
      contact_instagram_bw: s.contact_instagram_bw,
      contact_intro: s.contact_intro,
      contact_links: s.contact_links,
      footer_legal_links: s.footer_legal_links,
    }).eq("id", s.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Configuración guardada");
  }

  if (!s) return <p className="text-sm text-neutral-400">Cargando…</p>;

  return (
    <AdminSection
      title="Configuración del sitio"
      description="Ajustes generales, contacto, redes sociales, footer y SEO global."
      actions={<Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>}
    >
      <AdminCard>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-500">General</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Nombre del sitio</Label>
            <Input value={s.site_name} onChange={(e)=>setS({...s,site_name:e.target.value})} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Logo</Label>
            <MediaPicker value={s.logo_media_id} onChange={(id)=>setS({...s,logo_media_id:id})} />
          </div>
          <div className="space-y-2"><Label>Favicon</Label>
            <MediaPicker value={s.favicon_media_id} onChange={(id)=>setS({...s,favicon_media_id:id})} />
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-500">Imagen de la Home</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Subí una versión para cada dispositivo. Si dejás alguna vacía, se mostrará la imagen por defecto.
          Escritorio: ≥1024px · Tableta: 768–1023px · Teléfono: &lt;768px.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label>Escritorio</Label>
            <MediaPicker value={s.home_image_desktop_media_id} onChange={(id)=>setS({...s,home_image_desktop_media_id:id})} />
          </div>
          <div className="space-y-2"><Label>Tableta</Label>
            <MediaPicker value={s.home_image_tablet_media_id} onChange={(id)=>setS({...s,home_image_tablet_media_id:id})} />
          </div>
          <div className="space-y-2"><Label>Teléfono</Label>
            <MediaPicker value={s.home_image_mobile_media_id} onChange={(id)=>setS({...s,home_image_mobile_media_id:id})} />
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-500">CONTACT</h2>
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

      <AdminCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">Redes sociales</h2>
          <Button type="button" variant="outline" size="sm" onClick={()=>setS({...s, social:[...s.social, { label:"", url:"" }]})}>
            Añadir red
          </Button>
        </div>
        {s.social.length === 0 ? <p className="text-xs text-neutral-400">Sin redes.</p> : (
          <div className="space-y-2">
            {s.social.map((sn, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                <Input placeholder="Instagram, Behance…" value={sn.label} onChange={(e)=>{
                  const next = s.social.slice(); next[i] = { ...next[i], label: e.target.value }; setS({ ...s, social: next });
                }} />
                <Input placeholder="URL" value={sn.url} onChange={(e)=>{
                  const next = s.social.slice(); next[i] = { ...next[i], url: e.target.value }; setS({ ...s, social: next });
                }} />
                <button className="text-xs text-red-600 hover:underline" onClick={()=>setS({...s, social: s.social.filter((_,idx)=>idx!==i)})}>Quitar</button>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-500">Footer / Copyright</h2>
        <div className="space-y-2">
          <Label>Texto de copyright</Label>
          <Textarea rows={3} value={s.footer_text ?? ""} onChange={(e)=>setS({...s,footer_text:e.target.value})} placeholder="© Estela Currao. Todos los derechos reservados." />
        </div>
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Enlaces legales</p>
            <Button type="button" variant="outline" size="sm" onClick={()=>setS({...s, footer_legal_links:[...s.footer_legal_links, { title:"", url:"" }]})}>
              Añadir enlace
            </Button>
          </div>
          {s.footer_legal_links.length === 0 ? <p className="text-xs text-neutral-400">Sin enlaces legales.</p> : (
            <div className="space-y-2">
              {s.footer_legal_links.map((ln, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                  <Input placeholder="Política de privacidad" value={ln.title} onChange={(e)=>{
                    const next = s.footer_legal_links.slice(); next[i] = { ...next[i], title: e.target.value }; setS({ ...s, footer_legal_links: next });
                  }} />
                  <Input placeholder="https://…" value={ln.url} onChange={(e)=>{
                    const next = s.footer_legal_links.slice(); next[i] = { ...next[i], url: e.target.value }; setS({ ...s, footer_legal_links: next });
                  }} />
                  <button type="button" className="text-xs text-red-600 hover:underline" onClick={()=>setS({...s, footer_legal_links: s.footer_legal_links.filter((_,idx)=>idx!==i)})}>Quitar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-500">SEO general</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2"><Label>Meta title</Label>
            <Input value={s.seo_title ?? ""} onChange={(e)=>setS({...s,seo_title:e.target.value})} />
          </div>
          <div className="space-y-2 md:col-span-2"><Label>Meta description</Label>
            <Textarea rows={3} value={s.seo_description ?? ""} onChange={(e)=>setS({...s,seo_description:e.target.value})} />
          </div>
          <div className="space-y-2 md:col-span-2"><Label>Imagen social (OG)</Label>
            <MediaPicker value={s.seo_og_media_id} onChange={(id)=>setS({...s,seo_og_media_id:id})} />
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-500">Dossier de Presse (PDF)</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Subí el PDF del dossier de prensa. Mientras no haya archivo, la página <code>/press-dossier</code> muestra “Coming Soon”.
        </p>
        <MediaPicker
          value={s.press_dossier_media_id}
          onChange={(id) => setS({ ...s, press_dossier_media_id: id })}
          bucket={DOCS_BUCKET}
          accept="application/pdf"
        />
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
  title: z
    .string()
    .trim()
    .min(1, { message: "El título es obligatorio" })
    .max(80, { message: "Máximo 80 caracteres" }),
  url: z
    .string()
    .trim()
    .min(1, { message: "La URL es obligatoria" })
    .max(500, { message: "Máximo 500 caracteres" })
    .url({ message: "URL inválida (ej: https://…)" }),
});

function NewLinkButton({ onCreate }: { onCreate: (link: ContactLink) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});

  function reset() {
    setTitle("");
    setUrl("");
    setErrors({});
  }

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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
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
            <Input
              id="new-link-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Galería X"
              maxLength={80}
              autoFocus
            />
            {errors.title ? <p className="text-xs text-red-600">{errors.title}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-link-url">URL</Label>
            <Input
              id="new-link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              maxLength={500}
            />
            {errors.url ? <p className="text-xs text-red-600">{errors.url}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Agregar enlace</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}