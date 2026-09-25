import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { generateStructured, GEMINI_MODEL } from "../lib/gemini.js";
import { analyzeFeedback } from "../lib/ai.js";
import { feedbackSchema } from "../lib/validation.js";
const schema = z.object({ message: z.string().min(1) });
function withKey(t) {
  const old = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key-not-real";
  t.after(() => {
    if (old === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = old;
  });
}
const success = (value) => ({
  ok: true,
  status: 200,
  json: async () => ({
    candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(value) }] } }],
  }),
});
test("Gemini uses requested model, server header, bounded thinking and JSON schema", async (t) => {
  withKey(t);
  const result = await generateStructured(
    { system: "Test", input: { feedback: "example" }, schema },
    async (url, options) => {
      assert.ok(url.endsWith("/gemini-2.5-flash:generateContent"));
      assert.ok(!url.includes("test-key"));
      assert.equal(options.headers["x-goog-api-key"], "test-key-not-real");
      const body = JSON.parse(options.body);
      assert.equal(body.generationConfig.responseMimeType, "application/json");
      assert.equal(body.generationConfig.thinkingConfig.thinkingBudget, 0);
      assert.ok(body.generationConfig.responseJsonSchema.required.includes("message"));
      return success({ message: "Draft" });
    },
  );
  assert.equal(result.message, "Draft");
  assert.equal(GEMINI_MODEL, "gemini-2.5-flash");
});
test("quota errors are actionable and do not retry or leak upstream messages", async (t) => {
  withKey(t);
  let calls = 0;
  await assert.rejects(
    generateStructured({ schema }, async () => {
      calls++;
      return { ok: false, status: 429 };
    }),
    (e) => e.code === "AI_QUOTA" && e.status === 429,
  );
  assert.equal(calls, 1);
});
test("invalid credentials produce configuration errors", async (t) => {
  withKey(t);
  await assert.rejects(
    generateStructured({ schema }, async () => ({ ok: false, status: 403 })),
    (e) => e.code === "AI_CONFIGURATION",
  );
});
test("truncated, blocked, malformed and schema-invalid responses are rejected", async (t) => {
  withKey(t);
  for (const payload of [
    { candidates: [{ finishReason: "MAX_TOKENS" }] },
    { promptFeedback: { blockReason: "SAFETY" } },
    { candidates: [{ finishReason: "STOP", content: { parts: [{ text: "bad-json" }] } }] },
    { candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"other":1}' }] } }] },
  ])
    await assert.rejects(
      generateStructured({ schema }, async () => ({ ok: true, json: async () => payload })),
      (e) => e.code === "AI_INVALID_OUTPUT",
    );
});
test("transport failures return safe retry messaging", async (t) => {
  withKey(t);
  await assert.rejects(
    generateStructured({ schema }, async () => {
      throw new Error("sensitive transport details");
    }),
    (e) => e.code === "AI_UNAVAILABLE" && !e.message.includes("sensitive"),
  );
});
test("no key makes no network request", async (t) => {
  withKey(t);
  delete process.env.GEMINI_API_KEY;
  let calls = 0;
  await assert.rejects(
    generateStructured({ schema }, async () => {
      calls++;
    }),
    (e) => e.code === "AI_NOT_CONFIGURED",
  );
  assert.equal(calls, 0);
});
test("Gemini feedback is grounded and its source can be saved", async (t) => {
  withKey(t);
  const output = {
    decision: "REJECTED",
    summary: "Location concern",
    reasons: [
      {
        category: "LOCATION",
        label: "Too far",
        strength: "HIGH",
        knownPreference: true,
        evidence: "Mumbai is too far",
      },
    ],
    suggestPreferenceReview: true,
  };
  t.mock.method(globalThis, "fetch", async () => success(output));
  const result = await analyzeFeedback("Mumbai is too far", [
    { key: "location", value: { cities: ["Delhi"] }, type: "SOFT" },
  ]);
  assert.equal(result.source, "GEMINI");
  assert.ok(
    feedbackSchema.safeParse({
      clientId: "c",
      profileId: "p",
      rawText: "Mumbai is too far",
      structured: result.analysis,
      source: result.source,
      wasEdited: false,
    }).success,
  );
  await assert.rejects(
    analyzeFeedback("A completely different concern", []),
    /Unsupported feedback evidence/,
  );
});
