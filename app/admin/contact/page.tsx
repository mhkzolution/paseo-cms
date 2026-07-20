import { Inbox } from "lucide-react";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { ContactStatusSelect } from "@/features/contact/contact-status-select";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function ContactPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  const submissions = await prisma.contactSubmission.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Contact"
        description="Review website contact form submissions and manage follow-up status."
      />

      {submissions.length === 0 ? (
        <EmptyState icon={Inbox} title="No contact messages" description="New website messages will appear here." />
      ) : (
        <AdminTableShell minWidth="48rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Sender</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((submission) => (
                <tr key={submission.id} className="align-top">
                  <td className="max-w-lg px-4 py-3">
                    <p className="font-medium text-foreground">{submission.subject}</p>
                    <p className="mt-1 line-clamp-3 text-muted">{submission.message}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <p className="text-foreground">{submission.name}</p>
                    <a href={`mailto:${submission.email}`} className="hover:text-accent">
                      {submission.email}
                    </a>
                    {submission.phone ? <p>{submission.phone}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <ContactStatusSelect id={submission.id} status={submission.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(submission.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteResourceButton endpoint={`/api/contact/${submission.id}`} label={submission.subject} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      )}
    </div>
  );
}
