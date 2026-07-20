import type { BranchConfig, BranchSlug } from "./types";

export const BRANCH_SLUGS = ["park", "mall", "town"] as const;

export const DEFAULT_STORE_BRANCH_SLUG = "park" as const;

export const BRANCH_CONFIG: Record<BranchSlug, BranchConfig> = {
  mall: {
    slug: "mall",
    label: "The Paseo Lat Krabang",
    theme: {
      primary: "#C8102E",
      primaryForeground: "#FFFFFF",
      background: "#FCFAF6",
      accent: "#24211D",
      mood: "shopping",
    },
    sections: ["hero", "promotions", "stores", "events", "news", "map"],
  },
  park: {
    slug: "park",
    label: "The Paseo Kanchanaphisek",
    theme: {
      primary: "#2D6A4F",
      primaryForeground: "#FFFFFF",
      background: "#F0F7F4",
      accent: "#1B4332",
      mood: "outdoor",
    },
    sections: ["hero", "promotions", "events", "stores", "news", "map"],
  },
  town: {
    slug: "town",
    label: "The Paseo Ramkhamhaeng",
    theme: {
      primary: "#E07A2F",
      primaryForeground: "#FFFFFF",
      background: "#FFF8F0",
      accent: "#5C3D2E",
      mood: "community",
    },
    sections: ["hero", "promotions", "news", "events", "stores", "map"],
  },
};

export function isBranchSlug(value: string): value is BranchSlug {
  return (BRANCH_SLUGS as readonly string[]).includes(value);
}

export function getBranchConfig(slug: string): BranchConfig {
  if (!isBranchSlug(slug)) {
    throw new Error(`Unknown branch slug: ${slug}`);
  }
  return BRANCH_CONFIG[slug];
}
