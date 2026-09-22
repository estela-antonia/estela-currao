import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, getRequestIP, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

const submissionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
  // Honeypot: must stay empty. Bots that fill every field get rejected.
  website: z.string().max(200).optional().default(""),
  // Time-based check: ms elapsed between form mount and submit.
  elapsedMs: z.number().int().min(0).max(1000 * 60 * 60 * 24).optional().default(0),
  // CSRF: double-submit token, must match the httpOnly cookie and verify.
  csrfToken: z.string().min(1).max(200),
});

// Humans need at least a couple of seconds to fill three fields.
const MIN_FILL_MS = 2500;

// Issues a signed, short-lived CSRF token and stores it in an httpOnly cookie.
export const getContactCsrfToken = createServerFn({ method: "GET" }).handler(async () => {
  const { createCsrfToken, CSRF_COOKIE_NAME } = await import("@/lib/contact-csrf.server");
  const token = await createCsrfToken();
  setCookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 2,
  });

  // Anonymous session id used by the rate limiter (no personal data).
  const { SESSION_COOKIE_NAME } = await import("@/lib/contact-rate-limit.server");
  if (!getCookie(SESSION_COOKIE_NAME)) {
    setCookie(SESSION_COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return { token };
});

// Hashed request identifiers for logs (never raw IPs).
async function requestIdentityHashes() {
  const { hashIdentifier, SESSION_COOKIE_NAME } = await import("@/lib/contact-rate-limit.server");
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  const sessionId = getCookie(SESSION_COOKIE_NAME);
  return {
    ipHash: await hashIdentifier(ip),
    sessionHash: sessionId ? await hashIdentifier(sessionId) : null,
  };
}

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = submissionSchema.safeParse(input);
    if (!parsed.success) {
      const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "unknown")))];
      void import("@/lib/contact-audit.server").then(({ logContactRejection }) =>
        logContactRejection("invalid_input", { fields }),
      );
      throw parsed.error;
    }
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const { logContactRejection } = await import("@/lib/contact-audit.server");
    // Same-origin check: reject cross-site form posts outright.
    const origin = getRequestHeader("origin") ?? "";
    const host = getRequestHeader("host") ?? "";
    if (origin && host) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        originHost = "";
      }
      if (originHost !== host) {
        logContactRejection("bad_origin", await requestIdentityHashes());
        throw new Error("Invalid request origin.");
      }
    }

    const { verifyCsrfToken, CSRF_COOKIE_NAME } = await import("@/lib/contact-csrf.server");
    const cookieToken = getCookie(CSRF_COOKIE_NAME);
    if (!(await verifyCsrfToken(data.csrfToken, cookieToken))) {
      logContactRejection("csrf_invalid", await requestIdentityHashes());
      throw new Error("CSRF_INVALID");
    }

    if (data.website.trim() !== "" || data.elapsedMs < MIN_FILL_MS) {
      logContactRejection(
        data.website.trim() !== "" ? "honeypot" : "too_fast",
        await requestIdentityHashes(),
      );
      // Silent success: never tell a bot why it failed.
      return { ok: true as const };
    }

    // Rate limit by IP and by anonymous session before doing any work.
    const { checkAndRecordSubmission, hashIdentifier, SESSION_COOKIE_NAME } = await import(
      "@/lib/contact-rate-limit.server"
    );
    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const sessionId = getCookie(SESSION_COOKIE_NAME);
    const limit = await checkAndRecordSubmission(
      await hashIdentifier(ip),
      sessionId ? await hashIdentifier(sessionId) : null,
    );
    if (!limit.allowed) {
      logContactRejection(limit.scope === "hour" ? "rate_limit_hour" : "rate_limit_day", {
        ipHash: await hashIdentifier(ip),
        sessionHash: sessionId ? await hashIdentifier(sessionId) : null,
      });
      throw new Error(limit.scope === "hour" ? "RATE_LIMIT_HOUR" : "RATE_LIMIT_DAY");
    }

    const { getSupabaseAdmin } = await import("@/lib/supabase-admin.server");
    const supabaseAdmin = getSupabaseAdmin();
    const { data: inserted, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        name: data.name,
        email: data.email,
        message: data.message,
      })
      .select("id")
      .maybeSingle();

    if (error) throw new Error("No pudimos enviar el mensaje. Intenta de nuevo.");

    // Notify the studio inbox. A delivery failure must not lose the message,
    // which is already stored above.
    const messageRowId = inserted?.id ?? crypto.randomUUID();
    try {
      const { enqueueTemplateEmail } = await import("@/lib/email/send-internal.server");
      // Extra inboxes that receive a copy of every message from the website.
      // Configurable without a redeploy through CONTACT_FORWARD_EMAILS.
      const forwardTo = (process.env["CONTACT_FORWARD_EMAILS"] ?? "ecurrao@yahoo.com")
        .split(",")
        .map((address) => address.trim())
        .filter((address) => address.length > 0);
      const notify = await enqueueTemplateEmail({
        templateName: "contact-notification",
        idempotencyKey: `contact-notification-${messageRowId}`,
        bccEmails: forwardTo,
        templateData: {
          name: data.name,
          email: data.email,
          message: data.message,
          receivedAt: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
        },
      });
      if (!notify.ok) {
        await supabaseAdmin.from("email_send_log").insert({
          message_id: `contact-notification-${messageRowId}`,
          template_name: "contact-notification",
          recipient_email: "contact@estelacurrao.com",
          status: "failed",
          error_message: notify.reason ?? "unknown",
        });
      }
    } catch (notifyError) {
      console.error("Contact notification email failed", notifyError);
      await supabaseAdmin.from("email_send_log").insert({
        message_id: `contact-notification-${messageRowId}`,
        template_name: "contact-notification",
        recipient_email: "contact@estelacurrao.com",
        status: "failed",
        error_message: notifyError instanceof Error ? notifyError.message : "unknown",
      });
    }

    // Automatic acknowledgement to the visitor. Never blocks the submission.
    try {
      const { enqueueTemplateEmail } = await import("@/lib/email/send-internal.server");
      await enqueueTemplateEmail({
        templateName: "contact-receipt",
        recipientEmail: data.email,
        idempotencyKey: `contact-receipt-${messageRowId}`,
        templateData: { name: data.name, message: data.message },
      });
    } catch (receiptError) {
      console.error("Contact receipt email failed", receiptError);
    }

    return { ok: true as const };
  });
