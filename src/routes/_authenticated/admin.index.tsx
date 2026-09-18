import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Panel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

type Stats = {
  categories: number;
  subcategories: number;
  works: number;
  publications: number;
  news: number;
  media: number;
};

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const tables = [
        "categories",
        "subcategories",
        "works",
        "publications",
        "news",
        "media",
      ] as const;
      const results = await Promise.all(
        tables.map((t) =>
          supabase.from(t).select("*", { count: "exact", head: true }),
        ),
      );
      setStats({
        categories: results[0].count ?? 0,
        subcategories: results[1].count ?? 0,
        works: results[2].count ?? 0,
        publications: results[3].count ?? 0,
        news: results[4].count ?? 0,
        media: results[5].count ?? 0,
      });
    })();
  }, []);

  const cards: { label: string; value: number; to: string }[] = [
    { label: "Categorías", value: stats?.categories ?? 0, to: "/admin/categories" },
    { label: "Subcategorías", value: stats?.subcategories ?? 0, to: "/admin/subcategories" },
    { label: "Obras", value: stats?.works ?? 0, to: "/admin/works" },
    { label: "Publicaciones", value: stats?.publications ?? 0, to: "/admin/publications" },
    { label: "News", value: stats?.news ?? 0, to: "/admin/news" },
    { label: "Media", value: stats?.media ?? 0, to: "/admin/media" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-neutral-900">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Resumen del contenido publicado en el sitio.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-md border border-neutral-200 bg-white p-6 transition hover:border-neutral-900"
          >
            <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">
              {c.label}
            </div>
            <div className="mt-3 text-3xl font-light text-neutral-900">
              {c.value}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}