"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileText, Folder, FolderOpen, Plus, Video } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes, formatDate } from "@/lib/format";
import { DeleteMediaButton } from "@/features/media/delete-media-button";
import { MediaUploadButton } from "@/features/media/media-upload-button";

type MediaFolder = {
  id: string;
  name: string;
  slug: string;
  _count: { media: number };
};

type MediaItem = {
  id: string;
  folderId: string | null;
  filename: string;
  path: string;
  type: "IMAGE" | "PDF" | "VIDEO";
  size: number;
  createdAt: Date;
};

interface MediaLibraryProps {
  folders: MediaFolder[];
  media: MediaItem[];
  currentFolderId: string | null;
}

export function MediaLibrary({ folders, media, currentFolderId }: MediaLibraryProps) {
  const router = useRouter();
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  const currentFolder = folders.find((folder) => folder.id === currentFolderId) ?? null;

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
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{currentFolder?.name ?? "All files"}</h2>
            <p className="text-sm text-muted">
              {currentFolder ? "Files uploaded to this folder" : "All uploaded files across every folder"}
            </p>
          </div>
          <MediaUploadButton folderId={currentFolderId} />
        </div>

        {media.length === 0 ? (
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {media.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
              >
                <div className="relative flex aspect-square items-center justify-center bg-background">
                  {item.type === "IMAGE" ? (
                    <Image src={item.path} alt={item.filename} fill className="object-cover" sizes="200px" />
                  ) : item.type === "VIDEO" ? (
                    <Video className="h-8 w-8 text-muted" aria-hidden="true" />
                  ) : (
                    <FileText className="h-8 w-8 text-muted" aria-hidden="true" />
                  )}
                  <DeleteMediaButton mediaId={item.id} filename={item.filename} />
                </div>
                <div className="flex flex-col gap-0.5 px-3 py-2">
                  <p className="truncate text-sm font-medium text-foreground" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-xs text-muted">
                    {formatBytes(item.size)} · {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
