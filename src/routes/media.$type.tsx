import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import type { ThemeSlug, WorkPiece, Theme } from "@/lib/site-content.types";
import { siteContentQueryOptions, mediaSeoQueryOptions, type MediaSeo } from "@/lib/site-content";
import { BASE_URL } from "@/lib/site";
const homeAsset = { url: "/estela_home.webp" };
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";

type MediaType = "sculpture" | "painting" | "photography";

const TYPE_LABEL: Record<MediaType, string> = {
  sculpture: "SCULPTURE",
  painting: "PAINTING",
  photography: "PHOTOGRAPHY",
};

/**
 * Fallback pillar copy per discipline (bilingual FR + ES).
 * Used when the CMS has no published row for a discipline.
 */
const PILLAR: Record<
  MediaType,
  {
    h1Fr: string;
    h1Es: string;
    keyword: string;
    seoTitle: string;
    seoDescription: string;
    introFr: string;
    introEs: string;
  }
> = {
  sculpture: {
    h1Fr: "Sculpture contemporaine",
    h1Es: "Escultura contemporánea",
    keyword: "sculpture contemporaine",
    seoTitle:
      "Sculpture contemporaine — Estela Currao | Escultura contemporánea",
    seoDescription:
      "Sculpture contemporaine d'Estela Currao — escultura contemporánea de la artista visual y arquitecta. Series en bronce, obra figurativa y abstracta. Sculpture contemporaine, sculpture abstraite, escultura orgánica.",
    introFr:
      "Sculpture contemporaine d'Estela Currao — artiste visuelle et architecte. Une pratique tournée vers la matière, le corps et le vide : sculpture figurative en bronze, sculpture abstraite et sculpture organique. Chaque série interroge l'identité et le rythme des formes.",
    introEs:
      "Escultura contemporánea de Estela Currao — artista visual y arquitecta. Una práctica atenta a la materia, al cuerpo y al vacío: escultura figurativa en bronce, escultura abstracta y escultura orgánica. Cada serie interroga la identidad y el ritmo de las formas.",
  },
  painting: {
    h1Fr: "Peinture contemporaine",
    h1Es: "Pintura contemporánea",
    keyword: "peinture contemporaine",
    seoTitle:
      "Peinture contemporaine — Estela Currao | Pintura contemporánea abstracta",
    seoDescription:
      "Peinture contemporaine d'Estela Currao — pintura contemporánea abstracta y matérica. Obra pictórica de la artista visual y arquitecta: geste, rythme, matière. Peinture abstraite, pintura gestual.",
    introFr:
      "Peinture contemporaine d'Estela Currao — artiste visuelle et architecte. Une peinture abstraite qui explore la matière, le geste et le rythme, entre matrices rythmiques et zones d'influence. Peinture contemporaine française et internationale, gestuelle et matiériste.",
    introEs:
      "Pintura contemporánea de Estela Currao — artista visual y arquitecta. Una pintura abstracta que explora la materia, el gesto y el ritmo, entre matrices rítmicas y zonas de influencia. Pintura contemporánea gestual y matérica, en diálogo con la arquitectura.",
  },
  photography: {
    h1Fr: "Photographie artistique",
    h1Es: "Fotografía artística",
    keyword: "photographie artistique",
    seoTitle:
      "Photographie artistique — Estela Currao | Fotografía artística contemporánea",
    seoDescription:
      "Photographie artistique d'Estela Currao — fotografía artística contemporánea entre arquitectura, umbral y heterotopía. Obra fotográfica de la artista visual y arquitecta: photographie urbaine, architecturale et conceptuelle.",
    introFr:
      "Photographie artistique d'Estela Currao — artiste visuelle et architecte. Une photographie contemporaine qui interroge l'architecture, le seuil et l'hétérotopie. Photographie urbaine, photographie architecturale et instants suspendus.",
    introEs:
      "Fotografía artística de Estela Currao — artista visual y arquitecta. Una fotografía contemporánea que interroga la arquitectura, el umbral y la heterotopía. Fotografía urbana, arquitectónica e instantes suspendidos.",
  },
};

type Item = {
  themeSlug: ThemeSlug;
  workSlug: string;
  workTitle: string;
  pieceIndex: number; // 1-based, for URL
  piece: WorkPiece;
};

function collectByType(themes: Theme[], type: MediaType): Item[] {
  const out: Item[] = [];
  for (const theme of themes) {
    for (const work of theme.works) {
      const workType = work.type ?? (theme.slug === "photography" ? "photography" : "painting");
      const pieces = work.pieces ?? [];
      pieces.forEach((piece, idx) => {
        const pieceType = piece.type ?? workType;
        if (pieceType === type) {
          out.push({
            themeSlug: theme.slug,
            workSlug: work.slug,
            workTitle: work.title.replace(/\u00a0/g, " "),
            pieceIndex: idx + 1,
            piece,
          });
        }
      });
    }
  }
  return out;
}

