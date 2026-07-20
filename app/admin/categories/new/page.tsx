import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CategoryEditorForm } from "@/features/categories/category-editor-form";
import { requireRole } from "@/lib/rbac";

export default async function NewCategoryPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/categories" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to categories
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Add category</h1>
      </div>

      <CategoryEditorForm
        mode="create"
        endpoint="/api/categories"
        returnHref="/admin/categories"
        submitLabel="Create category"
        defaultValues={{ name: "", slug: "", image: "", color: "", sortOrder: 0 }}
      />
    </div>
  );
}
