"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Folder, FolderOpen, Plus } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MediaUploadButton } from "@/features/media/media-upload-button";
import { AssetDrawer } from "@/features/media/asset-drawer";
import { MediaGrid } from "@/features/media/media-grid";
import { MediaGridSkeleton } from "@/features/media/media-grid-skeleton";
import { MediaInventory } from "@/features/media/media-inventory";
import { MediaLoadMore } from "@/features/media/media-load-more";
import { MediaToolbar, type MediaFilter, type MediaSort } from "@/features/media/media-toolbar";
import { useMediaList } from "@/features/media/use-media-list";
import type { MediaFolderOption, MediaListItem } from "@/features/media/types";

type MediaFolder = {
  id: string;
  name: string;
  slug: string;
  _count: { media: number };
};

interface MediaLibraryProps {
  folders: MediaFolder[];
  media: MediaListItem[];
  currentFolderId: string | null;
}

export function MediaLibrary({ folders, currentFolderId }: MediaLibraryProps) {
  const router = useRouter();
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<MediaFilter>("all");
  const [sort, setSort] = useState<MediaSort>("newest");
  const [selectedAsset, setSelectedAsset] = useState<MediaListItem | null>(null);

  const currentFolder = folders.find((folder) => folder.id === currentFolderId) ?? null;
  const folderOptions: MediaFolderOption[] = folders.map(({ id, name }) => ({ id, name }));
  const { media, total, hasMore, isLoading, isLoadingMore, error, reload, loadMore } = useMediaList({
    folderId: currentFolderId,
    query,
    type,
    sort,
  });
  const inventoryTitle = query.trim() ? "Search Results" : currentFolder?.name ?? "All Files";

  const handleCreateFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!folderName.trim()) return;

    setIsCreatingFolder(true);
    setFolderError(null);

    const response = await fetch("/api/media/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName.trim() }),
    });

    setIsCreatingFolder(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setFolderError(body?.error ?? "Could not create folder.");
      return;
    }

    setFolderName("");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 rounded-lg border border-border bg-surface p-4 lg:w-72">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FolderOpen className="h-4 w-4 text-paseo" aria-hidden="true" />
          Folders
        </div>

        <nav className="mt-4 grid gap-1.5">
          <Link
            href="/admin/media"
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors",
              currentFolderId === null
                ? "bg-paseo-hover font-medium text-paseo-dark"
                : "text-foreground hover:bg-background",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <Folder className="h-4 w-4" aria-hidden="true" />
              All Files
            </span>
          </Link>
          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={`/admin/media?folderId=${folder.id}`}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors",
                currentFolderId === folder.id
                  ? "bg-paseo-hover font-medium text-paseo-dark"
                  : "text-foreground hover:bg-background",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Folder className="h-4 w-4" aria-hidden="true" />
                {folder.name}
              </span>
              <span className="min-w-6 rounded-full bg-background px-2 py-0.5 text-center text-xs text-muted">
                {folder._count.media}
              </span>
            </Link>
          ))}
        </nav>

        <form onSubmit={handleCreateFolder} className="mt-5 grid gap-2 border-t border-border pt-4">
          <label className="text-sm font-medium text-foreground" htmlFor="folder-name">
            New folder
          </label>
          <input
            id="folder-name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Posts, Banners..."
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
          />
          <Button type="submit" variant="secondary" isLoading={isCreatingFolder}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create folder
          </Button>
          {folderError ? <p className="text-sm text-destructive">{folderError}</p> : null}
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <MediaInventory title={inventoryTitle} total={total} />
          <MediaUploadButton folderId={currentFolderId} onBatchUploaded={reload} />
        </div>

        <MediaToolbar
          query={query}
          type={type}
          sort={sort}
          onQueryChange={setQuery}
          onTypeChange={setType}
          onSortChange={setSort}
          className="mb-5"
        />

        {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}

        {isLoading ? (
          <MediaGridSkeleton />
        ) : media.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No files yet"
            description={
              currentFolder
                ? `Upload files to the "${currentFolder.name}" folder.`
                : "Upload an image, PDF, or video to get started."
            }
          />
        ) : (
          <>
            <MediaGrid media={media} onSelect={setSelectedAsset} selectedId={selectedAsset?.id} />
            <MediaLoadMore
              loadedCount={media.length}
              total={total}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={() => void loadMore()}
            />
          </>
        )}
      </div>

      <AssetDrawer
        mode="library"
        asset={selectedAsset}
        folders={folderOptions}
        onClose={() => setSelectedAsset(null)}
        onSaved={(saved) => {
          setSelectedAsset(saved);
          reload();
        }}
        onDeleted={() => {
          setSelectedAsset(null);
          reload();
          router.refresh();
        }}
      />
    </div>
  );
}
