import { route, body, ApiError } from "@/lib/api";
import { signalSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
export const PATCH = route(async (req, { params }) => {
  const input = await body(req, signalSchema);
  const id = (await params).id;
  const signal = await prisma.preferenceSignal.findUnique({ where: { id } });
  if (!signal) throw new ApiError("Signal not found", 404);
  if (signal.status !== "PENDING_REVIEW")
    throw new ApiError("This signal has already been reviewed.", 409);
  return { signal: await prisma.preferenceSignal.update({ where: { id }, data: input }) };
});
