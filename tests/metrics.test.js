import test from "node:test";
import assert from "node:assert/strict";
import { calculateMetrics } from "../lib/metrics.js";
import { deriveSignals } from "../lib/signals.js";
const at = new Date().toISOString();
test("later milestones remain counted in earlier funnel stages", () => {
  const rs = [
    {
      id: "1",
      status: "MEETING_COMPLETED",
      sharedAt: at,
      acceptedAt: at,
      contactSharedAt: at,
      conversationAt: at,
      meetingFixedAt: at,
      completedAt: at,
    },
    { id: "2", status: "SHARED", sharedAt: at },
    { id: "3", status: "REJECTED", sharedAt: at },
    { id: "4", status: "REJECTED", sharedAt: null },
  ];
  const f = [
    {
      recommendationId: "3",
      structured: {
        reasons: [
          { category: "LOCATION", knownPreference: true },
          { category: "LOCATION", knownPreference: true },
        ],
      },
    },
    {
      recommendationId: "4",
      structured: { reasons: [{ category: "AGE", knownPreference: true }] },
    },
  ];
  const d = calculateMetrics(rs, f, []);
  assert.equal(d.metrics.profilesShared, 3);
  assert.equal(d.metrics.profilesAccepted, 1);
  assert.equal(d.metrics.acceptanceRate, 33.3);
  assert.equal(d.metrics.avoidableRejectionRate, 100);
  assert.equal(d.metrics.pending, 1);
  assert.equal(d.rejectionReasons.find((r) => r.category === "LOCATION").count, 1);
});
test("empty metrics have no NaN", () => {
  const d = calculateMetrics([], [], []);
  assert.equal(d.metrics.acceptanceRate, 0);
  assert.equal(d.metrics.avoidableRejectionRate, 0);
});
test("contradiction uses the last five ACCEPTED decisions, including later stages", () => {
  const c = { id: "c", preferences: [{ key: "location", value: { cities: ["Delhi NCR"] } }] };
  const accepted = ["Mumbai", "Pune", "Bengaluru", "Delhi", "Noida"].map((city, i) => ({
    id: `a${i}`,
    acceptedAt: new Date(Date.now() - i * 1000),
    status: "MEETING_COMPLETED",
    profile: { city },
  }));
  const rejected = Array.from({ length: 8 }, (_, i) => ({
    id: `r${i}`,
    status: "REJECTED",
    createdAt: new Date(),
    profile: { city: "Mumbai" },
  }));
  const signals = deriveSignals(c, [...rejected, ...accepted], []);
  assert.equal(signals[0].evidence.count, 3);
  assert.equal(signals[0].evidence.total, 5);
});
test("repeated reasons count separate decisions, not duplicated tags", () => {
  const c = { id: "c", preferences: [] };
  const feedback = [1, 2].map((id) => ({
    id,
    structured: { reasons: [{ category: "LOCATION" }, { category: "LOCATION" }] },
  }));
  assert.equal(deriveSignals(c, [], feedback).length, 0);
  feedback.push({ id: 3, structured: { reasons: [{ category: "LOCATION" }] } });
  assert.equal(deriveSignals(c, [], feedback)[0].evidence.count, 3);
});
