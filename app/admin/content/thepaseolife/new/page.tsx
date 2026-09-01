import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ThePaseoLifeForm } from "@/features/thepaseolife/thepaseolife-form";
import { requireModuleAccess } from "@/lib/rbac";

const EMPTY_ITEM = {
  image: "",
  title: "",
  description: "",
  linkUrl: "",
  openInNewTab: false,
  sortOrder: 0,
  isActive: true,
  publishedAt: "",
} as const;

export default async function NewThePaseoLifePage() {
  await requireModuleAccess("thepaseolife");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/content/thepaseolife"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to ThePaseoLife
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Create ThePaseoLife post</h1>
      </div>

      <ThePaseoLifeForm
        mode="create"
        endpoint="/api/admin/thepaseolife"
        returnHref="/admin/content/thepaseolife"
        submitLabel="Create"
        defaultValues={EMPTY_ITEM}
      />
    </div>
  );
}
