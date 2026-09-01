import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/login-form";
import { LoginLayout } from "@/features/auth/login-layout";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Sign in",
};

async function getLoginBrandStats() {
  try {
    const [branches, stores, events, promotions] = await Promise.all([
      prisma.branch.count({ where: { deletedAt: null } }),
      prisma.store.count({ where: { deletedAt: null } }),
      prisma.event.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
      prisma.promotion.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    ]);

    return {
      branches,
      stores,
      campaigns: events + promotions,
    };
  } catch {
    return { branches: 9, stores: 500, campaigns: 100 };
  }
}

export default async function LoginPage() {
  const [settings, stats] = await Promise.all([
    getSettings(["siteName", "siteLogo"] as const, DEFAULT_SETTINGS),
    getLoginBrandStats(),
  ]);

  return (
    <LoginLayout
      siteName={settings.siteName}
      siteLogo={settings.siteLogo || undefined}
      stats={stats}
    >
      <LoginForm />
    </LoginLayout>
  );
}
