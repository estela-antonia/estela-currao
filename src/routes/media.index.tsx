import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { mediaSlotsQueryOptions } from "@/lib/site-content";
import { BASE_URL } from "@/lib/site";
import { RouteErrorFallback } from "@/components/RouteFallbacks";

export const Route = createFileRoute("/media/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(mediaSlotsQueryOptions),
  head: () => ({
    meta: [
      { title: "Media — Estela Currao | Sculpture, Painting, Photography" },
      { name: "description", content: "Artistic disciplines of Estela Currao: contemporary sculpture, painting and photography." },
      { property: "og:title", content: "Media — Estela Currao" },
      { property: "og:description", content: "Artistic disciplines of Estela Currao: contemporary sculpture, painting and photography." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/media` },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/media` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${BASE_URL}/media#collection`,
          url: `${BASE_URL}/media`,
          name: "Media — Estela Currao",
          description:
            "Artistic disciplines of Estela Currao: contemporary sculpture, painting and photography.",
          isPartOf: { "@id": `${BASE_URL}/#website` },
          about: { "@id": `${BASE_URL}/#person` },
          hasPart: [
            { "@type": "CollectionPage", name: "Sculpture", url: `${BASE_URL}/media/sculpture` },
            { "@type": "CollectionPage", name: "Painting", url: `${BASE_URL}/media/painting` },
            { "@type": "CollectionPage", name: "Photography", url: `${BASE_URL}/media/photography` },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Media", item: `${BASE_URL}/media` },
          ],
        }),
      },
    ],
  }),
  component: MediaPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
  ),
});

