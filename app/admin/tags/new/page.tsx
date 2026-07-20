import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TagEditorForm } from "@/features/tags/tag-editor-form";
import { requireRole } from "@/lib/rbac";

export default async function NewTagPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/tags" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to tags
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Add tag</h1>
      </div>

      <TagEditorForm
        mode="create"
        endpoint="/api/tags"
        returnHref="/admin/tags"
        submitLabel="Create tag"
        defaultValues={{ name: "", slug: "", description: "" }}
      />
    </div>
  );
}
