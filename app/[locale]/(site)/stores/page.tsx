import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { StoreArchivePageGrid, StoreFilters } from "@/features/stores/store-archive-section";
import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { DEFAULT_STORE_BRANCH_SLUG } from "@/lib/branches/branch-config";
import { getBranchBySlug } from "@/lib/events";
import { getLocalizedName } from "@/lib/i18n/localized-name";
import { withLocaleAlternates } from "@/lib/i18n/locale-alternates";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import { buildStoresHref, getCategoryBySlug, getPublishedStores, getStoreBranches, getStoreCategories } from "@/lib/stores";

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

  const branchLabel = branch ? getLocalizedName(branch, appLocale) : null;
  const listingQuery = { branch: resolvedBranchSlug, category: category?.slug };

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground">
      <section className="bg-paseo py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p className="text-sm font-semibold uppercase text-foreground/80">{t("title")}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {category && branchLabel
              ? `${t("title")} — ${category.name} · ${branchLabel}`
              : category
                ? `${t("title")} — ${category.name}`
                : branchLabel
                  ? `${t("title")} — ${branchLabel}`
                  : t("title")}
          </h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <StoreFilters
          branches={branches}
          categories={categories}
          activeBranchSlug={branch?.slug}
          activeCategorySlug={category?.slug}
          activeCategoryColor={category?.color}
        />
        <div className="mt-10">
          <StoreArchivePageGrid stores={stores} listingQuery={listingQuery} emptyMessage={t("empty")} />
        </div>
      </section>
    </main>
  );
}
