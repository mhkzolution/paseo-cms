import type { BranchRecord } from "./types";

export function resolveBranchMapsUrl(branch: BranchRecord) {
  if (branch.mapsUrl?.trim()) return branch.mapsUrl.trim();
  if (branch.latitude != null && branch.longitude != null) {
    return `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`;
  }
  return null;
}

export function resolveBranchMapEmbedUrl(branch: BranchRecord) {
  if (branch.latitude != null && branch.longitude != null) {
    return `https://maps.google.com/maps?q=${branch.latitude},${branch.longitude}&hl=th&z=15&output=embed`;
  }
  return null;
}
