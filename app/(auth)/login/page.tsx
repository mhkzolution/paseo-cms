import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/login-form";
import { LoginLayout } from "@/features/auth/login-layout";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const settings = await getSettings(["siteName", "siteLogo"] as const, DEFAULT_SETTINGS);

  return (
    <LoginLayout
      siteName={settings.siteName}
      siteLogo={settings.siteLogo || undefined}
    >
      <LoginForm />
    </LoginLayout>
  );
}
