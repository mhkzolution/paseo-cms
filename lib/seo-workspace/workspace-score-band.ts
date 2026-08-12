import type { WorkspaceScoreBand } from "@/lib/seo-workspace/types";

export function getWorkspaceScoreBand(score: number): WorkspaceScoreBand {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  return "needs_attention";
}

export function getWorkspaceScoreBandLabel(band: WorkspaceScoreBand): string {
  switch (band) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    default:
      return "Needs Attention";
  }
}
