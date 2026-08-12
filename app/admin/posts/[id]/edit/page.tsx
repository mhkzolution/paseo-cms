import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PostEditorForm } from "@/features/content/post-editor-form";
import { ensureDefaultPostCategories, mapPostCategoryOptions } from "@/lib/categories";
import { toDateTimeInputValue } from "@/lib/content-form";
import { prisma } from "@/lib/prisma";
import { resolveInternalLinkSuggestions } from "@/lib/seo-internal-links";
import { requireModuleAccess } from "@/lib/rbac";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  await requireModuleAccess("news");
  await ensureDefaultPostCategories();

  const { id } = await params;
  const [post, categories, branches, tags, posts] = await Promise.all([
    prisma.post.findFirst({
      where: { id, deletedAt: null },
      include: {
        seo: true,
        tags: true,
        branches: true,
        relatedFrom: true,
        alternateLinks: true,
        faqs: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        images: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({
      where: { deletedAt: null, scope: "POST" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, postKind: true },
    }),
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.post.findMany({
      where: { deletedAt: null, NOT: { id } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!post) notFound();
  const seo = post.seo;

  const internalLinkSuggestions = await resolveInternalLinkSuggestions({
    contentType: "post",
    contentId: post.id,
    categoryId: post.categoryId,
    postKind: post.kind,
    tagIds: post.tags.map((tag) => tag.tagId),
    branchIds: post.branches.map((branch) => branch.branchId),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/posts" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to posts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit post</h1>
      </div>

      <PostEditorForm
        mode="edit"
        endpoint={`/api/posts/${post.id}`}
        returnHref="/admin/posts"
        submitLabel="Save changes"
        internalLinkSuggestions={internalLinkSuggestions}
        savedInternalLinkContext={{
          categoryId: post.categoryId ?? "",
          tagIds: post.tags.map((tag) => tag.tagId),
        }}
        categories={mapPostCategoryOptions(categories)}
        branches={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
        tags={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
        posts={posts.map((relatedPost) => ({ label: relatedPost.title, value: relatedPost.id }))}
        defaultValues={{
          title: post.title,
          slug: post.slug,
          kind: post.kind,
          h1: post.h1 ?? "",
          categoryId: post.categoryId ?? "",
          branchIds: post.branches.map((branch) => branch.branchId),
          tagIds: post.tags.map((tag) => tag.tagId),
          newTags: "",
          relatedPostIds: post.relatedFrom.map((related) => related.relatedPostId),
          excerpt: post.excerpt ?? "",
          subtitle: post.subtitle ?? "",
          content: post.content,
          featuredImage: post.featuredImage ?? "",
          coverImageAlt: post.coverImageAlt ?? "",
          coverImageCaption: post.coverImageCaption ?? "",
          bannerDesktop: post.bannerDesktop ?? "",
          bannerMobile: post.bannerMobile ?? "",
          showOnHome: post.showOnHome,
          status: post.status,
          publishedAt: toDateTimeInputValue(post.publishedAt),
          reviewedAt: toDateTimeInputValue(post.reviewedAt),
          expiresAt: toDateTimeInputValue(post.expiresAt),
          seo: {
            seoTitle: seo?.seoTitle ?? "",
            seoDescription: seo?.seoDescription ?? "",
            keywords: seo?.keywords ?? "",
            focusKeyword: seo?.focusKeyword ?? "",
            secondaryKeywords: Array.isArray(seo?.secondaryKeywords) ? seo.secondaryKeywords.join(", ") : "",
            canonicalUrl: seo?.canonicalUrl ?? "",
            ogTitle: seo?.ogTitle ?? "",
            ogDescription: seo?.ogDescription ?? "",
            ogImage: seo?.ogImage ?? "",
            twitterTitle: seo?.twitterTitle ?? "",
            twitterDescription: seo?.twitterDescription ?? "",
            twitterImage: seo?.twitterImage ?? "",
            twitterCard: seo?.twitterCard ?? "SUMMARY_LARGE_IMAGE",
            noindex: seo?.noindex ?? false,
            nofollow: seo?.nofollow ?? false,
            noarchive: seo?.noarchive ?? false,
            nosnippet: seo?.nosnippet ?? false,
            maxSnippet: seo?.maxSnippet ?? "",
            maxImagePreview: seo?.maxImagePreview ?? "large",
            maxVideoPreview: seo?.maxVideoPreview ?? "",
            schemaType: seo?.schemaType ?? "ARTICLE",
            customJsonLd: seo?.customJsonLd ? JSON.stringify(seo.customJsonLd, null, 2) : "",
            includeInSitemap: seo?.includeInSitemap ?? true,
            includeInNewsSitemap: seo?.includeInNewsSitemap ?? false,
            includeInImageSitemap: seo?.includeInImageSitemap ?? true,
            sitemapPriority: seo?.sitemapPriority ?? "",
            changeFrequency: seo?.changeFrequency ?? null,
          },
          alternates: post.alternateLinks.map((alternate) => ({ locale: alternate.locale, url: alternate.url })),
          faqs: post.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
          images: post.images.map((image) => ({
            url: image.url,
            alt: image.alt ?? "",
            caption: image.caption ?? "",
          })),
        }}
      />
    </div>
  );
}
