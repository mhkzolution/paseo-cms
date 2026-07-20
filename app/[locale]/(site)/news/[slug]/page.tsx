import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { notFound, permanentRedirect } from "next/navigation";

import { NewsPageBanner } from "@/features/news/news-page-banner";
import { NewsPostScrollShell } from "@/features/news/news-post-scroll-shell";
import { NewsPostSection } from "@/features/news/news-post-section";
import { OtherNewsSection } from "@/features/news/other-news-section";
import { EventAlbumGallery } from "@/features/events/event-album-gallery";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import {
  formatPostKindLabel,
  getMorePostsForNewsDetail,
  type ArchivePost,
} from "@/lib/post-archives";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";
import { buildRobots, toAbsoluteUrl } from "@/lib/seo";

export const revalidate = 300;

interface NewsPostPageProps {
  params: Promise<{ slug: string }>;
}

type NewsPostDetail = Prisma.PostGetPayload<{
  include: {
    author: true;
    category: true;
    seo: true;
    tags: { include: { tag: true } };
    branches: { include: { branch: true } };
    relatedFrom: { include: { relatedPost: { include: { category: true } } } };
    alternateLinks: true;
    faqs: true;
    images: true;
  };
}>;

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    select: { slug: true },
    take: 1000,
  });

  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: NewsPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [settings, post] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    prisma.post.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
      include: { seo: true, alternateLinks: true },
    }),
  ]);

  if (!post) return {};

  const baseUrl = settings.siteUrl.replace(/\/$/, "");
  const seo = post.seo;
  const canonical = seo?.canonicalUrl || `${baseUrl}/news/${post.slug}`;
  const title = seo?.seoTitle || post.title;
  const description = seo?.seoDescription || post.subtitle || post.excerpt || undefined;
  const image = seo?.ogImage || post.featuredImage || undefined;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: seo?.keywords || undefined,
    alternates: {
      canonical,
      languages: Object.fromEntries(post.alternateLinks.map((alternate) => [alternate.locale, alternate.url])),
    },
    openGraph: {
      type: "article",
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      url: canonical,
      siteName: settings.siteName,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: image ? [{ url: toAbsoluteUrl(baseUrl, image), alt: post.coverImageAlt || title }] : undefined,
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

export default async function NewsPostPage({ params }: NewsPostPageProps) {
  const { slug } = await params;
  const [settings, post] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    prisma.post.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
      include: {
        author: true,
        category: true,
        seo: true,
        tags: { include: { tag: true } },
        branches: { include: { branch: true } },
        relatedFrom: {
          include: { relatedPost: { include: { category: true } } },
          orderBy: { sortOrder: "asc" },
        },
        alternateLinks: true,
        faqs: { where: { deletedAt: null, isActive: true }, orderBy: { sortOrder: "asc" } },
        images: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  if (!post) {
    const history = await prisma.postSlugHistory.findUnique({ where: { oldSlug: slug } });
    if (history) permanentRedirect(`/news/${history.newSlug}`);
    notFound();
  }

  const baseUrl = settings.siteUrl.replace(/\/$/, "");
  const canonical = post.seo?.canonicalUrl || `${baseUrl}/news/${post.slug}`;
  const shareUrl = canonical;
  const jsonLd = buildPostJsonLd({ post, siteName: settings.siteName, canonical });
  const customJsonLd = post.seo?.customJsonLd;

  const relatedPosts = post.relatedFrom
    .map((item) => item.relatedPost)
    .filter((item) => item.status === "PUBLISHED" && !item.deletedAt);

  const morePosts = await getMorePostsForNewsDetail({
    excludeId: post.id,
    limit: 3,
    branchId: post.branches[0]?.branchId,
  });

  const displayMorePosts: ArchivePost[] = relatedPosts.length
    ? relatedPosts.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        featuredImage: item.featuredImage,
        coverImageAlt: item.coverImageAlt,
        kind: item.kind,
        publishedAt: item.publishedAt,
        category: item.category ? { name: item.category.name } : null,
      }))
    : morePosts;

  const branchNames = post.branches.map((item) => getBranchThaiName(item.branch));
  const locationLabel = branchNames.length ? branchNames.join(" · ") : "";

  return (
    <NewsPostScrollShell
      banner={
        <NewsPageBanner
          bannerDesktop={post.bannerDesktop}
          bannerMobile={post.bannerMobile}
          title={post.title}
        />
      }
    >
      <NewsPostSection
        post={{
          title: post.title,
          h1: post.h1,
          subtitle: post.subtitle,
          content: post.content,
          featuredImage: post.featuredImage,
          coverImageAlt: post.coverImageAlt,
          coverImageCaption: post.coverImageCaption,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          authorName: post.author?.name ?? null,
          kind: post.kind,
          locationLabel,
          shareUrl,
          tags: post.tags.map((item) => ({
            name: item.tag.name,
            slug: item.tag.slug,
          })),
        }}
      />

      <div className="mx-auto w-full max-w-[1100px] px-5 pb-10 sm:px-8 sm:pb-12">
        <EventAlbumGallery
          title="อัลบั้มรูปภาพ"
          images={post.images.map((image) => ({
            id: image.id,
            url: image.url,
            alt: image.alt,
            caption: image.caption,
          }))}
        />
      </div>

      <OtherNewsSection posts={displayMorePosts} />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {customJsonLd ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(customJsonLd) }}
        />
      ) : null}
    </NewsPostScrollShell>
  );
}

function buildPostJsonLd({
  post,
  siteName,
  canonical,
}: {
  post: NewsPostDetail;
  siteName: string;
  canonical: string;
}) {
  const schemaType = post.seo?.schemaType === "NEWS_ARTICLE" ? "NewsArticle" : "Article";

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: post.h1 || post.title,
    description: post.seo?.seoDescription || post.subtitle || post.excerpt || undefined,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.author?.name ? { "@type": "Person", name: post.author.name } : undefined,
    publisher: { "@type": "Organization", name: siteName },
    mainEntityOfPage: canonical,
    articleSection: formatPostKindLabel(post.kind),
    keywords: post.seo?.keywords,
  };
}
