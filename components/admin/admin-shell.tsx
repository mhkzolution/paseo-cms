"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import type { SiteBranding } from "@/lib/site-branding";
import type { AppRole } from "@/types";

const STORAGE_KEY = "paseo-admin-sidebar-open";
const MOBILE_MQ = "(max-width: 1023px)";

export function AdminShell({
  role,
  userName,
  branding,
  children,
}: {
  role: AppRole | null;
  userName?: string | null;
  branding: SiteBranding;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);

    const sync = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);

      if (mobile) {
        setOpen(false);
        return;
      }

      const stored = window.localStorage.getItem(STORAGE_KEY);
      setOpen(stored === null ? true : stored === "true");
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [pathname, isMobile]);

  useEffect(() => {
    if (!isMobile || !open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobile, open]);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (!window.matchMedia(MOBILE_MQ).matches) {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {open && isMobile ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] transition-opacity lg:hidden"
          onClick={close}
        />
      ) : null}

      <Sidebar role={role} branding={branding} open={open} isMobile={isMobile} onClose={close} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar userName={userName} sidebarOpen={open} onToggleSidebar={toggle} />
        <main className="scrollbar-paseo min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
