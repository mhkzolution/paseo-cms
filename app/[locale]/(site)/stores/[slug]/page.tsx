import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoreSingleContent } from "@/features/stores/store-single-content";
import { getStoreBySlug } from "@/lib/stores";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

interface StorePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; branch?: string }>;
}

export async function generateStaticParams() {
  const stores = await prisma.store.findMany({
    where: { deletedAt: null },
    select: { slug: true },
    take: 1000,
  });

  return stores.map((store) => ({ slug: store.slug }));
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) return {};

  return {
    title: store.name,
    description: store.description ?? `ข้อมูลร้าน ${store.name} ที่ ${store.branch.name}`,
    openGraph: store.cover
      ? {
          images: [{ url: store.cover, alt: store.name }],
        }
      : undefined,
  };
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { slug } = await params;
  const { category, branch } = await searchParams;
  const store = await getStoreBySlug(slug);

  if (!store) notFound();

  return (
    <StoreSingleContent
      store={store}
      listingQuery={{
        category,
        branch,
      }}
    />
  );
}
