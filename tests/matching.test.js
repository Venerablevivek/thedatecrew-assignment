import test from "node:test";
import assert from "node:assert/strict";
import { checkEligibility, scoreCandidate, rankCandidates, cityMatches } from "../lib/matching.js";
const client = {
  preferences: [
    { key: "age_range", value: { min: 29, max: 35 }, type: "HARD", weight: 1 },
    { key: "smoking", value: { allowed: false }, type: "HARD", weight: 1 },
    { key: "children", value: { desired: "YES" }, type: "HARD", weight: 1 },
    { key: "location", value: { cities: ["Delhi NCR"] }, type: "SOFT", weight: 1 },
    { key: "career_ambition", value: { level: "HIGH" }, type: "SOFT", weight: 0.9 },
    { key: "family_orientation", value: { level: "HIGH" }, type: "SOFT", weight: 0.8 },
  ],
  signals: [],
};
const profile = {
  id: "p",
  name: "Demo",
  active: true,
  age: 32,
  city: "Gurgaon",
  occupation: "Architect",
  smoking: "NO",
  children: "YES",
  relationshipIntent: "MARRIAGE",
  valuesSummary: "Family",
  lifestyleSummary: "Modern",
  attributes: { career_ambition: "HIGH", family_orientation: "HIGH", relocation: "OPEN" },
};
test("hard smoking conflict blocks a high-scoring profile", () => {
  assert.equal(checkEligibility(client, { ...profile, smoking: "YES" }).status, "BLOCKED");
  assert.equal(scoreCandidate(client, { ...profile, smoking: "YES" }).score, null);
});
test("unknown deal-breakers never pass eligibility", () => {
  assert.equal(checkEligibility(client, { ...profile, smoking: null }).status, "NEEDS_REVIEW");
  assert.equal(checkEligibility(client, { ...profile, children: "UNKNOWN" }).eligible, false);
});
test("age boundaries are inclusive and out-of-range ages fail", () => {
  for (const age of [29, 35])
    assert.equal(checkEligibility(client, { ...profile, age }).eligible, true);
  for (const age of [28, 36])
    assert.equal(checkEligibility(client, { ...profile, age }).eligible, false);
});
test("NCR normalization and soft location mismatch", () => {
  assert.equal(cityMatches("Noida", ["Delhi NCR"]), true);
  assert.equal(cityMatches("Mumbai", ["Delhi NCR"]), false);
  assert.equal(checkEligibility(client, { ...profile, city: "Mumbai" }).eligible, true);
});
test("strong fit has deterministic bounded score and matching breakdown", () => {
  const scored = scoreCandidate(client, profile);
  assert.equal(scored.score, 90);
  assert.equal(
    scored.score,
    Object.values(scored.breakdown).reduce((a, b) => a + b, 0),
  );
  assert.equal(scored.label, "Strong fit");
});
test("pending and confirmed-but-unapplied signals cannot change the ranking", () => {
  const baseline = scoreCandidate(client, profile);
  for (const status of ["PENDING_REVIEW", "CONFIRMED"]) {
    const result = scoreCandidate(
      { ...client, signals: [{ attributeKey: "location", status }] },
      profile,
      [{ acceptedAt: new Date(), profile }],
    );
    assert.equal(result.score, baseline.score);
  }
});
test("ranking puts eligible profiles before blocked candidates", () => {
  const ranked = rankCandidates(
    client,
    [
      { ...profile, name: "Conflict", smoking: "YES" },
      { ...profile, name: "Strong" },
    ],
    [],
  );
  assert.equal(ranked[0].profile.name, "Strong");
});
