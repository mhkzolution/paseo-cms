import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { FaPhone } from "react-icons/fa6";

import { SiteSocialIcons } from "@/features/layout/site-social-icons";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { BRANCH_SLUGS } from "@/lib/branches/branch-config";
import { getLocalizedName } from "@/lib/i18n/localized-name";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

function formatTelHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export async function SiteFooter() {
  const [branches, settings, t, locale] = await Promise.all([
    prisma.branch.findMany({
      where: { deletedAt: null },
      select: {
        name: true,
        nameTh: true,
        nameEn: true,
        slug: true,
        image: true,
        address: true,
        phone: true,
        leasingPhone1: true,
        leasingPhone2: true,
        createdAt: true,
      },
    }),
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    getTranslations("footer"),
    getLocale(),
  ]);

  const appLocale = locale as AppLocale;
  const tCommon = await getTranslations("common");

  const order = new Map(BRANCH_SLUGS.map((slug, index) => [slug, index]));
  const sortedBranches = [...branches].sort((a, b) => {
    const aOrder = order.get(a.slug as (typeof BRANCH_SLUGS)[number]) ?? 99;
    const bOrder = order.get(b.slug as (typeof BRANCH_SLUGS)[number]) ?? 99;
    return aOrder - bOrder;
  });

  const socialLinks = {
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    tiktokUrl: settings.tiktokUrl,
    lineUrl: settings.lineUrl,
  };

  return (
    <footer className="relative z-20 w-full border-t border-black/[0.06] bg-[#FAFAF8]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-4 md:py-8 lg:px-4 lg:py-8 xl:px-4">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr_0.65fr] lg:gap-10 xl:gap-16">
          <section>
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">
                {t("ourLocations")}
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {t("brandName")}
              </h2>
            </div>

            <div className="space-y-7">
              {sortedBranches.map((branch) => {
                const href = `/branches/${branch.slug}`;
                const displayName = getLocalizedName(branch, appLocale);
                const nameTh = branch.nameTh?.trim() || "";
                const nameEn = branch.nameEn?.trim() || "";

                return (
                  <article key={branch.slug} className="group flex min-w-0 items-start gap-4">
                    <Link href={href} className="relative block h-[68px] w-[68px] shrink-0">
                      {branch.image ? (
                        <Image
                          src={branch.image}
                          alt={displayName}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          sizes="68px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-paseo text-sm font-bold text-white">
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <Link href={href} className="inline-block">
                        {appLocale === "en" ? (
                          nameEn || displayName ? (
                            <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-paseo-dark sm:text-base">
                              {tCommon("brandPrefixEn")} {nameEn || displayName}
                            </h3>
                          ) : null
                        ) : (
                          <>
                            {nameEn ? (
                              <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-paseo-dark sm:text-base">
                                {tCommon("brandPrefixEn")} {nameEn}
                              </h3>
                            ) : null}
                            {nameTh ? (
                              <p className="mt-0 text-sm text-muted">
                                {tCommon("brandPrefix")} {nameTh}
                              </p>
                            ) : null}
                          </>
                        )}
                      </Link>

                      {branch.address ? (
                        <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted/80 sm:text-[13px]">
                          {branch.address}
                        </p>
                      ) : null}

                      {branch.phone ? (
                        <a
                          href={formatTelHref(branch.phone)}
                          className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-paseo-dark"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-paseo/10">
                            <FaPhone className="h-3 w-3 text-paseo-dark" aria-hidden="true" />
                          </span>
                          {branch.phone}
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">
                TBN Property
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {t("leasingTitle")}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted">{t("leasingDesc")}</p>
            </div>

            <div className="overflow-hidden rounded-2xl bg-[#F1F6E7]">
              {sortedBranches.map((branch, index) => {
                const branchName = getLocalizedName(branch, appLocale);
                const phones = [branch.leasingPhone1, branch.leasingPhone2].filter(
                  (phone): phone is string => Boolean(phone?.trim()),
                );

                if (!phones.length) return null;

                return (
                  <div
                    key={branch.slug}
                    className={["px-5 py-4", index > 0 ? "border-t border-paseo-dark/10" : ""].join(
                      " ",
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">{branchName}</p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                      {phones.map((phone) => (
                        <a
                          key={phone}
                          href={formatTelHref(phone)}
                          className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-paseo-dark"
                        >
                          <FaPhone className="h-3 w-3 shrink-0 text-paseo-dark" aria-hidden="true" />
                          <span>{phone}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">
                Follow Us
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {t("followUs")}
              </h2>

              <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-muted">
                {t("followDesc")}
              </p>
            </div>

            <SiteSocialIcons
              links={socialLinks}
              className="mt-6 flex flex-row flex-wrap items-center gap-2"
              iconClassName="h-5 w-5"
            />
          </section>
        </div>
      </div>

      <div className="border-t border-black/[0.06]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-4 xl:px-4">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>

          <div className="flex items-center gap-5">
            <Link href="/privacy-policy" className="transition-colors hover:text-foreground">
              {t("privacy")}
            </Link>

            <Link href="/terms" className="transition-colors hover:text-foreground">
              {t("terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
