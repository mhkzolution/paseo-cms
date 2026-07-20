"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import {
  analyzeSeoScore,
  type SeoCheck,
  type SeoScoreInput,
  type SeoScoreResult,
} from "@/lib/seo-score";

const BAND_TEXT = {
  red: "ต้องปรับปรุง",
  yellow: "พอใช้",
  green: "ดี",
} as const;

const BAND_BAR = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
} as const;

const STATUS_DOT = {
  good: "bg-emerald-500",
  ok: "bg-amber-500",
  bad: "bg-red-500",
} as const;

export function useDebouncedSeoScore(input: SeoScoreInput, delayMs = 300): SeoScoreResult {
  const [result, setResult] = useState(() => analyzeSeoScore(input));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setResult(analyzeSeoScore(input));
    }, delayMs);
    return () => window.clearTimeout(timer);
    // Serialize so object identity changes don't thrash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(input), delayMs]);

  return result;
}

export function SeoScorePanel({ result, className }: { result: SeoScoreResult; className?: string }) {
  const seoChecks = result.checks.filter((c) => c.group === "seo");
  const readabilityChecks = result.checks.filter((c) => c.group === "readability");

  return (
    <div className={cn("grid gap-4 rounded-md border border-border bg-surface p-4", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreMeter label="SEO" score={result.seoScore} band={result.band} />
        <ScoreMeter
          label="Readability"
          score={result.readabilityScore}
          band={result.readabilityScore < 50 ? "red" : result.readabilityScore < 80 ? "yellow" : "green"}
        />
      </div>

      <CheckGroup title="SEO analysis" checks={seoChecks} />
      <CheckGroup title="Readability" checks={readabilityChecks} />
    </div>
  );
}

function ScoreMeter({
  label,
  score,
  band,
}: {
  label: string;
  score: number;
  band: "red" | "yellow" | "green";
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm tabular-nums text-muted">
          <span className="text-base font-semibold text-foreground">{score}</span>/100 · {BAND_TEXT[band]}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div className={cn("h-full rounded-full transition-all", BAND_BAR[band])} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function CheckGroup({ title, checks }: { title: string; checks: SeoCheck[] }) {
  return (
    <div className="grid gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <ul className="grid gap-1.5">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-sm">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", STATUS_DOT[check.status])} aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-medium text-foreground">{check.label}</p>
              <p className="text-xs text-muted">{check.tip}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
