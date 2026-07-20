import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BannerForm } from "@/features/banners/banner-form";
import { BANNER_SCOPE_LABELS, getBranchPlacementLabels, type BannerScope } from "@/lib/banners";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const EMPTY_SITE_BANNER = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  linkUrl: "",
  linkLabel: "",
  showOnHome: false,
  showOnBranch1: false,
  showOnBranch2: false,
  showOnBranch3: false,
  showOnAbout: false,
  sortOrder: 0,
  isActive: true,
} as const;

const EMPTY_ABOUT_BANNER = {
  ...EMPTY_SITE_BANNER,
  showOnAbout: true,
} as const;

interface NewBannerPageProps {
  scope: BannerScope;
}

export async function NewBannerPageContent({ scope }: NewBannerPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);
  const branchLabels = scope === "site" ? await getBranchPlacementLabels() : undefined;
  const baseHref = `/admin/banners/${scope}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={baseHref} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to banners
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Add banner — {BANNER_SCOPE_LABELS[scope]}
        </h1>
      </div>

      <BannerForm
        mode="create"
        scope={scope}
        endpoint="/api/banners"
        returnHref={baseHref}
        submitLabel="Create banner"
        defaultValues={scope === "site" ? EMPTY_SITE_BANNER : EMPTY_ABOUT_BANNER}
        branchLabels={branchLabels}
      />
    </div>
  );
}

interface EditBannerPageProps {
  scope: BannerScope;
  id: string;
}

export async function EditBannerPageContent({ scope, id }: EditBannerPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  const [item, branchLabels] = await Promise.all([
    prisma.banner.findFirst({ where: { id, deletedAt: null } }),
    scope === "site" ? getBranchPlacementLabels() : Promise.resolve(undefined),
  ]);

  if (!item) {
    redirect(`/admin/banners/${scope}`);
  }

  const belongsToScope =
    scope === "about"
      ? item.showOnAbout
      : item.showOnHome || item.showOnBranch1 || item.showOnBranch2 || item.showOnBranch3;
  if (!belongsToScope) {
    redirect(`/admin/banners/${scope}`);
  }

  const baseHref = `/admin/banners/${scope}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={baseHref} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to banners
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Edit banner — {BANNER_SCOPE_LABELS[scope]}
        </h1>
      </div>

      <BannerForm
        mode="edit"
        scope={scope}
        endpoint={`/api/banners/${item.id}`}
        returnHref={baseHref}
        submitLabel="Save changes"
        branchLabels={branchLabels}
        defaultValues={{
          title: item.title,
          subtitle: item.subtitle ?? "",
          description: item.description ?? "",
          image: item.image,
          linkUrl: item.linkUrl ?? "",
          linkLabel: item.linkLabel ?? "",
          showOnHome: item.showOnHome,
          showOnBranch1: item.showOnBranch1,
          showOnBranch2: item.showOnBranch2,
          showOnBranch3: item.showOnBranch3,
          showOnAbout: item.showOnAbout,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        }}
      />
    </div>
  );
}
