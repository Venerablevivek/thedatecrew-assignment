import { route, ApiError } from "@/lib/api";
import { getClient } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { rankCandidates } from "@/lib/matching";
export const GET = route(async (req) => {
  const id = new URL(req.url).searchParams.get("clientId");
  if (!id) throw new ApiError("Choose a client");
  const client = await getClient(id);
  const candidates = await prisma.candidateProfile.findMany({ where: { active: true } });
  return {
    client,
    matches: rankCandidates(client, candidates, client.recommendations).map((m) => ({
      ...m,
      recommendation: client.recommendations.find((r) => r.profileId === m.profile.id) || null,
    })),
  };
});
