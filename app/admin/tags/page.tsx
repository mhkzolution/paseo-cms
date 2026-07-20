import Link from "next/link";
import { Plus, Tags } from "lucide-react";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function TagsPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const tags = await prisma.tag.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          posts: { where: { post: { deletedAt: null } } },
          events: { where: { event: { deletedAt: null } } },
          promotions: { where: { promotion: { deletedAt: null } } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Tags"
        description="Manage tags used across posts, events, and promotions"
        action={
          <Link
            href="/admin/tags/new"
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add tag
          </Link>
        }
      />

      {tags.length === 0 ? (
        <EmptyState icon={Tags} title="No tags yet" description="Create tags to organize posts, events, and promotions." />
      ) : (
        <AdminTableShell>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Posts</th>
                <th className="px-4 py-3 font-medium">Events</th>
                <th className="px-4 py-3 font-medium">Promotions</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tags.map((tag) => {
                const total = tag._count.posts + tag._count.events + tag._count.promotions;

                return (
                  <tr key={tag.id}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/admin/tags/${tag.id}`} className="hover:text-paseo-dark">
                        #{tag.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{tag.slug}</td>
                    <td className="px-4 py-3 text-muted">{tag._count.posts}</td>
                    <td className="px-4 py-3 text-muted">{tag._count.events}</td>
                    <td className="px-4 py-3 text-muted">{tag._count.promotions}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{total}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                        <Link
                          href={`/admin/tags/${tag.id}`}
                          className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                        >
                          View
                        </Link>
                        <DeleteResourceButton endpoint={`/api/tags/${tag.id}`} label={tag.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AdminTableShell>
      )}
    </div>
  );
}
