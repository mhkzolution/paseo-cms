import Link from "next/link";
import { CalendarDays, Plus, Tag } from "lucide-react";

type DashboardHeaderProps = {
  userName?: string | null;
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">
          {userName ? `Welcome back, ${userName}. ` : ""}
          ตอนนี้เนื้อหาในระบบเป็นอย่างไร และมีอะไรต้องสนใจไหม?
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/posts/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-paseo px-4 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Post
        </Link>
        <Link
          href="/admin/events/new"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-background"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Create Event
        </Link>
        <Link
          href="/admin/promotions/new"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-background"
        >
          <Tag className="h-4 w-4" aria-hidden="true" />
          Create Promotion
        </Link>
      </div>
    </header>
  );
}
