import { requireModuleAccess } from "@/lib/rbac";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleAccess("audit-logs");
  const params = await searchParams;
  void params; // wired in Task 3

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-sm font-medium text-muted">System</div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted">Review who changed what across the CMS.</p>
      </div>
      <p className="text-sm text-muted">Coming next: filters and table.</p>
    </div>
  );
}
