import Image from "next/image";
import Link from "next/link";
import { Layers, Plus } from "lucide-react";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function CategoriesPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          stores: { where: { deletedAt: null } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Categories"
        description="Group posts and stores for browsing"
        action={
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add category
          </Link>
        }
      />

      {categories.length === 0 ? (
        <EmptyState icon={Layers} title="No categories yet" description="Create categories for posts and stores." />
      ) : (
        <AdminTableShell>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Color</th>
                <th className="px-4 py-3 font-medium">Stores</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 text-muted">{category.sortOrder}</td>
                  <td className="px-4 py-3">
                    {category.image ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border bg-background">
                        <Image src={category.image} alt={category.name} fill className="object-cover" sizes="40px" />
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{category.name}</td>
                  <td className="px-4 py-3 text-muted">{category.slug}</td>
                  <td className="px-4 py-3">
                    {category.color ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-6 w-6 rounded-md border border-border"
                          style={{ backgroundColor: category.color }}
                          aria-hidden="true"
                        />
                        <span className="text-muted">{category.color}</span>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{category._count.stores}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                      >
                        Edit
                      </Link>
                      <DeleteResourceButton endpoint={`/api/categories/${category.id}`} label={category.name} />
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
