export type StoreCardMediaMode = "logo" | "cover" | "fallback";

export const STREET_MARKET_FALLBACK_LOGO = "/images/street-market-logo.jpg";

export type StoreCardMediaCategory = {
  name: string;
  slug?: string;
  color?: string | null;
  image?: string | null;
};

export type StoreCardMediaBranch = {
  slug?: string;
  image?: string | null;
};

export type StoreCardMediaInput = {
  name: string;
  logo?: string | null;
  cover?: string | null;
  category?: StoreCardMediaCategory | null;
  branch?: StoreCardMediaBranch | null;
};

export type StoreCardMediaResolved = {
  mode: StoreCardMediaMode;
  src: string | null;
  initials: string;
  category: StoreCardMediaCategory | null;
  accentColor: string;
};

const DEFAULT_ACCENT = "#2D6A4F";

export function getStoreInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]!.charAt(0)}${words[1]!.charAt(0)}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

/**
 * Resolves which media treatment a store card should use.
 *
 * - logo: brand mark — always `object-contain` inside a logo stage (never cropped)
 * - cover: promotional / hero image — `object-cover` when no logo exists
 * - fallback: branch image, street-market logo, or generated initials when no assets exist
 */
export function resolveStoreCardMedia(input: StoreCardMediaInput): StoreCardMediaResolved {
  const category = input.category ?? null;
  const accentColor = category?.color ?? DEFAULT_ACCENT;
  const initials = getStoreInitials(input.name);

  if (input.logo?.trim()) {
    return { mode: "logo", src: input.logo.trim(), initials, category, accentColor };
  }

  if (input.cover?.trim()) {
    return { mode: "cover", src: input.cover.trim(), initials, category, accentColor };
  }

  if (category?.slug === "street-market") {
    return { mode: "logo", src: STREET_MARKET_FALLBACK_LOGO, initials, category, accentColor };
  }

  if (input.branch?.image?.trim()) {
    return { mode: "logo", src: input.branch.image.trim(), initials, category, accentColor };
  }

  return { mode: "fallback", src: null, initials, category, accentColor };
}
