"use client";

import Image from "next/image";
import { Check, FileText, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBytes, formatDate } from "@/lib/format";
import type { MediaListItem } from "@/features/media/types";

interface MediaGridProps {
  media: MediaListItem[];
  onSelect: (asset: MediaListItem) => void;
  selectedId?: string | null;
  selectedIds?: string[];
  className?: string;
}

function isAssetSelected(assetId: string, selectedId?: string | null, selectedIds?: string[]) {
  return selectedId === assetId || selectedIds?.includes(assetId);
}

export function MediaGrid({ media, onSelect, selectedId, selectedIds, className }: MediaGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]",
        className,
      )}
    >
      {media.map((asset) => {
        const selected = isAssetSelected(asset.id, selectedId, selectedIds);

        return (
        <button
          key={asset.id}
          type="button"
          onClick={() => onSelect(asset)}
          className={cn(
            "group flex flex-col overflow-hidden rounded-lg border bg-surface text-left transition-colors hover:border-paseo",
            selected ? "border-paseo ring-2 ring-paseo/30" : "border-border",
          )}
        >
          <div className="relative flex aspect-square items-center justify-center bg-background">
            {asset.type === "IMAGE" ? (
              <Image
                src={asset.path}
                alt={asset.altText || asset.filename}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 220px"
              />
            ) : asset.type === "VIDEO" ? (
              <Video className="h-8 w-8 text-muted" aria-hidden="true" />
            ) : (
              <FileText className="h-8 w-8 text-muted" aria-hidden="true" />
            )}
            {selected ? (
              <span
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-paseo text-white shadow-sm"
                aria-hidden="true"
              >
                <Check className="h-3 w-3" />
              </span>
            ) : null}
          </div>
          <div className="min-w-0 px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground" title={asset.filename}>
              {asset.filename}
            </p>
            <p className="text-xs text-muted">
              {formatBytes(asset.size)} · {formatDate(asset.createdAt)}
            </p>
          </div>
        </button>
        );
      })}
    </div>
  );
}
