import { queryOptions } from "@tanstack/react-query";
import {
  getSiteContent,
  getNewsContent,
  getContactSettings,
  getMediaSlots,
  getMediaSeo,
  type NewsContent,
  type ContactSettings,
  type MediaSlotItem,
} from "@/lib/site-content.functions";
import type {
  Theme,
  ThemeSlug,
  WorkPiece,
  ThemeWork,
  ContactData,
  MediaSeo,
} from "@/lib/site-content.types";

export type { Theme, ThemeSlug, WorkPiece, ThemeWork };
export type { NewsContent, ContactSettings, MediaSlotItem, MediaSeo };

// The DB is the single source of truth. Server functions throw if the DB
// is unreachable — routes have errorComponent boundaries that catch it.
export const siteContentQueryOptions = queryOptions({
  queryKey: ["site-content"] as const,
  queryFn: () => getSiteContent(),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

export const newsContentQueryOptions = queryOptions({
  queryKey: ["news-content"] as const,
  queryFn: () => getNewsContent(),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

export const contactSettingsQueryOptions = queryOptions({
  queryKey: ["contact-settings"] as const,
  queryFn: async (): Promise<ContactData> => {
    const data = await getContactSettings();
    return (
      data ?? {
        photo: "",
        email: "",
        instagramColor: "",
        instagramBlackWhite: "",
        intro: { en: "", fr: "", es: "" },
        links: [],
      }
    );
  },
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

export type MediaSlotContentMap = Record<string, { src: string; alt: string; to: string }>;

export const mediaSlotsQueryOptions = queryOptions({
  queryKey: ["media-slots"] as const,
  queryFn: async (): Promise<MediaSlotContentMap> => {
    const data = await getMediaSlots();
    const map: MediaSlotContentMap = {};
    for (const [key, item] of Object.entries(data)) {
      if (!item?.src) continue;
      map[key] = { src: item.src, alt: item.alt, to: item.to };
    }
    return map;
  },
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

export const mediaSeoQueryOptions = queryOptions({
  queryKey: ["media-seo"] as const,
  queryFn: () => getMediaSeo(),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

// ---------- Isomorphic selectors over the query result ----------

export function themeBySlug(themes: Theme[], slug: string): Theme | undefined {
  return themes.find((t) => t.slug === slug);
}

export function getWorkBySlug(
  themes: Theme[],
  themeSlug: string,
  workSlug: string,
): ThemeWork | undefined {
  return themeBySlug(themes, themeSlug)?.works.find((w) => w.slug === workSlug);
}