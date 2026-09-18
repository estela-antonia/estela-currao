import type { Theme, ThemeWork, WorkPiece } from "@/lib/site-content.types";
import { BASE_URL } from "@/lib/site";


export type ArtType = "sculpture" | "painting" | "photography";

/**
 * Bilingual ES/FR label used in hidden SEO attributes (alt, meta) so Google
 * indexes the work for both Spanish and French audiences. The visible UI
 * stays in English — these strings only appear in alt/meta.
 */
const TYPE_LABEL: Record<ArtType, string> = {
  sculpture: "Escultura / Sculpture",
  painting: "Pintura / Peinture",
  photography: "Fotografía / Photographie",
};

/** Schema.org VisualArtwork.artform value per discipline (English, canonical). */
const TYPE_ARTFORM: Record<ArtType, string> = {
  sculpture: "Sculpture",
  painting: "Painting",
  photography: "Photography",
};

const PERSON_ID = `${BASE_URL}/#person`;

export function resolveArtType(
  theme: Theme,
  work: ThemeWork,
  piece?: WorkPiece,
): ArtType {
  if (piece?.type) return piece.type;
  if (work.type) return work.type;
  return theme.slug === "photography" ? "photography" : "painting";
}

export function typeLabel(type: ArtType): string {
  return TYPE_LABEL[type];
}

/**
 * Dynamic alt text (hidden, bilingual ES/FR for SEO):
 *   "[TITLE] - [ES / FR category]. Medium: [medium], Format: [format], Year: [year] — Estela Currao."
 */
export function buildArtworkAlt(
  title: string,
  type: ArtType,
  piece?: WorkPiece,
): string {
  const parts: string[] = [];
  if (piece?.medium) parts.push(`Medium: ${piece.medium}`);
  if (piece?.format) parts.push(`Format: ${piece.format}`);
  if (piece?.year) parts.push(`Year: ${piece.year}`);
  const detail = parts.length ? ` ${parts.join(", ")}.` : "";
  return `${title} - ${TYPE_LABEL[type]}.${detail} — Estela Currao.`;
}

/**
 * Dynamic head() meta for any subcategory / artwork page.
 * - title: "[Subcategoría] | [TYPE] Contemporánea — Estela Currao"
 * - description: includes the cita of the current piece when available.
 */
export function buildArtworkHead({
  theme,
  work,
  piece,
}: {
  theme: Theme;
  work: ThemeWork;
  piece?: WorkPiece;
}) {
  const type = resolveArtType(theme, work, piece);
  const sub = work.title.replace(/\u00a0/g, " ");
  const label = TYPE_LABEL[type];
  const title = `${sub} | ${label} Contemporánea — Estela Currao`;
  // Prioritise the original-language cita (often French) — strong SEO magnet
  // for French/Spanish audiences. Fall back to a bilingual generic line.
  const cita = piece?.cita?.trim();
  const description = cita
    ? `${cita} — ${sub}, ${label}. Estela Currao.`
    : `Descubre '${sub}', serie de ${label} de Estela Currao. Explora las obras y fichas técnicas.`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  };
}

/**
 * Helper for route head() — builds artwork metadata from resolved
 * theme/work loaded by the route loader. Falls back to a minimal canonical
 * head when the loader hasn't populated `loaderData` yet (e.g. initial
 * prerender before the query resolves).
 */
