import { route, body, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/data";
import { assistantInput, buildAssistantContext, answerAssistant } from "@/lib/assistant";
import { GeminiError, geminiConfigured } from "@/lib/gemini";
async function context(id, question = "") {
  if (!id) throw new ApiError("Choose a client");
  const client = await getClient(id);
  const profiles = await prisma.candidateProfile.findMany({ where: { active: true } });
  return buildAssistantContext(client, profiles, question);
}
export const GET = route(async (req) => {
  const data = await context(new URL(req.url).searchParams.get("clientId"));
  return {
    client: data.client,
    counts: data.counts,
    configured: geminiConfigured(),
    generatedAt: data.generatedAt,
    preferences: data.evidence
      .filter((e) => e.id.startsWith("preference:"))
      .map(({ label, href }) => ({ label, href })),
  };
});
export const POST = route(async (req) => {
  const input = await body(req, assistantInput);
  const data = await context(
    input.clientId,
    [...input.history.map((h) => h.question), input.question].join(" "),
  );
  try {
    return await answerAssistant(data, input);
  } catch (e) {
    if (e instanceof GeminiError) throw new ApiError(e.message, e.status, e.code);
    throw e;
  }
});
