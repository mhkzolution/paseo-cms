import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { generateSlug } from "../lib/seo";
import {
  createDefaultOperatingHours,
  STORE_DAY_KEYS,
  type StoreDayKey,
  type StoreOperatingHour,
} from "../lib/stores/operating-hours";

const prisma = new PrismaClient();

const SQL_PATH = path.resolve(__dirname, "../../database-paseolife/admin_thepaseo.sql");
const IMAGE_BASE_URL = "https://admin.thepaseo.co.th";
const BATCH_SIZE = 50;

const SKIP_BRANCH_ID = "c7522197-846f-412a-88db-4905bde06911"; // บางนา

const BRANCH_ID_TO_SLUG: Record<string, string> = {
  "701a697c-8b3d-41e2-876d-61b75c6ca1d5": "park",
  "c3842823-8e5b-4868-abc9-1ead064941be": "mall",
  "c7522197-846f-412a-88db-4905bde069ea": "town",
};

const CATEGORY_ID_TO_SLUG: Record<string, string> = {
  "12080905-cb5e-4059-bdc6-e1539ccbdfd0": "food",
  "3addf652-6a44-4142-ae3e-8f55fb0763e9": "street-market",
  "3c77788a-87d7-4ad8-8e0d-afaa777e7e46": "service",
  "68caaabf-e0f1-4ff6-a646-2e956eba8b46": "bank",
  "7339674a-ed06-47fc-b7a4-933c294d4a57": "clinic",
  "735486b8-c908-4821-8211-d32e495fa1c8": "specialty",
  "8644bced-1525-4c37-a9cd-6200cd6f9bd9": "education",
};

const PASEO_DAY_TO_STORE_DAY: StoreDayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

type ParsedShop = {
  id: string;
  name: string;
  logoUrl: string | null;
  imageUrl: string | null;
  description: string | null;
  location: string | null;
  categoryId: string | null;
  branchId: string | null;
  phone: string | null;
  isVisible: boolean;
};

type ParsedShopHour = {
  shopId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

function unquoteSqlValue(value: string): string | null {
  if (value === "NULL") return null;
  if (value.startsWith("'") && value.endsWith("'")) {
    return value
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\n/g, "\n")
      .replace(/\\\\/g, "\\");
  }
  return value;
}

function parseSqlTuple(line: string): string[] {
  const inner = line.trim().replace(/^\(/, "").replace(/\),?$/, "");
  const fields: string[] = [];
  let current = "";
  let inString = false;
  let escaped = false;

  for (const char of inner) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      current += char;
      continue;
    }
    if (char === "'") {
      inString = !inString;
      current += char;
      continue;
    }
    if (char === "," && !inString) {
      fields.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) fields.push(current.trim());
  return fields;
}

