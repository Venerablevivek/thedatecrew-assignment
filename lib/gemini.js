import { z } from "zod";
export const GEMINI_MODEL = "gemini-2.5-flash";
export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY?.trim());
export class GeminiError extends Error {
  constructor(message, status = 503, code = "AI_UNAVAILABLE") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export async function generateStructured(
  { system, input, schema, maxOutputTokens = 2048 },
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
  let response;
  try {
    response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.timeout(30000),
        cache: "no-store",
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json",
            responseJsonSchema: jsonSchema,
          },
        }),
      },
    );
  } catch {
    throw new GeminiError(
      "Gemini did not respond in time or could not be reached. Retry or use the manual option.",
    );
  }
  // Do not expose upstream payloads: they can include credentials or submitted content.
  if (response.status === 429)
    throw new GeminiError(
      "Gemini quota is temporarily unavailable. Check your AI Studio limits, wait, then retry. Manual review is still available.",
      429,
      "AI_QUOTA",
    );
  if ([400, 401, 403].includes(response.status))
    throw new GeminiError(
      "Gemini rejected the request. Check the server API key, project permissions and model access.",
      503,
      "AI_CONFIGURATION",
    );
  if (!response.ok)
    throw new GeminiError("Gemini is unavailable. Please retry later or use the manual option.");
  try {
    const payload = await response.json();
    const candidate = payload.candidates?.[0];
    if (payload.promptFeedback?.blockReason || candidate?.finishReason !== "STOP")
      throw new Error("Incomplete or blocked response");
    const text = candidate.content?.parts
      ?.filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("");
    return schema.parse(JSON.parse(text));
  } catch {
    throw new GeminiError(
      "Gemini could not return a complete, valid draft. Please retry or use the manual option.",
      503,
      "AI_INVALID_OUTPUT",
    );
  }
}
