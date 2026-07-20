import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CategoryEditorForm } from "@/features/categories/category-editor-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const { id } = await params;
  const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
  if (!category) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/categories" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to categories
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit category</h1>
      </div>

      <CategoryEditorForm
        mode="edit"
        endpoint={`/api/categories/${category.id}`}
        returnHref="/admin/categories"
        submitLabel="Save changes"
        defaultValues={{
          name: category.name,
          slug: category.slug,
          image: category.image ?? "",
          color: category.color ?? "",
          sortOrder: category.sortOrder,
        }}
      />
    </div>
  );
}
