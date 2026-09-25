import test from "node:test";
import assert from "node:assert/strict";
import { freshness, isStale } from "../lib/freshness.js";
const now = Date.UTC(2026, 8, 26);
const ago = (days) => new Date(now - days * 86400000);
test("classifies profile freshness by days since confirmation", () => {
  assert.equal(freshness(ago(0), now).label, "Confirmed today");
  assert.equal(freshness(ago(1), now).label, "Confirmed yesterday");
  assert.equal(freshness(ago(30), now).status, "FRESH");
  assert.equal(freshness(ago(31), now).status, "AGING");
  assert.equal(freshness(ago(90), now).status, "AGING");
  assert.deepEqual(
    { status: freshness(ago(91), now).status, days: freshness(ago(91), now).days },
    { status: "STALE", days: 91 },
  );
});
test("treats a missing confirmation as unknown, not stale", () => {
  assert.equal(freshness(null, now).status, "UNKNOWN");
  assert.equal(isStale({ lastConfirmedAt: null }, now), false);
  assert.equal(isStale({ lastConfirmedAt: ago(120) }, now), true);
});
