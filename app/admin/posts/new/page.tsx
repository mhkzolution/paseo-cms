import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PostEditorForm } from "@/features/content/post-editor-form";
import { ensureDefaultPostCategories, mapPostCategoryOptions } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { resolveInternalLinkSuggestions } from "@/lib/seo-internal-links";
import { requireModuleAccess } from "@/lib/rbac";

const NEW_POST_LINK_CONTEXT_ID = "__new_post__";

export default async function NewPostPage() {
  await requireModuleAccess("news");
  await ensureDefaultPostCategories();

  const [categories, branches, tags, posts] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null, scope: "POST" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, postKind: true },
    }),
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.post.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  const internalLinkSuggestions = await resolveInternalLinkSuggestions({
    contentType: "post",
    contentId: NEW_POST_LINK_CONTEXT_ID,
    categoryId: null,
    tagIds: [],
    branchIds: [],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/posts" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to posts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Add post</h1>
      </div>

      <PostEditorForm
        mode="create"
        endpoint="/api/posts"
        returnHref="/admin/posts"
        submitLabel="Create post"
        internalLinkSuggestions={internalLinkSuggestions}
        savedInternalLinkContext={{
          categoryId: "",
          tagIds: [],
        }}
        categories={mapPostCategoryOptions(categories)}
        branches={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
        tags={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
        posts={posts.map((post) => ({ label: post.title, value: post.id }))}
        defaultValues={{
          title: "",
          slug: "",
          kind: "NEWS",
          h1: "",
          categoryId: "",
          branchIds: [],
          tagIds: [],
          newTags: "",
          relatedPostIds: [],
          excerpt: "",
          subtitle: "",
          content: "",
          featuredImage: "",
          coverImageAlt: "",
          coverImageCaption: "",
          bannerDesktop: "",
          bannerMobile: "",
          showOnHome: false,
          status: "DRAFT",
          publishedAt: "",
          reviewedAt: "",
          expiresAt: "",
          seo: {
            seoTitle: "",
            seoDescription: "",
            keywords: "",
            focusKeyword: "",
            secondaryKeywords: "",
            canonicalUrl: "",
            ogTitle: "",
            ogDescription: "",
            ogImage: "",
            twitterTitle: "",
            twitterDescription: "",
            twitterImage: "",
            twitterCard: "SUMMARY_LARGE_IMAGE",
            noindex: false,
            nofollow: false,
            noarchive: false,
            nosnippet: false,
            maxSnippet: "",
            maxImagePreview: "large",
            maxVideoPreview: "",
            schemaType: "ARTICLE",
            customJsonLd: "",
            includeInSitemap: true,
            includeInNewsSitemap: false,
            includeInImageSitemap: true,
            sitemapPriority: "",
            changeFrequency: null,
          },
          alternates: [],
          faqs: [],
          images: [],
        }}
      />
    </div>
  );
}
