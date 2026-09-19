import { createMiddleware } from "@tanstack/react-start";

// Project-specific replacement for the generated `attachSupabaseAuth`.
// The generated version throws when the browser bundle has no Supabase
// configuration (self-hosted deploys read runtime env on the server only),
// which aborts every serverFn RPC and blanks public pages.
// Here the session lookup is best-effort: public pages keep working and
// authenticated calls still receive the bearer token when a session exists.
export const attachSupabaseAuthSafe = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    } catch {
      token = undefined;
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
