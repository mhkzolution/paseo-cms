"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Facebook, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface ShareMenuProps {
  url: string;
  title: string;
  className?: string;
  variant?: "menu" | "inline";
  /** Dropdown alignment relative to the trigger button */
  align?: "start" | "end" | "center";
  ariaLabel?: string;
}

function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.039 1.085l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ShareMenu({
  url,
  title,
  className,
  variant = "menu",
  align = "end",
  ariaLabel = "แชร์เนื้อหานี้",
}: ShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const items = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
    },
    {
      label: "Line",
      href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      icon: LineIcon,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: XIcon,
    },
  ] as const;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>
        <span className="mr-1 text-sm text-muted">แชร์</span>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`แชร์บน ${item.label}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.1] bg-white text-foreground transition-colors hover:border-paseo-dark hover:text-paseo-dark"
            >
              <Icon className="h-4 w-4 shrink-0" />
            </a>
          );
        })}
        <button
          type="button"
          onClick={copyLink}
          aria-label={copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์"}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-black/[0.1] bg-white px-3 text-sm font-medium text-foreground transition-colors hover:border-paseo-dark hover:text-paseo-dark"
        >
          {copied ? <Check className="h-4 w-4 shrink-0 text-paseo-dark" /> : <Copy className="h-4 w-4 shrink-0" />}
          {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition-colors hover:border-paseo hover:text-paseo-dark"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
      >
        <Share2 className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-2 min-w-[180px] max-w-[min(180px,calc(100vw-2.5rem))] rounded-xl border border-border bg-white p-2 shadow-lg",
            align === "end" && "right-0 left-auto",
            align === "start" && "left-0 right-auto",
            align === "center" && "left-1/2 right-auto -translate-x-1/2",
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-background"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </a>
            );
          })}
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-background"
          >
            {copied ? <Check className="h-4 w-4 shrink-0 text-paseo-dark" /> : <Copy className="h-4 w-4 shrink-0" />}
            {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
