import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { LazyImage } from "@/components/LazyImage";
import type { Theme, ThemeWork } from "@/lib/site-content.types";
import { resolveArtType, buildArtworkAlt, typeLabel } from "@/lib/artwork-seo";

// Uniform-module grid: every fine cell is a perfect square (set via
// container queries). A full work occupies a 2×2 module. Details occupy
// half-modules (2×1 or 1×2) or combine into 2-square rectangles (4×2 or
// 2×4). No hero pieces, no scale hierarchy — variation comes from
// fragmentation of a hidden geometric grid.
type Span = { c: number; r: number };
const M = 2; // fine cells per module side
const sq: Span = { c: M, r: M };
const hHalf: Span = { c: M, r: M / 2 };
const vHalf: Span = { c: M / 2, r: M };
const hRect: Span = { c: M * 2, r: M };
const vRect: Span = { c: M, r: M * 2 };
// Larger "feature" modules for stronger hierarchy and breathing room.
const big: Span = { c: M * 2, r: M * 2 }; // 4×4 fine cells (large square)
const bigV: Span = { c: M, r: M * 3 };    // tall portrait
const bigH: Span = { c: M * 3, r: M };    // wide landscape

// One distinct hidden-grid composition per work slug. All share the same
// uniform-module logic (no hero, no scale hierarchy) — only the
// fragmentation rhythm changes.
// Refined compositions: fewer tiles (~10–12), stronger hierarchy with one or
// two "feature" pieces per series, and intentional rhythm between large and
// small modules. Combined with the wider gutter below, this creates breathing
// room and a museum-room feel rather than a dense catalog.
// One single "anchor" piece per series (the only large module). The rest is
// a calm rhythm of small/medium tiles with intentional silences so the wall
// reads like a museum room, not a catalog page.
// Curated compositions: one anchor (4×4) per series, no half-module fillers,
// every tile has presence. The grid ends when pieces run out — empty cells
// at the bottom are intentional silence, not gaps to fill.
const PATTERNS: Record<string, Span[]> = {
  "micro-identities":        [big, sq, vRect, sq, hRect, sq, sq, vRect, sq],
  "the-gaze":                [vRect, big, sq, hRect, sq, vRect, sq],
  "erosions-of-the-self":    [sq, big, vRect, sq, hRect, sq, sq, vRect],
  "contingencies-of-matter": [big, sq, vRect, hRect, sq, sq, vRect, sq],
  "organic-matrices":        [vRect, big, sq, hRect, sq, sq, vRect, sq],
  "matrices-ritmicas":       [big, sq, hRect, sq, vRect, sq, sq, hRect],
  forks:                     [sq, big, hRect, sq, vRect, sq, sq, vRect],
  "zones-of-influence":      [big, sq, vRect, hRect, sq, sq, vRect, sq],
  heterotopias:              [big, sq, hRect, vRect, sq, sq, vRect, sq],
  "suspended-instants":      [vRect, big, hRect, sq, sq, hRect, sq],
  "the-outside-space":       [big, hRect, vRect, sq, sq, hRect, sq],
};

const DEFAULT_PATTERN: Span[] = [big, sq, vRect, sq, hRect, sq, sq, vRect];

// Offset block variants: the composition repeats in cycles, but each block
// starts on a different rhythm so a long series never repeats the same
// visual cadence.
const BLOCK_VARIANTS: Span[][] = [
  [vRect, sq, big, hRect, sq, sq, vRect, sq],
  [sq, hRect, sq, big, vRect, sq, hRect, sq],
  [big, vRect, sq, sq, hRect, sq, vRect, sq],
];

// Adapted closing blocks so an incomplete tail never leaves holes.
const TAIL_BLOCKS: Record<number, Span[]> = {
  1: [big],
  2: [big, vRect],
  3: [sq, big, vRect],
  4: [big, sq, vRect, sq],
  5: [vRect, big, sq, hRect, sq],
  6: [big, sq, vRect, hRect, sq, sq],
  7: [vRect, big, sq, hRect, sq, sq, vRect],
};

function buildSpans(count: number, base: Span[]): Span[] {
  const blockSize = base.length;
  const spans: Span[] = [];
  let block = 0;
  while (spans.length < count) {
    const remaining = count - spans.length;
    if (remaining < blockSize) {
      spans.push(...(TAIL_BLOCKS[remaining] ?? base.slice(0, remaining)));
      break;
    }
    const variant =
      block === 0 ? base : BLOCK_VARIANTS[(block - 1) % BLOCK_VARIANTS.length];
    spans.push(...variant.slice(0, blockSize));
    block += 1;
  }
  return spans.slice(0, count);
}

