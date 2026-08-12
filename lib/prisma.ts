import { Prisma, PrismaClient } from "@prisma/client";

const PRISMA_CLIENT_GENERATION = 3;

const globalForPrisma = globalThis as unknown as {
  prisma: (PrismaClient & { __generation?: number }) | undefined;
};

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }) as PrismaClient & { __generation?: number };

  client.__generation = PRISMA_CLIENT_GENERATION;
  return client;
}

function isPrismaClientCurrent(client: PrismaClient & { __generation?: number }) {
  if (client.__generation !== PRISMA_CLIENT_GENERATION) {
    return false;
  }

  if (!("localizationSetting" in client)) {
    return false;
  }

  return "scope" in Prisma.CategoryScalarFieldEnum && "postKind" in Prisma.CategoryScalarFieldEnum;
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma;

  if (existing && isPrismaClientCurrent(existing)) {
    return existing;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function getLocalizationSettingDelegate(client: PrismaClient = prisma) {
  if (!("localizationSetting" in client)) {
    return null;
  }

  return client.localizationSetting;
}

export function isMissingLocalizationTableError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  return error.code === "P2021" || error.code === "P2022";
}
