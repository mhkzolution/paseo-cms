"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FolderOpen, ImageIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadMediaFiles } from "@/lib/media-upload";
import { AssetDrawer } from "@/features/media/asset-drawer";
import { MediaGrid } from "@/features/media/media-grid";
import { MediaToolbar, type MediaFilter, type MediaSort } from "@/features/media/media-toolbar";
import type { MediaListItem } from "@/features/media/types";

type MediaFolder = {
  id: string;
  name: string;
  slug: string;
};

interface MediaPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (media: MediaListItem) => void;
  onSelectMany?: (media: MediaListItem[]) => void;
  multiple?: boolean;
  minSelections?: number;
  maxSelections?: number;
  accept?: Array<"IMAGE" | "PDF" | "VIDEO">;
  title?: string;
}

export function MediaPickerDialog(props: MediaPickerDialogProps) {
  if (!props.open) return null;
  return <MediaPickerDialogContent {...props} />;
}

function MediaPickerDialogContent({
  onClose,
  onSelect,
  onSelectMany,
  multiple = false,
  minSelections = 1,
  maxSelections = 3,
  accept = ["IMAGE"],
  title = "Choose from media library",
}: MediaPickerDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [media, setMedia] = useState<MediaListItem[]>([]);
  const [folderId, setFolderId] = useState<string>("root");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<MediaFilter>("all");
  const [sort, setSort] = useState<MediaSort>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaListItem | null>(null);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ folderId, sort });
    if (type !== "all") params.set("type", type);
    if (query.trim()) params.set("q", query.trim());

    try {
      const response = await fetch(`/api/media?${params.toString()}`);
      const body = (await response.json().catch(() => null)) as { media?: MediaListItem[]; error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Could not load media.");
      setMedia((body?.media ?? []).filter((item) => accept.includes(item.type)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load media.");
      setMedia([]);
    } finally {
      setIsLoading(false);
    }
  }, [accept, folderId, query, sort, type]);

  useEffect(() => {
    let active = true;

    void fetch("/api/media/folders")
      .then((response) => response.json())
      .then((body: { folders?: MediaFolder[] }) => {
        if (active) setFolders(body.folders ?? []);
      })
      .catch(() => {
        if (active) setFolders([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMedia(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMedia]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const confirmMany = () => {
    const selected = selectedIds
      .map((id) => media.find((item) => item.id === id))
      .filter((item): item is MediaListItem => Boolean(item));

    if (selected.length < minSelections || selected.length > maxSelections) return;
    onSelectMany?.(selected);
    onClose();
  };

  const selectAsset = (item: MediaListItem) => {
    if (!multiple) {
      onSelect?.(item);
      onClose();
      return;
    }

    setSelectedIds((current) => {
      if (current.includes(item.id)) {
        return current.filter((id) => id !== item.id);
      }
      if (current.length >= maxSelections) return current;
      return [...current, item.id];
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setIsUploading(true);
    setError(null);

    try {
      const { uploaded, errors } = await uploadMediaFiles(files, folderId === "root" ? null : folderId);
      await loadMedia();

      const accepted = uploaded.filter((item) => accept.includes(item.type));

      if (multiple) {
        if (accepted.length) {
          setSelectedIds((current) => {
            const next = [...current];
            for (const item of accepted) {
              if (next.length >= maxSelections) break;
              if (!next.includes(item.id)) next.push(item.id);
            }
            return next;
          });
        } else if (errors.length) {
          setError(errors[0] ?? "Upload failed.");
        }
      } else {
        const selected = accepted[0];
        if (selected) {
          onSelect?.({
            ...selected,
            createdAt: selected.createdAt,
            updatedAt: selected.updatedAt,
          });
          onClose();
        } else if (uploaded.length && errors.length) {
          setError(`Uploaded ${uploaded.length} file(s). ${errors.length} failed.`);
        } else if (errors.length) {
          setError(errors[0] ?? "Upload failed.");
        }
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const canConfirm =
    multiple &&
    selectedIds.length >= minSelections &&
    selectedIds.length <= maxSelections;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted">
              {multiple
                ? `Select ${minSelections}–${maxSelections} images, then confirm`
                : "Upload a new file or pick one from your library"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted hover:bg-background hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted" aria-hidden="true" />
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
            >
              <option value="root">All files (no folder)</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <MediaToolbar
            query={query}
            type={type}
            sort={sort}
            onQueryChange={setQuery}
            onTypeChange={setType}
            onSortChange={setSort}
            className="min-w-[16rem] flex-1"
          />

          <Button type="button" variant="secondary" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept.includes("IMAGE") ? "image/*" : "image/*,application/pdf,video/*"}
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {error ? <p className="px-5 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <p className="text-sm text-muted">Loading media...</p>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted">
              <ImageIcon className="h-8 w-8" aria-hidden="true" />
              <p className="text-sm">No files in this folder yet.</p>
            </div>
          ) : (
            <MediaGrid media={media} onSelect={setSelectedAsset} selectedId={selectedAsset?.id} />
          )}
        </div>

        {multiple ? (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-sm text-muted">
              Selected {selectedIds.length} / {maxSelections}
            </p>
            <Button type="button" disabled={!canConfirm} onClick={confirmMany}>
              Insert gallery
            </Button>
          </div>
        ) : null}
      </div>

      <AssetDrawer
        mode="picker"
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onSelect={(asset) => {
          selectAsset(asset);
          setSelectedAsset(null);
        }}
      />
    </div>
  );
}