export function ThemeWorkPage({ theme, work }: { theme: Theme; work: ThemeWork }) {
  const title = work.title.replace(/\u00a0/g, " ");
  const pattern = PATTERNS[work.slug] ?? DEFAULT_PATTERN;
  const pieces = work.pieces ?? [];
  const type = resolveArtType(theme, work);
  const typeLbl = typeLabel(type);
  // Dedupe by visible image src: when two pieces share the same file
  // (placeholders for missing originals), only the first one is shown.
  const seen = new Set<string>();
  const uniquePieces = pieces
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => {
      const src = p.grid ?? p.principal;
      if (seen.has(src)) return false;
      seen.add(src);
      return true;
    });
  // Every artwork of the series appears exactly once: the composition cycles
  // with offset variants until all pieces are placed.
  const tileCount = uniquePieces.length > 0 ? uniquePieces.length : pattern.length;
  const spans = buildSpans(tileCount, pattern);
  const tiles = Array.from({ length: tileCount }, (_, i) => {
    const entry = uniquePieces[i];
    return {
      src: entry ? (entry.p.grid ?? entry.p.principal) : work.cover,
      label: entry ? entry.p.title : undefined,
      span: spans[i] ?? sq,
      key: i,
      pieceNumber: entry ? entry.i + 1 : i + 1,
    };
  });

  

  return (
    <SiteLayout
      wrapperClassName="[--side-col:280px]"
      asideClassName="!px-5 !pt-7 !pb-8 md:!px-10 md:!py-14"
      mainClassName="!pt-2 !pb-20 md:!pt-14 md:!pb-14"
      aside={
        <div className="flex flex-col gap-5 md:gap-6">
          {/* Mobile: editorial index of the active category’s series. */}
          <div className="md:hidden flex flex-col gap-4">
            <Link
              to="/$category" params={{ category: theme.slug }}
              className="text-[10px] uppercase tracking-[0.28em] font-light text-neutral-400"
            >
              {theme.label}
            </Link>
            <ul className="flex flex-col gap-2.5">
              {theme.works.map((w) => {
                const active = w.slug === work.slug;
                return (
                  <li key={w.slug}>
                    <Link
                      to="/$category/$work"
                      params={{ category: theme.slug, work: w.slug }}
                      className={
                        "block text-[11px] uppercase leading-relaxed transition-colors " +
                        (active
                          ? "font-normal text-neutral-900 tracking-[0.20em]"
                          : "font-light text-neutral-400 tracking-[0.20em] hover:text-neutral-600")
                      }
                    >
                      {w.title.replace(/\u00a0/g, " ")}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          {/* Desktop: original category label and series list. */}
          <Link
            to="/$category" params={{ category: theme.slug }}
            className="hidden md:block text-lg uppercase tracking-[0.28em] font-medium text-neutral-900"
          >
            {theme.label}
          </Link>
          <ul className="hidden md:flex md:flex-col md:gap-5">
            {theme.works.map((w) => {
              const active = w.slug === work.slug;
              return (
                <li key={w.slug}>
                  <Link
                    to="/$category/$work"
                    params={{ category: theme.slug, work: w.slug }}
                    className={
                      "text-sm uppercase tracking-[0.24em] transition-colors " +
                      (active
                        ? "font-medium text-neutral-900"
                        : "font-light text-neutral-400 hover:text-neutral-700")
                    }
                  >
                    {w.title.replace(/\u00a0/g, " ")}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      }
    >
      <div style={{ containerType: "inline-size" }}>
          <h1 className="sr-only">{title}</h1>
          {/* Mobile: editorial asymmetric composition of 4 pieces,
              filling roughly the first viewport after the header. */}
          {(() => {
            const mobileAreas = [
              { c: "1 / 5", r: "1 / 6" },   // A — anchor, top-left
              { c: "5 / 7", r: "2 / 5" },   // B — small, top-right, offset down
              { c: "1 / 4", r: "7 / 11" },  // C — medium, lower-left
              { c: "4 / 7", r: "6 / 11" },  // D — tall, lower-right
            ];
            const mobilePieces = uniquePieces.slice(0, 4);
            return (
              <section
                className="md:hidden grid grid-cols-6 gap-2.5 -mx-1 mt-2 mb-8"
                style={{
                  gridTemplateRows: "repeat(10, 1fr)",
                  height: "min(74svh, 700px)",
                }}
              >
                {mobilePieces.map(({ p, i }, idx) => {
                  const pieceNumber = i + 1;
                  const src = p.grid ?? p.principal;
                  const area = mobileAreas[idx];
                  return (
                    <Link
                      key={pieceNumber}
                      to="/$category/$work/$piece"
                      params={{ category: theme.slug, work: work.slug, piece: String(pieceNumber) }}
                      aria-label={`Abrir ${p.title} — ${typeLbl}`}
                      className="group relative block overflow-hidden bg-neutral-100"
                      style={{ gridColumn: area.c, gridRow: area.r }}
                    >
                      <LazyImage
                        src={src}
                        alt={buildArtworkAlt(p.title, type, p)}
                        loading={idx === 0 ? "eager" : "lazy"}
                        className="h-full w-full"
                      />
                    </Link>
                  );
                })}
              </section>
            );
          })()}
          {/* Mobile: remaining pieces of the series, 2 columns. */}
          {uniquePieces.length > 4 && (
            <section className="md:hidden grid grid-cols-2 gap-2.5 -mx-1 mb-10">
              {uniquePieces.slice(4).map(({ p, i }) => (
                <Link
                  key={i + 1}
                  to="/$category/$work/$piece"
                  params={{ category: theme.slug, work: work.slug, piece: String(i + 1) }}
                  aria-label={`Abrir ${p.title} — ${typeLbl}`}
                  className="group relative block overflow-hidden bg-neutral-100 aspect-[4/5]"
                >
                  <LazyImage
                    src={p.grid ?? p.principal}
                    alt={buildArtworkAlt(p.title, type, p)}
                    loading="lazy"
                    className="h-full w-full"
                  />
                </Link>
              ))}
            </section>
          )}
          {/* Desktop / tablet: original curated grid */}
          <section
            className="hidden md:grid mx-auto"
            style={{
              ["--gap" as never]: "clamp(6px, 1.4cqw, 28px)",
              ["--pad" as never]: "clamp(8px, 6cqw, 96px)",
              maxWidth: "min(100%, 1280px)",
              paddingLeft: "var(--pad)",
              paddingRight: "var(--pad)",
              ["--cell" as never]:
                "calc((min(100cqw, 1280px) - 2 * var(--pad) - 11 * var(--gap)) / 12)",
              gap: "var(--gap)",
              gridTemplateColumns: "repeat(12, var(--cell))",
              gridAutoRows: "var(--cell)",
              gridAutoFlow: "dense",
            }}
          >
            {tiles.map((t) => (
              <Link
                key={t.key}
                to="/$category/$work/$piece"
                params={{ category: theme.slug, work: work.slug, piece: String(t.pieceNumber) }}
                aria-label={`Abrir ${t.label ?? title} — ${typeLbl}`}
                className="group relative block overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                style={{
                  gridColumn: `span ${t.span.c} / span ${t.span.c}`,
                  gridRow: `span ${t.span.r} / span ${t.span.r}`,
                }}
              >
                <LazyImage
                  src={t.src}
                  alt={buildArtworkAlt(
                    t.label ?? title,
                    type,
                    pieces[t.pieceNumber - 1],
                  )}
                  loading="lazy"
                  className="transition-transform duration-[900ms] ease-out will-change-transform group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                />
                {/* Velo suave + flecha al hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-neutral-900/0 transition-colors duration-500 group-hover:bg-neutral-900/10"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-2 right-2 translate-y-1 text-base leading-none text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-90"
                >
                  →
                </span>
              </Link>
            ))}
          </section>

          {theme.slug === "photography" && (
            <footer
              className="mt-12 mx-auto text-left"
              style={{
                maxWidth: "min(100%, 1280px)",
                paddingLeft: "clamp(16px, 6cqw, 96px)",
                paddingRight: "clamp(16px, 6cqw, 96px)",
              }}
            >
              <p className="text-sm italic leading-loose text-neutral-600">
                Available in various standard dimensions, preserving original
                proportions.
              </p>
            </footer>
          )}
      </div>
    </SiteLayout>
  );
}