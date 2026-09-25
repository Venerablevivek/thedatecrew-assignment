import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "node prisma/seed.js" },
  datasource: {
    // Neon: direct connection for CLI operations, pooled DATABASE_URL for the app.
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.DATABASE_URL ||
      "postgresql://tdc:tdc_local_demo@127.0.0.1:54329/tdc",
  },
});
