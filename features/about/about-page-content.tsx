import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, MapPin, Phone } from "lucide-react";

import { AboutBranchJumpButton } from "@/features/about/about-branch-jump-button";
import { BannerCarousel } from "@/features/banners/banner-carousel";
import type { BannerSlide } from "@/lib/banners";
import { getBranchEnglishName, getBranchThaiName } from "@/lib/branches/branch-names";
import { resolveBranchMapsUrl } from "@/lib/branches/maps";
import type { BranchRecord } from "@/lib/branches/types";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedName } from "@/lib/i18n/localized-name";
import type { SettingMap, SettingsKey } from "@/lib/settings";
import { stripHtml } from "@/lib/media";

type AboutSettings = Pick<
  SettingMap<SettingsKey>,
  | "aboutLogo"
  | "aboutDetail1"
  | "aboutDetail2"
  | "aboutDetail3"
  | "aboutMission"
  | "aboutVision"
  | "siteName"
>;

type AboutPageContentProps = {
  settings: AboutSettings;
  banners: BannerSlide[];
  branches: BranchRecord[];
};

const BRANCH_INTRO_IMAGE = "/images/paseo-frontviewmail.jpg";
const BRANCH_INTRO_TITLE = "คุณภาพชีวิตที่ดีขึ้น เพิ่มความสุขของครอบครัว";

const PROSE_CLASSES =
  "prose prose-base max-w-none prose-headings:font-sans prose-headings:text-base prose-headings:font-bold prose-headings:text-foreground prose-headings:leading-snug prose-p:my-3 prose-p:text-[15px] prose-p:leading-7 prose-p:text-muted prose-li:text-[15px] prose-li:text-muted prose-strong:text-foreground prose-a:text-paseo-dark prose-a:underline hover:prose-a:text-paseo";

const INFO_CARD_CLASS =
  "rounded-3xl border border-border bg-surface p-5 shadow-sm transition-all duration-300 hover:shadow-lg";

const IMAGE_FRAME_CLASS =
  "relative overflow-hidden rounded-3xl bg-muted/20 ring-1 ring-border shadow-xl";

function hasHtmlContent(value: string) {
  return Boolean(stripHtml(value));
}

function formatTelHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

