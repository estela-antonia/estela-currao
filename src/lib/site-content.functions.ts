import { createServerFn } from "@tanstack/react-start";
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from "@/lib/supabase-public-config";
import type {
  Theme,
  ThemeWork,
  WorkPiece,
  ThemeSlug,
  Exhibition,
  Publication,
  ContactData,
  Locale,
  MediaSeo,
} from "@/lib/site-content.types";

async function createPublicClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL || PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

type MediaRowLite = {
  id: string;
  public_url: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  original_filename?: string | null;
};

/**
 * Build a Map<id, { url, name }> resolving each media row to a usable URL.
 * Prefers `public_url`; when absent, generates a long-lived signed URL from
 * the private bucket via the admin client. Signed URLs are generated in one
 * batch per bucket to keep this cheap.
 */
async function buildMediaUrlMap(
  rows: MediaRowLite[],
): Promise<Map<string, { url: string; name: string }>> {
  const map = new Map<string, { url: string; name: string }>();
  const needSign: { id: string; bucket: string; path: string; name: string }[] = [];

  for (const m of rows) {
    const name = m.original_filename ?? "";
    if (m.public_url) {
      map.set(m.id, { url: m.public_url, name });
    } else if (m.storage_bucket && m.storage_path) {
      needSign.push({ id: m.id, bucket: m.storage_bucket, path: m.storage_path, name });
    }
  }

  if (needSign.length === 0) return map;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Group by bucket for batched signing (createSignedUrls accepts paths[]).
  const byBucket = new Map<string, typeof needSign>();
  for (const item of needSign) {
    const arr = byBucket.get(item.bucket) ?? [];
    arr.push(item);
    byBucket.set(item.bucket, arr);
  }
  const EXPIRES = 60 * 60 * 24 * 7; // 7 days
  for (const [bucket, items] of byBucket) {
    const paths = items.map((i) => i.path);
    const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrls(paths, EXPIRES);
    if (!data) continue;
    data.forEach((res, idx) => {
      const item = items[idx];
      if (res.signedUrl) map.set(item.id, { url: res.signedUrl, name: item.name });
    });
  }
  return map;
}

/**
 * Parses a publication description stored as
 *   `# EN\n<english>\n\n# FR\n<french>\n\n# ES\n<spanish>`
 * back into the trilingual shape used by the /news page. Missing sections
 * fall back to whichever locale is present so nothing renders blank.
 */
function parseTrilingual(raw: string | null | undefined): { en: string; fr: string; es: string } {
  const empty = { en: "", fr: "", es: "" };
  if (!raw) return empty;
  const out = { ...empty };
  const re = /#\s*(EN|FR|ES)\s*\n([\s\S]*?)(?=\n#\s*(?:EN|FR|ES)\s*\n|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const key = m[1].toLowerCase() as "en" | "fr" | "es";
    out[key] = m[2].trim();
  }
  // if the string had no markers, treat the whole blob as ES (legacy default)
  if (!out.en && !out.fr && !out.es) out.es = raw.trim();
  const fallback = out.es || out.fr || out.en;
  if (!out.en) out.en = fallback;
  if (!out.fr) out.fr = fallback;
  if (!out.es) out.es = fallback;
  return out;
}

/**
 * Public read: assembles the full site tree (Theme[] → ThemeWork[] →
 * WorkPiece[]) in the exact legacy shape from `src/data/themes.ts`. This is
 * what powers the 4 gallery themes; consumers do not need to know about the
 * underlying tables.
 *
 * Only PUBLISHED works are returned. If the DB has no categories yet
 * (fresh clone / migration not run), returns an empty array and callers
 * fall back to the hardcoded `themes` from `src/data/themes.ts`.
 */
