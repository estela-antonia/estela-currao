import { createFileRoute, notFound } from "@tanstack/react-router";
import { ThemeWorkPage } from "@/components/ThemeWorkPage";
import {
  siteContentQueryOptions,
  themeBySlug,
  getWorkBySlug,
} from "@/lib/site-content";
import { buildArtworkHeadFromLoader } from "@/lib/artwork-seo";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";

export const Route = createFileRoute("/$category/$work/")({
  loader: async ({ params, context }) => {
    const themes = await context.queryClient.ensureQueryData(siteContentQueryOptions);
    const theme = themeBySlug(themes, params.category);
    const work = getWorkBySlug(themes, params.category, params.work);
    if (!theme || !work) throw notFound();
    return { theme, work };
  },
  head: ({ params, loaderData }) =>
    buildArtworkHeadFromLoader(params.category, params.work, loaderData),
  notFoundComponent: () => (
    <RouteNotFoundFallback
      title="Series not found"
      message="This series does not exist."
      backTo="/"
      backLabel="Back home"
    />
  ),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
  ),
  component: function CategoryWorkGrid() {
    const { theme, work } = Route.useLoaderData();
    return <ThemeWorkPage theme={theme} work={work} />;
  },
});