import { readFile } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

import { extractMediaMetadata } from "../lib/media-metadata";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.media.findMany({
    where: {
      deletedAt: null,
      OR: [
        { mimeType: null },
        { extension: null },
        { originalName: null },
        { AND: [{ type: "IMAGE" }, { OR: [{ width: null }, { height: null }] }] },
      ],
    },
    take: 5000,
  });

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const absolute = path.join(process.cwd(), "public", row.path.replace(/^\//, ""));
      const buffer = await readFile(absolute);
      const meta = extractMediaMetadata(buffer, {
        mimeType: row.mimeType ?? "",
        originalName: row.originalName ?? row.filename,
        mediaType: row.type,
      });

      await prisma.media.update({
        where: { id: row.id },
        data: {
          originalName: row.originalName ?? meta.originalName,
          mimeType: row.mimeType ?? meta.mimeType,
          extension: row.extension ?? meta.extension,
          width: row.type === "IMAGE" ? (row.width ?? meta.width) : null,
          height: row.type === "IMAGE" ? (row.height ?? meta.height) : null,
        },
      });
      updated += 1;
    } catch (error) {
      skipped += 1;
      console.warn(`[media:backfill] skip ${row.id} ${row.path}`, error);
    }
  }

  console.log(`media:backfill done updated=${updated} skipped=${skipped}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
