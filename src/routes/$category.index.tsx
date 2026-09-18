import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ThemeGallery } from "@/components/ThemeGallery";
import { siteContentQueryOptions, themeBySlug } from "@/lib/site-content";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";
import { buildThemeIndexHead } from "@/lib/artwork-seo";

export const Route = createFileRoute("/$category/")({
  loader: async ({ params, context }) => {
    const themes = await context.queryClient.ensureQueryData(siteContentQueryOptions);
    const theme = themeBySlug(themes, params.category);
    if (!theme) throw notFound();
    return { theme };
  },
  head: ({ params, loaderData }) => {
    // Categoría inexistente o desactivada: metadatos de 404, sin indexar.
    if (!loaderData?.theme) {
      return {
        meta: [
          { title: "Page not found (404) — Estela Currao" },
          {
            name: "description",
            content: "The page you are looking for does not exist or has been moved.",
          },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return buildThemeIndexHead({
      themeSlug: params.category,
      title: `${loaderData.theme.title} — Estela Currao`,
      description: `${loaderData.theme.title} series by visual artist Estela Currao.`,
      theme: loaderData.theme,
    });
  },
  notFoundComponent: () => (
    <RouteNotFoundFallback title="Not found" message="This section does not exist." backTo="/" backLabel="Back home" />
  ),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
  ),
  component: function CategoryIndex() {
    const { category } = Route.useParams();
    const { data: themes } = useSuspenseQuery(siteContentQueryOptions);
    const theme = themeBySlug(themes, category);
    if (!theme) throw new Error("Theme not found");
    return <ThemeGallery theme={theme} themesForNav={themes} />;
  },
});