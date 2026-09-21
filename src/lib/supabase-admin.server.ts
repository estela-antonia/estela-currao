import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PUBLIC_SUPABASE_URL } from "@/lib/supabase-public-config";

function createAdminClient() {
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(process.env["SUPABASE_URL"] ?? PUBLIC_SUPABASE_URL, serviceRoleKey, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(
          typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
        );
        if (init?.headers) {
          new Headers(init.headers).forEach((value, key) => headers.set(key, value));
        }
        if (headers.get("Authorization") === `Bearer ${serviceRoleKey}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", serviceRoleKey);
        return fetch(input, { ...init, headers });
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let adminClient: ReturnType<typeof createAdminClient> | undefined;

export function getSupabaseAdmin() {
  adminClient ??= createAdminClient();
  return adminClient;
}