function parseShopLines(sql: string): ParsedShop[] {
  const shops: ParsedShop[] = [];
  let inBlock = false;

  for (const line of sql.split("\n")) {
    if (line.startsWith("INSERT INTO `Shop`")) {
      inBlock = true;
      continue;
    }
    if (!inBlock) continue;
    if (line.startsWith("--") || line.startsWith("CREATE TABLE")) {
      inBlock = false;
      continue;
    }
    if (!line.match(/^\('[0-9a-f]{8}-/)) {
      if (line.trim() === ";") inBlock = false;
      continue;
    }

    const fields = parseSqlTuple(line);
    if (fields.length < 14) continue;

    shops.push({
      id: unquoteSqlValue(fields[0]) ?? "",
      name: unquoteSqlValue(fields[1]) ?? "",
      logoUrl: unquoteSqlValue(fields[2]),
      imageUrl: unquoteSqlValue(fields[3]),
      description: unquoteSqlValue(fields[4]),
      location: unquoteSqlValue(fields[5]),
      categoryId: unquoteSqlValue(fields[6]),
      branchId: unquoteSqlValue(fields[7]),
      phone: unquoteSqlValue(fields[11]),
      isVisible: fields[12] === "1",
    });
  }

  return shops;
}

function parseShopHourLines(sql: string): ParsedShopHour[] {
  const hours: ParsedShopHour[] = [];
  let inBlock = false;

  for (const line of sql.split("\n")) {
    if (line.startsWith("INSERT INTO `ShopHour`")) {
      inBlock = true;
      continue;
    }
    if (!inBlock) continue;
    if (line.startsWith("--") || line.startsWith("CREATE TABLE")) {
      inBlock = false;
      continue;
    }
    if (!line.match(/^\('[0-9a-f]{8}-/)) {
      if (line.trim() === ";") inBlock = false;
      continue;
    }

    const fields = parseSqlTuple(line);
    if (fields.length < 6) continue;

    hours.push({
      shopId: unquoteSqlValue(fields[1]) ?? "",
      dayOfWeek: Number(fields[2]),
      openTime: unquoteSqlValue(fields[3]) ?? "10:00",
      closeTime: unquoteSqlValue(fields[4]) ?? "22:00",
      isClosed: fields[5] === "1",
    });
  }

  return hours;
}

function normalizeImageUrl(url: string | null): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${IMAGE_BASE_URL}${url}`;
  return url;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildDescription(description: string | null, location: string | null) {
  const parts: string[] = [];
  if (location?.trim()) {
    parts.push(`<p><strong>ตำแหน่ง:</strong> ${location.trim()}</p>`);
  }
  if (description?.trim()) {
    parts.push(description.trim());
  }
  return parts.length ? parts.join("\n") : null;
}

function convertOperatingHours(
  shopHours: ParsedShopHour[],
  shopId: string,
): StoreOperatingHour[] {
  const defaults = createDefaultOperatingHours();
  const byDay = new Map(STORE_DAY_KEYS.map((day) => [day, defaults.find((item) => item.day === day)!]));

  for (const hour of shopHours.filter((item) => item.shopId === shopId)) {
    const day = PASEO_DAY_TO_STORE_DAY[hour.dayOfWeek];
    if (!day) continue;
    byDay.set(day, {
      day,
      isOpen: !hour.isClosed,
      openTime: hour.openTime.slice(0, 5),
      closeTime: hour.closeTime.slice(0, 5),
    });
  }

  return STORE_DAY_KEYS.map((day) => byDay.get(day)!);
}

function buildUniqueSlug(baseName: string, location: string | null, usedSlugs: Set<string>) {
  const candidates = [
    generateSlug(baseName),
    location ? generateSlug(`${baseName} ${location}`) : "",
    generateSlug(`${baseName}-store`),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!usedSlugs.has(candidate)) return candidate;
  }

  let index = 2;
  const root = candidates[0] || "store";
  while (usedSlugs.has(`${root}-${index}`)) index += 1;
  return `${root}-${index}`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sql = readFileSync(SQL_PATH, "utf8");
  const allShops = parseShopLines(sql);
  const allHours = parseShopHourLines(sql);

  const shops = allShops.filter(
    (shop) => shop.isVisible && shop.branchId && shop.branchId !== SKIP_BRANCH_ID && BRANCH_ID_TO_SLUG[shop.branchId],
  );

  const [branches, categories, existingStores] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null } }),
    prisma.category.findMany({ where: { deletedAt: null } }),
    prisma.store.findMany({ where: { deletedAt: null }, select: { id: true, name: true, slug: true, branchId: true } }),
  ]);

  const branchBySlug = new Map(branches.map((branch) => [branch.slug, branch]));
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const usedSlugs = new Set(existingStores.map((store) => store.slug));

  const existingByKey = new Map<string, (typeof existingStores)[number]>();
  for (const store of existingStores) {
    existingByKey.set(`${normalizeName(store.name)}|${store.branchId}`, store);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const pendingCreates: Array<Parameters<typeof prisma.store.create>[0]["data"]> = [];
  const pendingUpdates: Array<{ id: string; data: Parameters<typeof prisma.store.update>[0]["data"] }> = [];

  for (const shop of shops) {
    const branchSlug = shop.branchId ? BRANCH_ID_TO_SLUG[shop.branchId] : null;
    const categorySlug = shop.categoryId ? CATEGORY_ID_TO_SLUG[shop.categoryId] : null;
    const branch = branchSlug ? branchBySlug.get(branchSlug) : null;
    const category = categorySlug ? categoryBySlug.get(categorySlug) : null;

    if (!branch) {
      skipped += 1;
      continue;
    }

    const description = buildDescription(shop.description, shop.location);
    const operatingHours = convertOperatingHours(allHours, shop.id);
    const data = {
      branchId: branch.id,
      categoryId: category?.id ?? null,
      nameTh: shop.name,
      nameEn: shop.name,
      name: shop.name,
      slug: "",
      logo: normalizeImageUrl(shop.logoUrl),
      cover: normalizeImageUrl(shop.imageUrl),
      description,
      phone1: shop.phone,
      phone2: null,
      operatingHours,
    };

    const existing = existingByKey.get(`${normalizeName(shop.name)}|${branch.id}`);
    if (existing) {
      pendingUpdates.push({
        id: existing.id,
        data: {
          categoryId: data.categoryId,
          nameTh: data.nameTh,
          nameEn: data.nameEn,
          name: data.name,
          logo: data.logo,
          cover: data.cover,
          description: data.description,
          phone1: data.phone1,
          operatingHours: data.operatingHours,
        },
      });
      updated += 1;
      continue;
    }

    const slug = buildUniqueSlug(shop.name, shop.location, usedSlugs);
    usedSlugs.add(slug);
    pendingCreates.push({ ...data, slug });
    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        sourceShops: allShops.length,
        importableShops: shops.length,
        skippedBangna: allShops.filter((shop) => shop.branchId === SKIP_BRANCH_ID).length,
        hiddenSkipped: allShops.filter((shop) => !shop.isVisible).length,
        toCreate: created,
        toUpdate: updated,
        skippedMissingBranch: skipped,
      },
      null,
      2,
    ),
  );

  if (dryRun) return;

  for (let index = 0; index < pendingUpdates.length; index += BATCH_SIZE) {
    const batch = pendingUpdates.slice(index, index + BATCH_SIZE);
    await prisma.$transaction(batch.map((item) => prisma.store.update({ where: { id: item.id }, data: item.data })));
  }

  for (let index = 0; index < pendingCreates.length; index += BATCH_SIZE) {
    const batch = pendingCreates.slice(index, index + BATCH_SIZE);
    await prisma.$transaction(batch.map((data) => prisma.store.create({ data })));
  }

  const finalCount = await prisma.store.count({ where: { deletedAt: null } });
  console.log(`Import complete. Active stores in CMS: ${finalCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
