import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

import type { ArchivePost } from "@/lib/post-archives";
import { formatPostKindLabel } from "@/lib/post-archives";

interface PostCardProps {
  post: ArchivePost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="overflow-hidden rounded-lg border border-border bg-white transition-colors hover:border-paseo"
    >
      {post.featuredImage ? (
        <div className="relative aspect-[16/10]">
          <Image
            src={post.featuredImage}
            alt={post.coverImageAlt || post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-background text-sm text-muted">No image</div>
      )}
      <article className="p-4">
        <p className="text-xs font-medium uppercase text-muted">{post.category?.name ?? formatPostKindLabel(post.kind)}</p>
        <h3 className="mt-2 line-clamp-2 text-base font-semibold">{post.title}</h3>
        {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{post.excerpt}</p> : null}
      </article>
    </Link>
  );
}

interface PostArchiveSectionsProps {
  archives: Array<{
    key: string;
    label: string;
    kind: string;
    posts: ArchivePost[];
  }>;
  viewAllHref?: string;
  className?: string;
}

export function PostArchiveSections({ archives, viewAllHref = "/news", className }: PostArchiveSectionsProps) {
  if (!archives.length) return null;

  return (
    <div className={className}>
      {archives.map((archive) => (
        <section key={archive.key} className="grid gap-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold uppercase text-paseo">{archive.label}</p>
            </div>
            <Link
              href={buildViewAllHref(viewAllHref, archive.kind)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-paseo-dark hover:text-paseo"
            >
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archive.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function buildViewAllHref(baseHref: string, kind: string): string {
  const [path, query = ""] = baseHref.split("?");
  const params = new URLSearchParams(query);
  params.set("kind", kind);
  const nextQuery = params.toString();
  return nextQuery ? `${path}?${nextQuery}` : (path || "/news");
}
