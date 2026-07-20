import { MediaLibrary } from "@/features/media/media-library";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

interface MediaLibraryPageProps {
  searchParams: Promise<{ folderId?: string }>;
}

export default async function MediaLibraryPage({ searchParams }: MediaLibraryPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  const { folderId } = await searchParams;
  const currentFolderId = folderId ?? null;

  const [folders, media] = await Promise.all([
    prisma.mediaFolder.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { media: { where: { deletedAt: null } } } },
      },
    }),
    prisma.media.findMany({
      where: {
        deletedAt: null,
        ...(currentFolderId ? { folderId: currentFolderId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Media Library</h1>
        <p className="text-sm text-muted">Organize uploads into folders and reuse files across the site</p>
      </div>

      <MediaLibrary folders={folders} media={media} currentFolderId={currentFolderId} />
    </div>
  );
}
