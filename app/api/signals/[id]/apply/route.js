import { route, body, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const POST = route(async (req, { params }) => {
  await body(req, z.object({ confirmedWithClient: z.literal(true) }));
  const id = (await params).id;
  return prisma.$transaction(async (db) => {
    const signal = await db.preferenceSignal.findUnique({ where: { id } });
    if (!signal) throw new ApiError("Signal not found", 404);
    await db.$queryRaw`SELECT id FROM "Client" WHERE id=${signal.clientId} FOR UPDATE`;
    if (
      signal.status !== "CONFIRMED" ||
      signal.type !== "PREFERENCE_CONTRADICTION" ||
      signal.attributeKey !== "location"
    )
      throw new ApiError("Confirm a location signal before applying this change.");
    const preference = await db.clientPreference.findFirst({
      where: { clientId: signal.clientId, key: "location" },
    });
    if (!preference || preference.type !== "SOFT")
      throw new ApiError("Only a soft location preference can be adjusted here.");
    await db.clientPreference.update({
      where: { id: preference.id },
      data: { weight: 0.25, source: "HUMAN_CONFIRMED" },
    });
    return {
      signal: await db.preferenceSignal.update({ where: { id }, data: { appliedAt: new Date() } }),
    };
  });
});
