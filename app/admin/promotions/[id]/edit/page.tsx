import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PromotionEditorForm } from "@/features/content/promotion-editor-form";
import { toDateTimeInputValue } from "@/lib/content-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

interface EditPromotionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPromotionPage({ params }: EditPromotionPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  const { id } = await params;
  const [promotion, branches, tags, promotions] = await Promise.all([
    prisma.promotion.findFirst({
      where: { id, deletedAt: null },
      include: {
        seo: true,
        tags: true,
        branches: true,
        relatedFrom: true,
        alternateLinks: true,
        faqs: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.promotion.findMany({
      where: { deletedAt: null, NOT: { id } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!promotion) notFound();
  const seo = promotion.seo;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/promotions" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to promotions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit promotion</h1>
      </div>

      <PromotionEditorForm
        mode="edit"
        endpoint={`/api/promotions/${promotion.id}`}
        returnHref="/admin/promotions"
        submitLabel="Save changes"
        branches={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
        tags={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
        promotions={promotions.map((item) => ({ label: item.title, value: item.id }))}
        defaultValues={{
          title: promotion.title,
          slug: promotion.slug,
          category: promotion.category,
          h1: promotion.h1 ?? "",
          branchIds: promotion.branches.map((branch) => branch.branchId),
          tagIds: promotion.tags.map((tag) => tag.tagId),
          newTags: "",
          relatedPromotionIds: promotion.relatedFrom.map((related) => related.relatedPromotionId),
          excerpt: promotion.excerpt ?? "",
          subtitle: promotion.subtitle ?? "",
          content: promotion.content,
          featuredImage: promotion.featuredImage ?? "",
          coverImageAlt: promotion.coverImageAlt ?? "",
          coverImageCaption: promotion.coverImageCaption ?? "",
          showOnHome: promotion.showOnHome,
          status: promotion.status,
          startDate: toDateTimeInputValue(promotion.startDate),
          endDate: toDateTimeInputValue(promotion.endDate),
          publishedAt: toDateTimeInputValue(promotion.publishedAt),
          reviewedAt: toDateTimeInputValue(promotion.reviewedAt),
          expiresAt: toDateTimeInputValue(promotion.expiresAt),
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
          alternates: promotion.alternateLinks.map((alternate) => ({ locale: alternate.locale, url: alternate.url })),
          faqs: promotion.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
        }}
      />
    </div>
  );
}
