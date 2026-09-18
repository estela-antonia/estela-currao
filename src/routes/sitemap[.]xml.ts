import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import type { Theme } from "@/lib/site-content.types";
import { getSiteContent } from "@/lib/site-content.functions";
import { BASE_URL } from "@/lib/site";
import homeAsset from "@/assets/estela_home.webp";

type SitemapImage = { loc: string; title?: string; caption?: string };

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  images?: SitemapImage[];
}

/** XML-escape text and URLs before emitting them. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Only permanent, publicly cacheable image URLs belong in an image sitemap.
 * Site assets are served from relative paths; signed storage URLs carry an
 * expiring token, so they are skipped.
 */
function toAbsoluteImage(url: string | undefined | null): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u || !u.startsWith("/")) return null;
  return `${BASE_URL}${u}`;
}

function collectImages(
  sources: (string | undefined | null)[],
  title: string,
): SitemapImage[] {
  const seen = new Set<string>();
  const out: SitemapImage[] = [];
  for (const src of sources) {
    const loc = toAbsoluteImage(src);
    if (!loc || seen.has(loc)) continue;
    seen.add(loc);
    out.push({ loc, title });
  }
  return out;
}

const HOME_IMAGE = `${BASE_URL}${homeAsset}`;

const STATIC: SitemapEntry[] = [
  {
    path: "/",
    changefreq: "weekly",
    priority: "1.0",
    images: [{ loc: HOME_IMAGE, title: "Estela Currao — visual artist and architect" }],
  },
  { path: "/works", changefreq: "weekly", priority: "0.8" },
  { path: "/identity", changefreq: "weekly", priority: "0.8" },
  { path: "/rhythmic-matrices", changefreq: "weekly", priority: "0.8" },
  { path: "/intersections", changefreq: "weekly", priority: "0.8" },
  { path: "/photography", changefreq: "weekly", priority: "0.8" },
  { path: "/media", changefreq: "monthly", priority: "0.7" },
  { path: "/architecture", changefreq: "monthly", priority: "0.7" },
  { path: "/media/sculpture", changefreq: "monthly", priority: "0.6" },
  { path: "/media/painting", changefreq: "monthly", priority: "0.6" },
  { path: "/media/photography", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/news", changefreq: "monthly", priority: "0.6" },
  { path: "/press-dossier", changefreq: "monthly", priority: "0.5" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC];

        let themes: Theme[] = [];
        try {
          themes = await getSiteContent();
        } catch {
          // DB unreachable — emit sitemap with only static top-level entries
        }

        for (const theme of themes) {
          for (const work of theme.works) {
            const workTitle = work.title.replace(/\u00a0/g, " ").trim();
            entries.push({
              path: `/${theme.slug}/${work.slug}`,
              changefreq: "monthly",
              priority: "0.7",
              images: collectImages(
                [work.cover, work.detail, ...(work.images ?? [])],
                `${workTitle} — Estela Currao`,
              ),
            });
            const pieces = work.pieces ?? [];
            pieces.forEach((piece, idx) => {
              const pieceTitle = (piece.title || workTitle).replace(/\u00a0/g, " ").trim();
              entries.push({
                path: `/${theme.slug}/${work.slug}/${idx + 1}`,
                changefreq: "monthly",
                priority: "0.6",
                images: collectImages(
                  [piece.principal, piece.grid, ...(piece.additional ?? [])],
                  `${pieceTitle} — Estela Currao`,
                ),
              });
            });
          }
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            ...(e.images ?? []).map((img) =>
              [
                `    <image:image>`,
                `      <image:loc>${esc(img.loc)}</image:loc>`,
                img.title ? `      <image:title>${esc(img.title)}</image:title>` : null,
                img.caption ? `      <image:caption>${esc(img.caption)}</image:caption>` : null,
                `    </image:image>`,
              ]
                .filter(Boolean)
                .join("\n"),
            ),
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
