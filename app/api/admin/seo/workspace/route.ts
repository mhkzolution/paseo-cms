import { NextResponse } from "next/server";

import { forbiddenError } from "@/lib/content-api";
import { getWorkspaceSnapshot } from "@/lib/seo-workspace/get-workspace-snapshot";
import { checkModuleAccess } from "@/lib/rbac";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("seo");
  if (!authorized) return forbiddenError(status);

  const snapshot = await getWorkspaceSnapshot();
  return NextResponse.json(snapshot);
}
