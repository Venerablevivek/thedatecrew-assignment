import { route } from "@/lib/api";
import { GEMINI_MODEL, geminiConfigured } from "@/lib/gemini";
export const GET = route(async () => ({
  model: GEMINI_MODEL,
  configured: geminiConfigured(),
  demoRules: process.env.DEMO_ANALYZER === "true",
}));