export const getSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<Theme[]> => {
    const supabase = await createPublicClient();

    const [catsRes, subsRes, worksRes, imagesRes, mediaRes] = await Promise.all([
      supabase.from("categories").select("id, slug, title, sort_order").eq("is_active", true).order("sort_order"),
      supabase.from("subcategories").select("id, category_id, slug, title, layout_type, sort_order, cover_media_id").eq("is_active", true).order("sort_order"),
      supabase.from("works").select("id, category_id, subcategory_id, slug, title, technique, dimensions, format, year, cita, layout_type, featured_media_id, sort_order").eq("status", "published").order("sort_order"),
      supabase.from("work_images").select("id, work_id, media_id, sort_order, is_featured").order("sort_order"),
      supabase.from("media").select("id, public_url, original_filename, storage_bucket, storage_path"),
    ]);

    if (catsRes.error) throw new Error(catsRes.error.message);
    if (subsRes.error) throw new Error(subsRes.error.message);
    if (worksRes.error) throw new Error(worksRes.error.message);
    if (imagesRes.error) throw new Error(imagesRes.error.message);
    if (mediaRes.error) throw new Error(mediaRes.error.message);

    const media = await buildMediaUrlMap(mediaRes.data ?? []);

    const imagesByWork = new Map<string, typeof imagesRes.data>();
    for (const img of imagesRes.data ?? []) {
      const arr = imagesByWork.get(img.work_id) ?? [];
      arr.push(img);
      imagesByWork.set(img.work_id, arr);
    }

    // Group works by subcategory
    const worksBySub = new Map<string, typeof worksRes.data>();
    for (const w of worksRes.data ?? []) {
      if (!w.subcategory_id) continue;
      const arr = worksBySub.get(w.subcategory_id) ?? [];
      arr.push(w);
      worksBySub.set(w.subcategory_id, arr);
    }

    const subsByCat = new Map<string, typeof subsRes.data>();
    for (const s of subsRes.data ?? []) {
      const arr = subsByCat.get(s.category_id) ?? [];
      arr.push(s);
      subsByCat.set(s.category_id, arr);
    }

    const themes: Theme[] = [];
    for (const cat of catsRes.data ?? []) {
      const subs = subsByCat.get(cat.id) ?? [];
      const works: ThemeWork[] = [];

      for (const sub of subs) {
        const subCover = sub.cover_media_id ? media.get(sub.cover_media_id) : undefined;
        const pieces: WorkPiece[] = [];
        const subWorks = worksBySub.get(sub.id) ?? [];

        for (const w of subWorks) {
          const imgs = imagesByWork.get(w.id) ?? [];
          const featured = w.featured_media_id ? media.get(w.featured_media_id) : undefined;
          // Seed convention: [0]=principal(featured), [1]=grid (if distinct), [2..]=additional
          const principal = featured
            ?? (imgs[0] ? media.get(imgs[0].media_id) : undefined);
          if (!principal) continue;

          const rest = imgs.filter((i) => !featured || i.media_id !== w.featured_media_id);
          const grid = rest[0] ? media.get(rest[0].media_id) : undefined;
          const additional = rest.slice(1)
            .map((i) => media.get(i.media_id))
            .filter((x): x is NonNullable<typeof x> => Boolean(x));

          const yearNum = w.year ? Number(w.year) : undefined;
          pieces.push({
            slug: w.slug,
            title: w.title,
            principal: principal.url,
            principalFileName: principal.name,
            grid: grid?.url,
            gridFileName: grid?.name,
            additional: additional.map((a) => a.url),
            additionalFileNames: additional.map((a) => a.name),
            medium: w.technique ?? undefined,
            format: w.format ?? undefined,
            year: Number.isFinite(yearNum) ? yearNum : undefined,
            cita: w.cita ?? undefined,
            type: (w.layout_type as WorkPiece["type"]) ?? undefined,
          });
        }

        // Fallback cover: subcategory cover, else first piece principal
        const coverUrl = subCover?.url ?? pieces[0]?.principal ?? "";
        const coverName = subCover?.name ?? pieces[0]?.principalFileName ?? "";

        works.push({
          title: sub.title,
          slug: sub.slug,
          cover: coverUrl,
          coverFileName: coverName,
          type: (sub.layout_type as ThemeWork["type"]) ?? undefined,
          pieces,
        });
      }

      themes.push({
        slug: cat.slug as ThemeSlug,
        label: cat.title.toUpperCase(),
        title: cat.title,
        path: `/${cat.slug}`,
        works,
      });
    }

    return themes;
  },
);

// ============================================================================
// News + Publications (powers /news)
// ============================================================================

export type NewsContent = {
  exhibitions: Exhibition[];
  publications: Publication[];
  about: { en: string; fr: string; es: string } | null;
};

