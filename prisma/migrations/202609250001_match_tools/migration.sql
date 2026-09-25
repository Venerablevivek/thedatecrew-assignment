ALTER TABLE "Client" ADD COLUMN "facts" JSONB;
ALTER TABLE "CandidateProfile" ADD COLUMN "partnerRequirements" JSONB;
CREATE TABLE "Meeting" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "recommendationId" TEXT NOT NULL UNIQUE REFERENCES "Recommendation"("id") ON DELETE CASCADE,
 "clientAvailability" TEXT NOT NULL DEFAULT '',
 "candidateAvailability" TEXT NOT NULL DEFAULT '',
 "scheduledAt" TIMESTAMP(3),
 "durationMinutes" INTEGER NOT NULL DEFAULT 60,
 "location" TEXT NOT NULL DEFAULT '',
 "status" TEXT NOT NULL DEFAULT 'PLANNING',
 "followUpAt" TIMESTAMP(3),
 "followUpDone" BOOLEAN NOT NULL DEFAULT false,
 "notes" TEXT NOT NULL DEFAULT '',
 "version" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
