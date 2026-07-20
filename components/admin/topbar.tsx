"use client";

import Link from "next/link";
import { Home, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TopbarProps {
  userName?: string | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ userName, sidebarOpen, onToggleSidebar }: TopbarProps) {
  const handleSignOut = async () => {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:h-16 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-paseo-hover hover:text-paseo-dark"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
          )}
        </button>

        <p className="truncate text-sm text-muted">
          {userName ? (
            <>
              <span className="hidden sm:inline">Signed in as </span>
              <span className="font-medium text-paseo-dark">{userName}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-paseo-hover hover:text-paseo-dark sm:px-4"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">หน้าหลัก</span>
        </Link>

        <Button
          variant="ghost"
          className="px-2 hover:bg-paseo-hover hover:text-paseo-dark sm:px-4"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
