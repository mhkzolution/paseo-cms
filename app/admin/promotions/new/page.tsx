import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PromotionEditorForm } from "@/features/content/promotion-editor-form";
import { prisma } from "@/lib/prisma";
import { resolveInternalLinkSuggestions } from "@/lib/seo-internal-links";
import { requireModuleAccess } from "@/lib/rbac";

const NEW_PROMOTION_LINK_CONTEXT_ID = "__new_promotion__";

const DEFAULT_SEO = {
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
  twitterCard: "SUMMARY_LARGE_IMAGE" as const,
  noindex: false,
  nofollow: false,
  noarchive: false,
  nosnippet: false,
  maxSnippet: "",
  maxImagePreview: "large",
  maxVideoPreview: "",
  schemaType: "ARTICLE" as const,
  customJsonLd: "",
  includeInSitemap: true,
  includeInNewsSitemap: false,
  includeInImageSitemap: true,
  sitemapPriority: "",
  changeFrequency: null,
};

export default async function NewPromotionPage() {
  await requireModuleAccess("promotions");

  const [branches, tags, promotions] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.promotion.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  const internalLinkSuggestions = await resolveInternalLinkSuggestions({
    contentType: "promotion",
    contentId: NEW_PROMOTION_LINK_CONTEXT_ID,
    promotionCategory: "FOOD",
    tagIds: [],
    branchIds: [],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/promotions" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to promotions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Add promotion</h1>
      </div>

      <PromotionEditorForm
        mode="create"
        endpoint="/api/promotions"
        returnHref="/admin/promotions"
        submitLabel="Create promotion"
        internalLinkSuggestions={internalLinkSuggestions}
        savedInternalLinkContext={{
          categoryId: "FOOD",
          tagIds: [],
        }}
        branches={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
        tags={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
        promotions={promotions.map((promotion) => ({ label: promotion.title, value: promotion.id }))}
        defaultValues={{
          title: "",
          slug: "",
          category: "FOOD",
          h1: "",
          branchIds: [],
          tagIds: [],
          newTags: "",
          relatedPromotionIds: [],
          excerpt: "",
          subtitle: "",
          content: "",
          featuredImage: "",
          coverImageAlt: "",
          coverImageCaption: "",
          showOnHome: false,
          status: "DRAFT",
          startDate: "",
          endDate: "",
          publishedAt: "",
          reviewedAt: "",
          expiresAt: "",
          seo: DEFAULT_SEO,
          alternates: [],
          faqs: [],
        }}
      />
    </div>
  );
}
