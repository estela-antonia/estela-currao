// Ad-hoc rate limiting for the public contact form. There is no shared
// rate-limit primitive in the backend, so submissions are counted in
// public.contact_submission_log (service-role only) per hashed IP and per
// anonymous session cookie.

export const SESSION_COOKIE_NAME = "ec_contact_sid";

export const LIMITS = {
  perHour: 3,
  perDay: 10,
} as const;

const encoder = new TextEncoder();

// Hash identifiers so no raw IP is ever stored.
export async function hashIdentifier(value: string): Promise<string> {
  const salt = process.env["CONTACT_CSRF_SECRET"] ?? "";
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${salt}:${value}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type RateLimitResult = { allowed: true } | { allowed: false; scope: "hour" | "day" };

export async function checkAndRecordSubmission(
  ipHash: string,
  sessionHash: string | null,
): Promise<RateLimitResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const now = Date.now();
  const dayAgo = new Date(now - 1000 * 60 * 60 * 24).toISOString();
  const hourAgo = new Date(now - 1000 * 60 * 60).toISOString();

  const orFilter = sessionHash
    ? `ip_hash.eq.${ipHash},session_hash.eq.${sessionHash}`
    : `ip_hash.eq.${ipHash}`;

  const { data, error } = await supabaseAdmin
    .from("contact_submission_log")
    .select("created_at")
    .or(orFilter)
    .gte("created_at", dayAgo);

  // Never block a genuine visitor because the counter itself failed.
  if (error) return { allowed: true };

  const rows = data ?? [];
  if (rows.length >= LIMITS.perDay) return { allowed: false, scope: "day" };
  const inLastHour = rows.filter((r) => r.created_at >= hourAgo).length;
  if (inLastHour >= LIMITS.perHour) return { allowed: false, scope: "hour" };

  await supabaseAdmin
    .from("contact_submission_log")
    .insert({ ip_hash: ipHash, session_hash: sessionHash });

  // Opportunistic cleanup of old rows.
  void supabaseAdmin
    .from("contact_submission_log")
    .delete()
    .lt("created_at", new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString());

  return { allowed: true };
}
