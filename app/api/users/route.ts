import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { checkRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/validators/user.validator";

export async function GET() {
  const { authorized, status } = await checkRole(["SUPER_ADMIN", "ADMIN"]);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkRole(["SUPER_ADMIN", "ADMIN"]);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: { ...parsed.data, password: hashedPassword },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
