// CSRF protection for the public contact form: a signed, short-lived token is
// issued as an httpOnly cookie and echoed back in the submission payload
// (double-submit). Both halves must match and the signature must verify.

export const CSRF_COOKIE_NAME = "ec_contact_csrf";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours

const encoder = new TextEncoder();

function secret(): string {
  // External deployments already provide the private database service key.
  // Reuse it as the HMAC key when a dedicated CSRF secret was not configured,
  // so issuing the contact token cannot fail before the message is saved.
  const value = process.env["CONTACT_CSRF_SECRET"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!value) throw new Error("Missing contact form signing secret");
  return value;
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createCsrfToken(): Promise<string> {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyCsrfToken(
  token: string | undefined,
  cookieToken: string | undefined,
): Promise<boolean> {
  if (!token || !cookieToken) return false;
  if (!timingSafeEqual(token, cookieToken)) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiresAt, nonce, signature] = parts as [string, string, string];

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  return timingSafeEqual(signature, await sign(`${expiresAt}.${nonce}`));
}