export function buildArtworkHeadFromLoader(
  themeSlug: string,
  workSlug: string,
  loaderData: { theme?: Theme; work?: ThemeWork } | undefined,
  pieceParam?: string,
) {
  const theme = loaderData?.theme;
  const work = loaderData?.work;
  if (!theme || !work) {
    const path = pieceParam
      ? `/${themeSlug}/${workSlug}/${pieceParam}`
      : `/${themeSlug}/${workSlug}`;
    return {
      meta: [
        { title: "Estela Currao" },
        { property: "og:url", content: `${BASE_URL}${path}` },
      ],
      links: [{ rel: "canonical", href: `${BASE_URL}${path}` }],
    };
  }
  const idx = pieceParam ? Number(pieceParam) : NaN;
  const piece =
    Number.isFinite(idx) && idx >= 1 ? work.pieces?.[idx - 1] : undefined;
  const { meta } = buildArtworkHead({ theme, work, piece });
  const path = pieceParam
    ? `/${themeSlug}/${workSlug}/${pieceParam}`
    : `/${themeSlug}/${workSlug}`;
  const url = `${BASE_URL}${path}`;
  const artform = TYPE_ARTFORM[resolveArtType(theme, work, piece)];
  const workName = work.title.replace(/\u00a0/g, " ");
  const themeName = theme.title.replace(/\u00a0/g, " ");
  const heroImage = piece?.principal ?? work.cover;
  const absoluteHero = heroImage
    ? heroImage.startsWith("http")
      ? heroImage
      : `${BASE_URL}${heroImage}`
    : undefined;
  const breadcrumbItems: Array<{ name: string; item: string }> = [
    { name: "Home", item: `${BASE_URL}/` },
    { name: themeName, item: `${BASE_URL}/${themeSlug}` },
    { name: workName, item: `${BASE_URL}/${themeSlug}/${workSlug}` },
  ];
  if (piece) {
    breadcrumbItems.push({ name: piece.title, item: url });
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };
  const jsonLd = piece
    ? {
        "@context": "https://schema.org",
        "@type": "VisualArtwork",
        name: piece.title,
        url,
        artform,
        artMedium: piece.medium ?? undefined,
        artworkSurface: piece.format ?? undefined,
        dateCreated: piece.year ? String(piece.year) : undefined,
        image: piece.principal ? `${BASE_URL}${piece.principal}` : undefined,
        isPartOf: {
          "@type": "CreativeWorkSeries",
          name: workName,
          url: `${BASE_URL}/${themeSlug}/${workSlug}`,
        },
        creator: {
          "@id": PERSON_ID,
          "@type": "Person",
          name: "Estela Currao",
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "CreativeWorkSeries",
        name: workName,
        url,
        genre: artform,
        image: work.cover ? `${BASE_URL}${work.cover}` : undefined,
        creator: {
          "@id": PERSON_ID,
          "@type": "Person",
          name: "Estela Currao",
        },
      };
  return {
    meta: [
      ...meta,
      { property: "og:url", content: url },
      ...(absoluteHero
        ? [
            { property: "og:image", content: absoluteHero },
            { name: "twitter:image", content: absoluteHero },
          ]
        : []),
    ],
    links: [
      { rel: "canonical", href: url },
      ...(heroImage
        ? [
            {
              rel: "preload",
              as: "image",
              href: heroImage,
              fetchPriority: "high" as const,
            },
          ]
        : []),
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbLd),
      },
    ],
  };
}

/**
 * Head builder for a theme index page (e.g. `/identity`, `/photography`).
 * Uses the first work's cover as og:image so social shares get a real
 * artwork thumbnail instead of the platform default.
 */
export function buildThemeIndexHead({
  themeSlug,
  title,
  description,
  theme,
}: {
  themeSlug: string;
  title: string;
  description: string;
  theme?: Theme;
}) {
  const url = `${BASE_URL}/${themeSlug}`;
  const cover = theme?.works?.find((w) => w.cover)?.cover;
  const absoluteCover = cover
    ? cover.startsWith("http")
      ? cover
      : `${BASE_URL}${cover}`
    : undefined;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      ...(absoluteCover
        ? [
            { property: "og:image", content: absoluteCover },
            { name: "twitter:image", content: absoluteCover },
            { name: "twitter:card", content: "summary_large_image" },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          url,
          about: { "@type": "Person", name: "Estela Currao" },
          ...(absoluteCover ? { image: absoluteCover } : {}),
        }),
      },
    ],
  };
}