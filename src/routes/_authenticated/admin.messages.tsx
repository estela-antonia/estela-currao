import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminSection, AdminCard } from "@/components/admin/AdminSection";
import { getEmailFailureAlerts } from "@/lib/admin-inbox.functions";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  head: () => ({
    meta: [{ title: "Mensajes — Panel" }, { name: "robots", content: "noindex" }],
  }),
  component: MessagesAdminPage,
});

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type Alert = {
  id: string;
  template: string;
  recipient: string;
  status: string;
  error: string | null;
  createdAt: string;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function MessagesAdminPage() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const loadAlerts = useServerFn(getEmailFailureAlerts);

  async function load() {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, message, is_read, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setMessages([]);
      return;
    }
    setMessages((data ?? []) as Message[]);
  }

  async function refresh() {
    await load();
    try {
      const res = await loadAlerts();
      setAlerts(res.alerts as Alert[]);
    } catch {
      setAlerts([]);
    }
  }

  useEffect(() => {
    void refresh();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setRead(id: string, is_read: boolean) {
    const { error } = await supabase.from("contact_messages").update({ is_read }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessages((prev) => prev?.map((m) => (m.id === id ? { ...m, is_read } : m)) ?? null);
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este mensaje definitivamente?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessages((prev) => prev?.filter((m) => m.id !== id) ?? null);
    toast.success("Mensaje eliminado");
  }

  if (!messages) return <p className="text-sm text-neutral-400">Cargando…</p>;

  const unread = messages.filter((m) => !m.is_read).length;
  const shown = filter === "unread" ? messages.filter((m) => !m.is_read) : messages;

  return (
    <AdminSection
      title="Mensajes"
      description={`Bandeja del formulario de contacto — ${messages.length} en total, ${unread} sin leer.`}
      actions={
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            Todos
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
            Sin leer ({unread})
          </Button>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Actualizar
          </Button>
        </div>
      }
    >
      {alerts.length > 0 ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Alertas de envío de email ({alerts.length})
          </p>
          <p className="mt-1 text-xs text-red-700">
            Estos avisos por email no se entregaron. Los mensajes siguen guardados en esta bandeja.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-red-800">
            {alerts.map((a) => (
              <li key={a.id}>
                {fmt(a.createdAt)} — {a.template} → {a.recipient} ({a.status}
                {a.error ? `: ${a.error}` : ""})
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AdminCard className="p-0">
        {shown.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400">No hay mensajes.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {shown.map((m) => {
              const isOpen = openId === m.id;
              return (
                <li key={m.id} className={m.is_read ? "bg-white" : "bg-neutral-50"}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                    onClick={() => {
                      setOpenId(isOpen ? null : m.id);
                      if (!isOpen && !m.is_read) void setRead(m.id, true);
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className={
                        "h-2 w-2 shrink-0 rounded-full " +
                        (m.is_read ? "bg-transparent" : "bg-neutral-900")
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={
                          "block truncate text-sm " +
                          (m.is_read ? "text-neutral-700" : "font-medium text-neutral-900")
                        }
                      >
                        {m.name} · {m.email}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">
                        {m.message}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-neutral-400">{fmt(m.created_at)}</span>
                  </button>

                  {isOpen ? (
                    <div className="border-t border-neutral-200 bg-white px-5 py-5">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-800">
                        {m.message}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Button asChild size="sm">
                          <a
                            href={`mailto:${m.email}?subject=${encodeURIComponent(
                              "Re: your message — Estela Currao",
                            )}&body=${encodeURIComponent(
                              `\n\n---\n${m.name} wrote on ${fmt(m.created_at)}:\n${m.message}`,
                            )}`}
                          >
                            Responder por email
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void setRead(m.id, !m.is_read)}>
                          {m.is_read ? "Marcar como no leído" : "Marcar como leído"}
                        </Button>
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => void remove(m.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </AdminSection>
  );
}
