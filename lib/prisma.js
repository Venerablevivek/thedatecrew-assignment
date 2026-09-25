import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.tdcPrisma ||
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      // Opening a TLS connection to a hosted database costs several round trips (~0.7s to
      // Neon from far away). pg closes idle connections after 10s by default, so keep them
      // for 5 minutes (Neon's default idle suspend) and send TCP keep-alives.
      idleTimeoutMillis: 5 * 60_000,
      keepAlive: true,
    }),
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.tdcPrisma = prisma;
