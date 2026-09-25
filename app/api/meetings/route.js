import { route, body, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { meetingSchema } from "@/lib/tools-validation";
export const GET = route(async () => ({
  recommendations: await prisma.recommendation.findMany({
    where: { acceptedAt: { not: null }, status: { not: "REJECTED" } },
    include: { client: true, profile: true, meeting: true },
    orderBy: { acceptedAt: "desc" },
  }),
}));
export const POST = route(async (req) => {
  const input = await body(req, meetingSchema);
  return prisma.$transaction(async (db) => {
    await db.$queryRaw`SELECT id FROM "Recommendation" WHERE id=${input.recommendationId} FOR UPDATE`;
    const rec = await db.recommendation.findUnique({
      where: { id: input.recommendationId },
      include: { meeting: true },
    });
    if (!rec) throw new ApiError("Introduction not found", 404);
    if (!rec.acceptedAt || rec.status === "REJECTED")
      throw new ApiError("Record acceptance before coordinating a meeting.", 409);
    if ((rec.meeting?.version || 0) !== input.version)
      throw new ApiError(
        "This plan changed in another window. Close and reopen it before saving.",
        409,
      );
    const { recommendationId, version, confirmed, ...fields } = input;
    if (
      fields.status === "SCHEDULED" &&
      new Date(fields.scheduledAt) <= new Date() &&
      fields.scheduledAt !== rec.meeting?.scheduledAt?.toISOString()
    )
      throw new ApiError("Choose a future time for a new or rescheduled meeting.");
    // Lock both participants across introductions to prevent simultaneous conflicting bookings.
    await db.$queryRaw`SELECT id FROM "Client" WHERE id=${rec.clientId} FOR UPDATE`;
    await db.$queryRaw`SELECT id FROM "CandidateProfile" WHERE id=${rec.profileId} FOR UPDATE`;
    if (fields.status === "SCHEDULED") {
      const others = await db.meeting.findMany({
        where: {
          status: "SCHEDULED",
          recommendationId: { not: rec.id },
          recommendation: { OR: [{ clientId: rec.clientId }, { profileId: rec.profileId }] },
        },
      });
      const start = Date.parse(fields.scheduledAt),
        end = start + fields.durationMinutes * 60000;
      if (
        others.some(
          (m) =>
            start < m.scheduledAt.getTime() + m.durationMinutes * 60000 &&
            end > m.scheduledAt.getTime(),
        )
      )
        throw new ApiError("This time overlaps another meeting for one of the participants.", 409);
    }
    const meeting = await db.meeting.upsert({
      where: { recommendationId },
      create: { recommendationId, ...fields, version: 1 },
      update: { ...fields, version: { increment: 1 } },
    });
    return { meeting };
  });
});
