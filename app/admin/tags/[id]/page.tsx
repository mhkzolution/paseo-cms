import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { ContentStatusBadge } from "@/components/admin/content-status-badge";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { TagEditorForm } from "@/features/tags/tag-editor-form";
import { buildTagHref } from "@/lib/tags";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

interface TagDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TagDetailPage({ params }: TagDetailPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const { id } = await params;
  const tag = await prisma.tag.findFirst({
    where: { id, deletedAt: null },
    include: {
      posts: {
        where: { post: { deletedAt: null } },
        include: {
          post: {
            select: { id: true, title: true, slug: true, status: true, kind: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      events: {
        where: { event: { deletedAt: null } },
        include: {
          event: {
            select: { id: true, title: true, slug: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      promotions: {
        where: { promotion: { deletedAt: null } },
        include: {
          promotion: {
            select: { id: true, title: true, slug: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tag) notFound();

  const usageTotal = tag.posts.length + tag.events.length + tag.promotions.length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin/tags" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to tags
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">#{tag.name}</h1>
          <p className="mt-1 text-sm text-muted">
            ใช้งานทั้งหมด {usageTotal} รายการ · slug: {tag.slug}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildTagHref(tag.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:border-paseo"
          >
            View public page
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <DeleteResourceButton endpoint={`/api/tags/${tag.id}`} label={tag.name} redirectTo="/admin/tags" />
        </div>
      </div>

      <section className="rounded-lg border border-border bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Edit tag</h2>
        <div className="mt-4">
          <TagEditorForm
            mode="edit"
            endpoint={`/api/tags/${tag.id}`}
            returnHref={`/admin/tags/${tag.id}`}
            submitLabel="Save changes"
            defaultValues={{
              name: tag.name,
              slug: tag.slug,
              description: tag.description ?? "",
            }}
          />
        </div>
      </section>

      <section className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">การใช้งานแท็กนี้</h2>
          <p className="mt-1 text-sm text-muted">รายการเนื้อหาที่ผูกกับแท็กนี้</p>
        </div>

        <UsageSection
          title="ข่าว / Posts"
          emptyMessage="ยังไม่มีโพสต์ใช้แท็กนี้"
          items={tag.posts.map((item) => ({
            id: item.post.id,
            title: item.post.title,
            status: item.post.status,
            editHref: `/admin/posts/${item.post.id}/edit`,
            publicHref: `/news/${item.post.slug}`,
          }))}
        />

        <UsageSection
          title="Events"
          emptyMessage="ยังไม่มี Event ใช้แท็กนี้"
          items={tag.events.map((item) => ({
            id: item.event.id,
            title: item.event.title,
            status: item.event.status,
            editHref: `/admin/events/${item.event.id}/edit`,
            publicHref: `/events/${item.event.slug}`,
          }))}
        />

        <UsageSection
          title="Promotions"
          emptyMessage="ยังไม่มี Promotion ใช้แท็กนี้"
          items={tag.promotions.map((item) => ({
            id: item.promotion.id,
            title: item.promotion.title,
            status: item.promotion.status,
            editHref: `/admin/promotions/${item.promotion.id}/edit`,
            publicHref: `/promotions/${item.promotion.slug}`,
          }))}
        />
      </section>
    </div>
  );
}

function UsageSection({
  title,
  emptyMessage,
  items,
}: {
  title: string;
  emptyMessage: string;
  items: Array<{
    id: string;
    title: string;
    status: string;
    editHref: string;
    publicHref: string;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted">{items.length} รายการ</span>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{item.title}</p>
                <div className="mt-1">
                  <ContentStatusBadge status={item.status as "DRAFT" | "PUBLISHED" | "ARCHIVED"} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={item.editHref}
                  className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                >
                  Edit
                </Link>
                <Link
                  href={item.publicHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted hover:bg-background hover:text-foreground"
                >
                  View
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
