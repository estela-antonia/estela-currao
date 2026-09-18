import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQueryOptions } from "@/lib/site-content";
import { SiteLayout } from "@/components/SiteLayout";
import { RouteErrorFallback } from "@/components/RouteFallbacks";
import { BASE_URL } from "@/lib/site";
import heroAsset from "@/assets/estela_home.webp";

export const Route = createFileRoute("/works")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQueryOptions),
  head: () => ({
    meta: [
      { title: "Works — Estela Currao" },
      { name: "description", content: "Explore the work of Estela Currao by series: sculpture, painting and photography grouped into her main thematic worlds." },
      { property: "og:title", content: "Works — Estela Currao" },
      { property: "og:description", content: "Explore the work of Estela Currao by series: sculpture, painting and photography grouped into her main thematic worlds." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/works` },
      { property: "og:image", content: `${BASE_URL}${heroAsset}` },
      { name: "twitter:image", content: `${BASE_URL}${heroAsset}` },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/works` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${BASE_URL}/works#collection`,
          url: `${BASE_URL}/works`,
          name: "Works — Estela Currao",
          description:
            "Thematic series of works by Estela Currao in sculpture, painting and photography.",
          about: { "@id": "https://estelacurrao.com/#person" },
          isPartOf: { "@id": "https://estelacurrao.com/#website" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Works", item: `${BASE_URL}/works` },
          ],
        }),
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
  ),
  component: WorksIndex,
});

function WorksIndex() {
  const { data: themes } = useSuspenseQuery(siteContentQueryOptions);
  return (
    <SiteLayout aside={null}>
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 font-sans text-[14px] font-light lowercase tracking-[0.28em] text-neutral-900 md:text-[16px]">
          works
        </h1>
        <ul className="flex flex-col divide-y divide-neutral-100 border-y border-neutral-100">
          {themes.map((t) => (
            <li key={t.slug}>
              <Link
                to="/$category"
                params={{ category: t.slug }}
                className="block py-4 font-sans text-[15px] font-light lowercase tracking-[0.22em] text-neutral-800 transition-opacity hover:opacity-60 md:text-[18px]"
              >
                {t.label.toLowerCase()}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/architecture"
          className="mt-8 inline-block font-sans text-[13px] font-light lowercase tracking-[0.22em] text-neutral-500 transition-colors hover:text-neutral-900"
        >
          architecture — the method behind the work
        </Link>
      </div>
    </SiteLayout>
  );
}