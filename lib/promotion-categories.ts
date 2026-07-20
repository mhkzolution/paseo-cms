import type { PromotionCategory } from "@prisma/client";

export const PROMOTION_CATEGORY_OPTIONS = [
  { label: "อาหาร", value: "FOOD" },
  { label: "เครื่องดื่มและเบเกอรี่", value: "DRINKS_BAKERY" },
  { label: "เบ็ดเตล็ด", value: "MISC" },
  { label: "โซนการศึกษา", value: "EDUCATION" },
] as const satisfies ReadonlyArray<{ label: string; value: PromotionCategory }>;

/** Public archive tab labels (English, per design mockup). */
export const PROMOTION_ARCHIVE_TABS = [
  { label: "All", value: null },
  { label: "Restaurant", value: "FOOD" },
  { label: "Drinks and Bakery", value: "DRINKS_BAKERY" },
  { label: "Education", value: "EDUCATION" },
  { label: "Other", value: "MISC" },
] as const satisfies ReadonlyArray<{ label: string; value: PromotionCategory | null }>;

const PROMOTION_CATEGORY_LABELS = Object.fromEntries(
  PROMOTION_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<PromotionCategory, string>;

export function formatPromotionCategory(category: PromotionCategory): string {
  return PROMOTION_CATEGORY_LABELS[category] ?? category;
}

export function isPromotionCategory(value: string): value is PromotionCategory {
  return PROMOTION_CATEGORY_OPTIONS.some((option) => option.value === value);
}
