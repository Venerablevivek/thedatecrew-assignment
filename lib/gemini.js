import { z } from "zod";
// Tried in order. Each model has its own free-tier quota, so falling back to a *different*
// model after a 429 or an overload helps; retrying the same model does not.
// Override with GEMINI_MODELS="model-a,model-b" (comma-separated) in the environment.
export const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-lite",
];
export const GEMINI_MODEL = DEFAULT_GEMINI_MODELS[0];
export const geminiModels = () => {
  const custom = process.env.GEMINI_MODELS?.split(",")
    .map((m) => m.trim())
    .filter((m) => /^[a-z0-9.-]+$/i.test(m));
  return custom?.length ? custom : DEFAULT_GEMINI_MODELS;
};
export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY?.trim());
// "gemini-3.5-flash-lite" → "Gemini 3.5 Flash Lite"
export const modelLabel = (model) =>
  model
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
// At most this many network calls per request, so one click can never burn through quotas.
export const MAX_MODEL_CALLS = 3;
const CALL_TIMEOUT_MS = 30000;
const TOTAL_BUDGET_MS = 55000;
// Models that recently failed are skipped (no request is made) until their cooldown ends.
// In-memory per server instance: enough to stop hammering a rate-limited model.
const cooldowns = new Map();
export const resetGeminiCooldowns = () => cooldowns.clear();
const coolDown = (model, ms) => cooldowns.set(model, Date.now() + ms);
const coolingDown = (model) => (cooldowns.get(model) || 0) > Date.now();
export class GeminiError extends Error {
  constructor(message, status = 503, code = "AI_UNAVAILABLE") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
// Google includes RetryInfo ("37s") and QuotaFailure (per-minute vs per-day) details on 429s.
function quotaCooldownMs(details = []) {
  const perDay = details.some((d) =>
    (d.violations || []).some((v) => /PerDay/i.test(v.quotaId || "")),
  );
  if (perDay) return 60 * 60000;
  const delay = details.find((d) => d.retryDelay)?.retryDelay;
  const seconds = Number.parseFloat(delay);
  return Number.isFinite(seconds) ? Math.min(seconds * 1000 + 1000, 10 * 60000) : 60000;
}
// Gemini 2.5 accepts thinkingBudget 0 (fast, no thinking); newer models reject that setting.
const thinkingFor = (model) =>
  model.startsWith("gemini-2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {};
async function callModel(model, key, { system, input, jsonSchema, maxOutputTokens }, fetcher) {
  let response;
  try {
    response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
        cache: "no-store",
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens,
            ...thinkingFor(model),
            responseMimeType: "application/json",
            responseJsonSchema: jsonSchema,
          },
        }),
      },
    );
  } catch {
    return { kind: "unavailable" };
  }
  if (response.ok) return { kind: "ok", response };
  // Read the upstream error only to classify it; it is never returned to the browser.
  let error = {};
  try {
    error = (await response.json())?.error || {};
  } catch {}
  const keyProblem =
    [401, 403].includes(response.status) ||
    (response.status === 400 &&
      ((error.details || []).some((d) => /API_KEY/i.test(d.reason || "")) ||
        /api key/i.test(error.message || "")));
  if (keyProblem) return { kind: "config" };
  if (response.status === 429) return { kind: "quota", cooldown: quotaCooldownMs(error.details) };
  // 404: model not available to this key; 400: model rejects these settings.
  if ([400, 404].includes(response.status)) return { kind: "unsupported", cooldown: 60 * 60000 };
  return { kind: "unavailable", cooldown: 60000 };
}
function parseOutput(payload, schema) {
  const candidate = payload.candidates?.[0];
  if (payload.promptFeedback?.blockReason || candidate?.finishReason !== "STOP")
    throw new Error("Incomplete or blocked response");
  const text = candidate.content?.parts
    ?.filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
  return schema.parse(JSON.parse(text));
}
/**
 * Generates schema-validated JSON, falling back across models on quota, overload, timeout,
 * unsupported-model or invalid-output failures. Pass `meta = {}` to learn which model answered.
 */
export async function generateStructured(
  { system, input, schema, maxOutputTokens = 2048, meta },
  fetcher = fetch,
) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key)
    throw new GeminiError(
      "Add a Gemini API key on the server to enable AI.",
      503,
      "AI_NOT_CONFIGURED",
    );
  const jsonSchema = z.toJSONSchema(schema);
  delete jsonSchema.$schema;
  const started = Date.now();
  const outcomes = [];
  for (const model of geminiModels()) {
    if (outcomes.length >= MAX_MODEL_CALLS || Date.now() - started > TOTAL_BUDGET_MS) break;
    if (coolingDown(model)) continue;
    const callStarted = Date.now();
    const result = await callModel(
      model,
      key,
      { system, input, jsonSchema, maxOutputTokens },
      fetcher,
    );
    if (result.kind === "config")
      throw new GeminiError(
        "Gemini rejected the request. Check the server API key and project permissions.",
        503,
        "AI_CONFIGURATION",
      );
    if (result.kind === "ok") {
      try {
        const data = parseOutput(await result.response.json(), schema);
        console.info(`[gemini] ${model} ok in ${Date.now() - callStarted}ms`);
        if (meta)
          Object.assign(meta, { model, label: modelLabel(model), attempts: outcomes.length + 1 });
        return data;
      } catch {
        console.warn(`[gemini] ${model} invalid output after ${Date.now() - callStarted}ms`);
        outcomes.push("invalid");
        continue;
      }
    }
    // Model name and outcome only: never log prompts, responses or keys.
    console.warn(
      `[gemini] ${model} ${result.kind} after ${Date.now() - callStarted}ms` +
        (result.cooldown ? `; skipping it for ${Math.round(result.cooldown / 1000)}s` : ""),
    );
    if (result.cooldown) coolDown(model, result.cooldown);
    outcomes.push(result.kind);
  }
  // Do not expose upstream payloads: they can include credentials or submitted content.
  if (!outcomes.length || outcomes.every((o) => o === "quota"))
    throw new GeminiError(
      "AI models are at their usage limit. Wait a minute, then retry, or use the guided or manual option.",
      429,
      "AI_QUOTA",
    );
  if (outcomes.every((o) => o === "invalid"))
    throw new GeminiError(
      "Gemini could not return a complete, valid draft. Please retry or use the manual option.",
      503,
      "AI_INVALID_OUTPUT",
    );
  throw new GeminiError(
    "AI models are busy or unavailable right now. Please retry shortly or use the manual option.",
  );
}
