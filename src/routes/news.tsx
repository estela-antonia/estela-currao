import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { LazyImage } from "@/components/LazyImage";
import { cn } from "@/lib/utils";
import { newsContentQueryOptions } from "@/lib/site-content";
import { BASE_URL } from "@/lib/site";
import heroAsset from "@/assets/estela_home.webp";
import { useState } from "react";
import { RouteErrorFallback } from "@/components/RouteFallbacks";

export const Route = createFileRoute("/news")({
  loader: ({ context }) => context.queryClient.ensureQueryData(newsContentQueryOptions),
  head: () => ({
    meta: [
      { title: "Profile — Estela Currao" },
      { name: "description", content: "Recent exhibitions and publications by visual artist Estela Currao — sculpture, painting and photography." },
      { property: "og:title", content: "Profile — Estela Currao" },
      { property: "og:description", content: "Recent exhibitions and publications by visual artist Estela Currao." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/news` },
      { property: "og:image", content: `${BASE_URL}${heroAsset}` },
      { name: "twitter:image", content: `${BASE_URL}${heroAsset}` },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/news` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "@id": `${BASE_URL}/news#aboutpage`,
          url: `${BASE_URL}/news`,
          name: "Profile — Estela Currao",
          description:
            "Biography, exhibitions and publications of Estela Currao, visual artist and architect.",
          mainEntity: { "@id": "https://estelacurrao.com/#person" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Profile", item: `${BASE_URL}/news` },
          ],
        }),
      },
    ],
  }),
  component: NewsPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
  ),
});

const LABELS = {
  en: {
    about: "About",
    exhibitions: "Exhibitions",
    publications: "Publications",
    dossier: "↓ Download PDF Press Dossier",
    heading: "Profile, exhibitions and press of Estela Currao",
    langGroup: "Content language",
    langNames: { en: "English", fr: "French", es: "Spanish" },
  },
  fr: {
    about: "À propos",
    exhibitions: "Expositions",
    publications: "Publications",
    dossier: "↓ Télécharger le dossier de presse PDF",
    heading: "Profil, expositions et presse d'Estela Currao",
    langGroup: "Langue du contenu",
    langNames: { en: "Anglais", fr: "Français", es: "Espagnol" },
  },
  es: {
    about: "Sobre mí",
    exhibitions: "Exposiciones",
    publications: "Publicaciones",
    dossier: "↓ Descargar dossier de prensa en PDF",
    heading: "Perfil, exposiciones y prensa de Estela Currao",
    langGroup: "Idioma del contenido",
    langNames: { en: "Inglés", fr: "Francés", es: "Español" },
  },
} as const;