function MediaPage() {
  const { data: slotContent } = useSuspenseQuery(mediaSlotsQueryOptions);
  // 3 carriles (Sculpture / Painting / Photography).
  // Cada slot: ancho relativo (30–37%), alineación lateral y offset vertical
  // para crear un ritmo escalonado tipo cascada con mucho silencio entre los
  // elementos.
  const lanes: {
    id: string;
    type: "sculpture" | "painting" | "photography";
    label: string;
    slots: {
      id: string;
      w: number;              // 0.60–0.74
      align: "start" | "center" | "end";
      ratio: number;          // aspect-ratio (w/h)
      // Offset vertical del inicio de cada fila, expresado como fracción del
      // ancho del viewport (vw). Se traduce a clamp() para escalar en todos
      // los tamaños de pantalla manteniendo el ritmo cascada.
      mt?: number;            // 0–0.14 (0–14vw)
    }[];
  }[] = [
    {
      id: "sculpture",
      type: "sculpture",
      label: "SCULPTURE",
      slots: [
        { id: "s-1", w: 0.35, align: "start", ratio: 3 / 4, mt: 0.00 },
        { id: "s-2", w: 0.31, align: "end",   ratio: 1,     mt: 0.05 },
        { id: "s-3", w: 0.33, align: "start", ratio: 4 / 5, mt: 0.09 },
      ],
    },
    {
      id: "painting",
      type: "painting",
      label: "PAINTING",
      slots: [
        { id: "p-1", w: 0.32, align: "start", ratio: 4 / 5, mt: 0.03 },
        { id: "p-2", w: 0.36, align: "end",   ratio: 5 / 4, mt: 0.06 },
        { id: "p-3", w: 0.30, align: "start", ratio: 1,     mt: 0.11 },
      ],
    },
    {
      id: "photography",
      type: "photography",
      label: "PHOTOGRAPHY",
      slots: [
        { id: "sp-1", w: 0.34, align: "start", ratio: 3 / 4, mt: 0.06 },
        { id: "sp-2", w: 0.31, align: "end", ratio: 4 / 5, mt: 0.06 },
        { id: "sp-3", w: 0.35, align: "start", ratio: 5 / 4, mt: 0.075 },
      ],
    },
  ];

  const mobileSlotId: Record<"sculpture" | "painting" | "photography", string> = {
    sculpture: "sculpture-1",
    painting: "painting-1",
    photography: "photography-1",
  };

  const alignClass = {
    start: "self-start",
    center: "self-center",
    end: "self-end",
  } as const;

  // Convierte una fracción de vw en un clamp() responsive:
  // mínimo 12px, ideal (fracción * 100)vw, máximo (fracción * 1600)px.
  // El factor de máximo asegura que nunca sea menor que el mínimo y que
  // escale adecuadamente en pantallas grandes.
  const mtStyle = (mt: number | undefined) => {
    if (!mt) return "0px";
    const min = Math.max(12, Math.round(mt * 80));
    const max = Math.max(min + 20, Math.round(mt * 1600));
    return `clamp(${min}px, ${(mt * 100).toFixed(2)}vw, ${max}px)`;
  };

  return (
    <SiteLayout
      asideClassName="hidden md:block"
      aside={
        <div className="flex flex-col gap-8">
          <ul className="flex flex-col gap-4 md:gap-5">
            {lanes.map((lane) => (
              <li key={lane.id}>
                <Link
                  to="/media/$type"
                  params={{ type: lane.type }}
                  className="text-sm uppercase tracking-[0.24em] font-light text-neutral-400 hover:text-neutral-900"
                >
                  {lane.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <h1 className="sr-only">
        Media — Estela Currao: contemporary sculpture, painting and photography
      </h1>

      {/* Desktop: composición cascada de 3 carriles con placeholders */}
      <div className="hidden md:grid w-full grid-cols-3 gap-x-[clamp(80px,9vw,140px)]">
        {lanes.map((lane) => (
          <div key={lane.id} className="flex flex-col" data-lane={lane.id}>
            {lane.slots.map((s, idx) => {
              // La segunda imagen de cada carril comienza exactamente en la
              // mitad horizontal de la imagen superior (eje central de la
              // primera foto), no alineada al centro ni al borde de la columna.
              const isSecondSlot = idx === 1;
              const leftOffset = isSecondSlot
                ? `${(lane.slots[0].w / 2) * 100}%`
                : undefined;
              const slotKey = `${lane.id}-${idx + 1}`;
              const content = slotContent[slotKey];
              return (
                <Link
                  key={s.id}
                  to="/media/$type"
                  params={{ type: lane.type }}
                  data-slot-id={s.id}
                  className={`${isSecondSlot ? "self-start" : alignClass[s.align]} bg-neutral-200 block overflow-hidden transition-opacity hover:opacity-80`}
                  aria-label={content?.alt ? `${content.alt} — ${lane.label}` : `Open ${lane.label}`}
                  style={{
                    width: `${s.w * 100}%`,
                    aspectRatio: `${s.ratio}`,
                    marginTop: mtStyle(s.mt),
                    marginLeft: leftOffset,
                  }}
                >
                  {content ? (
                    <img
                      src={content.src}
                      alt={content.alt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile: lista horizontal con miniatura. La imagen ocupa un 40 % para
          que el texto de la categoría (especialmente "PHOTOGRAPHY") no se
          corte en pantallas estrechas. */}
      <div className="md:hidden flex flex-col">
        {lanes.map((lane) => {
          const content = slotContent[mobileSlotId[lane.type]];
          return (
            <Link
              key={lane.id}
              to="/media/$type"
              params={{ type: lane.type }}
              className="group grid grid-cols-[minmax(0,40%)_minmax(0,1fr)] items-center gap-4 border-b border-neutral-100 py-5 first:pt-0 last:border-b-0"
              aria-label={lane.label}
            >
              <div className="relative w-full overflow-hidden aspect-[4/5] bg-background">
                {content?.src ? (
                  <img
                    src={content.src}
                    alt={content.alt ?? lane.label}
                    loading="lazy"
                    className="h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-85"
                  />
                ) : null}
              </div>

              <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="text-sm uppercase tracking-[0.24em] font-light text-neutral-900">
                  {lane.label}
                </span>
                <span className="shrink-0 text-sm uppercase tracking-[0.18em] text-neutral-400 transition-colors group-hover:text-neutral-900">
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>


    </SiteLayout>
  );
}
