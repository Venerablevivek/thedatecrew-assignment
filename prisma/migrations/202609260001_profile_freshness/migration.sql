-- When a matchmaker last confirmed the profile is current and the person is open to introductions.
ALTER TABLE "CandidateProfile" ADD COLUMN "lastConfirmedAt" TIMESTAMP(3);

-- Demo backfill for seeded profiles (profile-1 … profile-60), mirroring prisma/seed.js.
-- Mumbai profiles (index % 6 = 1) stay recent; others spread across 0–149 days.
UPDATE "CandidateProfile"
SET "lastConfirmedAt" = NOW() - make_interval(days =>
  CASE WHEN (n - 1) % 6 = 1 THEN ((n - 1) * 7) % 25 ELSE ((n - 1) * 37) % 150 END)
FROM (SELECT id AS pid, substring(id FROM '^profile-(\d+)$')::int AS n
      FROM "CandidateProfile" WHERE id ~ '^profile-\d+$') AS seeded
WHERE "CandidateProfile".id = seeded.pid AND "lastConfirmedAt" IS NULL;
