import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { UserForm } from "@/features/users/user-form";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const { id } = await params;
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });

  if (!user) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to users
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit user</h1>
      </div>

      <UserForm
        mode="edit"
        userId={user.id}
        defaultValues={{
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        }}
      />
    </div>
  );
}
