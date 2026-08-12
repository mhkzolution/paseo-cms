"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { formatDateTimeWithSettings } from "@/lib/datetime-formatters";
import type { LocalizationSettings } from "@/lib/localization-settings";

type RecalculateSeoButtonProps = {
  generatedAt: string;
  localization: LocalizationSettings;
};

export function RecalculateSeoButton({ generatedAt, localization }: RecalculateSeoButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleRecalculate = async () => {
    const confirmed = window.confirm(
      "Recalculate SEO workspace snapshot? This refreshes aggregated metrics from the latest audits.",
    );

    if (!confirmed) return;

    setMessage(null);

    const response = await fetch("/api/admin/seo/recalculate", { method: "POST" });
    if (!response.ok) {
      setMessage("Unable to refresh workspace data.");
      return;
    }

    const payload = (await response.json()) as { queued: boolean; estimatedItems: number };
    setMessage(`Snapshot queued for ${payload.estimatedItems.toLocaleString()} published items.`);

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <p className="text-xs text-muted">
        Last updated{" "}
        <time dateTime={generatedAt}>
          {formatDateTimeWithSettings(new Date(generatedAt), localization)}
        </time>
      </p>
      <button
        type="button"
        onClick={handleRecalculate}
        disabled={isPending}
        aria-busy={isPending}
        className="inline-flex h-10 items-center rounded-md bg-paseo px-4 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white disabled:opacity-60"
      >
        {isPending ? "Refreshing…" : "Recalculate SEO"}
      </button>
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
