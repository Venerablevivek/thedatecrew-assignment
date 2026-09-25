import test from "node:test";
import assert from "node:assert/strict";
import { simulateMatches, reciprocalCheck, introductionFacts } from "../lib/match-tools.js";
import { compatibilitySchema, meetingSchema } from "../lib/tools-validation.js";
const client = {
  age: 30,
  city: "Delhi",
  preferences: [
    { id: "hard", key: "smoking", type: "HARD", value: { allowed: false }, weight: 1 },
    { id: "soft", key: "location", type: "SOFT", value: { cities: ["Delhi"] }, weight: 1 },
  ],
  signals: [],
};
const profile = {
  id: "p",
  name: "A",
  age: 32,
  city: "Mumbai",
  active: true,
  smoking: "NO",
  attributes: {},
};
test("what-if never mutates input or relaxes hard constraints", () => {
  const before = JSON.stringify(client);
  const rows = simulateMatches(client, [profile, { ...profile, id: "blocked", smoking: "YES" }], {
    hard: 0,
    soft: 0,
  });
  assert.equal(JSON.stringify(client), before);
  assert.equal(rows.find((r) => r.profile.id === "blocked").eligible, false);
  assert.equal(rows.find((r) => r.profile.id === "p").eligible, true);
});
test("reciprocal missing data remains unknown, preferences are not client facts", () => {
  assert.equal(reciprocalCheck(client, profile).status, "INCOMPLETE");
  const p = {
    ...profile,
    partnerRequirements: {
      reviewedAt: "2026-09-25",
      openToIntroductions: "YES",
      preferences: [client.preferences[0]],
    },
  };
  assert.equal(reciprocalCheck(client, p).status, "INCOMPLETE");
  assert.equal(reciprocalCheck({ ...client, facts: { smoking: "YES" } }, p).status, "CONFLICT");
  assert.equal(reciprocalCheck({ ...client, facts: { smoking: "NO" } }, p).status, "ALIGNED");
  p.partnerRequirements.openToIntroductions = "NO";
  assert.equal(reciprocalCheck({ ...client, facts: { smoking: "NO" } }, p).status, "CONFLICT");
});
test("introduction fact pack contains only recorded facts and matching preferences", () => {
  const facts = introductionFacts(client, profile);
  assert.ok(!facts.some((f) => f.text.includes("Occupation")));
  assert.ok(!facts.some((f) => f.text.includes("Delhi")));
  assert.ok(facts.some((f) => f.text.includes("Non-smoker")));
});
const meeting = {
  recommendationId: "r",
  version: 0,
  clientAvailability: "",
  candidateAvailability: "",
  scheduledAt: null,
  durationMinutes: 60,
  location: "",
  status: "PLANNING",
  followUpAt: null,
  followUpDone: false,
  notes: "",
  confirmed: false,
};
test("scheduled meetings require time, location and participant confirmation", () => {
  assert.equal(meetingSchema.safeParse(meeting).success, true);
  assert.equal(meetingSchema.safeParse({ ...meeting, status: "SCHEDULED" }).success, false);
  assert.equal(
    meetingSchema.safeParse({
      ...meeting,
      status: "SCHEDULED",
      scheduledAt: "2099-01-01T10:00:00.000Z",
      location: "Cafe",
      confirmed: true,
    }).success,
    true,
  );
  assert.equal(
    meetingSchema.safeParse({
      ...meeting,
      status: "COMPLETED",
      scheduledAt: "2099-01-01T10:00:00.000Z",
      location: "Cafe",
      confirmed: true,
    }).success,
    false,
  );
  assert.equal(
    meetingSchema.safeParse({
      ...meeting,
      scheduledAt: "2099-01-01T10:00:00.000Z",
      followUpAt: "2098-01-01T10:00:00.000Z",
    }).success,
    false,
  );
});
test("verified requirements reject inverted or partial age ranges", () => {
  const fields = {
    clientId: "c",
    profileId: "p",
    confirmed: true,
    minAge: 35,
    maxAge: 30,
    cities: [],
    smoking: "UNKNOWN",
    children: "UNKNOWN",
    intent: "UNKNOWN",
    openToIntroductions: "UNKNOWN",
    clientSmoking: "UNKNOWN",
    clientChildren: "UNKNOWN",
    clientIntent: "UNKNOWN",
  };
  assert.equal(compatibilitySchema.safeParse(fields).success, false);
  assert.equal(compatibilitySchema.safeParse({ ...fields, minAge: null }).success, false);
  assert.equal(compatibilitySchema.safeParse({ ...fields, minAge: 25 }).success, true);
});
