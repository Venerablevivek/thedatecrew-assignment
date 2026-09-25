import test from "node:test";
import assert from "node:assert/strict";
import { demoAnalysis } from "../lib/ai.js";
import { analysisSchema } from "../lib/validation.js";
test("demo extractor returns labeled, schema-valid grounded reasons", () => {
  const text = "Nice profile, but feels too traditional for me and Mumbai makes things difficult.";
  const result = demoAnalysis(text, [{ key: "location" }]);
  assert.equal(result.reasons.length, 2);
  assert.equal(result.reasons[0].knownPreference, false);
  assert.equal(result.reasons[1].knownPreference, true);
  assert.ok(result.reasons.every((r) => text.includes(r.evidence)));
  assert.ok(analysisSchema.safeParse(result).success);
});
test("unrecognized language asks for human interpretation", () => {
  const d = demoAnalysis("I cannot explain why this is not right.", []);
  assert.equal(d.reasons[0].category, "OTHER");
  assert.equal(d.reasons[0].knownPreference, false);
});
