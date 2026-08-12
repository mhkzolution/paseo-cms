import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { CalendarDays } from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";

import { PromotionArchiveSection } from "@/features/promotions/promotion-archive-section";
import { ShareMenu } from "@/features/events/share-menu";
import { CONTENT_PROSE_CLASS } from "@/lib/content-prose";
import { formatPromotionCategory } from "@/lib/promotion-categories";
import { formatPromotionDateRange, getPublishedPromotions } from "@/lib/promotions";
import { prisma } from "@/lib/prisma";
import { buildPromotionHref, decodeSlugParam, resolvePublishedContentSlug } from "@/lib/slug";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";
import { buildRobots, toAbsoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const revalidate = 300;

interface PromotionPageProps {
  params: Promise<{ slug: string }>;
}

type PromotionDetail = Prisma.PromotionGetPayload<{
  include: {
    author: true;
    seo: true;
    tags: { include: { tag: true } };
    branches: { include: { branch: true } };
    relatedFrom: { include: { relatedPromotion: true } };
    alternateLinks: true;
    faqs: true;
  };
}>;

export async function generateStaticParams() {
  const promotions = await prisma.promotion.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    select: { slug: true },
    take: 1000,
  });

  return promotions.map((promotion) => ({ slug: promotion.slug }));
}

export async function generateMetadata({ params }: PromotionPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = await resolvePublishedContentSlug(prisma.promotion, rawSlug);
  if (!slug) return {};

  const [settings, promotion] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    prisma.promotion.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
      include: { seo: true, alternateLinks: true },
    }),
  ]);

  if (!promotion) return {};

  const baseUrl = settings.siteUrl.replace(/\/$/, "");
  const seo = promotion.seo;
  const canonical = seo?.canonicalUrl || `${baseUrl}/promotions/${promotion.slug}`;
  const title = seo?.seoTitle || promotion.title;
  const description = seo?.seoDescription || promotion.subtitle || promotion.excerpt || undefined;
  const image = seo?.ogImage || promotion.featuredImage || undefined;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: seo?.keywords || undefined,
    alternates: {
      canonical,
      languages: Object.fromEntries(promotion.alternateLinks.map((alternate) => [alternate.locale, alternate.url])),
    },
    openGraph: {
      type: "article",
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      url: canonical,
      siteName: settings.siteName,
      publishedTime: promotion.publishedAt?.toISOString(),
      modifiedTime: promotion.updatedAt.toISOString(),
      images: image ? [{ url: toAbsoluteUrl(baseUrl, image), alt: promotion.coverImageAlt || title }] : undefined,
    },
    twitter: {
      card: seo?.twitterCard === "SUMMARY" ? "summary" : "summary_large_image",
      title: seo?.twitterTitle || seo?.ogTitle || title,
      description: seo?.twitterDescription || seo?.ogDescription || description,
      images: seo?.twitterImage || image ? [toAbsoluteUrl(baseUrl, seo?.twitterImage || image || "")] : undefined,
    },
    robots: buildRobots({
      noindex: seo?.noindex,
      nofollow: seo?.nofollow,
      noarchive: seo?.noarchive,
      nosnippet: seo?.nosnippet,
      maxSnippet: seo?.maxSnippet,
      maxImagePreview: seo?.maxImagePreview,
      maxVideoPreview: seo?.maxVideoPreview,
    }),
  };
}

