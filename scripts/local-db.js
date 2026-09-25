import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";
const databaseDir = path.resolve(".local-db");
const pg = new EmbeddedPostgres({
  databaseDir,
  user: "tdc",
  password: "tdc_local_demo",
  port: 54329,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: ["-c", "listen_addresses=127.0.0.1", "-c", "unix_socket_directories=/tmp"],
  onLog: console.log,
  onError: console.error,
});
if (!existsSync(path.join(databaseDir, "PG_VERSION"))) await pg.initialise();
await pg.start();
const connection = pg.getPgClient();
await connection.connect();
const result = await connection.query("SELECT 1 FROM pg_database WHERE datname = 'tdc'");
await connection.end();
if (!result.rowCount) await pg.createDatabase("tdc");
console.log("Local PostgreSQL ready on 127.0.0.1:54329. Keep this terminal open.");
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    await pg.stop();
    process.exit(0);
  });
setInterval(() => {}, 60000);
