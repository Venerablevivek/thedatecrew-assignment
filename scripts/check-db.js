// Checks the configured database connections without printing credentials.
// Usage: npm run db:check
import "dotenv/config";
import pg from "pg";
const targets = [
  ["DATABASE_URL (app runtime)", process.env.DATABASE_URL],
  ["DIRECT_URL (migrations)", process.env.DIRECT_URL],
];
let failed = false;
for (const [label, url] of targets) {
  if (!url) {
    console.log(
      `– ${label}: not set${label.startsWith("DIRECT") ? " (falls back to DATABASE_URL)" : ""}`,
    );
    if (!label.startsWith("DIRECT")) failed = true;
    continue;
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    console.log(`✗ ${label}: not a valid URL`);
    failed = true;
    continue;
  }
  const where = `${parsed.hostname}${parsed.pathname}`;
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT current_database() AS db,
              to_regclass('public._prisma_migrations') IS NOT NULL AS migrated,
              to_regclass('public."CandidateProfile"') IS NOT NULL AS has_tables`,
    );
    const info = rows[0];
    let detail = "connected · no tables yet (run npm run db:migrate)";
    if (info.migrated) {
      const m = await client.query(
        `SELECT count(*)::int AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL`,
      );
      detail = `connected · ${m.rows[0].n} migrations applied`;
      if (info.has_tables) {
        const c = await client.query(
          `SELECT (SELECT count(*) FROM "Client")::int AS clients,
                  (SELECT count(*) FROM "CandidateProfile")::int AS profiles`,
        );
        detail += ` · ${c.rows[0].clients} clients, ${c.rows[0].profiles} profiles`;
      }
    }
    console.log(`✓ ${label}: ${where} · ${detail}`);
  } catch (e) {
    console.log(`✗ ${label}: ${where} · ${e.message}`);
    failed = true;
  } finally {
    await client.end().catch(() => {});
  }
}
if (process.env.DATABASE_URL?.includes("-pooler.") && !process.env.DIRECT_URL)
  console.log(
    "! Neon pooled URL without DIRECT_URL: add the direct URL before running migrations.",
  );
process.exit(failed ? 1 : 0);
