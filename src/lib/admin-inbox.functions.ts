import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Email delivery failure alerts for the admin inbox. email_send_log is
 * service-role only, so it is read here after verifying the caller is admin.
 */
export const getEmailFailureAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
      .in("status", ["failed", "dlq"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return { alerts: [] as never[] };

    // A failed row is only a real alert when no later row for the same email succeeded.
    const failed = data ?? [];
    const ids = failed.map((r) => r.message_id).filter((v): v is string => !!v);
    let sentIds = new Set<string>();
    if (ids.length > 0) {
      const { data: sent } = await supabaseAdmin
        .from("email_send_log")
        .select("message_id")
        .eq("status", "sent")
        .in("message_id", ids);
      sentIds = new Set((sent ?? []).map((r) => r.message_id).filter((v): v is string => !!v));
    }

    return {
      alerts: failed
        .filter((r) => !r.message_id || !sentIds.has(r.message_id))
        .map((r) => ({
          id: r.id,
          template: r.template_name,
          recipient: r.recipient_email,
          status: r.status,
          error: r.error_message,
          createdAt: r.created_at,
        })),
    };
  });
