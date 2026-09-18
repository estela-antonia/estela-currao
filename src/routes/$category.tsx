import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { siteContentQueryOptions, themeBySlug } from "@/lib/site-content";
import { RouteNotFoundFallback, RouteErrorFallback } from "@/components/RouteFallbacks";

// Slugs that belong to other top-level routes and must never be treated as
// dynamic categories (otherwise a user creating category `admin` would break
// the panel URL).
const RESERVED = new Set([
  "admin",
  "auth",
  "contact",
  "news",
  "media",
  "press-dossier",
  "sitemap.xml",
  "api",
  "assets",
  "_authenticated",
  "works",
]);

export const Route = createFileRoute("/$category")({
  loader: async ({ params, context }) => {
    if (RESERVED.has(params.category)) throw notFound();
    const themes = await context.queryClient.ensureQueryData(siteContentQueryOptions);
    const theme = themeBySlug(themes, params.category);
    if (!theme) throw notFound();
    return { theme };
  },
  notFoundComponent: () => (
    <RouteNotFoundFallback
      title="Category not found"
      message="This section does not exist."
      backTo="/"
      backLabel="Back home"
    />
  ),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
  ),
  component: () => <Outlet />,
});