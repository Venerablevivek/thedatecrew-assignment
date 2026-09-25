import { checkEligibility, preferenceMatch, preferenceLabel, rankCandidates } from "./matching.js";
export function simulateMatches(client, profiles, weights, history = []) {
  const preferences = client.preferences.map((p) => ({
    ...p,
    weight:
      p.type === "SOFT" && Object.hasOwn(weights, p.id)
        ? Math.max(0, Math.min(2, Number(weights[p.id])))
        : p.weight,
  }));
  return rankCandidates({ ...client, preferences }, profiles, history);
}
export function reciprocalCheck(client, profile) {
  const forward = checkEligibility(client, profile);
  const record = profile.partnerRequirements;
  const preferences = record?.preferences || [];
  const facts = { ...(client.facts || {}), age: client.age, city: client.city };
  const rows = preferences.map((p) => ({
    label: preferenceLabel(p),
    match: preferenceMatch(p, facts),
  }));
  const conflicts = rows.filter((r) => r.match === false).map((r) => r.label);
  const unknowns = rows.filter((r) => r.match === null).map((r) => r.label);
  if (!record?.reviewedAt || !preferences.length)
    unknowns.push("Candidate requirements have not been recorded");
  if (!record?.openToIntroductions || record.openToIntroductions === "UNKNOWN")
    unknowns.push("Candidate willingness to receive introductions is not confirmed");
  const unavailable = record?.openToIntroductions === "NO";
  const status =
    (!forward.eligible && forward.failures.length) || conflicts.length || unavailable
      ? "CONFLICT"
      : !forward.eligible || unknowns.length
        ? "INCOMPLETE"
        : "ALIGNED";
  return {
    status,
    forward,
    rows,
    conflicts,
    unknowns,
    unavailable,
    reviewedAt: record?.reviewedAt || null,
  };
}
export function introductionFacts(client, profile) {
  return [
    { id: "name", text: `Name: ${profile.name}` },
    { id: "age", text: `Age: ${profile.age}` },
    { id: "city", text: `City: ${profile.city}` },
    ...(profile.occupation
      ? [{ id: "occupation", text: `Occupation: ${profile.occupation}` }]
      : []),
    ...(profile.valuesSummary
      ? [{ id: "values", text: `Profile values: ${profile.valuesSummary}` }]
      : []),
    ...(profile.lifestyleSummary
      ? [{ id: "lifestyle", text: `Profile lifestyle: ${profile.lifestyleSummary}` }]
      : []),
    ...client.preferences
      .filter((p) => preferenceMatch(p, profile) === true)
      .map((p, i) => ({
        id: `match-${i}`,
        text: `Matches stated preference: ${preferenceLabel(p)}`,
      })),
  ];
}
