import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { cn } from "@/lib/utils";

export type SearchResultItem = {
  id: string;
  title: string;
  description: string | null;
  href: string;
  image?: string | null;
  imageAlt?: string | null;
  category?: string | null;
  logo?: string | null;
  branchName?: string | null;
};

type SearchPostListItemProps = {
  item: SearchResultItem;
  onNavigate?: () => void;
};

export function SearchPostListItem({ item, onNavigate }: SearchPostListItemProps) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group flex gap-4 overflow-hidden rounded-lg border border-border bg-white p-3 transition-colors hover:border-paseo"
    >
      {item.image ? (
        <div className="relative h-[88px] w-[132px] shrink-0 overflow-hidden rounded-md bg-[#F3F0EA]">
          <Image
            src={item.image}
            alt={item.imageAlt || item.title}
            fill
            sizes="132px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="flex h-[88px] w-[132px] shrink-0 items-center justify-center rounded-md bg-[#F3F0EA] text-xs text-muted">
          No image
        </div>
      )}

      <article className="min-w-0 flex-1 py-0.5">
        {item.category ? (
          <p className="text-xs font-medium uppercase text-muted">{item.category}</p>
        ) : null}
        <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-paseo-dark sm:text-base">
          {item.title}
        </h4>
        {item.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{item.description}</p>
        ) : null}
      </article>
    </Link>
  );
}

type SearchStoreListItemProps = {
  item: SearchResultItem;
  onNavigate?: () => void;
};

export function SearchStoreListItem({ item, onNavigate }: SearchStoreListItemProps) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 transition-colors hover:border-paseo"
    >
      {item.logo ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-white">
          <Image src={item.logo} alt={item.title} fill sizes="48px" className="object-contain p-1" />
        </div>
      ) : (
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#F3F0EA] text-sm font-bold text-[#9B8459]",
          )}
        >
          {item.title.charAt(0)}
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground transition-colors group-hover:text-paseo-dark">
          {item.title}
        </p>
        {item.branchName ? <p className="mt-0.5 truncate text-sm text-muted">{item.branchName}</p> : null}
      </div>
    </Link>
  );
}
