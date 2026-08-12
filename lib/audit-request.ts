import { headers } from "next/headers";

import type { AuditRequestContext } from "@/lib/audit-log";

export async function getAuditRequestContext(): Promise<AuditRequestContext> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null;
  const userAgent = headerStore.get("user-agent");

  return {
    ipAddress,
    userAgent,
  };
}
