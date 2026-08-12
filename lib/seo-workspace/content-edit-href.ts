import type { WorkspaceContentType } from "@/lib/seo-workspace/types";

export function getWorkspaceContentEditHref(contentType: WorkspaceContentType, id: string): string {
  switch (contentType) {
    case "post":
      return `/admin/posts/${id}/edit?tab=seo`;
    case "event":
      return `/admin/events/${id}/edit?tab=seo`;
    case "promotion":
      return `/admin/promotions/${id}/edit?tab=seo`;
  }
}

export function buildIssueDeepLink(checkId: string): string {
  return `/admin/seo/workspace?issue=${encodeURIComponent(checkId)}`;
}
