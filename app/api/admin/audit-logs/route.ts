import { NextResponse } from "next/server";

import { listAuditLogs, parseAuditLogsListQuery } from "@/lib/audit-logs-query";
import { forbiddenError } from "@/lib/content-api";
import { checkModuleAccess } from "@/lib/rbac";

export async function GET(request: Request) {
  const { authorized, status } = await checkModuleAccess("audit-logs");
  if (!authorized) return forbiddenError(status);

  const url = new URL(request.url);
  const query = parseAuditLogsListQuery(Object.fromEntries(url.searchParams));
  const result = await listAuditLogs(query);
  return NextResponse.json(result);
}
