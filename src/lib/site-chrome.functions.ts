import { createServerFn } from "@tanstack/react-start";

type LegalLink = { title: string; url: string };

async function createPublicClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/** Resolve a media id to a usable URL: public_url first, signed URL as fallback. */
async function resolveMediaUrl(
  client: Awaited<ReturnType<typeof createPublicClient>>,
  mediaId: string | null | undefined,
): Promise<string | null> {
  if (!mediaId) return null;
  const { data: media } = await client
    .from("media")
    .select("public_url, storage_bucket, storage_path")
    .eq("id", mediaId)
    .maybeSingle();
  if (!media) return null;
  if (media.public_url) return media.public_url as string;
  if (!media.storage_bucket || !media.storage_path) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.storage
      .from(media.storage_bucket as string)
      .createSignedUrl(media.storage_path as string, 60 * 60 * 24 * 7);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export const getFooterSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ footer_text: string | null; footer_legal_links: LegalLink[] }> => {
    try {
      const client = await createPublicClient();
      const { data: row } = await client
        .from("site_settings")
        .select("footer_text, footer_legal_links")
        .eq("singleton", true)
        .maybeSingle();
      const links = Array.isArray(row?.footer_legal_links)
        ? (row!.footer_legal_links as LegalLink[]).filter(
            (l) =>
              l &&
              typeof l.title === "string" &&
              typeof l.url === "string" &&
              l.title.trim() &&
              l.url.trim(),
          )
        : [];
      return { footer_text: (row?.footer_text as string | null) ?? null, footer_legal_links: links };
    } catch {
      return { footer_text: null, footer_legal_links: [] };
    }
  },
);

export const getHomeImages = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ desktop: string | null; tablet: string | null; mobile: string | null }> => {
    try {
      const client = await createPublicClient();
      const { data: settings } = await client
        .from("site_settings")
        .select(
          "home_image_desktop_media_id, home_image_tablet_media_id, home_image_mobile_media_id",
        )
        .eq("singleton", true)
        .maybeSingle();
      if (!settings) return { desktop: null, tablet: null, mobile: null };
      const [desktop, tablet, mobile] = await Promise.all([
        resolveMediaUrl(client, settings.home_image_desktop_media_id as string | null),
        resolveMediaUrl(client, settings.home_image_tablet_media_id as string | null),
        resolveMediaUrl(client, settings.home_image_mobile_media_id as string | null),
      ]);
      return { desktop, tablet, mobile };
    } catch {
      return { desktop: null, tablet: null, mobile: null };
    }
  },
);

export const getPressDossierUrl = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ url: string | null }> => {
    try {
      const client = await createPublicClient();
      const { data: settings } = await client
        .from("site_settings")
        .select("press_dossier_media_id")
        .eq("singleton", true)
        .maybeSingle();
      const url = await resolveMediaUrl(
        client,
        (settings?.press_dossier_media_id as string | null) ?? null,
      );
      return { url };
    } catch {
      return { url: null };
    }
  },
);
