export const WEIGHTS = { preferences: 45, values: 25, history: 20, completeness: 10 };
export const pretty = (value) =>
  String(value || "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
const normalizeCity = (city) =>
  ["delhi", "new delhi", "gurgaon", "gurugram", "noida", "delhi ncr"].includes(
    String(city).toLowerCase(),
  )
    ? "delhi ncr"
    : String(city).toLowerCase();
export const cityMatches = (city, cities = []) =>
  cities.some((c) => normalizeCity(c) === normalizeCity(city));
export function preferenceLabel(p) {
  if (p.key === "age_range") return `Age ${p.value.min}–${p.value.max}`;
  if (p.key === "smoking") return p.value.allowed ? "Smoking accepted" : "Non-smoker";
  if (p.key === "children")
    return p.value.desired === "YES" ? "Wants children" : "Does not want children";
  if (p.key === "location") return p.value.cities.join(", ");
  return `${pretty(p.key)}: ${pretty(p.value.level || p.value.desired)}`;
}
export function preferenceMatch(p, profile) {
  const value = profile[p.key] ?? profile.attributes?.[p.key];
  if (p.key === "age_range")
    return Number.isFinite(profile.age)
      ? profile.age >= p.value.min && profile.age <= p.value.max
      : null;
  if (p.key === "location") return profile.city ? cityMatches(profile.city, p.value.cities) : null;
  if (value == null || value === "UNKNOWN" || value === "") return null;
  if (p.key === "smoking") return value === (p.value.allowed ? "YES" : "NO");
  if (p.key === "children") return value === p.value.desired;
  return value === (p.value.level || p.value.desired);
}
export function checkEligibility(client, profile) {
  const failures = [],
    unknowns = [],
    passed = [];
  if (!profile.active) failures.push("Profile is not active");
  for (const p of client.preferences.filter((p) => p.type === "HARD")) {
    const match = preferenceMatch(p, profile);
    if (match === null) unknowns.push(`${preferenceLabel(p)} — information missing`);
    else if (!match) failures.push(`${preferenceLabel(p)} — confirmed conflict`);
    else passed.push(preferenceLabel(p));
  }
  return {
    eligible: failures.length === 0 && unknowns.length === 0,
    status: failures.length ? "BLOCKED" : unknowns.length ? "NEEDS_REVIEW" : "ELIGIBLE",
    failures,
    unknowns,
    passed,
  };
}
export function scoreCandidate(client, profile, history = []) {
  const eligibility = checkEligibility(client, profile);
  if (!eligibility.eligible)
    return {
      profile,
      ...eligibility,
      score: null,
      label: eligibility.status === "BLOCKED" ? "Known conflict" : "Needs clarification",
      breakdown: {},
      matched: eligibility.passed,
      warnings: [...eligibility.failures, ...eligibility.unknowns],
      explanation: "Resolve the requirements before recommending this profile.",
    };
  const soft = client.preferences.filter(
    (p) => p.type === "SOFT" && !["family_orientation", "lifestyle"].includes(p.key),
  );
  const values = client.preferences.filter(
    (p) => p.type === "SOFT" && ["family_orientation", "lifestyle"].includes(p.key),
  );
  const ratio = (prefs) =>
    prefs.length
      ? prefs.reduce(
          (n, p) =>
            n +
            (preferenceMatch(p, profile) === true
              ? 1
              : preferenceMatch(p, profile) === null
                ? 0.5
                : 0) *
              p.weight,
          0,
        ) / (prefs.reduce((n, p) => n + p.weight, 0) || 1)
      : 0.5;
  const approvedLocation = client.signals?.some(
    (s) => s.attributeKey === "location" && s.appliedAt,
  );
  const accepted = history.filter((r) => r.acceptedAt);
  const cityHistory = accepted.filter(
    (r) => r.profile && cityMatches(profile.city, [r.profile.city]),
  ).length;
  const historical =
    approvedLocation && accepted.length
      ? Math.min(1, 0.5 + cityHistory / accepted.length / 2)
      : 0.5;
  const fields = [
    profile.age,
    profile.city,
    profile.occupation,
    profile.smoking,
    profile.children,
    profile.relationshipIntent,
    profile.valuesSummary,
    profile.lifestyleSummary,
    profile.attributes?.relocation,
    profile.attributes?.career_ambition,
  ];
  const breakdown = {
    preferences: Math.round(ratio(soft) * 45),
    values: Math.round(ratio(values) * 25),
    history: Math.round(historical * 20),
    completeness: Math.round(
      (fields.filter((v) => v != null && v !== "UNKNOWN").length / fields.length) * 10,
    ),
  };
  const score = Object.values(breakdown).reduce((n, v) => n + v, 0);
  const matched = [
    ...eligibility.passed,
    ...client.preferences
      .filter((p) => p.type === "SOFT" && preferenceMatch(p, profile) === true)
      .map(preferenceLabel),
  ];
  const warnings = client.preferences
    .filter((p) => p.type === "SOFT" && preferenceMatch(p, profile) !== true)
    .map(
      (p) =>
        `${preferenceLabel(p)} — ${preferenceMatch(p, profile) === null ? "unknown" : "outside preference"}`,
    );
  if (!profile.attributes?.relocation || profile.attributes.relocation === "UNKNOWN")
    warnings.push("Relocation flexibility is not confirmed");
  return {
    profile,
    ...eligibility,
    score,
    breakdown,
    matched,
    warnings,
    label: score >= 85 ? "Strong fit" : score >= 70 ? "Worth reviewing" : "Mixed signals",
    explanation: `Meets all ${eligibility.passed.length} hard requirements. ${matched.length - eligibility.passed.length} soft preferences align.${warnings.length ? " Review the open questions below." : " No known preference conflicts."}`,
    historyNote: approvedLocation
      ? "Uses accepted-city history after an explicit preference update."
      : "Neutral history baseline; unconfirmed signals do not affect ranking.",
  };
}
export const rankCandidates = (client, profiles, history) =>
  profiles
    .map((p) => scoreCandidate(client, p, history))
    .sort(
      (a, b) =>
        Number(b.eligible) - Number(a.eligible) ||
        (b.score ?? -1) - (a.score ?? -1) ||
        a.profile.name.localeCompare(b.profile.name),
    );
