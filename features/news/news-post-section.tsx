import type { PostKind } from "@prisma/client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { ShareMenu } from "@/features/events/share-menu";
import { formatDate, formatTime } from "@/lib/datetime-server";
import { formatPostKindLabel } from "@/lib/post-archives";
import { CONTENT_PROSE_CLASS } from "@/lib/content-prose";
import { buildTagHref } from "@/lib/tags";
import { cn } from "@/lib/utils";

export type NewsPostTag = {
  name: string;
  slug: string;
};

export type NewsPostSectionData = {
  title: string;
  h1: string | null;
  subtitle: string | null;
  content: string;
  featuredImage: string | null;
  coverImageAlt: string | null;
  coverImageCaption: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
  kind: PostKind;
  locationLabel: string;
  shareUrl: string;
  tags: NewsPostTag[];
};

type NewsPostSectionProps = {
  post: NewsPostSectionData;
};

export async function NewsPostSection({ post }: NewsPostSectionProps) {
  const publishedDate = post.publishedAt ?? post.createdAt;
  const [dateLabel, timeLabel] = await Promise.all([
    formatDate(publishedDate),
    formatTime(publishedDate),
  ]);
  const categoryLabel = formatPostKindLabel(post.kind);

  return (
    <article className="mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8 sm:py-12 lg:py-16">
      <header className="relative">
        <div className="min-w-0 text-center sm:pr-14 sm:text-left">
          <h1 className="text-[2rem] font-semibold leading-[1.15] tracking-[-0.035em] text-foreground sm:text-4xl sm:leading-[1.12] lg:text-5xl">
            {post.title}
          </h1>

          <p className="mt-4 text-sm leading-6 text-muted sm:text-base">
            <span>{dateLabel}</span>
            <span aria-hidden="true"> · </span>
            <span>{timeLabel}</span>
            {post.locationLabel ? (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-semibold text-paseo">{post.locationLabel}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="relative z-30 mt-5 flex justify-center sm:hidden">
          <ShareMenu
            url={post.shareUrl}
            title={post.title}
            ariaLabel="แชร์บทความนี้"
            align="center"
          />
        </div>

        <div className="absolute right-0 top-0 z-30 hidden sm:block">
          <ShareMenu
            url={post.shareUrl}
            title={post.title}
            ariaLabel="แชร์บทความนี้"
            align="end"
          />
        </div>
      </header>

      {post.featuredImage ? (
        <figure className="mt-8 sm:mt-10">
          <div className="relative aspect-[1000/751] w-full overflow-hidden bg-[#F3F1EC]">
            <Image
              src={post.featuredImage}
              alt={post.coverImageAlt || post.title}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1200px) 1100px, 100vw"
            />
          </div>

          {post.coverImageCaption ? (
            <figcaption className="mt-3 text-xs leading-5 text-muted">
              {post.coverImageCaption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <section className="mt-4 border-t border-black/[0.1] pt-4 sm:mt-12 sm:pt-12">
        {post.subtitle ? (
          <h2 className="max-w-3xl text-3xl font-semibold leading-[1.4] tracking-[-0.025em] text-foreground sm:text-3xl sm:leading-[1.35]">
            {post.subtitle}
          </h2>
        ) : null}

        <div
          className={cn(CONTENT_PROSE_CLASS, "mt-8 text-foreground")}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <footer className="mt-12 border-t border-black/[0.1] pt-6">
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
            {post.authorName ? (
              <div className="flex items-center gap-2">
                <dt className="font-medium text-foreground">ผู้เขียน</dt>
                <dd>{post.authorName}</dd>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <dt className="font-medium text-foreground">วันที่โพส</dt>
              <dd>
                <time dateTime={publishedDate.toISOString()}>{dateLabel}</time>
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="font-medium text-foreground">หมวดหมู่</dt>
              <dd>{categoryLabel}</dd>
            </div>
          </dl>

          {post.tags.length ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">แท็ก</span>
              {post.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={buildTagHref(tag.slug)}
                  className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-paseo hover:text-paseo-dark"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          ) : null}
        </footer>
      </section>
    </article>
  );
}
