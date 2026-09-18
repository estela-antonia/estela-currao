import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { LazyImage, FadeImage } from "@/components/LazyImage";
import type { Theme, ThemeWork, WorkPiece } from "@/lib/site-content.types";
import { resolveArtType, buildArtworkAlt } from "@/lib/artwork-seo";

const DISCIPLINE_LABEL: Record<"sculpture" | "painting" | "photography", string> = {
  sculpture: "Sculpture",
  painting: "Painting",
  photography: "Photography",
};

const DISCIPLINE_PATH: Record<"sculpture" | "painting" | "photography", "/media/$type"> = {
  sculpture: "/media/$type",
  painting: "/media/$type",
  photography: "/media/$type",
};

/** Unified technical caption (title, counter, medium, format, year) — same markup on desktop and mobile. */
function ArtworkCaption({
  title,
  piece,
  pieceIndex,
  total,
  className = "",
}: {
  title: string;
  piece?: WorkPiece;
  pieceIndex: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <h2 className="min-w-0 break-normal text-2xl font-light leading-tight text-neutral-900 [hyphens:none] [overflow-wrap:normal] [text-wrap:balance] md:text-[28px]">
          {title}
        </h2>
        {piece && total > 1 && (
          <p className="whitespace-nowrap text-[10px] uppercase leading-tight tracking-[0.24em] tabular-nums text-neutral-500">
            <span className="sr-only">
              Work {pieceIndex} of {total}
            </span>
            <span aria-hidden="true">
              {String(pieceIndex).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </p>
        )}
      </div>
      {piece ? (
        <dl className="mt-7 min-w-0 space-y-1.5 text-sm leading-relaxed text-neutral-600">
          {(piece.medium || piece.format) && (
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              {piece.medium && (
                <>
                  <dt className="sr-only">Medium</dt>
                  <dd className="min-w-0 break-words [overflow-wrap:anywhere]">{piece.medium}</dd>
                </>
              )}
              {piece.medium && piece.format && (
                <span aria-hidden="true" className="shrink-0 text-neutral-400">
                  ·
                </span>
              )}
              {piece.format && (
                <>
                  <dt className="sr-only">Format</dt>
                  <dd className="min-w-0 break-words [overflow-wrap:anywhere]">{piece.format}</dd>
                </>
              )}
            </div>
          )}
          {piece.year && (
            <div className="min-w-0">
              <dt className="sr-only">Year</dt>
              <dd className="tabular-nums">{piece.year}</dd>
            </div>
          )}
        </dl>
      ) : (
        <div className="mt-3 text-sm tabular-nums text-neutral-600">
          <span className="sr-only">Image {pieceIndex}</span>
          <span aria-hidden="true">#{String(pieceIndex).padStart(2, "0")}</span>
        </div>
      )}
    </div>
  );
}

export function ArtworkPage({
  theme,
  work,
  pieceIndex,
}: {
  theme: Theme;
  work: ThemeWork;
  pieceIndex: number;
}) {
  const piece = work.pieces?.[pieceIndex - 1];
  const navigate = useNavigate();
  const workTitle = work.title.replace(/\u00a0/g, " ");
  const title = piece ? piece.title : workTitle;
  const type = resolveArtType(theme, work, piece);
  const mainAlt = buildArtworkAlt(title, type, piece);
  const seoTitle = `Estela Currao - ${title}`;
  const seoId = `artwork-${title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
  const gallery = piece
    ? [piece.principal, ...piece.additional]
    : [work.cover, ...(work.images ?? [])];
  const [active, setActive] = useState(0);
  useEffect(() => {
    setActive(0);
  }, [pieceIndex, work.slug]);

  const allPieces = useMemo(
    () => (work.pieces ?? []).map((p, i) => ({ p, idx: i + 1 })),
    [work.pieces],
  );
  const workIndex = theme.works.findIndex((w) => w.slug === work.slug);
  const prevWork = theme.works[workIndex - 1];
  const nextWork = theme.works[workIndex + 1];
  const showThumbs = (type === "sculpture" || !!piece) && gallery.length > 1;



  // Cyclic navigation: wraps around at both ends so arrows never disappear.
  const total = allPieces.length;
  const prevPieceIdx =
    piece && total > 1 ? (pieceIndex > 1 ? pieceIndex - 1 : total) : null;
  const nextPieceIdx =
    piece && total > 1 ? (pieceIndex < total ? pieceIndex + 1 : 1) : null;

  // Keyboard navigation: ← / → move between pieces.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" && prevPieceIdx) {
        navigate({
          to: "/$category/$work/$piece",
          params: { category: theme.slug, work: work.slug, piece: String(prevPieceIdx) },
        });
      } else if (e.key === "ArrowRight" && nextPieceIdx) {
        navigate({
          to: "/$category/$work/$piece",
          params: { category: theme.slug, work: work.slug, piece: String(nextPieceIdx) },
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevPieceIdx, nextPieceIdx, navigate, theme.slug, work.slug]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Swipe gesture (mobile): horizontal drag moves between pieces, cyclically.
  const goToPiece = (idx: number) =>
    navigate({
      to: "/$category/$work/$piece",
      params: { category: theme.slug, work: work.slug, piece: String(idx) },
    });
  const touchStart = useRef<
    { x: number; y: number; t: number; aborted: boolean } | null
  >(null);
  const onTouchStart = (e: React.TouchEvent) => {
    // Ignore multi-touch (pinch/zoom) entirely.
    if (e.touches.length > 1) {
      touchStart.current = null;
      return;
    }
    const t = e.touches[0];
    touchStart.current = t
      ? { x: t.clientX, y: t.clientY, t: Date.now(), aborted: false }
      : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const start = touchStart.current;
    const t = e.touches[0];
    if (!start || !t) return;
    if (e.touches.length > 1) {
      start.aborted = true;
      return;
    }
    // Once the gesture reads as vertical scrolling, it can never become a swipe.
    const dx = Math.abs(t.clientX - start.x);
    const dy = Math.abs(t.clientY - start.y);
    if (dy > 24 && dy > dx) start.aborted = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    const t = e.changedTouches[0];
    if (!start || !t || start.aborted) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const elapsed = Date.now() - start.t;
    // Require a deliberate, clearly horizontal drag.
    const minDistance = Math.max(70, window.innerWidth * 0.18);
    if (Math.abs(dx) < minDistance) return;
    if (Math.abs(dx) < Math.abs(dy) * 2.5) return;
    if (Math.abs(dy) > 80) return;
    if (elapsed > 900) return;
    if (dx < 0 && nextPieceIdx) goToPiece(nextPieceIdx);
    else if (dx > 0 && prevPieceIdx) goToPiece(prevPieceIdx);
  };

  const relatedRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  // Subtle reveal: sections below the fold fade/lift in when they enter the viewport.
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const revealRefs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setRevealed({ pieces: true, series: true });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = (entry.target as HTMLElement).dataset["reveal"];
            if (key) setRevealed((prev) => ({ ...prev, [key]: true }));
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    Object.values(revealRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [pieceIndex, work.slug]);
  const revealClass = (key: string) =>
    `transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
      revealed[key] ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
    }`;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const tolerance = 4;
      setCanScrollLeft(el.scrollLeft > tolerance);
      setCanScrollRight(
        el.scrollLeft + el.clientWidth < el.scrollWidth - tolerance,
      );
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [allPieces.length]);

  // Center the active piece in the carousel when it changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-piece-idx="${pieceIndex}"]`);
    if (!target) return;
    const left =
      target.offsetLeft - el.clientWidth / 2 + target.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [pieceIndex, allPieces.length]);

  const scrollRelated = (direction: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.75, behavior: "smooth" });
  };

  return (
    <SiteLayout
      asideClassName="!py-5 md:!py-14"
      aside={
        <div className="flex flex-col">
          {/* Block 1 — Main category */}
          <div>
            <Link
              to="/$category" params={{ category: theme.slug }}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.24em] text-neutral-500 transition hover:text-neutral-900"
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
              {theme.label}
            </Link>
            <h1
              className="mt-4 font-medium uppercase leading-tight tracking-[0.08em] text-neutral-900"
              style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)" }}
              aria-label={workTitle}
            >
              {workTitle}
            </h1>
          </div>

          {/* Series navigation within the theme */}
          {(prevWork || nextWork) && (
            <div className="mt-6 border-y border-neutral-200 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                  Series
                </span>
                <div className="flex items-center">
                  {prevWork ? (
                    <Link
                      to="/$category/$work"
                      params={{ category: theme.slug, work: prevWork.slug }}
                      aria-label="Previous series"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-neutral-500 transition hover:text-neutral-900 md:h-8 md:w-8"
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} />
                    </Link>
                  ) : (
                    <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-neutral-400 md:h-8 md:w-8">
                      <ChevronLeft size={18} strokeWidth={1.5} />
                    </span>
                  )}
                  {nextWork ? (
                    <Link
                      to="/$category/$work"
                      params={{ category: theme.slug, work: nextWork.slug }}
                      aria-label="Next series"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-neutral-500 transition hover:text-neutral-900 md:h-8 md:w-8"
                    >
                      <ChevronRight size={18} strokeWidth={1.5} />
                    </Link>
                  ) : (
                    <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-neutral-400 md:h-8 md:w-8">
                      <ChevronRight size={18} strokeWidth={1.5} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* Block 2 — Artwork information (desktop only) */}
          <div className="mt-10 hidden md:mt-20 md:block">
            <div className="sr-only">
              <span>Estela Currao</span>
              <span aria-hidden>·</span>
              <Link
                to={DISCIPLINE_PATH[type]}
                params={{ type }}
              >
                {DISCIPLINE_LABEL[type]}
              </Link>
            </div>
            <ArtworkCaption
              title={title}
              piece={piece}
              pieceIndex={pieceIndex}
              total={total}
            />
          </div>

          {/* Block 3 — Curatorial quote (desktop only; mobile/tablet is below image) */}
          {piece?.cita && (
            <blockquote className="mt-32 hidden border-l border-neutral-300 pl-4 text-sm italic leading-loose text-neutral-600 whitespace-pre-line md:block">
              {piece.cita}
            </blockquote>
          )}

        </div>
      }
    >
      <div
        className="flex w-full flex-col items-start gap-4 md:flex-row md:gap-6"
        itemScope
        itemType="https://schema.org/VisualArtwork"
      >
        <meta itemProp="creator" content="Estela Currao" />
        <meta itemProp="name" content={title} />
        <figure
          className="order-1 relative flex min-h-[min(54svh,80vw)] w-full min-w-0 flex-1 touch-pan-y items-center justify-center sm:min-h-[min(62svh,70vw)] md:order-none md:min-h-[min(72svh,52vw)]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={() => {
            touchStart.current = null;
          }}
        >
          <FadeImage
            id={seoId}
            src={gallery[active]}
            alt={mainAlt}
            title={seoTitle}
            itemProp="image"
            className="block h-auto max-h-[54vh] w-auto max-w-full object-contain text-transparent sm:max-h-[62vh] md:max-h-[72vh]"
          />
          {prevPieceIdx && (
            <Link
              to="/$category/$work/$piece"
              params={{ category: theme.slug, work: work.slug, piece: String(prevPieceIdx) }}
              aria-label={`Previous work (${prevPieceIdx} of ${total})`}
              className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition-colors duration-300 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 md:h-12 md:w-12"
            >
              <ChevronLeft size={24} strokeWidth={0.75} className="md:h-[30px] md:w-[30px]" />
            </Link>
          )}
          {nextPieceIdx && (
            <Link
              to="/$category/$work/$piece"
              params={{ category: theme.slug, work: work.slug, piece: String(nextPieceIdx) }}
              aria-label={`Next work (${nextPieceIdx} of ${total})`}
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition-colors duration-300 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 md:h-12 md:w-12"
            >
              <ChevronRight size={24} strokeWidth={0.75} className="md:h-[30px] md:w-[30px]" />
            </Link>
          )}
        </figure>

        {/* Mobile artwork title + technical info */}
        <ArtworkCaption
          title={title}
          piece={piece}
          pieceIndex={pieceIndex}
          total={total}
          className="order-2 w-full md:hidden"
        />

        {showThumbs && (
          <div className="order-3 flex w-full shrink-0 flex-row gap-2 overflow-x-auto md:order-none md:w-20 md:flex-col md:gap-3 md:overflow-visible">
            {gallery.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View ${i + 1}`}
                className={`relative h-16 w-16 shrink-0 overflow-hidden border transition md:h-20 md:w-20 ${
                  i === active
                    ? "border-neutral-900"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                <LazyImage
                  id={`${seoId}-view-${i + 1}`}
                  src={src}
                  alt={`${title} — view ${i + 1}`}
                  title={`${seoTitle} — view ${i + 1}`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Curatorial quote — mobile/tablet only, placed after image */}
        {piece?.cita && (
          <blockquote className="order-4 mt-10 border-l border-neutral-300 pl-4 text-sm italic leading-loose text-neutral-600 whitespace-pre-line md:hidden">
            {piece.cita}
          </blockquote>
        )}

      </div>

      {piece && allPieces.length > 1 && (
        <section
          ref={(el) => {
            relatedRef.current = el;
            revealRefs.current["pieces"] = el;
          }}
          data-reveal="pieces"
          className={`mt-10 border-t border-neutral-200 pt-8 md:mt-12 ${revealClass("pieces")}`}
        >
          <div className="flex items-baseline justify-end gap-4">
            <span className="text-[10px] uppercase tracking-[0.24em] text-neutral-400">
              {pieceIndex} / {allPieces.length}
            </span>
          </div>
          <div className="relative mt-6">
            <button
              type="button"
              aria-label="Previous work"
              onClick={() => scrollRelated(-1)}
              className={`absolute -left-3 top-1/2 z-10 -translate-y-1/2 flex items-center justify-center p-3 text-neutral-400 transition-colors duration-300 hover:text-neutral-900 md:-left-5 ${
                canScrollLeft
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <ChevronLeft size={30} strokeWidth={0.75} />
            </button>

            <div
              ref={scrollRef}
              className="flex items-start gap-7 overflow-x-auto py-6 md:gap-9 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
            >
              {allPieces.map(({ p, idx }) => {
                const isActive = idx === pieceIndex;
                const isOffset = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    data-piece-idx={idx}
                    className="min-w-[160px] shrink-0 md:min-w-[200px]"
                    style={{ transform: isOffset ? "translateY(20px)" : undefined }}
                  >
                    <Link
                      to="/$category/$work/$piece"
                      params={{ category: theme.slug, work: work.slug, piece: String(idx) }}
                      className="group block"
                      onClick={() => setActive(0)}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <div
                        className={`relative flex h-[180px] items-end overflow-hidden transition md:h-[220px] ${
                          isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                        }`}
                      >
                        <FadeImage
                          src={p.principal}
                          alt={buildArtworkAlt(
                            p.title,
                            resolveArtType(theme, work, p),
                            p,
                          )}
                          className="block h-[180px] w-auto max-w-[260px] object-contain md:h-[220px] md:max-w-[320px]"
                          loading="lazy"
                        />
                      </div>
                      <div
                        className={`mt-3 flex items-center gap-2 text-sm transition ${
                          isActive
                            ? "text-neutral-900"
                            : "text-neutral-600 group-hover:text-neutral-900"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`inline-block h-1 w-1 rounded-full transition ${
                            isActive ? "bg-neutral-900" : "bg-transparent"
                          }`}
                        />
                        <span>{p.title}</span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Next work"
              onClick={() => scrollRelated(1)}
              className={`absolute -right-3 top-1/2 z-10 -translate-y-1/2 flex items-center justify-center p-3 text-neutral-400 transition-colors duration-300 hover:text-neutral-900 md:-right-5 ${
                canScrollRight
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <ChevronRight size={30} strokeWidth={0.75} />
            </button>
          </div>
        </section>
      )}

      {/* Related works — other series within the same theme */}
      {(() => {
        const relatedSeries = theme.works.filter((w) => w.slug !== work.slug);
        if (relatedSeries.length === 0) return null;
        return (
          <section
            ref={(el) => {
              revealRefs.current["series"] = el;
            }}
            data-reveal="series"
            className={`mt-16 border-t border-neutral-200 pt-10 ${revealClass("series")}`}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-xs font-medium uppercase tracking-[0.28em] text-neutral-700">
                Related works — {theme.title}
              </h3>
              <Link
                to="/$category" params={{ category: theme.slug }}
                className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 transition hover:text-neutral-900"
              >
                View all →
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {relatedSeries.map((w) => (
                <li key={w.slug}>
                  <Link
                    to="/$category/$work"
                    params={{ category: theme.slug, work: w.slug }}
                    className="group block"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                      <LazyImage
                        src={w.cover}
                        alt={`${w.title} — series from ${theme.title} by Estela Currao`}
                        className="transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-3 text-sm text-neutral-600 transition group-hover:text-neutral-900">
                      {w.title}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}
    </SiteLayout>
  );
}