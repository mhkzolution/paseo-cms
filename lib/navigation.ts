export type NavItem = {
  labelKey:
    | "branchMall"
    | "branchTown"
    | "branchPark"
    | "stores"
    | "about"
    | "news"
    | "leasing";
  href: string;
};

export const SITE_NAV_ITEMS: NavItem[] = [
  { labelKey: "branchMall", href: "/branches/mall" },
  { labelKey: "branchTown", href: "/branches/town" },
  { labelKey: "branchPark", href: "/branches/park" },
  { labelKey: "stores", href: "/stores?branch=park" },
  { labelKey: "about", href: "/about" },
  { labelKey: "news", href: "/news" },
  { labelKey: "leasing", href: "/leasing" },
];
