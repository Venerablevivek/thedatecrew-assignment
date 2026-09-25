-- CreateEnum
CREATE TYPE "PreferenceType" AS ENUM ('HARD', 'SOFT');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('SUGGESTED', 'SHORTLISTED', 'SHARED', 'ACCEPTED', 'REJECTED', 'CONTACT_SHARED', 'CONVERSATION_STARTED', 'MEETING_FIXED', 'MEETING_COMPLETED');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('REPEATED_REJECTION', 'REPEATED_ACCEPTANCE', 'PREFERENCE_CONTRADICTION');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('PENDING_REVIEW', 'CONFIRMED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Matchmaker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matchmaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "city" TEXT,
    "occupation" TEXT,
    "matchmakerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPreference" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" "PreferenceType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'STATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "occupation" TEXT,
    "smoking" TEXT,
    "children" TEXT,
    "relationshipIntent" TEXT,
    "attributes" JSONB NOT NULL,
    "valuesSummary" TEXT,
    "lifestyleSummary" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "matchmakerId" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'SUGGESTED',
    "score" DOUBLE PRECISION,
    "scoreBreakdown" JSONB,
    "matchedReasons" JSONB,
    "warnings" JSONB,
    "eligibility" JSONB,
    "preferenceSnapshot" JSONB,
    "contactSharedAt" TIMESTAMP(3),
    "conversationAt" TIMESTAMP(3),
    "meetingFixedAt" TIMESTAMP(3),
    "sharedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "structured" JSONB NOT NULL,
    "aiSummary" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "wasEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceSignal" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "SignalStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "appliedAt" TIMESTAMP(3),
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Matchmaker_email_key" ON "Matchmaker"("email");

-- CreateIndex
CREATE INDEX "Client_matchmakerId_idx" ON "Client"("matchmakerId");

-- CreateIndex
CREATE INDEX "ClientPreference_clientId_idx" ON "ClientPreference"("clientId");

-- CreateIndex
CREATE INDEX "ClientPreference_key_idx" ON "ClientPreference"("key");

-- CreateIndex
CREATE INDEX "CandidateProfile_active_idx" ON "CandidateProfile"("active");

-- CreateIndex
CREATE INDEX "CandidateProfile_city_idx" ON "CandidateProfile"("city");

-- CreateIndex
CREATE INDEX "Recommendation_clientId_status_idx" ON "Recommendation"("clientId", "status");

-- CreateIndex
CREATE INDEX "Recommendation_matchmakerId_idx" ON "Recommendation"("matchmakerId");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_clientId_profileId_key" ON "Recommendation"("clientId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_recommendationId_key" ON "Feedback"("recommendationId");

-- CreateIndex
CREATE INDEX "Feedback_clientId_idx" ON "Feedback"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceSignal_signature_key" ON "PreferenceSignal"("signature");

-- CreateIndex
CREATE INDEX "PreferenceSignal_clientId_status_idx" ON "PreferenceSignal"("clientId", "status");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "Matchmaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "Matchmaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceSignal" ADD CONSTRAINT "PreferenceSignal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
