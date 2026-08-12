import Image from "next/image";
import Link from "next/link";
import { Layers, Plus } from "lucide-react";
import type { CategoryScope } from "@prisma/client";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { getCategoryAdminConfig, ensureDefaultPostCategories } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";

interface CategoryListPageProps {
  scope: CategoryScope;
}

export async function CategoryListPage({ scope }: CategoryListPageProps) {
  await requireModuleAccess(scope === "POST" ? "post-categories" : "categories");

  const config = getCategoryAdminConfig(scope);
  const countRelation = config.countRelation;

  if (scope === "POST") {
    await ensureDefaultPostCategories();
  }

  const categories = await prisma.category.findMany({
    where: { deletedAt: null, scope },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select:
          countRelation === "stores"
            ? { stores: { where: { deletedAt: null } } }
            : { posts: { where: { deletedAt: null } } },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={config.title}
        description={config.description}
        action={
          <Link
            href={`${config.basePath}/new`}
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {config.addLabel}
          </Link>
        }
      />

      {categories.length === 0 ? (
        <EmptyState icon={Layers} title={config.emptyTitle} description={config.emptyDescription} />
      ) : (
        <AdminTableShell>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">ลำดับ</th>
                <th className="px-4 py-3 font-medium">รูปภาพ</th>
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">สี</th>
                <th className="px-4 py-3 font-medium">{config.countLabel}</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((category) => {
                const itemCount =
                  countRelation === "stores" ? category._count.stores : category._count.posts;

                return (
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
                    <td className="px-4 py-3 text-muted">{itemCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                        <Link
                          href={`${config.basePath}/${category.id}/edit`}
                          className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                        >
                          แก้ไข
                        </Link>
                        <DeleteResourceButton endpoint={`/api/categories/${category.id}`} label={category.name} />
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
