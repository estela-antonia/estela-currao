import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { RouteErrorFallback } from "@/components/RouteFallbacks";
import { BASE_URL } from "@/lib/site";
import heroAsset from "@/assets/estela_home.webp";

const TITLE = "Architecture — Estela Currao | Architect and Visual Artist";
const DESCRIPTION =
  "How architecture shapes the work of Estela Currao, architect and visual artist: threshold, structure, rhythm, void and scale, from architectural drawing to sculpture, painting and photography.";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "Estela Currao architect, architecture portfolio, architect visual artist, architectural photography, threshold, heterotopia, arquitecta artista visual",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/architecture` },
      { property: "og:image", content: `${BASE_URL}${heroAsset}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${BASE_URL}${heroAsset}` },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/architecture` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${BASE_URL}/architecture#page`,
          url: `${BASE_URL}/architecture`,
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: "en",
          about: { "@id": `${BASE_URL}/#person` },
          isPartOf: { "@id": `${BASE_URL}/#website` },
          primaryImageOfPage: `${BASE_URL}${heroAsset}`,
          mainEntity: {
            "@id": `${BASE_URL}/#person`,
            "@type": "Person",
            name: "Estela Currao",
            jobTitle: ["Architect", "Visual artist"],
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Architecture", item: `${BASE_URL}/architecture` },
          ],
        }),
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
  ),
  component: ArchitecturePage,
});

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "threshold",
    body: "Architecture begins with a decision about passage: what opens, what closes, what remains suspended in between. That question travels intact into the photographic work, where doorways, edges and interiors are read less as places than as conditions — the threshold as a form of attention.",
  },
  {
    heading: "structure and rhythm",
    body: "A plan is a rhythm before it is a building: repetition, interval, interruption. The Rhythmic Matrices series works with that grammar directly, translating modular thinking and structural cadence into painting, where the grid is never mechanical but breathes with the hand.",
  },
  {
    heading: "void and scale",
    body: "In architecture the void carries as much weight as the mass that defines it. Sculpture keeps that discipline: volume is measured against the air around it, and scale becomes a relation to the body rather than a dimension on a drawing.",
  },
  {
    heading: "material",
    body: "Bronze, pigment, paper and light are treated as construction materials — chosen for how they age, absorb and resist. Making remains an act of assembly, closer to a site than to a studio gesture.",
  },
];

const CTAS: { label: string; to: string; params?: Record<string, string>; note: string }[] = [
  {
    label: "photography",
    to: "/media/$type",
    params: { type: "photography" },
    note: "Architecture, threshold and heterotopia in the photographic work.",
  },
  {
    label: "rhythmic matrices",
    to: "/$category",
    params: { category: "rhythmic-matrices" },
    note: "Structure, interval and cadence translated into painting.",
  },
  {
    label: "identity",
    to: "/$category",
    params: { category: "identity" },
    note: "Body, volume and void in the sculptural series.",
  },
  {
    label: "all works",
    to: "/works",
    note: "Every series, by thematic world.",
  },
];

function ArchitecturePage() {
  return (
    <SiteLayout aside={null}>
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-10 font-sans text-[14px] font-light lowercase tracking-[0.28em] text-neutral-900 md:text-[16px]">
          architecture
        </h1>

        <p className="max-w-2xl font-sans text-[15px] font-light leading-relaxed text-neutral-700 md:text-[17px]">
          Estela Currao works as an architect and a visual artist. The two practices are not
          separate chapters: architectural thinking — threshold, structure, rhythm, void, scale and
          material — is the method that organises the sculpture, painting and photography gathered
          on this site.
        </p>

        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-x-14">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="mb-3 font-sans text-[11px] font-light uppercase tracking-[0.24em] text-neutral-500">
                {s.heading}
              </h2>
              <p className="font-sans text-[14px] font-light leading-relaxed text-neutral-700 md:text-[15px]">
                {s.body}
              </p>
            </section>
          ))}
        </div>

        <h2 className="mt-20 mb-4 font-sans text-[11px] font-light uppercase tracking-[0.24em] text-neutral-500">
          related work
        </h2>
        <ul className="flex flex-col divide-y divide-neutral-100 border-y border-neutral-100">
          {CTAS.map((c) => (
            <li key={c.label}>
              <Link
                to={c.to as never}
                params={c.params as never}
                className="flex flex-col gap-1 py-4 transition-opacity hover:opacity-60 md:flex-row md:items-baseline md:justify-between md:gap-8"
              >
                <span className="font-sans text-[15px] font-light lowercase tracking-[0.22em] text-neutral-900 md:text-[17px]">
                  {c.label}
                </span>
                <span className="font-sans text-[13px] font-light text-neutral-500 md:text-right">
                  {c.note}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-16 font-sans text-[14px] font-light leading-relaxed text-neutral-700">
          For architectural collaborations, commissions or studio enquiries,{" "}
          <Link to="/contact" className="underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900">
            get in touch
          </Link>
          .
        </p>
      </div>
    </SiteLayout>
  );
}