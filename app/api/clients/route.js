import { route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { percent } from "@/lib/metrics";
export const dynamic = "force-dynamic";
// The list only needs summary fields; full records are loaded per client on its own page.
export const GET = route(async () => ({
  clients: (
    await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        age: true,
        city: true,
        occupation: true,
        matchmaker: { select: { name: true } },
        preferences: { select: { type: true } },
        signals: { select: { status: true } },
        recommendations: { select: { sharedAt: true, acceptedAt: true, updatedAt: true } },
      },
      orderBy: { name: "asc" },
    })
  ).map(({ preferences, signals, recommendations, ...c }) => ({
    ...c,
    acceptanceRate: percent(
      recommendations.filter((r) => r.acceptedAt).length,
      recommendations.filter((r) => r.sharedAt).length,
    ),
    pendingSignals: signals.filter((s) => s.status === "PENDING_REVIEW").length,
    recommendationCount: recommendations.length,
    hardPreferences: preferences.filter((p) => p.type === "HARD").length,
    softPreferences: preferences.filter((p) => p.type === "SOFT").length,
    lastActivity: recommendations.reduce(
      (latest, r) => (!latest || r.updatedAt > latest ? r.updatedAt : latest),
      null,
    ),
  })),
}));
