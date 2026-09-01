import { NextResponse } from "next/server";

import { getPublishedThePaseoLifePosts } from "@/lib/thepaseolife";

export async function GET() {
  const items = await getPublishedThePaseoLifePosts();
  return NextResponse.json({ items });
}
