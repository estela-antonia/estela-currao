import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import type { Locale } from "@/lib/site-content.types";
import { contactSettingsQueryOptions } from "@/lib/site-content";
import { BASE_URL } from "@/lib/site";
import { RouteErrorFallback } from "@/components/RouteFallbacks";
import { ContactForm } from "@/components/ContactForm";

export const Route = createFileRoute("/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(contactSettingsQueryOptions),
  head: () => ({
    meta: [
      { title: "Contact — Estela Currao, Visual Artist and Architect" },
      { name: "description", content: "Get in touch with Estela Currao — visual artist and architect — for exhibitions, commissions and press enquiries." },
      { property: "og:title", content: "Contact — Estela Currao, Visual Artist and Architect" },
      { property: "og:description", content: "Get in touch with Estela Currao — visual artist and architect — for exhibitions, commissions and press enquiries." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/contact` },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/contact` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact — Estela Currao",
          url: `${BASE_URL}/contact`,
          "@id": `${BASE_URL}/contact#webpage`,
          inLanguage: "en",
          isPartOf: { "@id": `${BASE_URL}/#website` },
          about: { "@id": `${BASE_URL}/#person` },
          mainEntity: { "@id": `${BASE_URL}/#person` },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Contact", item: `${BASE_URL}/contact` },
          ],
        }),
      },
    ],
  }),
  component: ContactPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} backTo="/" backLabel="Back home" />
  ),
});

function ContactPage() {
  // Contact page is English-only by design.
  const locale: Locale = "en";
  const { data: contact } = useSuspenseQuery(contactSettingsQueryOptions);
  const { photo, instagramColor, instagramBlackWhite, intro, links } = contact;

  const introText = intro[locale];
  const visibleLinks = links.filter((l) => l.url && l.url.trim() !== "");

  const titleNode = (
    <h1 className="text-[7.2vw] md:text-[clamp(1.1rem,1.8vw,2.25rem)] font-light leading-[1.05] tracking-tight text-neutral-900 mb-10 md:mb-0 break-words">
      <span aria-hidden="true">CONTACT</span>
      <span className="sr-only">Contact Estela Currao — visual artist and architect</span>
    </h1>
  );

  const contactInfo = (
    <div className="flex flex-col gap-10 md:gap-6">
      <div className="space-y-2">
        <p className="text-[13px] font-light uppercase tracking-[0.3em] text-neutral-500">
          Instagram
        </p>
        <div className="flex flex-col gap-2">
          {instagramColor ? (
            <a
              href={instagramColor}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[clamp(14px,1.6vw,15px)] font-light text-neutral-900 hover:text-neutral-500 transition-colors"
            >
              Instagram — Color
            </a>
          ) : null}
          {instagramBlackWhite ? (
            <a
              href={instagramBlackWhite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[clamp(14px,1.6vw,15px)] font-light text-neutral-900 hover:text-neutral-500 transition-colors"
            >
              Instagram — Black &amp; White
            </a>
          ) : null}
        </div>
      </div>

      {visibleLinks.length > 0 ? (
      <div className="space-y-2">
          <p className="text-[13px] font-light uppercase tracking-[0.3em] text-neutral-500">
            Links
          </p>
          <ul className="flex flex-col gap-2">
            {visibleLinks.map((link) => (
              <li key={`${link.title}-${link.url}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[clamp(14px,1.6vw,15px)] font-light text-neutral-900 hover:text-neutral-500 transition-colors"
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );

  const quoteNode = (
    <blockquote className="max-w-[420px] md:max-w-none border-l border-neutral-300 pl-4 text-[15px] md:text-base italic leading-loose md:leading-relaxed text-neutral-600 whitespace-pre-line">
      {introText}
    </blockquote>
  );

  const photoNode = photo ? (
    <img
      src={photo}
      alt="Estela Currao"
      className="w-full max-w-[336px] object-contain md:h-auto md:max-h-[46vh] md:w-auto md:max-w-[340px]"
      loading="lazy"
    />
  ) : null;

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={{
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <SiteHeader />
      {/* Mobile layout — unchanged */}
      <main className="flex-1 px-5 py-8 sm:px-6 md:hidden">
        {titleNode}
        <div className="flex flex-col gap-10">
          {contactInfo}
          <ContactForm locale={locale} />
          {photoNode ? <div className="flex justify-center">{photoNode}</div> : null}
          {quoteNode}
        </div>
      </main>

      {/* Desktop layout — mirrors PROFILE grid */}
      <main className="hidden flex-1 md:grid md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-10 desktop-tall:h-[calc(100dvh-77px)] desktop-tall:overflow-hidden">
        {/* Left column — title + social links */}
        <aside className="relative min-w-0">
          <div className="sticky top-0 min-w-0 md:pl-10 md:pr-4 md:py-24 lg:pl-10 lg:pr-6">
            {titleNode}
            <div className="mt-8">{contactInfo}</div>
          </div>
        </aside>

        {/* Right column — form, photo, quote */}
        <section className="md:pl-4 md:pr-[4vw] md:py-24">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-[clamp(1.5rem,3vw,3.5rem)]">
            <div className="min-w-0">
              <ContactForm locale={locale} />
              <div className="pt-8">{quoteNode}</div>
            </div>
            {photoNode ? (
              <div className="flex items-start justify-end">{photoNode}</div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
