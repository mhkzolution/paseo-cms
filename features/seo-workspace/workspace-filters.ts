import type { AttentionItem, WorkspaceContentType, WorkspaceScoreBand } from "@/lib/seo-workspace/types";

export type WorkspaceFilterState = {
  types: WorkspaceContentType[];
  band: WorkspaceScoreBand | "all";
  category: string;
  branch: string;
  tag: string;
  issue: string;
};

export type WorkspaceFilterOption = {
  value: string;
  label: string;
};

export const DEFAULT_WORKSPACE_FILTERS: WorkspaceFilterState = {
  types: ["post", "event", "promotion"],
  band: "all",
  category: "",
  branch: "",
  tag: "",
  issue: "",
};

export function parseWorkspaceFilters(searchParams: URLSearchParams): WorkspaceFilterState {
  const typesParam = searchParams.get("types");
  const parsedTypes = typesParam
    ? typesParam
        .split(",")
        .filter(
          (value): value is WorkspaceContentType =>
            value === "post" || value === "event" || value === "promotion",
        )
    : DEFAULT_WORKSPACE_FILTERS.types;

  const bandParam = searchParams.get("band");
  const band =
    bandParam === "excellent" || bandParam === "good" || bandParam === "needs_attention"
      ? bandParam
      : "all";

  return {
    types: parsedTypes.length > 0 ? parsedTypes : DEFAULT_WORKSPACE_FILTERS.types,
    band,
    category: searchParams.get("category") ?? "",
    branch: searchParams.get("branch") ?? "",
    tag: searchParams.get("tag") ?? "",
    issue: searchParams.get("issue") ?? "",
  };
}

export function filtersToSearchParams(filters: WorkspaceFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.types.length > 0 && filters.types.length < 3) {
    params.set("types", filters.types.join(","));
  }

  if (filters.band !== "all") {
    params.set("band", filters.band);
  }

  if (filters.category) params.set("category", filters.category);
  if (filters.branch) params.set("branch", filters.branch);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.issue) params.set("issue", filters.issue);

  return params;
}

function matchesContentFilters(
  item: Pick<AttentionItem, "contentType" | "scoreBand" | "categoryKey" | "branchIds" | "tagIds" | "failingCheckIds">,
  filters: WorkspaceFilterState,
) {
  if (!filters.types.includes(item.contentType)) return false;
  if (filters.band !== "all" && item.scoreBand !== filters.band) return false;
  if (filters.category && item.categoryKey !== filters.category) return false;
  if (filters.branch && !item.branchIds.includes(filters.branch)) return false;
  if (filters.tag && !item.tagIds.includes(filters.tag)) return false;
  if (filters.issue && !item.failingCheckIds.includes(filters.issue)) return false;

  return true;
}

export function filterAttentionItems(items: AttentionItem[], filters: WorkspaceFilterState) {
  return items.filter((item) => matchesContentFilters(item, filters));
}

export function countActiveFilters(filters: WorkspaceFilterState) {
  let count = 0;

  if (filters.types.length < 3) count += 1;
  if (filters.band !== "all") count += 1;
  if (filters.category) count += 1;
  if (filters.branch) count += 1;
  if (filters.tag) count += 1;
  if (filters.issue) count += 1;

  return count;
}
