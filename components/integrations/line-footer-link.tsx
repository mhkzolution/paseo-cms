"use client";

import { FaLine } from "react-icons/fa";

import { trackEvent } from "@/components/integrations/events/track-event";

type LineFooterLinkProps = {
  href: string;
  label: string;
};

export function LineFooterLink({ href, label }: LineFooterLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-paseo-dark"
      onClick={() => trackEvent("line_oa_click", { surface: "footer" })}
    >
      <FaLine className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </a>
  );
}
