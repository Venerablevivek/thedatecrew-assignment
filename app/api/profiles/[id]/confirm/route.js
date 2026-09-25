import { route, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
// Records that a matchmaker re-confirmed the profile is current and the person is still available.
export const POST = route(async (_req, { params }) => {
  const { id } = await params;
  const profile = await prisma.candidateProfile.findUnique({ where: { id }, select: { id: true } });
  if (!profile) throw new ApiError("Profile not found", 404, "NOT_FOUND");
  return {
    profile: await prisma.candidateProfile.update({
      where: { id },
      data: { lastConfirmedAt: new Date() },
      select: { id: true, lastConfirmedAt: true },
    }),
  };
});
