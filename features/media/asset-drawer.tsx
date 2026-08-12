"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Download, FileText, Pencil, Trash2, Video, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes, formatDate } from "@/lib/format";
import type { MediaFolderOption, MediaListItem } from "@/features/media/types";

type AssetDrawerMode = "library" | "picker";

interface AssetDrawerProps {
  mode: AssetDrawerMode;
  asset: MediaListItem | null;
  folders?: MediaFolderOption[];
  onClose: () => void;
  onSaved?: (asset: MediaListItem) => void;
  onDeleted?: (asset: MediaListItem) => void;
  onSelect?: (asset: MediaListItem) => void;
}

type Metadata = Pick<MediaListItem, "altText" | "title" | "caption">;

const emptyValue = (value: string | null) => value ?? "—";

export function AssetDrawer({ mode, asset, folders = [], onClose, onSaved, onDeleted, onSelect }: AssetDrawerProps) {
  if (!asset) return null;

  return (
    <AssetDrawerContent
      key={asset.id}
      mode={mode}
      asset={asset}
      folders={folders}
      onClose={onClose}
      onSaved={onSaved}
      onDeleted={onDeleted}
      onSelect={onSelect}
    />
  );
}

function AssetDrawerContent({ mode, asset, folders = [], onClose, onSaved, onDeleted, onSelect }: AssetDrawerProps & { asset: MediaListItem }) {
  const [currentAsset, setCurrentAsset] = useState(asset);
  const [metadata, setMetadata] = useState<Metadata>({
    altText: asset.altText,
    title: asset.title,
    caption: asset.caption,
  });
  const [moveFolderId, setMoveFolderId] = useState(asset.folderId ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isDirty =
    metadata.altText !== currentAsset.altText ||
    metadata.title !== currentAsset.title ||
    metadata.caption !== currentAsset.caption;

  const requestClose = () => {
    if (mode === "library" && isDirty && !window.confirm("Discard unsaved metadata changes?")) return;
    onClose();
  };

  const patchAsset = async (data: Partial<MediaListItem>) => {
    const response = await fetch(`/api/media/${currentAsset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = (await response.json().catch(() => null)) as { media?: MediaListItem; error?: string } | null;

    if (!response.ok || !body?.media) throw new Error(body?.error ?? "Could not update this asset.");
    setCurrentAsset(body.media);
    onSaved?.(body.media);
    return body.media;
  };

  const saveMetadata = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await patchAsset(metadata);
      setMetadata({ altText: saved.altText, title: saved.title, caption: saved.caption });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save metadata.");
    } finally {
      setIsSaving(false);
    }
  };

  const renameAsset = async () => {
    const filename = window.prompt("Rename asset", currentAsset.filename)?.trim();
    if (!filename || filename === currentAsset.filename) return;
    setError(null);
    try {
      await patchAsset({ filename });
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Could not rename this asset.");
    }
  };

  const moveAsset = async () => {
    const folderId = moveFolderId || null;
    if (folderId === currentAsset.folderId) return;
    setIsMoving(true);
    setError(null);
    try {
      const saved = await patchAsset({ folderId });
      setMoveFolderId(saved.folderId ?? "");
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "Could not move this asset.");
    } finally {
      setIsMoving(false);
    }
  };

  const deleteAsset = async () => {
    const confirmed = window.confirm(
      "Delete Asset\n\nThis asset will be removed from the Media Library.\n\nYou can restore it later if recovery is supported by the system.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/media/${currentAsset.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not remove this file. Please try again.");
      }
      onDeleted?.(currentAsset);
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove this file. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(new URL(currentAsset.path, window.location.origin).toString());
      setCopied(true);
    } catch {
      setError("Could not copy the asset URL.");
    }
  };

  const setField = (field: keyof Metadata, value: string) => {
    setMetadata((current) => ({ ...current, [field]: value || null }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="presentation" onMouseDown={requestClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${currentAsset.filename} details`}
        className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-surface shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="truncate text-lg font-semibold text-foreground">Asset details</h2>
          <button
            type="button"
            onClick={requestClose}
            className="rounded-md p-2 text-muted hover:bg-background hover:text-foreground"
            aria-label="Close asset details"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <section aria-label="Preview" className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-background">
            {currentAsset.type === "IMAGE" ? (
              <Image src={currentAsset.path} alt={currentAsset.altText || currentAsset.filename} width={800} height={450} className="h-full w-full object-contain" />
            ) : currentAsset.type === "VIDEO" ? (
              <div className="flex flex-col items-center gap-2 text-muted">
                <Video className="h-10 w-10" aria-hidden="true" />
                <a href={currentAsset.path} target="_blank" rel="noreferrer" className="text-sm underline">
                  Open video
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted">
                <FileText className="h-10 w-10" aria-hidden="true" />
                <a href={currentAsset.path} target="_blank" rel="noreferrer" className="text-sm underline">
                  Open PDF
                </a>
              </div>
            )}
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold text-foreground">Asset information</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Filename" value={currentAsset.filename} />
              <Detail label="Original name" value={emptyValue(currentAsset.originalName)} />
              <Detail label="Size" value={formatBytes(currentAsset.size)} />
              <Detail label="Mime type" value={emptyValue(currentAsset.mimeType)} />
              <Detail label="Extension" value={emptyValue(currentAsset.extension)} />
              <Detail label="Dimensions" value={currentAsset.width && currentAsset.height ? `${currentAsset.width} × ${currentAsset.height}` : "—"} />
              <Detail label="Created At" value={formatDate(currentAsset.createdAt)} />
              <Detail label="Updated At" value={formatDate(currentAsset.updatedAt)} />
            </dl>
          </section>

          <section className="mt-6 border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">SEO metadata</h3>
            {mode === "library" ? (
              <div className="mt-3 grid gap-3">
                <Field label="Alt text" value={metadata.altText ?? ""} onChange={(value) => setField("altText", value)} />
                <Field label="Title" value={metadata.title ?? ""} onChange={(value) => setField("title", value)} />
                <Field label="Caption" value={metadata.caption ?? ""} multiline onChange={(value) => setField("caption", value)} />
                <Button type="button" className="w-fit" isLoading={isSaving} disabled={!isDirty} onClick={saveMetadata}>
                  Save Metadata
                </Button>
              </div>
            ) : (
              <dl className="mt-3 grid gap-3 text-sm">
                <Detail label="Alt text" value={emptyValue(currentAsset.altText)} />
                <Detail label="Title" value={emptyValue(currentAsset.title)} />
                <Detail label="Caption" value={emptyValue(currentAsset.caption)} />
              </dl>
            )}
          </section>

          {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
        </div>

        <footer className="border-t border-border p-5">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={copyUrl}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? "Copied" : "Copy URL"}
            </Button>
            <a
              href={currentAsset.path}
              download
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-paseo/40 hover:bg-paseo-hover"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download
            </a>
            {mode === "picker" ? (
              <Button type="button" onClick={() => onSelect?.(currentAsset)}>
                Select
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" onClick={renameAsset}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Rename
                </Button>
                <select
                  aria-label="Move asset to folder"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={moveFolderId}
                  onChange={(event) => setMoveFolderId(event.target.value)}
                >
                  <option value="">No folder</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" isLoading={isMoving} disabled={moveFolderId === (currentAsset.folderId ?? "")} onClick={moveAsset}>
                  Move
                </Button>
                <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" isLoading={isDeleting} onClick={deleteAsset}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </footer>
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-foreground">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  multiline = false,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  const className = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-paseo";
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label}
      {multiline ? (
        <textarea className={className} rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={className} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}
