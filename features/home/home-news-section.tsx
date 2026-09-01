import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import type { ArchivePost } from "@/lib/post-archives";
import { formatPostDate } from "@/lib/post-archives";
import { cn } from "@/lib/utils";

type HomeNewsSectionProps = {
  posts: ArchivePost[];
  className?: string;
  eyebrow?: string;
  title?: string;
  showViewAll?: boolean;
  showHeading?: boolean;
  /** Lighter padding for archive pages (e.g. /news) instead of homepage sections. */
  variant?: "default" | "compact";
};

export function HomeNewsSection({
  posts,
  className,
  eyebrow = "News",
  title = "บทความน่าสนใจ",
  showViewAll = true,
  showHeading = true,
  variant = "default",
}: HomeNewsSectionProps) {
  return (
    <section
      id="news"
      className={cn(
        variant === "compact"
          ? "bg-white pb-10 sm:pb-12"
          : "scroll-mt-[72px] bg-white py-8 sm:py-20 lg:py-24",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {showHeading ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">
              {eyebrow}
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              {title}
            </h2>
          </div>
        ) : null}

        {posts.length ? (
          <>
            {/* Post List */}
            <ul
              className={cn(
                showHeading ? "mt-9" : "mt-0",
                "-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 scrollbar-hidden",
                "sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0",
                "lg:grid-cols-3 lg:gap-x-6",
              )}
            >
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="
                    w-[78vw] max-w-[320px] shrink-0 snap-start
                    sm:w-auto sm:max-w-none
                  "
                >
                  <article className="group">
                    <Link
                      href={`/news/${post.slug}`}
                      className="block"
                    >
                      {/* Image 4:5 */}
                      <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-[#F0EDE8]">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={
                              post.coverImageAlt ||
                              post.title
                            }
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 78vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
                            {post.title}
                          </div>
                        )}

                        {/* Desktop hover arrow */}
                        <div className="absolute right-4 top-4 hidden h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
                          <ArrowRight
                            className="h-4 w-4 -rotate-45 text-foreground"
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pt-5">
                        {/* Date */}
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <CalendarDays
                            className="h-4 w-4 shrink-0 text-paseo-dark"
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />

                          <time dateTime={post.publishedAt?.toISOString()}>
                            {formatPostDate(post.publishedAt)}
                          </time>
                        </div>

                        {/* Title */}
                        <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-paseo-dark sm:text-xl">
                          {post.title}
                        </h3>
                      </div>
                    </Link>
                  </article>
                </li>
              ))}
            </ul>

            {showViewAll ? (
              <div className="mt-12 flex justify-center sm:mt-14">
                <Link
                  href="/news"
                  className="group inline-flex items-center gap-3 rounded-full border border-black/[0.1] bg-white px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:border-paseo-dark/40 hover:bg-paseo-dark hover:text-white"
                >
                  ดูบทความทั้งหมด

                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-9 rounded-2xl bg-[#FCFAF6] px-6 py-12 text-center">
            <p className="text-sm text-muted">
              ยังไม่มีบทความในขณะนี้
            </p>
          </div>
        )}
      </div>
    </section>
  );
}