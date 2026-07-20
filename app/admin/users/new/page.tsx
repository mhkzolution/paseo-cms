import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/rbac";
import { UserForm } from "@/features/users/user-form";

export default async function NewUserPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

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
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Add user</h1>
      </div>

      <UserForm mode="create" />
    </div>
  );
}
