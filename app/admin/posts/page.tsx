import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Newspaper, Plus } from "lucide-react";

import { ContentStatusBadge } from "@/components/admin/content-status-badge";
import { SeoScoreBadge } from "@/components/admin/seo-score-badge";
import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { formatDate } from "@/lib/format";
import { latestSeoAuditInclude } from "@/lib/seo-audit";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function PostsPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    include: {
      category: true,
      author: true,
      seo: true,
      tags: { include: { tag: true } },
      branches: { include: { branch: true } },
      seoAudits: latestSeoAuditInclude,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Posts & News"
        description="Manage news articles and editorial posts"
        action={
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add post
          </Link>
        }
      />

      {posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No posts yet" description="Create the first news post." />
      ) : (
        <AdminTableShell minWidth="56rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">SEO</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => {
                const audit = post.seoAudits[0];
                return (
                  <tr key={post.id}>
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-16 overflow-hidden rounded-md border border-border bg-background">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.coverImageAlt || post.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted">
                            <ImageIcon className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{post.title}</td>
                    <td className="px-4 py-3 text-muted">{post.author?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      <div>{post.category?.name ?? "Uncategorized"}</div>
                      <div className="text-xs">{formatPostKind(post.kind)}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div className="max-w-56 truncate">
                        {post.branches.length ? post.branches.map((item) => item.branch.name).join(", ") : "All branches"}
                      </div>
                      <div className="text-xs">
                        {post.showOnHome ? "Home" : "Post only"}
                        {post.seo?.noindex ? " · Noindex" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SeoScoreBadge score={audit?.score} readability={audit?.readability} />
                    </td>
                    <td className="px-4 py-3">
                      <ContentStatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(post.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                        >
                          Edit
                        </Link>
                        <DeleteResourceButton endpoint={`/api/posts/${post.id}`} label={post.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AdminTableShell>
      )}
    </div>
  );
}

function formatPostKind(kind: string) {
  const labels: Record<string, string> = {
    NEWS: "ข่าวสาร",
    PUBLIC_RELATIONS: "ประชาสัมพันธ์",
    CENTER_UPDATE: "อัปเดตศูนย์",
    ARTICLE: "บทความ",
  };

  return labels[kind] ?? kind;
}
