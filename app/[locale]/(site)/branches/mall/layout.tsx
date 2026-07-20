import type { CSSProperties, ReactNode } from "react";

import { getBranchConfig } from "@/lib/branches/branch-config";

const { theme } = getBranchConfig("mall");

export default function MallLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={
        {
          "--branch-primary": theme.primary,
          "--branch-primary-foreground": theme.primaryForeground,
          "--branch-background": theme.background,
          "--branch-accent": theme.accent,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