export const getNewsContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<NewsContent> => {
    const supabase = await createPublicClient();

    const [newsRes, pubsRes, mediaRes, bioRes] = await Promise.all([
      supabase
        .from("news")
        .select("id, title, subtitle, published_at, sort_order")
        .eq("status", "published")
        .order("sort_order", { ascending: true }),
      supabase
        .from("publications")
        .select("id, title, year, description, cover_media_id, sort_order")
        .eq("status", "published")
        .order("sort_order", { ascending: true }),
      supabase.from("media").select("id, public_url, storage_bucket, storage_path, original_filename"),
      supabase.from("biography").select("body, body_fr, body_es").eq("singleton", true).maybeSingle(),
    ]);

    if (newsRes.error) throw new Error(newsRes.error.message);
    if (pubsRes.error) throw new Error(pubsRes.error.message);
    if (mediaRes.error) throw new Error(mediaRes.error.message);

    const mediaMap = await buildMediaUrlMap(mediaRes.data ?? []);
    const mediaUrl = new Map<string, string>();
    for (const [id, v] of mediaMap) mediaUrl.set(id, v.url);

    const exhibitions: Exhibition[] = (newsRes.data ?? []).map((n) => {
      // subtitle stored as `"<year> — <location>"`
      const sub = (n.subtitle ?? "").split("—").map((s: string) => s.trim());
      const year = n.published_at ? String(n.published_at).slice(0, 4) : (sub[0] ?? "");
      const location = sub.length > 1 ? sub.slice(1).join(" — ") : (sub[0] ?? "");
      return {
        date: year,
        event: n.title,
        location,
      };
    });

    const publications: Publication[] = (pubsRes.data ?? []).map((p) => ({
      year: p.year ?? "",
      magazine: p.title,
      image: p.cover_media_id ? mediaUrl.get(p.cover_media_id) : undefined,
      text: parseTrilingual(p.description),
    }));

    const bio = bioRes.error ? null : bioRes.data;
    const aboutEn = (bio?.body ?? "").trim();
    const aboutFr = (bio?.body_fr ?? "").trim();
    const aboutEs = (bio?.body_es ?? "").trim();
    const about =
      aboutEn || aboutFr || aboutEs
        ? {
            en: aboutEn || aboutEs || aboutFr,
            fr: aboutFr || aboutEn || aboutEs,
            es: aboutEs || aboutEn || aboutFr,
          }
        : null;

    return { exhibitions, publications, about };
  },
);

// ============================================================================
// Contact settings (powers /contact)
// ============================================================================

export type ContactSettings = ContactData;

export const getContactSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContactSettings | null> => {
    const supabase = await createPublicClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select(
        "contact_email, contact_phone, contact_photo_media_id, contact_instagram_color, contact_instagram_bw, contact_intro, contact_links",
      )
      .eq("singleton", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    let photo = "";
    if (data.contact_photo_media_id) {
      const { data: m } = await supabase
        .from("media")
        .select("public_url, storage_bucket, storage_path")
        .eq("id", data.contact_photo_media_id)
        .maybeSingle();
      if (m?.public_url) photo = m.public_url;
      else if (m?.storage_bucket && m?.storage_path) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: signed } = await supabaseAdmin.storage
          .from(m.storage_bucket)
          .createSignedUrl(m.storage_path, 60 * 60 * 24 * 7);
        if (signed?.signedUrl) photo = signed.signedUrl;
      }
    }

    const introRaw = (data.contact_intro ?? {}) as Partial<Record<Locale, string>>;
    const linksRaw = Array.isArray(data.contact_links) ? (data.contact_links as { title: string; url: string }[]) : [];

    return {
      photo,
      email: data.contact_email ?? "",
      instagramColor: data.contact_instagram_color ?? "",
      instagramBlackWhite: data.contact_instagram_bw ?? "",
      intro: {
        en: introRaw.en ?? "",
        fr: introRaw.fr ?? "",
        es: introRaw.es ?? "",
      },
      links: linksRaw,
    };
  },
);

// ============================================================================
// Media slots (powers /media landing)
// ============================================================================

export type MediaSlotItem = {
  slotKey: string; // e.g. "sculpture-1"
  src: string;
  alt: string;
  to: string;         // route path with theme slug + work slug
  themeSlug: ThemeSlug;
  workSlug: string;
};

