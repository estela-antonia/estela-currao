import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/AdminSection";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Usuarios — Panel" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});

type Role = { id: string; user_id: string; role: string; created_at: string };

function UsersPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRoles((data as Role[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void reload(); }, []);

  async function revoke(r: Role) {
    if (!confirm(`¿Quitar rol "${r.role}" a este usuario?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", r.id);
    if (error) toast.error(error.message); else { toast.success("Rol eliminado"); reload(); }
  }

  return (
    <AdminSection
      title="Usuarios y roles"
      description="Solo los usuarios con rol admin pueden acceder al panel."
    >
      <div className="rounded-md border border-neutral-200 bg-white p-6">
        <h2 className="mb-2 text-sm font-medium">Añadir administrador</h2>
        <p className="text-xs text-neutral-500">
          Pídele a la persona que se registre desde <code className="rounded bg-neutral-100 px-1">/auth</code>,
          copia su user_id (UUID) y pégalo abajo.
        </p>
        <AddAdminForm onDone={reload} />
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-widest text-neutral-500">
            <tr><th className="px-4 py-3">User ID</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Alta</th><th className="px-4 py-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">Cargando…</td></tr>
            : roles.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">Sin roles.</td></tr>
            : roles.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 last:border-b-0">
                <td className="px-4 py-3 font-mono text-xs">{r.user_id}</td>
                <td className="px-4 py-3">{r.role}</td>
                {/* Fixed YYYY-MM-DD format, consistent with news and publications tables. */}
                <td className="px-4 py-3 text-neutral-500">{r.created_at?.slice(0, 10) ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={()=>revoke(r)} className="text-xs text-red-600 hover:underline">Revocar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSection>
  );
}

function AddAdminForm({ onDone }: { onDone: () => void }) {
  const [uid, setUid] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!uid.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid.trim(), role: "admin" });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Administrador añadido"); setUid(""); onDone(); }
  }
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={uid}
        onChange={(e)=>setUid(e.target.value)}
        placeholder="user_id (UUID)"
        className="flex-1 rounded-md border border-neutral-200 px-3 py-2 font-mono text-xs"
      />
      <button
        onClick={add}
        disabled={busy}
        className="rounded-md bg-neutral-900 px-4 text-xs uppercase tracking-widest text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        Añadir
      </button>
    </div>
  );
}