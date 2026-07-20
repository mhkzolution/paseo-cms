import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ResourceForm } from "@/features/content/resource-form";
import { requireRole } from "@/lib/rbac";

const GALLERY_FIELDS = [
  { name: "album", label: "Album", type: "text" },
  { name: "image", label: "Image URL", type: "text" },
] as const;

export default async function NewGalleryPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/gallery" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to gallery
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Add gallery image</h1>
      </div>

      <ResourceForm
        mode="create"
        endpoint="/api/gallery"
        returnHref="/admin/gallery"
        submitLabel="Create gallery image"
        schemaKey="gallery"
        fields={[...GALLERY_FIELDS]}
        defaultValues={{ album: "", image: "" }}
      />
    </div>
  );
}
