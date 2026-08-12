import { generateSlug } from "@/lib/seo";

/** Decode URL slug segments and normalize to NFC for consistent DB lookups. */
export function decodeSlugParam(value: string) {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  return decoded.normalize("NFC");
}

function stripMarks(value: string) {
  return value.normalize("NFC").replace(/\p{M}/gu, "");
}

/** Previous slugifier that turned Thai combining marks into hyphens. */
function legacyGenerateSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

/** Compare a stored slug with a request slug, tolerating encoding and legacy variants. */
export function slugMatchesStored(stored: string, requested: string) {
  const storedNfc = stored.normalize("NFC");
  const requestedNfc = requested.normalize("NFC");

  return (
    storedNfc === requestedNfc ||
    generateSlug(requestedNfc) === storedNfc ||
    legacyGenerateSlug(requestedNfc) === storedNfc ||
    stripMarks(storedNfc) === stripMarks(requestedNfc)
  );
}

export function buildEventHref(slug: string) {
  return `/events/${encodeURIComponent(slug)}`;
}

export function buildPostHref(slug: string) {
  return `/news/${encodeURIComponent(slug)}`;
}

export function buildPromotionHref(slug: string) {
  return `/promotions/${encodeURIComponent(slug)}`;
}

type SlugRecord = { id: string; slug: string };

interface SlugLookupClient {
  findFirst(args: {
    where: { slug: string; deletedAt: null; status: "PUBLISHED" };
    select: { id: true; slug: true };
  }): Promise<SlugRecord | null>;
  findMany(args: {
    where: { deletedAt: null; status: "PUBLISHED" };
    select: { id: true; slug: true };
    take?: number;
  }): Promise<SlugRecord[]>;
}

/** Resolve a URL slug to the canonical stored slug (handles encoding + Thai variants). */
export async function resolvePublishedContentSlug(
  client: SlugLookupClient,
  rawSlug: string,
): Promise<string | null> {
  const slug = decodeSlugParam(rawSlug);

  const direct = await client.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED" },
    select: { id: true, slug: true },
  });
  if (direct) return direct.slug;

  const candidates = await client.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    select: { id: true, slug: true },
    take: 1000,
  });

  const matched = candidates.find((item) => slugMatchesStored(item.slug, slug));
  return matched?.slug ?? null;
}
