// CSRF protection for the public contact form: a random, short-lived token is
// issued as an httpOnly cookie and echoed back in the submission payload
// (double-submit). Both halves must match and the token must not be expired.
//
// No server secret is required, so issuing the token can never fail because of
// missing environment configuration on external deployments.

export const CSRF_COOKIE_NAME = "ec_contact_csrf";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createCsrfToken(): Promise<string> {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${expiresAt}.${nonce}`;
}

export async function verifyCsrfToken(
  token: string | undefined,
  cookieToken: string | undefined,
): Promise<boolean> {
  if (!token || !cookieToken) return false;
  if (!timingSafeEqual(token, cookieToken)) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiresAt, nonce] = parts as [string, string];

  if (nonce.length !== 64 || !/^[0-9a-f]+$/.test(nonce)) return false;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  return true;
}
