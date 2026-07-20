import { redirect } from "next/navigation";

export default function LegacyNewBannerPage() {
  redirect("/admin/banners/site/new");
}
