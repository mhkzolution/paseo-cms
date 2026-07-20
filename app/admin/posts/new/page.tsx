import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PostEditorForm } from "@/features/content/post-editor-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function NewPostPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const [categories, branches, tags, posts] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.post.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

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
        categories={categories.map((category) => ({ label: category.name, value: category.id }))}
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
