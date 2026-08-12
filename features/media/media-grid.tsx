"use client";

import Image from "next/image";
import { FileText, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBytes, formatDate } from "@/lib/format";
import type { MediaListItem } from "@/features/media/types";

interface MediaGridProps {
  media: MediaListItem[];
  onSelect: (asset: MediaListItem) => void;
  selectedId?: string | null;
  className?: string;
}

export function MediaGrid({ media, onSelect, selectedId, className }: MediaGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5", className)}>
      {media.map((asset) => (
        <button
          key={asset.id}
          type="button"
          onClick={() => onSelect(asset)}
          className={cn(
            "group flex flex-col overflow-hidden rounded-lg border bg-surface text-left transition-colors hover:border-paseo",
            selectedId === asset.id ? "border-paseo ring-2 ring-paseo/30" : "border-border",
          )}
        >
          <div className="relative flex aspect-square items-center justify-center bg-background">
            {asset.type === "IMAGE" ? (
              <Image src={asset.path} alt={asset.altText || asset.filename} fill className="object-cover" sizes="200px" />
            ) : asset.type === "VIDEO" ? (
              <Video className="h-8 w-8 text-muted" aria-hidden="true" />
            ) : (
              <FileText className="h-8 w-8 text-muted" aria-hidden="true" />
            )}
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
      ))}
    </div>
  );
}
