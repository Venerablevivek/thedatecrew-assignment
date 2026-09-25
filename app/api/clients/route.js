import { route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { percent } from "@/lib/metrics";
export const dynamic = "force-dynamic";
export const GET = route(async () => ({
  clients: (
    await prisma.client.findMany({
      include: { matchmaker: true, preferences: true, signals: true, recommendations: true },
      orderBy: { name: "asc" },
    })
  ).map((c) => ({
    ...c,
    acceptanceRate: percent(
      c.recommendations.filter((r) => r.acceptedAt).length,
      c.recommendations.filter((r) => r.sharedAt).length,
    ),
    pendingSignals: c.signals.filter((s) => s.status === "PENDING_REVIEW").length,
  })),
}));
