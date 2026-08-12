import { recoverableSeoPoints } from "@/lib/seo-assistant";
import type { SeoCheck } from "@/lib/seo-score";

export function sumRecoverablePotential(checks: SeoCheck[]): number {
  return checks
    .filter((check) => check.group === "seo" && check.status !== "good")
    .reduce((total, check) => total + recoverableSeoPoints(check), 0);
}

export function projectSeoScore(score: number, recoverablePotential: number): number {
  return Math.min(100, score + recoverablePotential);
}
