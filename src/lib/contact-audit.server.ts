/**
 * Structured, privacy-safe logging of rejected contact-form attempts.
 * Never logs names, emails or message bodies — only the reason, a coarse
 * timestamp and non-reversible hashes already used by the rate limiter.
 */
export type ContactRejectionReason =
  | "honeypot"
  | "too_fast"
  | "invalid_input"
  | "csrf_invalid"
  | "bad_origin"
  | "rate_limit_hour"
  | "rate_limit_day";

export function logContactRejection(
  reason: ContactRejectionReason,
  details: { ipHash?: string | null; sessionHash?: string | null; fields?: string[] } = {},
) {
  console.warn(
    JSON.stringify({
      event: "contact_form_rejected",
      reason,
      at: new Date().toISOString(),
      ipHash: details.ipHash ? details.ipHash.slice(0, 12) : undefined,
      sessionHash: details.sessionHash ? details.sessionHash.slice(0, 12) : undefined,
      fields: details.fields,
    }),
  );
}
