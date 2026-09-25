import { geminiConfigured } from "./gemini.js";
import { prisma } from "./prisma.js";
import { ApiError } from "./api.js";
import { calculateMetrics, SCENARIO } from "./metrics.js";
export async function getClient(id, db = prisma) {
  const client = await db.client.findUnique({
    where: { id },
    include: {
      preferences: true,
      matchmaker: true,
      signals: { orderBy: { createdAt: "desc" } },
      recommendations: {
        include: { profile: true, feedback: true },
        orderBy: { createdAt: "desc" },
      },
      feedback: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!client) throw new ApiError("Client not found", 404, "NOT_FOUND");
  return client;
}
export async function dashboard() {
  const since = new Date(Date.now() - 30 * 86400000);
  const [recommendations, feedback, matchmakers, signals] = await Promise.all([
    prisma.recommendation.findMany({ where: { sharedAt: { gte: since } } }),
    prisma.feedback.findMany({
      where: { createdAt: { gte: since } },
      include: { client: true, recommendation: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.matchmaker.findMany(),
    prisma.preferenceSignal.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return {
    ...calculateMetrics(recommendations, feedback, matchmakers),
    scenario: SCENARIO,
    signals,
    feedback,
    aiMode: geminiConfigured()
      ? "GEMINI"
      : process.env.DEMO_ANALYZER === "true"
        ? "DEMO_RULES"
        : "MANUAL",
  };
}
