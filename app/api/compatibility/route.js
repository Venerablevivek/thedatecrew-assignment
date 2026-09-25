import { route, body, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { compatibilitySchema } from "@/lib/tools-validation";
export const POST = route(async (req) => {
  const input = await body(req, compatibilitySchema);
  const preferences = [];
  const add = (key, value) => preferences.push({ key, value, type: "HARD", weight: 1 });
  if (input.minAge !== null) add("age_range", { min: input.minAge, max: input.maxAge });
  if (input.cities.length) add("location", { cities: input.cities });
  if (input.smoking !== "UNKNOWN") add("smoking", { allowed: input.smoking === "YES" });
  if (input.children !== "UNKNOWN") add("children", { desired: input.children });
  if (input.intent !== "UNKNOWN") add("relationshipIntent", { desired: input.intent });
  return prisma.$transaction(async (db) => {
    const [client, profile] = await Promise.all([
      db.client.findUnique({ where: { id: input.clientId } }),
      db.candidateProfile.findUnique({ where: { id: input.profileId } }),
    ]);
    if (!client || !profile) throw new ApiError("Client or candidate not found", 404);
    await db.client.update({
      where: { id: client.id },
      data: {
        facts: {
          smoking: input.clientSmoking,
          children: input.clientChildren,
          relationshipIntent: input.clientIntent,
          reviewedAt: new Date().toISOString(),
        },
      },
    });
    await db.candidateProfile.update({
      where: { id: profile.id },
      data: {
        partnerRequirements: {
          preferences,
          openToIntroductions: input.openToIntroductions,
          reviewedAt: new Date().toISOString(),
          source: "HUMAN_REVIEW",
        },
      },
    });
    return { saved: true };
  });
});
