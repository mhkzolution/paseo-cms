"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export const SEO_COPY_FEEDBACK_MS = 2000;

export type SeoCopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

export function SeoCopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className,
}: SeoCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      // TODO(A4.1): analytics.track("seo_copy", { label, textLength: text.length });
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), SEO_COPY_FEEDBACK_MS);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={copied ? copiedLabel : label}
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface",
        className,
      )}
      data-testid="seo-copy-button"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
