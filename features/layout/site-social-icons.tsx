import type { ComponentType } from "react";
import { FaFacebookSquare, FaLine } from "react-icons/fa";
import { FaSquareInstagram, FaTiktok } from "react-icons/fa6";

import { cn } from "@/lib/utils";

export type SiteSocialLinks = {
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  lineUrl?: string;
};

const SOCIAL_ICON_ITEMS = [
  { key: "facebookUrl", label: "Facebook", Icon: FaFacebookSquare },
  { key: "instagramUrl", label: "Instagram", Icon: FaSquareInstagram },
  { key: "tiktokUrl", label: "TikTok", Icon: FaTiktok },
  { key: "lineUrl", label: "LINE", Icon: FaLine },
] as const satisfies ReadonlyArray<{
  key: keyof SiteSocialLinks;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}>;

type SiteSocialIconsProps = {
  links: SiteSocialLinks;
  className?: string;
  iconClassName?: string;
};

export function SiteSocialIcons({ links, className, iconClassName = "h-[18px] w-[18px]" }: SiteSocialIconsProps) {
  const items = SOCIAL_ICON_ITEMS.filter((item) => links[item.key]?.trim());

  if (!items.length) return null;

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Social media">
      {items.map(({ key, label, Icon }) => {
        const href = links[key]?.trim();
        if (!href) return null;

        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="inline-flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:text-paseo-dark"
          >
            <Icon className={iconClassName} aria-hidden />
          </a>
        );
      })}
    </nav>
  );
}
