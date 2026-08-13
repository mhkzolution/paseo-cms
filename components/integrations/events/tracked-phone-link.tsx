"use client";

import { trackEvent } from "@/components/integrations/events/track-event";

export function TrackedPhoneLink({
  href,
  location,
  className,
  children,
}: {
  href: string;
  location?: "footer" | "branch_card" | "directory";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackEvent("phone_click", { location })}
    >
      {children}
    </a>
  );
}
