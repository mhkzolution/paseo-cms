import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EventEditorForm } from "@/features/content/event-editor-form";
import { toDateTimeInputValue } from "@/lib/content-form";
import { prisma } from "@/lib/prisma";
import { resolveInternalLinkSuggestions } from "@/lib/seo-internal-links";
import { requireModuleAccess } from "@/lib/rbac";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  await requireModuleAccess("events");

  const { id } = await params;
  const [event, branches, tags, events] = await Promise.all([
    prisma.event.findFirst({
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
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.event.findMany({
      where: { deletedAt: null, NOT: { id } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!event) notFound();
  const seo = event.seo;

  const internalLinkSuggestions = await resolveInternalLinkSuggestions({
    contentType: "event",
    contentId: event.id,
    tagIds: event.tags.map((tag) => tag.tagId),
    branchIds: event.branches.map((branch) => branch.branchId),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to events
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit event</h1>
      </div>

      <EventEditorForm
        mode="edit"
        endpoint={`/api/events/${event.id}`}
        returnHref="/admin/events"
        submitLabel="Save changes"
        internalLinkSuggestions={internalLinkSuggestions}
        savedInternalLinkContext={{
          categoryId: "",
          tagIds: event.tags.map((tag) => tag.tagId),
        }}
        branches={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
        tags={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
        events={events.map((relatedEvent) => ({ label: relatedEvent.title, value: relatedEvent.id }))}
        defaultValues={{
          title: event.title,
          slug: event.slug,
          h1: event.h1 ?? "",
          branchIds: event.branches.map((branch) => branch.branchId),
          tagIds: event.tags.map((tag) => tag.tagId),
          newTags: "",
          relatedEventIds: event.relatedFrom.map((related) => related.relatedEventId),
          excerpt: event.excerpt ?? "",
          subtitle: event.subtitle ?? "",
          content: event.content,
          featuredImage: event.featuredImage ?? "",
          coverImageAlt: event.coverImageAlt ?? "",
          coverImageCaption: event.coverImageCaption ?? "",
          showOnHome: event.showOnHome,
          status: event.status,
          eventDate: toDateTimeInputValue(event.eventDate),
          eventEndDate: toDateTimeInputValue(event.eventEndDate),
          location: event.location ?? "",
          publishedAt: toDateTimeInputValue(event.publishedAt),
          reviewedAt: toDateTimeInputValue(event.reviewedAt),
          expiresAt: toDateTimeInputValue(event.expiresAt),
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
            schemaType: seo?.schemaType ?? "EVENT",
            customJsonLd: seo?.customJsonLd ? JSON.stringify(seo.customJsonLd, null, 2) : "",
            includeInSitemap: seo?.includeInSitemap ?? true,
            includeInNewsSitemap: seo?.includeInNewsSitemap ?? false,
            includeInImageSitemap: seo?.includeInImageSitemap ?? true,
            sitemapPriority: seo?.sitemapPriority ?? "",
            changeFrequency: seo?.changeFrequency ?? null,
          },
          alternates: event.alternateLinks.map((alternate) => ({ locale: alternate.locale, url: alternate.url })),
          faqs: event.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
          images: event.images.map((image) => ({
            url: image.url,
            alt: image.alt ?? "",
            caption: image.caption ?? "",
          })),
        }}
      />
    </div>
  );
}
