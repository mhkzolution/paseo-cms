import type { AppLocale } from "@/i18n/routing";

export type LocalizedNameFields = {
  name?: string | null;
  nameTh?: string | null;
  nameEn?: string | null;
};

export function getLocalizedName(entity: LocalizedNameFields, locale: AppLocale | string): string {
  const name = entity.name?.trim() || "";
  const nameTh = entity.nameTh?.trim() || "";
  const nameEn = entity.nameEn?.trim() || "";

  if (locale === "en") {
    return nameEn || nameTh || name;
  }

  return nameTh || name || nameEn;
}
