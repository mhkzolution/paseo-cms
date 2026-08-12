import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { PostKind } from "@prisma/client";

import { HomeNewsSection } from "@/features/home/home-news-section";
import { POST_KIND_LABELS, POST_KIND_ORDER } from "@/lib/post-archives";
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
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      coverImageAlt: true,
      kind: true,
      publishedAt: true,
      category: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 24,
  });

  return (
    <main className="min-h-screen bg-white text-foreground">
      <section className="mx-auto w-full max-w-7xl px-5 pt-12 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">{t("title")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
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
      </section>

      <HomeNewsSection posts={posts} showViewAll={false} showHeading={false} variant="compact" className="pt-6" />
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
