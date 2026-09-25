import { z } from "zod";
const id = z.string().min(1).max(100);
export const pairSchema = z.object({ clientId: id, profileId: id });
const choice = z.enum(["YES", "NO", "UNKNOWN"]);
export const compatibilitySchema = pairSchema
  .extend({
    confirmed: z.literal(true),
    minAge: z.number().int().min(18).max(100).nullable(),
    maxAge: z.number().int().min(18).max(100).nullable(),
    cities: z.array(z.string().trim().min(1).max(80)).max(20),
    smoking: choice,
    children: choice,
    intent: z.enum(["MARRIAGE", "LONG_TERM", "UNKNOWN"]),
    openToIntroductions: choice,
    clientSmoking: choice,
    clientChildren: choice,
    clientIntent: z.enum(["MARRIAGE", "LONG_TERM", "UNKNOWN"]),
  })
  .refine((d) => (d.minAge === null) === (d.maxAge === null), {
    message: "Enter both ends of the age range or leave both empty.",
  })
  .refine((d) => d.minAge === null || d.minAge <= d.maxAge, {
    message: "Minimum age must not exceed maximum age.",
  });
export const meetingSchema = z
  .object({
    recommendationId: id,
    version: z.number().int().min(0),
    clientAvailability: z.string().trim().max(1000),
    candidateAvailability: z.string().trim().max(1000),
    scheduledAt: z.string().datetime().nullable(),
    durationMinutes: z.number().int().min(15).max(480),
    location: z.string().trim().max(300),
    status: z.enum(["PLANNING", "SCHEDULED", "COMPLETED", "CANCELLED"]),
    followUpAt: z.string().datetime().nullable(),
    followUpDone: z.boolean(),
    notes: z.string().trim().max(3000),
    confirmed: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (
      ["SCHEDULED", "COMPLETED"].includes(d.status) &&
      (!d.scheduledAt || !d.location || !d.confirmed)
    )
      ctx.addIssue({
        code: "custom",
        message: "Confirm both participants and provide a meeting time and location.",
      });
    if (d.status === "COMPLETED" && d.scheduledAt && new Date(d.scheduledAt) > new Date())
      ctx.addIssue({ code: "custom", message: "A future meeting cannot be completed." });
    if (d.followUpAt && d.scheduledAt && new Date(d.followUpAt) < new Date(d.scheduledAt))
      ctx.addIssue({ code: "custom", message: "Follow-up must be after the meeting." });
  });
