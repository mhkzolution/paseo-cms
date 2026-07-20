import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { contactSchema } from "@/validators/content.validator";

const CONTACT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] as const;

export async function GET() {
  const { authorized, status } = await checkRole([...CONTACT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const submissions = await prisma.contactSubmission.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  const parsed = contactSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const submission = await prisma.contactSubmission.create({ data: parsed.data });

  return NextResponse.json({ submission }, { status: 201 });
}