function NewsPage() {
  const [lang, setLang] = useState<"en" | "fr" | "es">("en");
  const t = LABELS[lang];
  const { data } = useSuspenseQuery(newsContentQueryOptions);
  const { exhibitions, publications, about } = data;
  return (
    <div
      className="min-h-screen bg-white text-neutral-900"
      style={{
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <SiteHeader />

      <main
        lang={lang}
        className="grid grid-cols-1 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-10 min-h-[calc(100vh-80px)]"
      >
        {/* Left column — fixed NEWS title */}
        <aside className="relative min-w-0">
          <div className="sticky top-24 min-w-0 px-5 pt-14 pb-0 sm:px-6 md:pl-10 md:pr-4 md:py-24 lg:pl-10 lg:pr-6">
            <h1 className="text-[7.2vw] md:text-[clamp(1.1rem,1.8vw,2.25rem)] font-light leading-[1.05] tracking-tight text-neutral-900 break-words">
              <span aria-hidden="true">PROFILE</span>
              <span className="sr-only">{t.heading}</span>
            </h1>
            <div
              role="group"
              aria-label={t.langGroup}
              className="mt-2 flex gap-4 pl-[6px] text-[11px] font-light uppercase tracking-[0.28em] text-neutral-500"
            >
              {(["en", "fr", "es"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  aria-pressed={lang === code}
                  aria-label={t.langNames[code]}
                  onClick={() => setLang(code)}
                  className={
                    lang === code
                      ? "text-neutral-900 opacity-100"
                      : "opacity-60 transition-opacity hover:opacity-100"
                  }
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right column — static content (fluid: grows with viewport) */}
        <section className="px-5 pt-10 pb-12 sm:px-6 md:pl-4 md:pr-[4vw] md:py-16">
          {/* Press dossier download — above About */}
          <div className="mb-8 md:text-right">
            <a
              href="/press-dossier"
              className="text-[11px] font-light uppercase tracking-[0.22em] text-neutral-500 transition-opacity hover:text-neutral-900 hover:opacity-100 md:text-[clamp(11px,0.72vw,13px)]"
            >
              {t.dossier}
            </a>
          </div>

          {/* About — brief presentation of the artistic practice */}
          {about && (
            <div className="mb-16">
              <h2 className="mb-6 text-[10px] font-light uppercase tracking-[0.32em] text-neutral-500">
                {t.about}
              </h2>
              <div className="space-y-2 text-sm font-light leading-relaxed text-neutral-800 md:text-[clamp(0.9rem,1vw,1.25rem)]">
                {about[lang]
                  .split(/\n\s*\n/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {para}
                    </p>
                  ))}
              </div>
            </div>
          )}

          {/* Exhibitions — vertical list, text only */}
          <div className="mb-20">
            <h2 className="mb-8 text-[10px] font-light uppercase tracking-[0.32em] text-neutral-500">
              {t.exhibitions}
            </h2>
            <ul className="divide-y divide-neutral-200">
              {exhibitions.map((ex, i) => (
                <li
                  key={`${ex.date}-${ex.event}-${i}`}
                  className="grid grid-cols-[80px_1fr] gap-6 py-5 md:grid-cols-[8%_1fr_28%] md:gap-8"
                >
                  <span className="text-sm font-light text-neutral-500 md:text-[clamp(0.875rem,0.9vw,1.125rem)]">
                    {ex.date}
                  </span>
                  <span className="text-sm font-light text-neutral-900 md:text-[clamp(0.875rem,0.95vw,1.25rem)]">
                    {ex.event}
                    <span className="mt-1 block text-xs font-light text-neutral-500 md:hidden">
                      {ex.location}
                    </span>
                  </span>
                  <span className="hidden text-sm font-light text-neutral-700 md:block md:text-[clamp(0.875rem,0.9vw,1.125rem)]">
                    {ex.location}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Publications — split horizontal blocks */}
          <div>
            <h2 className="mb-8 text-[10px] font-light uppercase tracking-[0.32em] text-neutral-500">
              {t.publications}
            </h2>
            <ul className="space-y-10 md:space-y-[clamp(2.5rem,3vw,4rem)]">
              {publications.map((pub, i) => (
                <li
                  key={`${pub.year}-${pub.magazine}-${i}`}
                  className={cn(
                    "grid grid-cols-1 gap-6",
                    pub.image
                      ? "md:grid-cols-[65fr_35fr] md:gap-[clamp(1.5rem,2.5vw,3rem)]"
                      : "md:grid-cols-1",
                  )}
                >
                  <div className="flex flex-col justify-center">
                    <p className="mb-3 whitespace-pre-line text-sm font-light leading-relaxed text-neutral-800 md:text-[clamp(0.9rem,1vw,1.25rem)]">
                      {pub.text[lang]}
                    </p>
                    <p className="text-[11px] font-light uppercase tracking-[0.22em] text-neutral-500 md:text-[clamp(11px,0.7vw,14px)]">
                      {pub.magazine} — {pub.year}
                    </p>
                  </div>
                  {pub.image && (
                    <div className="flex items-start justify-end">
                      <LazyImage
                        src={pub.image}
                        alt={`${pub.magazine} ${pub.year}`}
                        title={`${pub.magazine} ${pub.year}`}
                        className="aspect-[3/4] w-[42%] border border-neutral-200 md:w-[70%]"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}