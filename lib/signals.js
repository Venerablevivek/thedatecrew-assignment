import { cityMatches } from "./matching.js";
export function deriveSignals(client, recommendations, feedback) {
  const results = [];
  const location = client.preferences.find((p) => p.key === "location");
  const accepted = recommendations
    .filter((r) => r.acceptedAt)
    .sort((a, b) => new Date(b.acceptedAt) - new Date(a.acceptedAt))
    .slice(0, 5);
  const outside = location
    ? accepted.filter((r) => !cityMatches(r.profile.city, location.value.cities))
    : [];
  if (location && accepted.length === 5 && outside.length >= 3)
    results.push({
      signature: `${client.id}:location:contradiction`,
      clientId: client.id,
      type: "PREFERENCE_CONTRADICTION",
      attributeKey: "location",
      title: "Location may be more flexible than stated",
      description: `${outside.length} of the last ${accepted.length} accepted profiles were outside ${location.value.cities.join(", ")}. Check whether location should remain a strong preference.`,
      evidence: {
        count: outside.length,
        total: accepted.length,
        recommendationIds: outside.map((r) => r.id),
        cities: outside.map((r) => r.profile.city),
      },
      confidence: outside.length / accepted.length,
    });
  const categories = {};
  for (const f of feedback)
    for (const category of new Set(f.structured.reasons.map((r) => r.category)))
      (categories[category] ||= []).push(f.id);
  for (const [category, ids] of Object.entries(categories))
    if (ids.length >= 3)
      results.push({
        signature: `${client.id}:${category}:rejection`,
        clientId: client.id,
        type: "REPEATED_REJECTION",
        attributeKey: category.toLowerCase(),
        title: `${category.charAt(0) + category.slice(1).toLowerCase()} appears in repeated feedback`,
        description: `${ids.length} reviewed feedback records mention this concern. Ask the client to clarify before changing any preference.`,
        evidence: { count: ids.length, feedbackIds: ids },
        confidence: Math.min(1, ids.length / 10),
      });
  return results;
}
export async function refreshSignals(db, clientId) {
  const client = await db.client.findUnique({
    where: { id: clientId },
    include: { preferences: true },
  });
  const recommendations = await db.recommendation.findMany({
    where: { clientId },
    include: { profile: true },
  });
  const feedback = await db.feedback.findMany({ where: { clientId } });
  for (const signal of deriveSignals(client, recommendations, feedback)) {
    const { signature, ...data } = signal;
    await db.preferenceSignal.upsert({
      where: { signature },
      create: signal,
      update: {
        description: data.description,
        evidence: data.evidence,
        confidence: data.confidence,
      },
    });
  }
}
