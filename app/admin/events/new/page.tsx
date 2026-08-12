import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EventEditorForm } from "@/features/content/event-editor-form";
import { prisma } from "@/lib/prisma";
import { resolveInternalLinkSuggestions } from "@/lib/seo-internal-links";
import { requireModuleAccess } from "@/lib/rbac";

const NEW_EVENT_LINK_CONTEXT_ID = "__new_event__";

export default async function NewEventPage() {
  await requireModuleAccess("events");

  const [branches, tags, events] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.event.findMany({ where: { deletedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  const internalLinkSuggestions = await resolveInternalLinkSuggestions({
    contentType: "event",
    contentId: NEW_EVENT_LINK_CONTEXT_ID,
    tagIds: [],
    branchIds: [],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to events
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Add event</h1>
      </div>

      <EventEditorForm
        mode="create"
        endpoint="/api/events"
        returnHref="/admin/events"
        submitLabel="Create event"
        internalLinkSuggestions={internalLinkSuggestions}
        savedInternalLinkContext={{
          categoryId: "",
          tagIds: [],
        }}
        branches={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
        tags={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
        events={events.map((event) => ({ label: event.title, value: event.id }))}
        defaultValues={{
          title: "",
          slug: "",
          h1: "",
          branchIds: [],
          tagIds: [],
          newTags: "",
          relatedEventIds: [],
          excerpt: "",
          subtitle: "",
          content: "",
          featuredImage: "",
          coverImageAlt: "",
          coverImageCaption: "",
          showOnHome: false,
          status: "DRAFT",
          eventDate: "",
          eventEndDate: "",
          location: "",
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
            schemaType: "EVENT",
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
