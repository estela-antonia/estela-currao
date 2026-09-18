import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * Permanent structural layout.
 *
 * A fixed-width left column hosts navigation context (theme, series,
 * title or quote) and stays constant across every view — series,
 * work grids and individual artworks. Its width is stable regardless
 * of content or viewport. The main area starts immediately after the
 * column and fills the remaining width without centering.
 */
export function SiteLayout({
  aside,
  children,
  mainClassName,
  asideClassName,
  wrapperClassName,
}: {
  aside: ReactNode;
  children: ReactNode;
  mainClassName?: string;
  asideClassName?: string;
  wrapperClassName?: string;
}) {
  return (
    <div
      className={`flex min-h-screen flex-col bg-background ${wrapperClassName ?? ""}`}
      style={{
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <SiteHeader />
      <div className="flex w-full min-h-[0px] flex-1 flex-col items-stretch md:flex-row">
        <aside
          className={`w-full shrink-0 self-start px-6 py-8 md:sticky md:top-[72px] md:px-10 md:py-14 md:w-[var(--side-col,280px)] ${asideClassName ?? ""}`}
        >
          {aside}
        </aside>
        <main className={`min-w-0 min-h-[0px] flex-1 px-5 pb-12 sm:px-6 md:px-10 md:py-14 ${mainClassName ?? ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