export const Route = createFileRoute("/media/$type")({
  loader: async ({ params, context }) => {
    const t = params.type as MediaType;
    if (!["sculpture", "painting", "photography"].includes(t)) throw notFound();
    const [mediaSeo] = await Promise.all([
      context.queryClient.ensureQueryData(mediaSeoQueryOptions),
      context.queryClient.ensureQueryData(siteContentQueryOptions),
    ]);
    const pillar = mediaSeo.find((p) => p.type === t) ?? null;
    return { type: t, pillar };
  },
  head: ({ params, loaderData }) => {
    const t = params.type as MediaType;
    const url = `${BASE_URL}/media/${t}`;
    const p = loaderData?.pillar ?? PILLAR[t];
    // Salvaguarda SEO: si el título cargado desde el administrador es
    // demasiado largo (o quedó pegado el texto de la descripción), usamos el
    // título corto por defecto para no romper el <title> de la página.
    const loadedTitle = p.seoTitle?.trim() ?? "";
    const title =
      loadedTitle.length > 0 && loadedTitle.length <= 90 ? loadedTitle : PILLAR[t].seoTitle;
    const description = p.seoDescription;
    const keyword = p.keyword;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "keywords",
          content: `Estela Currao ${keyword}, ${keyword}, ${t} contemporain, ${t} contemporánea, artista visual arquitecta`,
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { property: "og:image", content: `${BASE_URL}${homeAsset.url}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: `${BASE_URL}${homeAsset.url}` },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url,
            inLanguage: ["fr", "es"],
            about: keyword,
            primaryImageOfPage: `${BASE_URL}${homeAsset.url}`,
            creator: {
              "@id": `${BASE_URL}/#person`,
              "@type": "Person",
              name: "Estela Currao",
              jobTitle: ["Visual artist", "Architect"],
            },
            isPartOf: { "@id": `${BASE_URL}/media#collection` },
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
              { "@type": "ListItem", position: 3, name: title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: MediaTypePage,
  notFoundComponent: () => (
    <RouteNotFoundFallback
      title="Media type not found"
      message="Try Sculpture, Painting or Photography."
      backTo="/identity"
      backLabel="Back to THEMATICS"
    />
  ),
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/identity" backLabel="Back to THEMATICS" />
  ),
});

function MediaTypePage() {
  const { type, pillar } = Route.useLoaderData() as { type: MediaType; pillar: MediaSeo | null };
  const { data: themes } = useSuspenseQuery(siteContentQueryOptions);
  const items = collectByType(themes, type);
  const p = pillar ?? PILLAR[type];
  const [lang, setLang] = useState<"fr" | "es">("fr");
  useEffect(() => {
    const nav = (navigator.languages?.[0] ?? navigator.language ?? "fr").toLowerCase();
    setLang(nav.startsWith("es") ? "es" : "fr");
  }, []);
  const h1 = lang === "es" ? p.h1Es : p.h1Fr;
  const intro = lang === "es" ? p.introEs : p.introFr;
  return (
    <SiteLayout
      aside={
        <div className="flex flex-col gap-8">
          <Link
            to="/$category"
            params={{ category: "identity" }}
            className="text-xs uppercase tracking-[0.24em] text-neutral-500 hover:text-neutral-900"
          >
            ← THEMATICS
          </Link>
          <ul className="flex flex-col gap-6 md:gap-8">
            {(Object.keys(TYPE_LABEL) as MediaType[]).map((t) => {
              const active = t === type;
              return (
                <li key={t}>
                  <Link
                    to="/media/$type"
                    params={{ type: t }}
                    className={
                      "text-base uppercase tracking-[0.28em] transition-colors md:text-lg " +
                      (active
                        ? "font-medium text-neutral-900"
                        : "font-light text-neutral-400 hover:text-neutral-700")
                    }
                  >
                    {TYPE_LABEL[t]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      }
    >
      <h2 className="mb-10 text-[8px] font-medium uppercase tracking-[0.28em] text-neutral-500">
        Series & obras
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">No works available.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:gap-x-4 sm:gap-y-4 md:grid-cols-3 md:gap-x-4 md:gap-y-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-6">
          {items.map((it) => {
            const src = it.piece.grid ?? it.piece.principal;
            return (
              <Link
                key={`${it.themeSlug}-${it.workSlug}-${it.pieceIndex}`}
                to="/$category/$work/$piece"
                params={{
                  category: it.themeSlug,
                  work: it.workSlug,
                  piece: String(it.pieceIndex),
                }}
                className="group flex flex-col gap-2"
              >
                <div className="flex w-full items-center justify-center overflow-hidden bg-background aspect-[4/5]">
                  <img
                    src={src}
                    alt={it.piece.title}
                    loading="lazy"
                    className="h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-85"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-neutral-900">{it.piece.title}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                    {it.workTitle}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <footer className="mt-16 max-w-3xl md:mt-24">
        <h1
          className="font-light leading-tight text-foreground"
          style={{ fontSize: "clamp(1.125rem, 2.4vw, 1.6875rem)" }}
        >
          {h1}
          <span className="block text-base font-normal uppercase tracking-[0.24em] text-foreground/80 mt-4">
            Estela Currao
          </span>
        </h1>
        <div className="mt-8 text-base leading-relaxed text-foreground/90">
          <p lang={lang} className="whitespace-pre-line">{intro}</p>
        </div>
      </footer>
    </SiteLayout>
  );
}
