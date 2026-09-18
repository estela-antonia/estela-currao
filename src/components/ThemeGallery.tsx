import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { LazyImage } from "@/components/LazyImage";
import type { Theme, ThemeWork } from "@/lib/site-content.types";
import { useIsMobile } from "@/hooks/use-mobile";

export function ThemeGallery({
  theme,
  themesForNav,
}: {
  theme: Theme;
  /** Themes list used to render the left-side nav. Falls back to the
   *  hardcoded list when not provided (SSR-safe default). */
  themesForNav?: Theme[];
}) {
  const isMobile = useIsMobile();
  const navThemes = themesForNav ?? [theme];
  // 2 columnas cuando el tema tiene 4 o menos obras (aplica también en pantallas
  // gigantes, para mantener el mismo principio de lectura museo/celular);
  // 3 columnas sólo cuando hay más de 4 obras y estamos en desktop.
  const COLUMNS = isMobile === true || theme.works.length <= 4 ? 2 : 3;

  return (
    <SiteLayout
      mainClassName="md:pr-12"
      asideClassName="py-3.5 md:py-14"
      aside={
        <ul className="flex flex-col gap-2 md:gap-8">
          {navThemes.map((t) => {
            const active = t.slug === theme.slug;
            return (
              <li key={t.slug}>
                <Link
                  to={t.path}
                  className={
                    "text-[0.6875rem] uppercase tracking-[0.18em] transition-colors md:text-lg md:tracking-[0.28em] " +
                    (active
                      ? "font-medium text-neutral-900"
                      : "font-light text-neutral-400 hover:text-neutral-700")
                  }
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      }
    >
      {/* 🔒 LOCKED LAYOUT — NO MODIFICAR sin pedido EXPLÍCITO del usuario. 🔒
          Aprobado por Estela el 21-06-2026. Cualquier cambio en esta sección
          (estructura, clases, estilos, gaps, offsets, alturas, anchos, ratios)
          requiere confirmación previa. Único parámetro tuneable: COLUMNS.
          ───────────────────────────────────────────────────────────────
          - Galería estilo museo, toda la serie visible en el viewport inicial
            (sin scroll a partir de 1440×900).
          - Columnas verticales pegadas a la derecha, gran vacío a la izquierda.
          - Responsive: 2 columnas en mobile, 3 columnas en desktop.
            Así, en mobile, temas con 4 obras (ej. Identity) muestran la 4ª obra
            junto a la 3ª en lugar de quedar aislada bajo la 1ª.
          - Cada obra mantiene su ratio 2/3 (rectángulo vertical tipo póster).
          - Tamaño de rectángulo FIJO (referencia: IDENTITY con 2 obras/columna),
            para que todas las subcategorías "lean" igual aunque tengan menos piezas.
          - Desfase artístico: la 2ª columna arranca más abajo que la 1ª
            (y la 3ª, si se activa, intermedia) → ritmo escalonado asimétrico.
          - Título blanco con flecha ↗ integrado abajo de cada rectángulo. */}
      {(() => {
        // Desfase por columna (translate-y). Sutil, no rompe el fit del viewport.
        const offsets = COLUMNS === 2
          ? ["", "translate-y-8"]
          : ["", "translate-y-14", "translate-y-7"];
        // Repartir las obras en columnas verticales (round-robin).
        const columns: ThemeWork[][] = Array.from({ length: COLUMNS }, () => []);
        theme.works.forEach((w, i) => columns[i % COLUMNS].push(w));
        // Tamaño de rectángulo fijo en todo el sitio (referencia: IDENTITY con 2 obras por columna),
        // así RHYTHMIC MATRICES / INTERSECTIONS / SPACES OF PERCEPTION leen igual aunque tengan menos piezas.
        const perCol = 2;
        // Ancho de columna: limitado tanto por el alto disponible como por el ancho
        // del viewport, para que las 2 columnas de mobile entren sin envolver y las 3
        // de desktop no se desborden.
        const gapBetweenCols = COLUMNS === 2 ? 0.5 : 0.75; // rem
        const paddingX = COLUMNS === 2 ? 2.5 : 5; // rem (px-5 md:px-10)
        const sidebar = COLUMNS === 2 ? 0 : 280; // px
        // En desktop reservamos el ancho de 1 columna extra a la derecha, para que
        // la última columna no quede pegada al borde de la pantalla.
        const reserveExtraCol = isMobile === false;
        const divisor = reserveExtraCol ? COLUMNS + 1 : COLUMNS;
        const gapsCount = reserveExtraCol ? COLUMNS : COLUMNS - 1;
        const widthByViewport = `calc((100vw - ${sidebar}px - ${paddingX}rem - ${gapsCount * gapBetweenCols}rem) / ${divisor})`;
        const widthByHeight = "calc((100svh - 14rem - 0.75rem) / 3)";
        const colWidth = `min(${widthByHeight}, ${widthByViewport})`;
        return (
          <section
            className="ml-auto flex w-full flex-wrap justify-end gap-2 md:gap-3"
            style={{
              ...(reserveExtraCol
                ? { paddingRight: `calc(${colWidth} + ${gapBetweenCols}rem)` }
                : null),
              ["--gallery-h" as never]: isMobile
                ? "calc(100svh - 15.5rem)"
                : "calc(100svh - 14rem)",
            }}
          >
            <h1 className="sr-only">{theme.label}</h1>
            {columns.map((colWorks, ci) => (
              <div
                key={ci}
                className={`flex min-h-0 shrink-0 flex-col gap-2 md:gap-3 ${ci === 0 ? "" : offsets[ci]}`}
                style={{ width: colWidth, height: "var(--gallery-h)" }}
              >
                {colWorks.map((work) => (
                  <div
                    key={work.slug}
                    className="min-h-0 w-full shrink-0"
                    style={{ aspectRatio: "2 / 3" }}
                  >
                    <WorkCard work={work} themePath={theme.path} themeSlug={theme.slug} />
                  </div>
                ))}
              </div>
            ))}
          </section>
        );
      })()}
    </SiteLayout>
  );
}

function WorkCard({ work, themePath, themeSlug }: { work: ThemeWork; themePath: string; themeSlug: string }) {
  return (
    <Link
      to="/$category/$work"
      params={{ category: themeSlug, work: work.slug }}
      aria-label={work.title}
      className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-none"
    >
      <LazyImage
        src={work.cover}
        alt={work.title}
        loading="lazy"
        className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[30%] max-h-[220px] min-h-[96px] items-end px-2.5 pb-2.5 md:px-5 md:pb-5"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.42) 14%, rgba(0,0,0,0.24) 32%, rgba(0,0,0,0.10) 56%, rgba(0,0,0,0.03) 78%, rgba(0,0,0,0) 100%)",
        }}
      >
        <span className="flex min-w-0 items-baseline gap-1 text-left text-[0.8125rem] leading-snug text-white/90 transition-colors duration-300 group-hover:text-white sm:text-sm sm:gap-1.5 md:text-lg">
          <span className="min-w-0 break-words font-light [text-wrap:balance]">
            {work.title}
          </span>
          <span
            aria-hidden="true"
            className="inline-block shrink-0 translate-y-0 transition-transform duration-200 group-hover:-translate-y-0.5"
          >
            ↗
          </span>
        </span>
      </div>
    </Link>
  );
}