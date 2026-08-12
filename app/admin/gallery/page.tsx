import Link from "next/link";
import { Images, Plus } from "lucide-react";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { formatDate } from "@/lib/format";
import { getLocalizationSettings } from "@/lib/settings-cache";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";

export default async function GalleryPage() {
  await requireModuleAccess("gallery");
  const localization = await getLocalizationSettings();

  const gallery = await prisma.gallery.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Gallery"
        description="Manage image albums for the website gallery"
        action={
          <Link
            href="/admin/gallery/new"
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add image
          </Link>
        }
      />

      {gallery.length === 0 ? (
        <EmptyState icon={Images} title="No gallery images yet" description="Add the first gallery image." />
      ) : (
        <AdminTableShell>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Album</th>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gallery.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{item.album}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted">{item.image}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(item.createdAt, localization)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                      <Link
                        href={`/admin/gallery/${item.id}/edit`}
                        className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                      >
                        Edit
                      </Link>
                      <DeleteResourceButton endpoint={`/api/gallery/${item.id}`} label={item.album} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      )}
    </div>
  );
}
