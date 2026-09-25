import { route, body, ApiError } from "@/lib/api";
import { actionSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/data";
import { reciprocalCheck } from "@/lib/match-tools";
import { scoreCandidate } from "@/lib/matching";
import { refreshSignals } from "@/lib/signals";
import { freshness } from "@/lib/freshness";
const transitions = {
  SUGGESTED: ["SHORTLISTED", "SHARED"],
  SHORTLISTED: ["SHARED"],
  SHARED: ["ACCEPTED"],
  ACCEPTED: ["CONTACT_SHARED"],
  CONTACT_SHARED: ["CONVERSATION_STARTED"],
  CONVERSATION_STARTED: ["MEETING_FIXED"],
  MEETING_FIXED: ["MEETING_COMPLETED"],
};
export const POST = route(async (req) => {
  const input = await body(req, actionSchema);
  return prisma.$transaction(async (db) => {
    await db.$queryRaw`SELECT id FROM "Client" WHERE id=${input.clientId} FOR UPDATE`;
    const client = await getClient(input.clientId, db),
      profile = await db.candidateProfile.findUnique({ where: { id: input.profileId } });
    if (!profile) throw new ApiError("Profile not found", 404);
    const existing = await db.recommendation.findUnique({
      where: { clientId_profileId: { clientId: client.id, profileId: profile.id } },
    });
    if (existing?.status === input.action) return { recommendation: existing };
    const from = existing?.status || "SUGGESTED";
    if (!transitions[from]?.includes(input.action))
      throw new ApiError(`Cannot move from ${from} to ${input.action}`, 409, "INVALID_TRANSITION");
    const scored = scoreCandidate(client, profile, client.recommendations);
    if (["SHORTLISTED", "SHARED"].includes(input.action) && !scored.eligible)
      throw new ApiError(
        "Resolve all deal-breaker conflicts and missing required information before sharing.",
        409,
        "INELIGIBLE",
      );
    if (
      ["SHORTLISTED", "SHARED"].includes(input.action) &&
      reciprocalCheck(client, profile).status === "CONFLICT"
    )
      throw new ApiError(
        "Resolve the candidate’s requirements or availability conflict before sharing.",
        409,
        "RECIPROCAL_CONFLICT",
      );
    if (input.action === "SHARED" && !input.acknowledgeStale) {
      const fresh = freshness(profile.lastConfirmedAt);
      if (fresh.status === "STALE")
        throw new ApiError(
          `This profile was last confirmed ${fresh.days} days ago. Re-confirm it before sharing.`,
          409,
          "STALE_PROFILE",
        );
    }
    const data = { status: input.action };
    const timestamp = {
      SHARED: "sharedAt",
      ACCEPTED: "acceptedAt",
      CONTACT_SHARED: "contactSharedAt",
      CONVERSATION_STARTED: "conversationAt",
      MEETING_FIXED: "meetingFixedAt",
      MEETING_COMPLETED: "completedAt",
    }[input.action];
    if (timestamp) data[timestamp] = new Date();
    if (input.action === "SHARED") data.preferenceSnapshot = client.preferences;
    const recommendation = await db.recommendation.upsert({
      where: { clientId_profileId: { clientId: client.id, profileId: profile.id } },
      create: {
        ...data,
        clientId: client.id,
        profileId: profile.id,
        matchmakerId: client.matchmakerId,
        score: scored.score,
        scoreBreakdown: scored.breakdown,
        eligibility: { status: scored.status },
        preferenceSnapshot: client.preferences,
      },
      update: data,
    });
    await refreshSignals(db, client.id);
    return { recommendation };
  });
});
