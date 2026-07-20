import { notFound } from "next/navigation";

import { ParkPage } from "@/features/branches/park/park-page";
import { getBranchPageData } from "@/lib/branches/get-branch-page-data";

export default async function ParkBranchPage() {
  const data = await getBranchPageData("park");
  if (!data) notFound();
  return <ParkPage data={data} />;
}
