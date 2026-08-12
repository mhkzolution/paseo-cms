import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { auth } from "@/lib/auth";
import { getSiteBranding } from "@/lib/site-branding";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const branding = await getSiteBranding();

  return (
    <AdminShell role={session.user.role} userName={session.user.name} branding={branding}>
      {children}
    </AdminShell>
  );
}
