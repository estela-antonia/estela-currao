import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArtworkPage } from "@/components/ArtworkPage";
import {
  siteContentQueryOptions,
  themeBySlug,
  getWorkBySlug,
} from "@/lib/site-content";
import { buildArtworkHeadFromLoader } from "@/lib/artwork-seo";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";

export const Route = createFileRoute("/$category/$work/$piece")({
  loader: async ({ params, context }) => {
    const themes = await context.queryClient.ensureQueryData(siteContentQueryOptions);
    const theme = themeBySlug(themes, params.category);
    const work = getWorkBySlug(themes, params.category, params.work);
    if (!theme || !work) throw notFound();
    const piece = Number(params.piece);
    if (!Number.isFinite(piece) || piece < 1) throw notFound();
    return { theme, work, piece };
  },
  head: ({ params, loaderData }) =>
    buildArtworkHeadFromLoader(params.category, params.work, loaderData, params.piece),
  notFoundComponent: () => (
    <RouteNotFoundFallback
      title="Artwork not found"
      message="This artwork does not exist or has been moved."
      backTo="/"
      backLabel="Back home"
    />
  ),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
  ),
  component: function CategoryPiece() {
    const { theme, work, piece } = Route.useLoaderData();
    return <ArtworkPage theme={theme} work={work} pieceIndex={piece} />;
  },
});