import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuthSafe } from "./lib/supabase-auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  const p = new URL(request.url).pathname;
  if (p.startsWith("/lovable/") || p === "/email/unsubscribe") {
    return next();
  }
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
};

const securityHeadersMiddleware = createMiddleware().server(async ({ next, request }) => {
  const p = new URL(request.url).pathname;
  if (p.startsWith("/lovable/") || p === "/email/unsubscribe") {
    return next();
  }
  const result = await next();
  const response = (result as { response?: Response }).response;
  if (response?.headers) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      if (!response.headers.has(key)) response.headers.set(key, value);
    }
  }
  return result;
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuthSafe],
  requestMiddleware: [securityHeadersMiddleware, errorMiddleware],
}));
