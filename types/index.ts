import type { LucideIcon } from "lucide-react";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "MARKETING" | "VIEWER";

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  roles?: AppRole[];
  children?: NavChildItem[];
}

export interface NavChildItem {
  label: string;
  href: string;
  roles?: AppRole[];
}