export const getMediaSlots = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, MediaSlotItem>> => {
    const supabase = await createPublicClient();

    const [slotsRes, worksRes, mediaRes, catsRes, subsRes, imagesRes] = await Promise.all([
      supabase
        .from("media_slots")
        .select("slot_key, work_id, alt_override")
        .order("sort_order", { ascending: true }),
      supabase
        .from("works")
        .select("id, category_id, subcategory_id, slug, title, media_type, featured_media_id, sort_order")
        .eq("status", "published")
        .not("media_type", "is", null)
        .order("sort_order", { ascending: true }),
      supabase.from("media").select("id, public_url, storage_bucket, storage_path, original_filename"),
      supabase.from("categories").select("id, slug"),
      supabase.from("subcategories").select("id, slug, category_id"),
      supabase.from("work_images").select("work_id, media_id, sort_order").order("sort_order"),
    ]);

    if (slotsRes.error) throw new Error(slotsRes.error.message);
    if (worksRes.error) throw new Error(worksRes.error.message);
    if (mediaRes.error) throw new Error(mediaRes.error.message);
    if (catsRes.error) throw new Error(catsRes.error.message);
    if (subsRes.error) throw new Error(subsRes.error.message);
    if (imagesRes.error) throw new Error(imagesRes.error.message);

    const mediaMap = await buildMediaUrlMap(mediaRes.data ?? []);
    const mediaUrl = new Map<string, string>();
    for (const [id, v] of mediaMap) mediaUrl.set(id, v.url);

    const catSlug = new Map<string, string>();
    for (const c of catsRes.data ?? []) catSlug.set(c.id, c.slug);

    const subInfo = new Map<string, { slug: string; categoryId: string }>();
    for (const s of subsRes.data ?? []) subInfo.set(s.id, { slug: s.slug, categoryId: s.category_id });

    const firstImageByWork = new Map<string, string>();
    for (const img of imagesRes.data ?? []) {
      if (!firstImageByWork.has(img.work_id)) firstImageByWork.set(img.work_id, img.media_id);
    }

    type WorkRow = NonNullable<typeof worksRes.data>[number];
    const worksById = new Map<string, WorkRow>();
    for (const w of worksRes.data ?? []) worksById.set(w.id, w);

    function itemForWork(
      slotKey: string,
      w: WorkRow,
      altOverride: string | null,
    ): MediaSlotItem | null {
      const mediaId = w.featured_media_id ?? firstImageByWork.get(w.id) ?? null;
      const src = mediaId ? mediaUrl.get(mediaId) ?? "" : "";
      if (!src) return null;
      const themeSlug = (w.category_id ? catSlug.get(w.category_id) : undefined) as ThemeSlug | undefined;
      const subSlug = w.subcategory_id ? subInfo.get(w.subcategory_id)?.slug : undefined;
      if (!themeSlug || !subSlug) return null;
      return {
        slotKey,
        src,
        alt: altOverride?.trim() ? altOverride : w.title,
        to: `/${themeSlug}/${subSlug}`,
        themeSlug,
        workSlug: subSlug,
      };
    }

    const out: Record<string, MediaSlotItem> = {};

    // Track what auto-fallback already used, per media type, to skip duplicates
    const autoBuckets: Record<"sculpture" | "painting" | "photography", WorkRow[]> = {
      sculpture: [], painting: [], photography: [],
    };
    for (const w of worksRes.data ?? []) {
      const mt = w.media_type as "sculpture" | "painting" | "photography" | null;
      if (mt && autoBuckets[mt]) autoBuckets[mt].push(w);
    }
    const autoCursor: Record<string, number> = { sculpture: 0, painting: 0, photography: 0 };

    for (const slot of slotsRes.data ?? []) {
      const mt = slot.slot_key.split("-")[0] as "sculpture" | "painting" | "photography";
      // 1) Explicit assignment
      if (slot.work_id) {
        const w = worksById.get(slot.work_id);
        if (w) {
          const item = itemForWork(slot.slot_key, w, slot.alt_override);
          if (item) { out[slot.slot_key] = item; continue; }
        }
      }
      // 2) Auto-fill from next available work of the same media type
      const list = autoBuckets[mt] ?? [];
      while (autoCursor[mt] < list.length) {
        const w = list[autoCursor[mt]++];
        const item = itemForWork(slot.slot_key, w, slot.alt_override);
        if (item) { out[slot.slot_key] = item; break; }
      }
    }

    return out;
  },
);

// ============================================================================
// Media SEO (powers /media/$type)
// ============================================================================

export const getMediaSeo = createServerFn({ method: "GET" }).handler(
  async (): Promise<MediaSeo[]> => {
    const supabase = await createPublicClient();

    const { data, error } = await supabase
      .from("media_seo")
      .select(
        "type, h1_fr, h1_es, keyword, seo_title, seo_description, intro_fr, intro_es, status",
      )
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      type: row.type as MediaSeo["type"],
      h1Fr: row.h1_fr ?? "",
      h1Es: row.h1_es ?? "",
      keyword: row.keyword ?? "",
      seoTitle: row.seo_title ?? "",
      seoDescription: row.seo_description ?? "",
      introFr: row.intro_fr ?? "",
      introEs: row.intro_es ?? "",
      status: row.status as MediaSeo["status"],
    }));
  },
);