import { Link } from "@/i18n/navigation";
import { Tag } from "lucide-react";

import { StoreCardMedia } from "@/features/stores/store-card-media";
import { StoreStatusDot } from "@/features/stores/store-status-dot";
import type { ArchiveStore } from "@/lib/stores";
import { buildStoreDetailHref } from "@/lib/stores";
import {
  DIRECTORY_CATEGORY_MAX,
  DIRECTORY_NAME_MAX,
  DIRECTORY_TIME_MAX,
  truncateDirectoryText,
} from "@/lib/stores/directory-text";
import { resolveStoreCardMedia } from "@/lib/stores/store-card-media";
import { getStoreOpenStatus } from "@/lib/stores/operating-hours";
import { cn } from "@/lib/utils";

export type StoreDirectoryCardProps = {
  store: ArchiveStore;
  listingQuery?: { category?: string; branch?: string };
  promotionLabel?: string | null;
};

export function StoreDirectoryCard({
  store,
  listingQuery,
  promotionLabel = null,
}: StoreDirectoryCardProps) {
  const media = resolveStoreCardMedia({
    name: store.name,
    logo: store.logo,
    cover: store.cover,
    category: store.category,
    branch: store.branch,
  });
  const status = getStoreOpenStatus(store.operatingHours);

  const displayName = truncateDirectoryText(store.name, DIRECTORY_NAME_MAX);
  const displayCategory = store.category
    ? truncateDirectoryText(store.category.name, DIRECTORY_CATEGORY_MAX)
    : null;
  const displayTime = truncateDirectoryText(status.detail, DIRECTORY_TIME_MAX);

  return (
    <Link
      href={buildStoreDetailHref(store.slug, listingQuery)}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-black/[0.08] bg-white transition-all hover:border-paseo/30 hover:shadow-sm"
    >
      <div className="relative">
        <StoreCardMedia media={media} alt={store.name} variant="directory" />
        <StoreStatusDot isOpen={status.isOpen} className="absolute left-2 top-2 z-10" />

        {promotionLabel ? (
          <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-paseo px-1.5 py-px text-[9px] font-semibold text-white shadow-sm">
            <Tag className="h-2.5 w-2.5" aria-hidden="true" />
            {promotionLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 px-2 py-1.5 sm:px-2.5 sm:py-2">
        <h3 className="line-clamp-2 overflow-hidden text-ellipsis text-[13px] font-semibold leading-snug text-foreground group-hover:text-paseo-dark sm:text-sm">
          {displayName}
        </h3>

        {displayCategory ? (
          <p className="truncate text-[11px] text-muted sm:text-xs">{displayCategory}</p>
        ) : null}

        <p
          className={cn(
            "truncate text-[11px] font-medium sm:text-xs",
            status.isOpen ? "text-green-600" : "text-muted",
          )}
        >
          {displayTime}
        </p>
      </div>
    </Link>
  );
}
