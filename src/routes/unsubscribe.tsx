import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type State = "loading" | "valid" | "already" | "invalid" | "done" | "error";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Unsubscribe — Estela Currao" },
      { name: "description", content: "Manage email notifications from the studio of Estela Currao." },
      { property: "og:title", content: "Unsubscribe — Estela Currao" },
      { property: "og:description", content: "Manage email notifications from the studio of Estela Currao." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const [state, setState] = useState<State>("loading");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    if (!t) {
      setState("invalid");
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return setState("invalid");
        if (body.valid) return setState("valid");
        if (body.reason === "already_unsubscribed") return setState("already");
        setState("invalid");
      })
      .catch(() => setState("error"));
  }, []);

  const confirm = async () => {
    if (!token) return;
    setState("loading");
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.success) setState("done");
      else if (body.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-md">
        <p className="text-[10px] tracking-[0.28em] text-muted-foreground">ESTELA CURRAO</p>
        <h1 className="mt-6 text-lg font-light tracking-wide text-foreground">Unsubscribe</h1>

        {state === "loading" && (
          <p className="mt-6 text-sm text-muted-foreground">Checking your link…</p>
        )}
        {state === "valid" && (
          <>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Confirm that you no longer wish to receive emails from the studio.
            </p>
            <button
              type="button"
              onClick={confirm}
              className="mt-8 border border-foreground px-6 py-2 text-xs tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              CONFIRM UNSUBSCRIBE
            </button>
          </>
        )}
        {state === "already" && (
          <p className="mt-6 text-sm text-muted-foreground">
            This address is already unsubscribed.
          </p>
        )}
        {state === "done" && (
          <p className="mt-6 text-sm text-muted-foreground">
            You have been unsubscribed. No further emails will be sent.
          </p>
        )}
        {state === "invalid" && (
          <p className="mt-6 text-sm text-muted-foreground">
            This link is invalid or has expired.
          </p>
        )}
        {state === "error" && (
          <p className="mt-6 text-sm text-muted-foreground">
            Something went wrong. Please try again later.
          </p>
        )}

        <a
          href="/"
          className="mt-10 inline-block text-xs tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          BACK HOME
        </a>
      </div>
    </main>
  );
}