import { AdminPageHeader } from "@/components/admin/admin-table";
import { AdminSearch } from "@/features/search/admin-search";
import { requireRole } from "@/lib/rbac";

export default async function SearchPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Search"
        description="Preview public search results across published website content."
      />

      <AdminSearch />
    </div>
  );
}
