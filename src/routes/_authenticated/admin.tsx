import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    await supabase.rpc("bootstrap_admin");
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin");
    if (!roles || roles.length === 0) {
      throw redirect({ to: "/" });
    }
    return { userId: userData.user.id, email: userData.user.email ?? "" };
  },
  component: AdminLayout,
});

const NAV: { to: string; label: string; group?: string }[] = [
  { to: "/admin", label: "Dashboard", group: "General" },
  { to: "/admin/categories", label: "Categorías", group: "Contenido" },
  { to: "/admin/subcategories", label: "Subcategorías", group: "Contenido" },
  { to: "/admin/works", label: "Obras", group: "Contenido" },
  { to: "/admin/media-seo", label: "SEO Media", group: "Contenido" },
  { to: "/admin/publications", label: "Publicaciones", group: "Contenido" },
  { to: "/admin/news", label: "News", group: "Contenido" },
  { to: "/admin/biography", label: "About", group: "Contenido" },
  { to: "/admin/contact", label: "CONTACT", group: "Contenido" },
  { to: "/admin/messages", label: "Mensajes", group: "General" },
  { to: "/admin/media", label: "Media library", group: "Recursos" },
  { to: "/admin/settings", label: "Configuración", group: "Sistema" },
  { to: "/admin/users", label: "Usuarios", group: "Sistema" },
];

function AdminLayout() {
  const { email } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  const groups = Array.from(new Set(NAV.map((n) => n.group ?? "")));

  return (
    <div lang="es" className="flex min-h-screen bg-neutral-50">
      <aside
        className={
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-neutral-200 bg-white transition-transform lg:static lg:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
        }
      >
        <div className="flex h-14 items-center border-b border-neutral-200 px-5">
          <Link
            to="/admin"
            className="text-xs font-medium uppercase tracking-[0.28em] text-neutral-900"
          >
            Estela Currao
          </Link>
        </div>
        <nav className="space-y-6 px-3 py-6">
          {groups.map((g) => (
            <div key={g}>
              <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                {g}
              </div>
              <div className="space-y-0.5">
                {NAV.filter((n) => (n.group ?? "") === g).map((item) => {
                  const active =
                    pathname === item.to ||
                    (item.to !== "/admin" && pathname.startsWith(item.to));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={
                        "block rounded-md px-3 py-2 text-sm transition-colors " +
                        (active
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-700 hover:bg-neutral-100")
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 lg:ml-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-8">
          <button
            type="button"
            className="lg:hidden text-xs uppercase tracking-widest"
            onClick={() => setOpen((v) => !v)}
          >
            Menú
          </button>
          <div className="hidden text-xs uppercase tracking-[0.2em] text-neutral-500 lg:block">
            Panel de administración
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="hidden sm:inline">{email}</span>
            <Link
              to="/"
              className="uppercase tracking-[0.2em] hover:text-neutral-900"
            >
              Ver sitio
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="uppercase tracking-[0.2em] hover:text-neutral-900"
            >
              Salir
            </button>
          </div>
        </header>
        <main className="px-4 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}