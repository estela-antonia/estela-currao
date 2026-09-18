import { createFileRoute, notFound } from "@tanstack/react-router";
import { RouteNotFoundFallback } from "@/components/RouteFallbacks";

export const Route = createFileRoute("/$")({
  // Throwing notFound() makes the server respond with a real 404 status
  // instead of a soft 404 (200 with a "not found" page).
  loader: () => {
    throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Page not found (404) — Estela Currao" },
      {
        name: "description",
        content:
          "The page you are looking for does not exist or has been moved. Return home to explore the work of Estela Currao.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Page not found (404) — Estela Currao" },
      {
        property: "og:description",
        content: "The page you are looking for does not exist or has been moved.",
      },
    ],
  }),
  component: NotFoundPage,
  notFoundComponent: NotFoundPage,
});

function NotFoundPage() {
  return (
    <RouteNotFoundFallback
      title="Page not found"
      message="The page you are looking for doesn't exist or has been moved."
      backTo="/"
      backLabel="Back home"
    />
  );
}
