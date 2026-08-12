import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { notFound, permanentRedirect } from "next/navigation";

import { EventCard } from "@/features/events/event-card";
import { StoreCard } from "@/features/stores/store-archive-section";
import { formatPostKindLabel } from "@/lib/post-archives";
import { buildTagHref, getContentByTagSlug } from "@/lib/tags";
import type { ArchivePromotion } from "@/lib/promotions";

export const revalidate = 300;

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

function decodeSlugParam(value: string) {
  try {
    return decodeURIComponent(value).normalize("NFC");
  } catch {
    return value.normalize("NFC");
  }
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentByTagSlug(slug);
  if (!content) return {};

  return {
    title: `#${content.tag.name}`,
    description: content.tag.description || `เนื้อหาที่มีแท็ก ${content.tag.name}`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug: rawSlug } = await params;
  const content = await getContentByTagSlug(rawSlug);
  if (!content) notFound();

  const requestSlug = decodeSlugParam(rawSlug);
  if (requestSlug !== content.tag.slug) {
    permanentRedirect(buildTagHref(content.tag.slug));
  }

  const { tag, posts, stores, events, promotions } = content;
  const sections = [
    { id: "news", label: "ข่าว", count: posts.length },
    { id: "stores", label: "ร้านค้า", count: stores.length },
    { id: "events", label: "Event", count: events.length },
    { id: "promotions", label: "Promotion", count: promotions.length },
  ].filter((section) => section.count > 0);

  const hasAny = sections.length > 0;

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground">
      <section className="border-b border-border bg-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-paseo">Tag</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">#{tag.name}</h1>
          {tag.description ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">{tag.description}</p>
          ) : hasAny ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              รวมเนื้อหาที่ใช้แท็กนี้ แยกตามประเภท
            </p>
          ) : null}

          {sections.length ? (
            <nav className="mt-8 flex flex-wrap gap-2" aria-label="ประเภทเนื้อหา">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-paseo hover:text-paseo-dark"
                >
                  {section.label}
                  <span className="ml-1.5 text-xs tabular-nums opacity-70">{section.count}</span>
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-14 px-5 py-12 sm:px-8 sm:py-16">
        {posts.length ? (
          <TagSection id="news" title="ข่าว" count={posts.length}>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
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
                  ) : null}
                  <article className="p-5">
                    <p className="text-xs font-medium uppercase text-muted">
                      {formatPostKindLabel(post.kind)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
                    {post.excerpt ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{post.excerpt}</p>
                    ) : null}
                  </article>
                </Link>
              ))}
            </div>
          </TagSection>
        ) : null}

        {stores.length ? (
          <TagSection id="stores" title="ร้านค้า" count={stores.length}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={{
                    id: store.id,
                    name: store.name,
                    slug: store.slug,
                    logo: store.logo,
                    cover: store.cover,
                    operatingHours: store.operatingHours,
                    category: store.category,
                    branchName: store.branch.name,
                    branch: store.branch,
                  }}
                />
              ))}
            </div>
          </TagSection>
        ) : null}

        {events.length ? (
          <TagSection id="events" title="Event" count={events.length}>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} imageClassName="rounded-xl" />
              ))}
            </div>
          </TagSection>
        ) : null}

        {promotions.length ? (
          <TagSection id="promotions" title="Promotion" count={promotions.length}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promotion) => (
                <PromotionCard key={promotion.id} promotion={promotion} />
              ))}
            </div>
          </TagSection>
        ) : null}
      </div>
    </main>
  );
}

function TagSection({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <span className="text-sm text-muted">{count} รายการ</span>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function PromotionCard({ promotion }: { promotion: ArchivePromotion }) {
  return (
    <Link
      href={`/promotions/${promotion.slug}`}
      className="group relative block aspect-square overflow-hidden rounded-lg bg-[#1a1a18]"
    >
      {promotion.featuredImage ? (
        <Image
          src={promotion.featuredImage}
          alt={promotion.coverImageAlt || promotion.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#262421] p-6 text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-white">{promotion.title}</span>
        </div>
      )}
      <span className="sr-only">{promotion.title}</span>
    </Link>
  );
}
