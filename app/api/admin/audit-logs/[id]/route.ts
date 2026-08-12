import { NextResponse } from "next/server";

import { getAuditLogById } from "@/lib/audit-logs-query";
import { forbiddenError } from "@/lib/content-api";
import { checkModuleAccess } from "@/lib/rbac";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, status } = await checkModuleAccess("audit-logs");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const row = await getAuditLogById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}
