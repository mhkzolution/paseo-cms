import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { PostKind } from "@prisma/client";

import { POST_KIND_LABELS, POST_KIND_ORDER, formatPostKindLabel } from "@/lib/post-archives";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

interface NewsPageProps {
  searchParams: Promise<{ kind?: string; branch?: string }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { kind, branch: branchSlug } = await searchParams;
  const t = await getTranslations("news");
  const selectedKind = POST_KIND_ORDER.includes(kind as PostKind) ? (kind as PostKind) : null;

  const branch = branchSlug
    ? await prisma.branch.findFirst({ where: { slug: branchSlug, deletedAt: null }, select: { id: true, name: true, slug: true } })
    : null;

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      status: "PUBLISHED",
      ...(selectedKind ? { kind: selectedKind } : {}),
      AND: [
        { OR: [{ seo: null }, { seo: { is: { noindex: false } } }] },
        ...(branch
          ? [{ OR: [{ branches: { some: { branchId: branch.id } } }, { branches: { none: {} } }] }]
          : []),
      ],
    },
    include: { category: true, seo: true, tags: { include: { tag: true } } },
    orderBy: { publishedAt: "desc" },
    take: 24,
  });

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground">
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-paseo">{t("title")}</p>
          <h1 className="mt-2 text-4xl font-semibold">
            {branch ? t("storiesFrom", { name: branch.name }) : t("storiesDefault")}
          </h1>
          {selectedKind ? (
            <p className="mt-3 text-sm text-muted">หมวด: {POST_KIND_LABELS[selectedKind]}</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <FilterLink href="/news" active={!selectedKind && !branch} label="ทั้งหมด" />
          {POST_KIND_ORDER.map((kindValue) => (
            <FilterLink
              key={kindValue}
              href={buildNewsHref({ kind: kindValue, branch: branch?.slug })}
              active={selectedKind === kindValue}
              label={POST_KIND_LABELS[kindValue]}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/news/${post.slug}`} className="overflow-hidden rounded-lg border border-border bg-white hover:border-paseo">
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
                <p className="text-xs font-medium uppercase text-muted">{post.category?.name ?? formatPostKindLabel(post.kind)}</p>
                <h2 className="mt-2 text-lg font-semibold">{post.title}</h2>
                {post.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{post.excerpt}</p> : null}
              </article>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function buildNewsHref({ kind, branch }: { kind?: PostKind; branch?: string }) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (branch) params.set("branch", branch);
  const query = params.toString();
  return query ? `/news?${query}` : "/news";
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-paseo px-3 py-1.5 text-sm font-medium text-white"
          : "rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:border-paseo"
      }
    >
      {label}
    </Link>
  );
}
