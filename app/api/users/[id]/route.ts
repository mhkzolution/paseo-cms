import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { checkModuleAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/validators/user.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("users");
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const { password, ...rest } = parsed.data;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status, session } = await checkModuleAccess("users");
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const { id } = await params;

  if (session?.user.id === id) {
    return NextResponse.json({ error: "You can't remove your own account" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
