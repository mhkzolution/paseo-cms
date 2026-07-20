import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ResourceForm } from "@/features/content/resource-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const GALLERY_FIELDS = [
  { name: "album", label: "Album", type: "text" },
  { name: "image", label: "Image URL", type: "text" },
] as const;

interface EditGalleryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGalleryPage({ params }: EditGalleryPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  const { id } = await params;
  const item = await prisma.gallery.findFirst({ where: { id, deletedAt: null } });
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/gallery" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to gallery
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit gallery image</h1>
      </div>

      <ResourceForm
        mode="edit"
        endpoint={`/api/gallery/${item.id}`}
        returnHref="/admin/gallery"
        submitLabel="Save changes"
        schemaKey="gallery"
        fields={[...GALLERY_FIELDS]}
        defaultValues={{ album: item.album, image: item.image }}
      />
    </div>
  );
}
