import { route, body, ApiError } from "@/lib/api";
import { analyzeSchema } from "@/lib/validation";
import { getClient } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { GeminiError } from "@/lib/gemini";
import { analyzeFeedback } from "@/lib/ai";
export const POST = route(async (req) => {
  const input = await body(req, analyzeSchema);
  const client = await getClient(input.clientId);
  const profile = await prisma.candidateProfile.findUnique({ where: { id: input.profileId } });
  if (!profile) throw new ApiError("Profile not found", 404);
  const rec = client.recommendations.find((r) => r.profileId === input.profileId);
  try {
    return await analyzeFeedback(input.feedback, rec?.preferenceSnapshot || client.preferences);
  } catch (e) {
    if (e instanceof GeminiError) throw new ApiError(e.message, e.status, e.code);
    throw new ApiError(
      "AI analysis unavailable. Your text is preserved; use manual categorization.",
      503,
      "AI_UNAVAILABLE",
    );
  }
});
