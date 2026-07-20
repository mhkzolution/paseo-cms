import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { checkRole } from "@/lib/rbac";
import { leasingSchema } from "@/validators/content.validator";

const LEASING_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] as const;

export async function GET() {
  const { authorized, status } = await checkRole([...LEASING_ROLES]);
  if (!authorized) return forbiddenError(status);

  const submissions = await prisma.leasingSubmission.findMany({
    where: { deletedAt: null },
    include: {
      branch: {
        select: { id: true, name: true, nameTh: true, nameEn: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  const parsed = leasingSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const { recaptchaToken, ...data } = parsed.data;
  const recaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaValid) {
    return NextResponse.json({ error: "การยืนยัน reCAPTCHA ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 422 });
  }

  const branch = await prisma.branch.findFirst({
    where: { id: data.branchId, deletedAt: null },
    select: { id: true },
  });
  if (!branch) {
    return NextResponse.json({ error: "ไม่พบสาขาที่เลือก" }, { status: 422 });
  }

  const submission = await prisma.leasingSubmission.create({ data });

  return NextResponse.json({ submission }, { status: 201 });
}
