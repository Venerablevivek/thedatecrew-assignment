import { route, body, ApiError } from "@/lib/api";
import { feedbackSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/data";
import { refreshSignals } from "@/lib/signals";
export const POST = route(async (req) => {
  const input = await body(req, feedbackSchema);
  return prisma.$transaction(async (db) => {
    await db.$queryRaw`SELECT id FROM "Client" WHERE id=${input.clientId} FOR UPDATE`;
    const client = await getClient(input.clientId, db);
    if (!(await db.candidateProfile.findUnique({ where: { id: input.profileId } })))
      throw new ApiError("Profile not found", 404);
    let recommendation = await db.recommendation.findUnique({
      where: { clientId_profileId: { clientId: client.id, profileId: input.profileId } },
    });
    if (recommendation?.acceptedAt)
      throw new ApiError(
        "This profile was already accepted. Rejection cannot overwrite its history.",
        409,
      );
    if (recommendation?.status === "REJECTED")
      throw new ApiError(
        "Feedback has already been recorded for this profile.",
        409,
        "ALREADY_REVIEWED",
      );
    const preferences = recommendation?.preferenceSnapshot || client.preferences;
    const keys = {
      LOCATION: "location",
      AGE: "age_range",
      SMOKING: "smoking",
      CHILDREN: "children",
      CAREER: "career_ambition",
      FAMILY: "family_orientation",
      LIFESTYLE: "lifestyle",
      RELATIONSHIP_INTENT: "relationshipIntent",
    };
    for (const reason of input.structured.reasons) {
      if (reason.evidence && !input.rawText.includes(reason.evidence))
        throw new ApiError("Evidence must be an exact excerpt from the feedback.");
      if (
        reason.knownPreference &&
        !preferences.some((p) => p.key === (keys[reason.category] || reason.category.toLowerCase()))
      )
        throw new ApiError(
          `No recorded preference supports ${reason.category}. Uncheck known preference.`,
        );
    }
    recommendation = await db.recommendation.upsert({
      where: { clientId_profileId: { clientId: client.id, profileId: input.profileId } },
      create: {
        clientId: client.id,
        profileId: input.profileId,
        matchmakerId: client.matchmakerId,
        status: "REJECTED",
        preferenceSnapshot: client.preferences,
      },
      update: { status: "REJECTED" },
    });
    const feedback = await db.feedback.create({
      data: {
        clientId: client.id,
        recommendationId: recommendation.id,
        rawText: input.rawText,
        structured: input.structured,
        aiSummary: input.structured.summary,
        wasEdited: input.wasEdited,
        source: input.source,
      },
    });
    await refreshSignals(db, client.id);
    return {
      feedback,
      signals: await db.preferenceSignal.findMany({ where: { clientId: client.id } }),
    };
  });
});
