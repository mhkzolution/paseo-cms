import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { RoleBadge } from "@/components/admin/role-badge";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";
import type { AppRole } from "@/types";

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  SUPER_ADMIN: "Full access, including Users, Roles, and Settings.",
  ADMIN: "Manages all content and users, except system Settings.",
  EDITOR: "Creates and publishes content across all modules.",
  MARKETING: "Manages Promotions, Events, and Gallery.",
  VIEWER: "Read-only access to the dashboard and content.",
};

// Capability matrix is fixed for now since DATABASE.md has no roles/permissions
// table — roles live as an enum on User. If granular, editable permissions are
// needed later, this is the natural place to introduce a `permissions` table.
const MODULES = ["Posts/News", "Events & Promotions", "Stores & Branches", "Users", "Settings"];

const CAPABILITY_MATRIX: Record<AppRole, boolean[]> = {
  SUPER_ADMIN: [true, true, true, true, true],
  ADMIN: [true, true, true, true, false],
  EDITOR: [true, true, true, false, false],
  MARKETING: [false, true, false, false, false],
  VIEWER: [false, false, false, false, false],
};

const ALL_ROLES: AppRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING", "VIEWER"];

export default async function RolesPage() {
  await requireModuleAccess("roles");

  const counts = await prisma.user.groupBy({
    by: ["role"],
    where: { deletedAt: null },
    _count: true,
  });

  const countByRole = new Map(counts.map((row) => [row.role, row._count]));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Roles"
        description="Roles are fixed system-wide. Assign them to people from the Users page."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_ROLES.map((role) => (
          <div key={role} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <RoleBadge role={role} />
              <span className="text-sm text-muted">{countByRole.get(role) ?? 0} people</span>
            </div>
            <p className="mt-3 text-sm text-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        ))}
      </div>

      <AdminTableShell minWidth="36rem">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Module</th>
              {ALL_ROLES.map((role) => (
                <th key={role} className="px-4 py-3 font-medium">
                  {role.replace("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MODULES.map((module, moduleIndex) => (
              <tr key={module}>
                <td className="px-4 py-3 font-medium text-foreground">{module}</td>
                {ALL_ROLES.map((role) => (
                  <td key={role} className="px-4 py-3">
                    {CAPABILITY_MATRIX[role][moduleIndex] ? (
                      <span className="text-accent">✓</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
