import { z } from "zod";
export const CATEGORIES = [
  "LOCATION",
  "AGE",
  "SMOKING",
  "CHILDREN",
  "RELIGION",
  "DIET",
  "CAREER",
  "EDUCATION",
  "FAMILY",
  "LIFESTYLE",
  "VALUES",
  "PERSONALITY",
  "COMMUNICATION",
  "ATTRACTION",
  "RELATIONSHIP_INTENT",
  "OTHER",
];
export const reasonSchema = z.object({
  category: z.enum(CATEGORIES),
  label: z.string().min(1).max(180),
  strength: z.enum(["LOW", "MEDIUM", "HIGH"]),
  knownPreference: z.boolean(),
  evidence: z.string().max(1000),
});
export const analysisSchema = z.object({
  decision: z.literal("REJECTED"),
  summary: z.string().min(1).max(500),
  reasons: z.array(reasonSchema).min(1).max(8),
  suggestPreferenceReview: z.boolean(),
});
export const actionSchema = z.object({
  clientId: z.string().min(1),
  profileId: z.string().min(1),
  action: z.enum([
    "SHORTLISTED",
    "SHARED",
    "ACCEPTED",
    "CONTACT_SHARED",
    "CONVERSATION_STARTED",
    "MEETING_FIXED",
    "MEETING_COMPLETED",
  ]),
  // Required to share a profile whose details have not been confirmed recently.
  acknowledgeStale: z.boolean().optional(),
});
export const analyzeSchema = z.object({
  clientId: z.string().min(1),
  profileId: z.string().min(1),
  feedback: z.string().trim().min(5).max(4000),
});
export const feedbackSchema = z.object({
  clientId: z.string().min(1),
  profileId: z.string().min(1),
  rawText: z.string().trim().min(5).max(4000),
  structured: analysisSchema,
  wasEdited: z.boolean(),
  source: z.enum(["GEMINI", "OPENAI", "DEMO_RULES", "MANUAL"]),
});
export const signalSchema = z.object({ status: z.enum(["CONFIRMED", "DISMISSED"]) });
