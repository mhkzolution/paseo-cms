import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { contactStatusSchema } from "@/validators/content.validator";

const CONTACT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...CONTACT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = contactStatusSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const submission = await prisma.contactSubmission.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ submission });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...CONTACT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  await prisma.contactSubmission.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
