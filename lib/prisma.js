import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.tdcPrisma ||
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.tdcPrisma = prisma;
