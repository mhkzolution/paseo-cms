import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { CategoryScope } from "@prisma/client";

import { CategoryEditorForm } from "@/features/categories/category-editor-form";
import { getCategoryAdminConfig } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";

interface CategoryEditorPageProps {
  scope: CategoryScope;
  mode: "create" | "edit";
  categoryId?: string;
}

export async function CategoryEditorPage({ scope, mode, categoryId }: CategoryEditorPageProps) {
  await requireModuleAccess(scope === "POST" ? "post-categories" : "categories");

  const config = getCategoryAdminConfig(scope);

  const category =
    mode === "edit" && categoryId
      ? await prisma.category.findFirst({ where: { id: categoryId, deletedAt: null, scope } })
      : null;

  if (mode === "edit" && !category) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={config.basePath} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {config.backLabel}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          {mode === "create" ? config.createTitle : config.editTitle}
        </h1>
      </div>

      <CategoryEditorForm
        mode={mode}
        endpoint={mode === "create" ? "/api/categories" : `/api/categories/${category!.id}`}
        returnHref={config.basePath}
        submitLabel={mode === "create" ? config.createSubmitLabel : config.editSubmitLabel}
        defaultValues={{
          name: category?.name ?? "",
          slug: category?.slug ?? "",
          scope,
          postKind: category?.postKind ?? "",
          image: category?.image ?? "",
          color: category?.color ?? "",
          sortOrder: category?.sortOrder ?? 0,
        }}
      />
    </div>
  );
}
