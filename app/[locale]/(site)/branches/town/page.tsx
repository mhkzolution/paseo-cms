import { notFound } from "next/navigation";

import { TownPage } from "@/features/branches/town/town-page";
import { getBranchPageData } from "@/lib/branches/get-branch-page-data";

export default async function TownBranchPage() {
  const data = await getBranchPageData("town");
  if (!data) notFound();
  return <TownPage data={data} />;
}
