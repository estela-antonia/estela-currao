import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { RouteNotFoundFallback, RouteErrorFallback } from "@/components/RouteFallbacks";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => (
      <RouteNotFoundFallback
        title="Page not found"
        message="The page you are looking for doesn't exist or has been moved."
        backTo="/"
        backLabel="Back home"
      />
    ),
    defaultErrorComponent: ({ error, reset }) => (
      <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
    ),
  });

  // Reuse SSR-fetched data on the client: avoids double fetching and
  // hydration mismatches from per-request signed media URLs.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
