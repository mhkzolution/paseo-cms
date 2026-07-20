import {
  Newspaper,
  CalendarDays,
  Tag,
  Store,
  FolderOpen,
  Users,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/admin/stat-card";

export default async function DashboardPage() {
  const session = await auth();

  const [postCount, eventCount, promotionCount, storeCount, mediaCount, userCount] = await Promise.all([
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.event.count({ where: { deletedAt: null } }),
      prisma.promotion.count({ where: { deletedAt: null } }),
      prisma.store.count({ where: { deletedAt: null } }),
      prisma.media.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);

  const stats = [
    { label: "Posts & News", value: postCount, icon: Newspaper },
    { label: "Events", value: eventCount, icon: CalendarDays },
    { label: "Promotions", value: promotionCount, icon: Tag },
    { label: "Stores", value: storeCount, icon: Store },
    { label: "Media files", value: mediaCount, icon: FolderOpen },
    { label: "Users", value: userCount, icon: Users },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}
