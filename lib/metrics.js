export const SCENARIO = {
  shared: 1000,
  accepted: 310,
  contacts: 210,
  conversations: 150,
  fixed: 75,
  completed: 42,
  avoidable: 35,
  searchHours: 2,
};
export const percent = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);
export function calculateMetrics(recommendations, feedback, matchmakers) {
  const shared = recommendations.filter((r) => r.sharedAt);
  const accepted = shared.filter((r) => r.acceptedAt);
  const rejected = shared.filter((r) => r.status === "REJECTED");
  const rejectedIds = new Set(rejected.map((r) => r.id));
  const known = feedback.filter(
    (f) =>
      rejectedIds.has(f.recommendationId) && f.structured.reasons.some((r) => r.knownPreference),
  );
  const counts = [
    shared.length,
    accepted.length,
    shared.filter((r) => r.contactSharedAt).length,
    shared.filter((r) => r.conversationAt).length,
    shared.filter((r) => r.meetingFixedAt).length,
    shared.filter((r) => r.completedAt).length,
  ];
  const stages = [
    "Profiles shared",
    "Profiles accepted",
    "Contact details shared",
    "Conversations started",
    "Meetings fixed",
    "Meetings completed",
  ];
  const categories = {};
  for (const f of feedback)
    for (const category of new Set(f.structured.reasons.map((r) => r.category)))
      categories[category] = (categories[category] || 0) + 1;
  return {
    metrics: {
      profilesShared: shared.length,
      profilesAccepted: accepted.length,
      acceptanceRate: percent(accepted.length, shared.length),
      avoidableRejectionRate: percent(known.length, rejected.length),
      meetingsCompleted: counts[5],
      rejected: rejected.length,
      knownRejections: known.length,
      feedbackCount: feedback.length,
      pending: shared.filter((r) => !r.acceptedAt && r.status !== "REJECTED").length,
    },
    funnel: stages.map((stage, i) => ({
      stage,
      value: counts[i],
      conversion: i ? percent(counts[i], counts[i - 1]) : 100,
    })),
    matchmakers: matchmakers.map((m) => ({
      name: m.name,
      id: m.id,
      shared: shared.filter((r) => r.matchmakerId === m.id).length,
      acceptanceRate: percent(
        accepted.filter((r) => r.matchmakerId === m.id).length,
        shared.filter((r) => r.matchmakerId === m.id).length,
      ),
    })),
    rejectionReasons: Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
  };
}
