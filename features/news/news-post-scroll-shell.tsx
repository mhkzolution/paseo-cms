import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type NewsPostScrollShellProps = {
  banner: ReactNode;
  children: ReactNode;
};

/**
 * Sticky banner (z-0) + opaque content (z-10) so the page scrolls over the banner.
 * Mobile: height follows banner image. Desktop: fills viewport below header.
 */
export function NewsPostScrollShell({ banner, children }: NewsPostScrollShellProps) {
  return (
    <main className="relative w-full max-w-[100%] overflow-x-clip text-foreground">
      <div
        className={cn(
          "sticky top-[4.5rem] z-0 w-full max-w-[100%] overflow-x-clip",
          "h-auto md:h-[calc(100dvh-4.5rem)] md:overflow-hidden",
          "[&:not(:has(*))]:hidden",
        )}
      >
        {banner}
      </div>
      <div className="relative z-10 w-full min-w-0 max-w-[100%] bg-[#FCFAF6]">{children}</div>
    </main>
  );
}
