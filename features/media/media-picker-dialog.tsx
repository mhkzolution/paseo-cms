"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, FolderOpen, ImageIcon, Search, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadMediaFiles } from "@/lib/media-upload";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

type MediaItem = {
  id: string;
  folderId: string | null;
  filename: string;
  path: string;
  type: "IMAGE" | "PDF" | "VIDEO";
  size: number;
  createdAt: string;
};

type MediaFolder = {
  id: string;
  name: string;
  slug: string;
};

interface MediaPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (media: MediaItem) => void;
  onSelectMany?: (media: MediaItem[]) => void;
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
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folderId, setFolderId] = useState<string>("root");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("folderId", folderId);
    if (accept.length === 1) params.set("type", accept[0]!);
    if (query.trim()) params.set("q", query.trim());

    const response = await fetch(`/api/media?${params.toString()}`);
    const body = (await response.json().catch(() => null)) as { media?: MediaItem[]; error?: string } | null;

    if (!response.ok) {
      setError(body?.error ?? "Could not load media.");
      setMedia([]);
      setIsLoading(false);
      return;
    }

    setMedia((body?.media ?? []).filter((item) => accept.includes(item.type)));
    setIsLoading(false);
  }, [accept, folderId, query]);

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
    let active = true;

    void (async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("folderId", folderId);
      if (accept.length === 1) params.set("type", accept[0]!);
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`/api/media?${params.toString()}`);
      const body = (await response.json().catch(() => null)) as { media?: MediaItem[]; error?: string } | null;

      if (!active) return;

      if (!response.ok) {
        setError(body?.error ?? "Could not load media.");
        setMedia([]);
        setIsLoading(false);
        return;
      }

      setMedia((body?.media ?? []).filter((item) => accept.includes(item.type)));
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [accept, folderId, query]);

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
      .filter((item): item is MediaItem => Boolean(item));

    if (selected.length < minSelections || selected.length > maxSelections) return;
    onSelectMany?.(selected);
    onClose();
  };

  const toggleSelect = (item: MediaItem) => {
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
            createdAt: new Date().toISOString(),
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

          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm"
              placeholder="Search files..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {media.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item)}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-lg border bg-background text-left transition-colors",
                      isSelected ? "border-paseo ring-2 ring-paseo/30" : "border-border hover:border-paseo",
                    )}
                  >
                    <div className="relative aspect-square bg-surface">
                      {item.type === "IMAGE" ? (
                        <Image src={item.path} alt={item.filename} fill className="object-cover" sizes="180px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted">{item.type}</div>
                      )}
                      {multiple && isSelected ? (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-paseo text-white">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-medium text-foreground">{item.filename}</p>
                      <p className="text-xs text-muted">{formatBytes(item.size)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
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
    </div>
  );
}
