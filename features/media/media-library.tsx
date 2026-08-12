"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Folder, FolderOpen, Plus } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MediaUploadButton } from "@/features/media/media-upload-button";
import { AssetDrawer } from "@/features/media/asset-drawer";
import { MediaGrid } from "@/features/media/media-grid";
import { MediaToolbar, type MediaFilter, type MediaSort } from "@/features/media/media-toolbar";
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

export function MediaLibrary({ folders, media: initialMedia, currentFolderId }: MediaLibraryProps) {
  const router = useRouter();
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaListItem[]>(initialMedia);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<MediaFilter>("all");
  const [sort, setSort] = useState<MediaSort>("newest");
  const [isLoading, setIsLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<MediaListItem | null>(null);

  const currentFolder = folders.find((folder) => folder.id === currentFolderId) ?? null;
  const folderOptions: MediaFolderOption[] = folders.map(({ id, name }) => ({ id, name }));

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    setMediaError(null);

    const params = new URLSearchParams({ folderId: currentFolderId ?? "root", sort });
    if (query.trim()) params.set("q", query.trim());
    if (type !== "all") params.set("type", type);

    try {
      const response = await fetch(`/api/media?${params.toString()}`);
      const body = (await response.json().catch(() => null)) as { media?: MediaListItem[]; error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Could not load media.");
      setMedia(body?.media ?? []);
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Could not load media.");
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId, query, sort, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMedia(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMedia]);

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

        <nav className="mt-4 grid gap-1">
          <Link
            href="/admin/media"
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
              currentFolderId === null ? "bg-paseo-hover text-paseo-dark" : "text-foreground hover:bg-background",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <Folder className="h-4 w-4" aria-hidden="true" />
              All files
            </span>
          </Link>
          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={`/admin/media?folderId=${folder.id}`}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                currentFolderId === folder.id ? "bg-paseo-hover text-paseo-dark" : "text-foreground hover:bg-background",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Folder className="h-4 w-4" aria-hidden="true" />
                {folder.name}
              </span>
              <span className="text-xs text-muted">{folder._count.media}</span>
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
          <div>
            <h2 className="text-lg font-semibold text-foreground">{currentFolder?.name ?? "All files"}</h2>
            <p className="text-sm text-muted">
              {currentFolder ? "Files uploaded to this folder" : "All uploaded files across every folder"}
            </p>
          </div>
          <MediaUploadButton folderId={currentFolderId} onBatchUploaded={() => void loadMedia()} />
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

        {mediaError ? <p role="alert" className="mb-4 text-sm text-destructive">{mediaError}</p> : null}

        {isLoading ? (
          <p className="text-sm text-muted">Loading media...</p>
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
          <MediaGrid media={media} onSelect={setSelectedAsset} selectedId={selectedAsset?.id} />
        )}
      </div>

      <AssetDrawer
        mode="library"
        asset={selectedAsset}
        folders={folderOptions}
        onClose={() => setSelectedAsset(null)}
        onSaved={(saved) => {
          setMedia((current) => current.map((asset) => (asset.id === saved.id ? saved : asset)));
          setSelectedAsset(saved);
        }}
        onDeleted={(deleted) => {
          setMedia((current) => current.filter((asset) => asset.id !== deleted.id));
          setSelectedAsset(null);
          router.refresh();
        }}
      />
    </div>
  );
}
