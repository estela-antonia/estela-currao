import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getPressDossierUrl } from "@/lib/site-chrome.functions";
import { BASE_URL } from "@/lib/site";

export const Route = createFileRoute("/press-dossier")({
  head: () => ({
    meta: [
      { title: "Press Dossier — Estela Currao" },
      { name: "description", content: "Download the press dossier of Estela Currao: biography, exhibitions, selected works and press coverage in PDF." },
      { property: "og:title", content: "Press Dossier — Estela Currao" },
      { property: "og:description", content: "Download the press dossier of Estela Currao: biography, exhibitions, selected works and press coverage in PDF." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/press-dossier` },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/press-dossier` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${BASE_URL}/press-dossier#webpage`,
          url: `${BASE_URL}/press-dossier`,
          name: "Press Dossier — Estela Currao",
          description:
            "Download the press dossier of Estela Currao: biography, exhibitions, selected works and press coverage in PDF.",
          inLanguage: "en",
          isPartOf: { "@id": `${BASE_URL}/#website` },
          about: { "@id": `${BASE_URL}/#person` },
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
            { "@type": "ListItem", position: 3, name: "Press Dossier", item: `${BASE_URL}/press-dossier` },
          ],
        }),
      },
    ],
  }),
  component: PressDossierPage,
});

function PressDossierPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { url: signed } = await getPressDossierUrl();
        if (!cancelled && signed) {
          setUrl(signed);
          window.location.replace(signed);
        }
      } catch {
        // fall through to Coming Soon
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (url) {
    return (
      <div
        className="min-h-screen bg-white text-neutral-900"
        style={{
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <SiteHeader />
        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-8">
          <p className="text-sm font-light text-neutral-500">
            Opening press dossier…{" "}
            <a href={url} className="underline">
              Abrir el dossier de prensa manualmente si no se abre solo.
            </a>
          </p>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white text-neutral-900"
      style={{
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-8 text-center">
        <h1 className="text-[8vw] font-light leading-[1.05] tracking-tight text-neutral-900 md:text-[3.2vw]">
          Dossier de Presse
        </h1>
        <p className="mt-6 text-[11px] font-light uppercase tracking-[0.32em] text-neutral-500">
          Coming Soon
        </p>
        <p className="mt-8 max-w-md text-sm font-light text-neutral-600 md:text-base">
          Our press materials will be available soon.
        </p>
      </main>
    </div>
  );
}