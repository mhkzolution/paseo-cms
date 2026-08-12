import { AdminTableShell } from "@/components/admin/admin-table";

const SKELETON_ROWS = 10;

export default function AuditLogsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-4 w-16 animate-pulse rounded bg-border" />
        <div className="h-8 w-48 animate-pulse rounded bg-border" />
        <div className="h-4 w-72 animate-pulse rounded bg-border" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="hidden h-96 w-72 animate-pulse rounded-md border border-border bg-surface lg:block" />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="h-10 w-full max-w-md animate-pulse rounded bg-border" />

          <AdminTableShell minWidth="56rem">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  {Array.from({ length: 7 }).map((_, index) => (
                    <th key={index} className="px-4 py-3">
                      <div className="h-3 w-16 animate-pulse rounded bg-border" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-border" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        </div>
      </div>
    </div>
  );
}
