import { notFound } from "next/navigation";

import { MallPage } from "@/features/branches/mall/mall-page";
import { getBranchPageData } from "@/lib/branches/get-branch-page-data";

export default async function MallBranchPage() {
  const data = await getBranchPageData("mall");
  if (!data) notFound();
  return <MallPage data={data} />;
}
