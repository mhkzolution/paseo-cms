import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

import type { ArchivePost } from "@/lib/post-archives";
import { formatPostDate, formatPostKindLabel, truncatePostExcerpt } from "@/lib/post-archives";
import { cn } from "@/lib/utils";

interface TrendUpdateCardProps {
  post: ArchivePost;
  className?: string;
}

export function TrendUpdateCard({ post, className }: TrendUpdateCardProps) {
  const excerpt = truncatePostExcerpt(post.excerpt);
  const postDate = formatPostDate(post.publishedAt);
  const categoryLabel = post.category?.name ?? formatPostKindLabel(post.kind);

  return (
    <article className={cn("flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white", className)}>
      <Link href={`/news/${post.slug}`} className="group block">
        {post.featuredImage ? (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.coverImageAlt || post.title}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center bg-background text-sm text-muted">No image</div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase text-muted">{categoryLabel}</p>
        <Link href={`/news/${post.slug}`} className="group mt-2 block">
          <h3 className="line-clamp-2 text-base font-semibold transition-colors group-hover:text-paseo-dark">{post.title}</h3>
        </Link>
        {postDate ? <p className="mt-2 text-xs text-muted">{postDate}</p> : null}
        {excerpt ? <p className="mt-3 line-clamp-4 flex-1 text-sm leading-6 text-muted">{excerpt}</p> : null}
        <Link
          href={`/news/${post.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-paseo-dark transition-colors hover:text-paseo"
        >
          อ่านเพิ่มเติม
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
