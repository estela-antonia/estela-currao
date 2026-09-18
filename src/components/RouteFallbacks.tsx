import { useRouter } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

type ErrorProps = {
  error: Error;
  reset: () => void;
  backTo?: string;
  backLabel?: string;
};

export function RouteErrorFallback({
  error,
  reset,
  backTo = "/",
  backLabel = "Go home",
}: ErrorProps) {
  const router = useRouter();
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  return (
    <div className="min-h-dvh bg-white">
      <SiteHeader />
      <main
        aria-labelledby="route-error-title"
        className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-24 sm:px-10"
      >
        <p className="font-sans text-[11px] font-light lowercase tracking-[0.34em] text-neutral-600">
          error
        </p>
        <h1
          id="route-error-title"
          tabIndex={-1}
          className="mt-6 font-sans text-[22px] font-light uppercase leading-[1.25] tracking-[0.16em] text-neutral-900 focus:outline-none sm:text-[28px]"
        >
          This page didn’t load
        </h1>
        <p
          role="alert"
          className="mt-5 max-w-md font-sans text-[13px] font-light leading-relaxed text-neutral-700"
        >
          Something interrupted loading this content. You can try again or go back.
        </p>
        <nav aria-label="Error actions" className="mt-12 flex flex-wrap items-center gap-8">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-sm font-sans text-[12px] font-light lowercase tracking-[0.28em] text-neutral-900 underline decoration-neutral-500 underline-offset-[6px] transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            try again
          </button>
          <a
            href={backTo}
            className="rounded-sm font-sans text-[12px] font-light lowercase tracking-[0.28em] text-neutral-700 underline decoration-neutral-400 underline-offset-[6px] transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            {backLabel}
          </a>
        </nav>
      </main>
    </div>
  );
}

type NotFoundProps = {
  title?: string;
  message?: string;
  backTo?: string;
  backLabel?: string;
  secondaryTo?: string;
  secondaryLabel?: string;
};

export function RouteNotFoundFallback({
  title = "Not found",
  message = "The content you're looking for doesn't exist or has been moved.",
  backTo = "/",
  backLabel = "Go home",
  secondaryTo = "/works",
  secondaryLabel = "Explore worlds",
}: NotFoundProps) {
  return (
    <div className="min-h-dvh bg-white">
      <SiteHeader />
      <main
        aria-labelledby="not-found-title"
        className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-24 sm:px-10"
      >
        <p className="font-sans text-[11px] font-light lowercase tracking-[0.34em] text-neutral-600">
          <span className="sr-only">Error </span>
          404
        </p>
        <h1
          id="not-found-title"
          tabIndex={-1}
          className="mt-6 font-sans text-[22px] font-light uppercase leading-[1.25] tracking-[0.16em] text-neutral-900 focus:outline-none sm:text-[28px]"
        >
          {title}
        </h1>
        <p className="mt-5 max-w-md font-sans text-[13px] font-light leading-relaxed text-neutral-700">
          {message}
        </p>
        <nav aria-label="Alternative navigation" className="mt-12 flex flex-wrap items-center gap-8">
          <a
            href={backTo}
            className="rounded-sm font-sans text-[12px] font-light lowercase tracking-[0.28em] text-neutral-900 underline decoration-neutral-500 underline-offset-[6px] transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            {backLabel}
          </a>
          {secondaryTo ? (
            <a
              href={secondaryTo}
              className="rounded-sm font-sans text-[12px] font-light lowercase tracking-[0.28em] text-neutral-700 underline decoration-neutral-400 underline-offset-[6px] transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
            >
              {secondaryLabel}
            </a>
          ) : null}
        </nav>
      </main>
    </div>
  );
}