function RichTextBlock({ html, className }: { html: string; className?: string }) {
  if (!hasHtmlContent(html)) return null;

  return (
    <div
      className={className ? `${PROSE_CLASSES} ${className}` : PROSE_CLASSES}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function SectionRule() {
  return (
    <div
      className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"
      aria-hidden="true"
    />
  );
}

function SectionHeading({
  eyebrow,
  title,
  titleClassName,
}: {
  eyebrow: string;
  title: string;
  titleClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-paseo-dark">{eyebrow}</p>
      <h2
        className={
          titleClassName ??
          "mt-2 text-xl font-bold uppercase tracking-wide text-foreground sm:text-2xl"
        }
      >
        {title}
      </h2>
    </div>
  );
}

function branchSectionId(slug: string) {
  return `branch-${slug}`;
}

export async function AboutPageContent({ settings, banners, branches }: AboutPageContentProps) {
  const [locale, t, tCommon] = await Promise.all([
    getLocale(),
    getTranslations("about"),
    getTranslations("common"),
  ]);
  const appLocale = locale as AppLocale;

  const details = [settings.aboutDetail1, settings.aboutDetail2, settings.aboutDetail3].filter(
    hasHtmlContent,
  );

  const hasMission = hasHtmlContent(settings.aboutMission);
  const hasVision = hasHtmlContent(settings.aboutVision);
  const hasAbout = Boolean(settings.aboutLogo) || details.length > 0;
  const hasBranches = branches.length > 0;

  return (
    <div className="bg-background">
      {banners.length ? <BannerCarousel banners={banners} /> : null}

      {/* About — logo left, details 1–3 right */}
      {hasAbout ? (
        <section className="py-10 sm:py-14 md:py-16">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-5 sm:px-8">
            <SectionHeading
              eyebrow="About"
              title="Shopping Mall Our Story of Success"
              titleClassName="mt-2 text-lg font-bold uppercase tracking-wide text-foreground sm:text-xl"
            />

            <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
              {settings.aboutLogo ? (
                <div className="mx-auto w-fit lg:mx-0 lg:pt-1">
                  <div
                    className={`${IMAGE_FRAME_CLASS} flex h-44 w-44 items-center justify-center bg-surface p-4 sm:h-48 sm:w-48`}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={settings.aboutLogo}
                        alt={settings.siteName}
                        fill
                        className="object-contain"
                        sizes="192px"
                        priority
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {details.length > 0 ? (
                <div className={`space-y-8 ${settings.aboutLogo ? "" : "lg:col-span-2"}`}>
                  {details.map((detail, index) => (
                    <article
                      key={index}
                      className="rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-8"
                    >
                      <RichTextBlock html={detail} />
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Mission */}
      {hasMission ? (
        <section className="border-t border-border/80 bg-background py-10 sm:py-12">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-5 sm:px-8">
            <SectionHeading eyebrow="Mission" title="พันธกิจ Our Mission" />
            <SectionRule />
            <div className="max-w-5xl rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-8">
              <RichTextBlock html={settings.aboutMission} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Vision */}
      {hasVision ? (
        <section className="border-t border-border/80 bg-background py-10 sm:py-12">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-5 sm:px-8">
            <SectionHeading eyebrow="Vision" title="วิสัยทัศน์ Our Vision" />
            <SectionRule />
            <div className="max-w-5xl rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-8">
              <RichTextBlock html={settings.aboutVision} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Branch directory intro */}
      {hasBranches ? (
        <section
          id="branches"
          className="scroll-mt-24 border-t border-border/80 bg-background py-10 sm:py-14"
        >
          <div className="mx-auto w-full max-w-6xl space-y-8 px-5 sm:px-8">
            <SectionHeading
              eyebrow="Our Branches"
              title={BRANCH_INTRO_TITLE}
              titleClassName="mt-2 max-w-3xl text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl"
            />

            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className={`${IMAGE_FRAME_CLASS} mx-auto aspect-square w-full max-w-md lg:mx-0 lg:max-w-none`}>
                <Image
                  src={BRANCH_INTRO_IMAGE}
                  alt="The Paseo"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 560px, 100vw"
                />
              </div>

              <ul className="space-y-4">
                {branches.map((branch) => {
                  const nameEn = getBranchEnglishName(branch);
                  const nameTh = getBranchThaiName(branch);
                  const displayName = getLocalizedName(branch, appLocale);
                  const targetId = branchSectionId(branch.slug);

                  return (
                    <li
                      key={branch.id}
                      className="flex items-center gap-4 rounded-3xl border border-border bg-surface px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="min-w-0 flex-1">
                        {appLocale === "en" ? (
                          <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                            {tCommon("brandPrefixEn")} {displayName}
                          </p>
                        ) : (
                          <>
                            {nameEn ? (
                              <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                                {tCommon("brandPrefixEn")} {nameEn}
                              </p>
                            ) : null}
                            {nameTh ? (
                              <p className="mt-0.5 text-sm text-muted sm:text-[15px]">
                                {tCommon("brandPrefix")} {nameTh}
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>
                      <AboutBranchJumpButton
                        targetId={targetId}
                        label={`${t("branchesHeading")}: ${displayName}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* Per-branch sections */}
      {hasBranches
        ? branches.map((branch) => {
            const nameEn = getBranchEnglishName(branch);
            const nameTh = getBranchThaiName(branch);
            const displayName = getLocalizedName(branch, appLocale);
            const mapsUrl = resolveBranchMapsUrl(branch);
            const leasingPhones = [branch.leasingPhone1, branch.leasingPhone2].filter(
              (value): value is string => Boolean(value?.trim()),
            );

            return (
              <section
                key={branch.id}
                id={branchSectionId(branch.slug)}
                className="scroll-mt-24 border-t border-border/80 bg-background py-10 sm:py-14"
              >
                <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
                  <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                    <div className={`${IMAGE_FRAME_CLASS} aspect-[4/3] w-full sm:aspect-square`}>
                      {branch.thumbnail ? (
                        <Image
                          src={branch.thumbnail}
                          alt={displayName}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 560px, 100vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-muted">
                          —
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-8">
                      <div>
                        {appLocale === "en" ? (
                          <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            {tCommon("brandPrefixEn")} {displayName}
                          </h3>
                        ) : (
                          <>
                            {nameEn ? (
                              <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                {tCommon("brandPrefixEn")} {nameEn}
                              </h3>
                            ) : null}
                            {nameTh ? (
                              <p className="mt-1 text-base text-muted sm:text-lg">
                                {tCommon("brandPrefix")} {nameTh}
                              </p>
                            ) : null}
                          </>
                        )}

                        {branch.shortDescription ? (
                          <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-muted">
                            {branch.shortDescription}
                          </p>
                        ) : null}
                      </div>

                      {branch.phone ? (
                        <div className={`${INFO_CARD_CLASS} flex items-start gap-3`}>
                          <Phone className="mt-0.5 h-5 w-5 shrink-0 text-paseo-dark" aria-hidden="true" />
                          <div>
                            <p className="text-sm font-semibold text-paseo-dark">เบอร์โทรศัพท์</p>
                            <a
                              href={formatTelHref(branch.phone)}
                              className="mt-1 inline-block text-[15px] font-medium text-paseo-dark transition-colors hover:text-paseo"
                            >
                              {branch.phone}
                            </a>
                          </div>
                        </div>
                      ) : null}

                      {branch.address ? (
                        <div className={`${INFO_CARD_CLASS} flex items-start gap-3`}>
                          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-paseo-dark" aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-paseo-dark">ที่อยู่</p>
                            <p className="mt-1 whitespace-pre-line text-[15px] leading-7 text-muted">
                              {branch.address}
                            </p>
                            {mapsUrl ? (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-2 rounded-full bg-paseo px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-paseo-dark"
                              >
                                Google Map
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {leasingPhones.length > 0 ? (
                        <div className={`${INFO_CARD_CLASS} flex items-start gap-3`}>
                          <Phone className="mt-0.5 h-5 w-5 shrink-0 text-paseo-dark" aria-hidden="true" />
                          <div>
                            <p className="text-sm font-semibold text-paseo-dark">
                              เบอร์ติดต่อเช่าพื้นที่
                            </p>
                            <div className="mt-1 flex flex-col gap-1">
                              {leasingPhones.map((phone) => (
                                <a
                                  key={phone}
                                  href={formatTelHref(phone)}
                                  className="text-[15px] font-medium text-paseo-dark transition-colors hover:text-paseo"
                                >
                                  โทร. {phone}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        : null}
    </div>
  );
}
