import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { getFooterSettings } from "@/lib/site-chrome.functions";

type LegalLink = { title: string; url: string };

type FooterData = {
  footer_text: string | null;
  footer_legal_links: LegalLink[];
};

export function SiteFooter() {
  const [data, setData] = useState<FooterData | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await getFooterSettings();
        if (cancelled || !row) return;
        setData({ footer_text: row.footer_text, footer_legal_links: row.footer_legal_links });
      } catch {
        // keep the footer hidden when settings are unavailable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide on admin/auth surfaces
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  const copyright = data?.footer_text?.trim();
  const links = data?.footer_legal_links ?? [];
  if (!copyright && links.length === 0) return null;

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-background px-5 py-6 sm:px-6 md:px-10">
      <div className="flex flex-col items-start justify-between gap-3 text-xs text-neutral-500 md:flex-row md:items-center">
        {copyright ? <p className="whitespace-pre-line">{copyright}</p> : <span />}
        {links.length > 0 ? (
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {links.map((l, i) => (
              <li key={`${l.url}-${i}`}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-900 hover:underline"
                >
                  {l.title}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  );
}