export default async function PromotionPage({ params }: PromotionPageProps) {
  const { slug: rawSlug } = await params;
  const slug = await resolvePublishedContentSlug(prisma.promotion, rawSlug);
  if (!slug) notFound();

  if (decodeSlugParam(rawSlug) !== slug) {
    permanentRedirect(buildPromotionHref(slug));
  }

  const [settings, promotion] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    prisma.promotion.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
      include: {
        author: true,
        seo: true,
        tags: { include: { tag: true } },
        branches: { include: { branch: true } },
        relatedFrom: { include: { relatedPromotion: true }, orderBy: { sortOrder: "asc" } },
        alternateLinks: true,
        faqs: { where: { deletedAt: null, isActive: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  if (!promotion) notFound();

  const baseUrl = settings.siteUrl.replace(/\/$/, "");
  const canonical = promotion.seo?.canonicalUrl || `${baseUrl}/promotions/${promotion.slug}`;
  const shareUrl = canonical;

  const relatedPromotions = promotion.relatedFrom
    .map((item) => item.relatedPromotion)
    .filter((item) => item.status === "PUBLISHED" && !item.deletedAt);

  const morePromotions = await getPublishedPromotions({
    excludeId: promotion.id,
    limit: 6,
    branchId: promotion.branches[0]?.branchId,
    category: promotion.category,
  });

  const displayMorePromotions = relatedPromotions.length
    ? relatedPromotions.slice(0, 6).map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        category: item.category,
        featuredImage: item.featuredImage,
        coverImageAlt: item.coverImageAlt,
        startDate: item.startDate,
        endDate: item.endDate,
      }))
    : morePromotions;

  const firstBranch = promotion.branches[0];
  const promotionsArchiveHref =
    promotion.branches.length === 1 && firstBranch
      ? `/promotions?branch=${firstBranch.branch.slug}`
      : "/promotions";

  const jsonLd = buildPromotionJsonLd({ promotion, siteName: settings.siteName, canonical });
  const customJsonLd = promotion.seo?.customJsonLd;

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground">
      <article className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-paseo">
            Home
          </Link>
          <span className="px-2">/</span>
          <Link href={promotionsArchiveHref} className="hover:text-paseo">
            Promotions
          </Link>
        </nav>

        <header className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase text-paseo">{formatPromotionCategory(promotion.category)}</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight">{promotion.title}</h1>
              {promotion.subtitle ? <p className="mt-2 text-xl leading-8 text-muted">{promotion.subtitle}</p> : null}
            </div>
            <ShareMenu url={shareUrl} title={promotion.title} />
          </div>

          {promotion.excerpt ? <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{promotion.excerpt}</p> : null}

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-paseo" aria-hidden="true" />
              {formatPromotionDateRange(promotion.startDate, promotion.endDate)}
            </span>
            {promotion.author?.name ? <span>{promotion.author.name}</span> : null}
            {promotion.readingTimeMinutes ? <span>{promotion.readingTimeMinutes} min read</span> : null}
          </div>
        </header>

        {promotion.featuredImage ? (
          <figure className="mt-6">
            <Image
              src={promotion.featuredImage}
              alt={promotion.coverImageAlt || promotion.title}
              width={1600}
              height={2000}
              priority
              className="w-full h-auto rounded-2xl"
            />

            {promotion.coverImageCaption && (
              <figcaption className="mt-2 text-sm text-muted">
                {promotion.coverImageCaption}
              </figcaption>
            )}
          </figure>
        ) : null}

        <div className={cn(CONTENT_PROSE_CLASS, "mt-6 text-foreground")} dangerouslySetInnerHTML={{ __html: promotion.content }} />

        {promotion.faqs.length ? (
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="text-2xl font-semibold">FAQ</h2>
            <div className="mt-4 grid gap-4">
              {promotion.faqs.map((faq) => (
                <div key={faq.id} className="rounded-lg border border-border bg-white p-4">
                  <h3 className="font-medium text-foreground">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {promotion.tags.length || promotion.branches.length ? (
          <footer className="mt-10 grid gap-4 border-t border-border pt-6 text-sm text-muted">
            {promotion.tags.length ? <p>Tags: {promotion.tags.map((item) => item.tag.name).join(", ")}</p> : null}
            {promotion.branches.length ? <p>Branches: {promotion.branches.map((item) => item.branch.name).join(", ")}</p> : null}
          </footer>
        ) : null}

        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {customJsonLd ? (
          <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(customJsonLd) }} />
        ) : null}
      </article>

      {displayMorePromotions.length ? (
        <PromotionArchiveSection
          promotions={displayMorePromotions}
          title="MORE PROMOTION"
          viewAllHref={promotionsArchiveHref}
        />
      ) : null}
    </main>
  );
}

function buildPromotionJsonLd({
  promotion,
  siteName,
  canonical,
}: {
  promotion: PromotionDetail;
  siteName: string;
  canonical: string;
}) {
  const schemaType = promotion.seo?.schemaType === "NEWS_ARTICLE" ? "NewsArticle" : "Article";

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: promotion.title,
    description: promotion.seo?.seoDescription || promotion.subtitle || promotion.excerpt || undefined,
    image: promotion.featuredImage ? [promotion.featuredImage] : undefined,
    datePublished: promotion.publishedAt?.toISOString(),
    dateModified: promotion.updatedAt.toISOString(),
    author: promotion.author?.name ? { "@type": "Person", name: promotion.author.name } : undefined,
    publisher: { "@type": "Organization", name: siteName },
    mainEntityOfPage: canonical,
    articleSection: formatPromotionCategory(promotion.category),
    keywords: promotion.seo?.keywords,
  };
}
