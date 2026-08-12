import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { StoresDirectory } from "@/features/stores/stores-directory";
import { DEFAULT_STORE_BRANCH_SLUG } from "@/lib/branches/branch-config";
import { getBranchBySlug } from "@/lib/events";
import { getLocalizedName } from "@/lib/i18n/localized-name";
import { withLocaleAlternates } from "@/lib/i18n/locale-alternates";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import { buildStoresHref, getCategoryBySlug, getPublishedStores, getStoreBranches, getStoreCategories } from "@/lib/stores";
import { getStorePromotionLabels } from "@/lib/stores/store-promotions";

export const revalidate = 300;

interface StoresPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; branch?: string }>;
}

export async function generateMetadata({ params, searchParams }: StoresPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { category: categorySlug, branch: branchSlug } = await searchParams;
  const resolvedBranchSlug = branchSlug ?? DEFAULT_STORE_BRANCH_SLUG;
  const [category, branch, t, settings] = await Promise.all([
    categorySlug ? getCategoryBySlug(categorySlug) : null,
    getBranchBySlug(resolvedBranchSlug),
    getTranslations({ locale, namespace: "stores" }),
    getSettings(["siteUrl"] as const, DEFAULT_SETTINGS),
  ]);

  const branchLabel = branch ? getLocalizedName(branch, locale as AppLocale) : null;
  const title =
    category && branchLabel
      ? `${t("title")} — ${category.name} · ${branchLabel}`
      : category
        ? `${t("title")} — ${category.name}`
        : branchLabel
          ? `${t("title")} — ${branchLabel}`
          : t("title");

  return withLocaleAlternates(
    { title, description: title },
    "/stores",
    locale as AppLocale,
    settings.siteUrl || undefined,
  );
}

export default async function StoresPage({ params, searchParams }: StoresPageProps) {
  const { locale } = await params;
  const { category: categorySlug, branch: branchSlug } = await searchParams;
  const t = await getTranslations("stores");
  const appLocale = (locale || (await getLocale())) as AppLocale;

  if (!branchSlug) {
    redirect({
      href: buildStoresHref({ branch: DEFAULT_STORE_BRANCH_SLUG, category: categorySlug }),
      locale: appLocale,
    });
  }

  const resolvedBranchSlug = branchSlug as string;

  const [category, branch] = await Promise.all([
    categorySlug ? getCategoryBySlug(categorySlug) : null,
    getBranchBySlug(resolvedBranchSlug),
  ]);

  const [categories, branches, stores] = await Promise.all([
    getStoreCategories(branch?.id),
    getStoreBranches(),
    getPublishedStores({
      categorySlug: category?.slug,
      branchId: branch?.id,
    }),
  ]);

  const promotionLabels = branch?.id
    ? await getStorePromotionLabels(
        stores.map((store) => ({ id: store.id, name: store.name, slug: store.slug })),
        branch.id,
      )
    : {};

  return (
    <StoresDirectory
      title={t("title")}
      stores={stores}
      branches={branches}
      categories={categories.map((item) => ({
        slug: item.slug,
        name: item.name,
        image: item.image,
        color: item.color,
        storeCount: item.storeCount,
      }))}
      activeBranchSlug={branch?.slug}
      activeCategorySlug={category?.slug}
      promotionLabels={promotionLabels}
      searchPlaceholder={t("searchPlaceholder")}
      emptyMessage={t("empty")}
    />
  );
}
