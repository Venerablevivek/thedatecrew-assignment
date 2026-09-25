import { route } from "@/lib/api";
import { GEMINI_MODEL, geminiConfigured, geminiModels } from "@/lib/gemini";
export const GET = route(async () => ({
  model: GEMINI_MODEL,
  fallbacks: geminiModels().slice(1),
  configured: geminiConfigured(),
  demoRules: process.env.DEMO_ANALYZER === "true",
}));
