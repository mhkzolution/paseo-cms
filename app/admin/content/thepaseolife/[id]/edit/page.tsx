import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ThePaseoLifeForm } from "@/features/thepaseolife/thepaseolife-form";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditThePaseoLifePage({ params }: PageProps) {
  await requireModuleAccess("thepaseolife");
  const { id } = await params;

  const item = await prisma.thePaseoLifePost.findFirst({
    where: { id, deletedAt: null },
  });

  if (!item) notFound();

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
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit ThePaseoLife post</h1>
      </div>

      <ThePaseoLifeForm
        mode="edit"
        endpoint={`/api/admin/thepaseolife/${item.id}`}
        returnHref="/admin/content/thepaseolife"
        submitLabel="Save changes"
        defaultValues={{
          image: item.image,
          title: item.title,
          description: item.description ?? "",
          linkUrl: item.linkUrl,
          openInNewTab: item.openInNewTab,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
          publishedAt: item.publishedAt,
        }}
      />
    </div>
  );
}
