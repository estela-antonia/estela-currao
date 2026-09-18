import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { siteContentQueryOptions } from "@/lib/site-content";

const NAV = [
  { to: "/", label: "home" },
  { to: "/media", label: "media" },
  { to: "/news", label: "profile" },
  { to: "/contact", label: "contact" },
] as const;

export function SiteHeader() {
  const [desktopWorks, setDesktopWorks] = useState(false);
  const [desktopHoverCat, setDesktopHoverCat] = useState<string | null>(null);
  const [desktopMedia, setDesktopMedia] = useState(false);
  const { data: themes } = useQuery(siteContentQueryOptions);

  const desktopActiveCat =
    desktopHoverCat ? themes?.find((t) => t.slug === desktopHoverCat) : undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white md:border-neutral-200">
      <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6 md:px-10 md:py-5">
        <Link
          to="/"
          className="hidden min-w-0 truncate font-sans font-light uppercase tracking-[0.22em] text-neutral-900 lg:block lg:text-[24px]"
        >
          Estela Currao
        </Link>
        <nav className="hidden flex-1 items-center justify-between gap-6 font-sans text-[13px] font-light lowercase tracking-[0.28em] text-neutral-700 md:flex md:text-[14px] lg:flex-none lg:justify-end lg:gap-9">
          <Link to="/" className="transition-opacity hover:opacity-60">home</Link>
          <div
            className="relative"
            onMouseEnter={() => setDesktopWorks(true)}
            onMouseLeave={() => {
              setDesktopWorks(false);
              setDesktopHoverCat(null);
            }}
          >
            <button
              type="button"
              className="transition-opacity hover:opacity-60"
              aria-haspopup="true"
              aria-expanded={desktopWorks}
            >
              worlds
            </button>
            {desktopWorks && (themes?.length ?? 0) > 0 && (
              <div className="absolute left-0 top-full pt-3">
                <div className="flex bg-white border border-neutral-200 shadow-sm">
                  <ul className="min-w-[220px] py-2">
                    {(themes ?? []).map((t) => (
                      <li key={t.slug}>
                        <Link
                          to="/$category"
                          params={{ category: t.slug }}
                          onMouseEnter={() => setDesktopHoverCat(t.slug)}
                          onClick={() => {
                            setDesktopWorks(false);
                            setDesktopHoverCat(null);
                          }}
                          className={
                            "flex items-center justify-between gap-6 px-5 py-2 text-[12px] tracking-[0.22em] transition-colors " +
                            (desktopHoverCat === t.slug
                              ? "bg-neutral-50 text-neutral-900"
                              : "text-neutral-700 hover:bg-neutral-50")
                          }
                        >
                          <span>{t.label.toLowerCase()}</span>
                          {t.works.length > 0 && (
                            <ChevronRight size={12} strokeWidth={1.5} />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {desktopActiveCat && desktopActiveCat.works.length > 0 && (
                    <ul className="min-w-[240px] border-l border-neutral-200 py-2">
                      {desktopActiveCat.works.map((w) => (
                        <li key={w.slug}>
                          <Link
                            to="/$category/$work"
                            params={{ category: desktopActiveCat.slug, work: w.slug }}
                            onClick={() => {
                              setDesktopWorks(false);
                              setDesktopHoverCat(null);
                            }}
                            className="block px-5 py-2 text-[12px] tracking-[0.22em] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                          >
                            {w.title.toLowerCase()}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          {NAV.filter((n) => n.to !== "/").map((n) =>
            n.to === "/media" ? (
              <div
                key={n.to}
                className="relative"
                onMouseEnter={() => setDesktopMedia(true)}
                onMouseLeave={() => setDesktopMedia(false)}
              >
                <Link
                  to={n.to}
                  className="transition-opacity hover:opacity-60"
                  onFocus={() => setDesktopMedia(true)}
                  onBlur={() => setDesktopMedia(false)}
                >
                  {n.label}
                </Link>
                {desktopMedia && (
                  <div className="absolute left-0 top-full pt-3">
                    <div className="min-w-[220px] border border-neutral-200 bg-white px-5 py-3 shadow-sm">
                      <p className="text-[12px] font-light lowercase tracking-[0.22em] text-neutral-700">
                        by technique
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link key={n.to} to={n.to} className="transition-opacity hover:opacity-60">
                {n.label}
              </Link>
            ),
          )}
        </nav>
        <nav className="flex w-full items-center justify-between gap-4 font-sans text-[12px] font-light lowercase tracking-[0.24em] text-neutral-700 md:hidden">
          <Link
            to="/$category"
            params={{ category: "identity" }}
            aria-label="worlds"
            className="transition-opacity hover:opacity-60"
          >
            worlds
          </Link>
          {NAV.filter((n) => n.to !== "/").map((n) => (
            <Link key={n.to} to={n.to} className="transition-opacity hover:opacity-60">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}