import { revalidatePath } from "next/cache";

export function revalidateBannerPages(data: {
  showOnHome?: boolean;
  showOnBranch1?: boolean;
  showOnBranch2?: boolean;
  showOnBranch3?: boolean;
  showOnAbout?: boolean;
}) {
  if (data.showOnHome) {
    revalidatePath("/");
  }

  if (data.showOnAbout) {
    revalidatePath("/about");
  }

  if (data.showOnBranch1 || data.showOnBranch2 || data.showOnBranch3) {
    revalidatePath("/branches/mall");
    revalidatePath("/branches/park");
    revalidatePath("/branches/town");
  }
}

export function revalidateAllBannerPages() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/branches/mall");
  revalidatePath("/branches/park");
  revalidatePath("/branches/town");
}
