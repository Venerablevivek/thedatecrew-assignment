# Vercel deployment handoff

The app is ready for a Node.js/Vercel deployment. It has been built and tested locally against PostgreSQL. This file does not claim that a public URL already exists.

## Prerequisites

- A GitHub repository under the submitter's account.
- A Vercel project importing that repository.
- A dedicated managed PostgreSQL database with a connection string compatible with `pg`.
- Optional Gemini API key configured through the hosting environment-variable UI.

Never commit `.env`, database files, access tokens, or real client records.

## Neon setup (existing Neon account)

1. In the Neon console open your project → **Connect**. Pick the branch, database (`neondb`) and role.
2. Turn **Connection pooling ON** and copy the string → this is `DATABASE_URL` (host contains `-pooler`).
   Turn it **OFF** and copy again → this is `DIRECT_URL` (same host without `-pooler`).
3. In the root `.env`, set both. Paste them exactly; nothing may follow the query string
   (a leftover `/tdc` from the local URL breaks the `channel_binding` parameter).

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

4. Check both connections (prints hosts and table counts, never credentials):

```bash
npm run db:check
```

5. Create the tables. Prisma CLI uses `DIRECT_URL` (see `prisma.config.js`); PgBouncer-pooled connections are not suitable for migrations.

```bash
npm run db:migrate
npm run db:status
```

6. **Only on a new, empty database**, load the synthetic demo data (8 clients, 60 profiles). Over the network this takes about a minute.

```bash
npm run db:seed
```

**Seeding deletes existing application records. Never add it to the build command.** If your terminal sets `NODE_ENV=production`, the script requires `ALLOW_DEMO_RESET=true` for that one command. Do not set that flag in Vercel.

7. Restart `npm run dev` (the Prisma client caches its connection) and open the dashboard. Local development now reads and writes Neon; any deployment using the same URLs shares that data.

The runtime uses `DATABASE_URL`. Prisma CLI uses `DIRECT_URL`, falling back to `DATABASE_URL_UNPOOLED` (set automatically by the Vercel–Neon integration), then `DATABASE_URL`.

Node's `pg` driver prints a `SECURITY WARNING` about `sslmode=require` being treated as `verify-full`. That is informational: connections are fully certificate-verified today.

## Deploy on Vercel

1. Push the source to GitHub, including `package-lock.json`, `prisma/`, and `.env.example`. Exclude `node_modules`, `.next`, `.local-db`, and `.env` (already ignored).
2. Import the repository into Vercel as **Next.js**. Use the project root, a supported Node version satisfying `>=22.12.0`, and build command `npm run build`. Keep the default output directory.
3. Set Production environment variables in Vercel:

| Variable         | Value                               |
| ---------------- | ----------------------------------- |
| `DATABASE_URL`   | Full Neon pooled PostgreSQL URL     |
| `DIRECT_URL`     | Full Neon direct PostgreSQL URL     |
| `GEMINI_API_KEY` | Your existing Gemini API key        |
| `DEMO_ANALYZER`  | `false` for live AI/manual fallback |

4. Deploy after the migration and initial seed above (already done if `npm run db:check` shows tables). Vercel builds generate Prisma Client but do not run migrations or seed data. For future schema changes, run `npm run db:migrate` against the intended database before deploying compatible code.
5. Verify the dashboard and AI assistant. Record feedback and refresh to verify persistence. Redeploy after changing Vercel environment variables.
6. For preview deployments, use a separate Neon branch/database so testing does not alter the submission database.

The embedded PostgreSQL package is only for local development. Do not start `db:local` on Vercel or use a localhost database URL there. No `NEXT_PUBLIC_` prefix belongs on these secrets.

References: [Vercel Postgres integrations](https://vercel.com/docs/postgres), [Prisma database connections](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections).

## Enable and verify live AI

Use deployment access protection for a private assessment demo before adding `GEMINI_API_KEY`; there is no app authentication or durable public rate limiter in this MVP. Set `DEMO_ANALYZER=false` and the fixed `gemini-2.5-flash` model. Redeploy. Analyze the example and verify the response says **Gemini 2.5 Flash draft**, not **Demo rules**. Save only after reviewing the extracted evidence.

Gemini outages leave manual categorization available. Avoid claiming live AI was tested until an actual request succeeds with your configured account.

## Submission status

- Local production build: verified.
- Persistent local PostgreSQL: verified.
- Public URL: awaiting hosting setup.
- GitHub URL: awaiting repository setup.
- Live Gemini request: verify again on the deployed site with its configured key.
- Resume: supply your own current resume; none was attached.

The original assessment accepts screenshots or a recording as prototype evidence, so the screenshots in `docs/screenshots/` remain usable even before hosting is complete.
