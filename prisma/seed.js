import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { refreshSignals } from "../lib/signals.js";
const names = [
  "Rahul Mehra",
  "Arjun Kapoor",
  "Kabir Sethi",
  "Rohan Malhotra",
  "Aarav Shah",
  "Vikram Rao",
  "Aditya Nair",
  "Ishaan Khanna",
  "Dev Patel",
  "Karan Bhatia",
  "Nikhil Menon",
  "Siddharth Jain",
];
const surnames = ["Mehra", "Kapoor", "Sethi", "Malhotra", "Shah"];
const firstNames = [
  "Vivaan",
  "Yash",
  "Dhruv",
  "Pranav",
  "Samar",
  "Vedant",
  "Krish",
  "Manav",
  "Ayaan",
  "Harsh",
  "Neil",
  "Varun",
];
const cities = ["Delhi", "Mumbai", "Bengaluru", "Gurgaon", "Pune", "Noida"];
const occupations = [
  "Product Lead",
  "Architect",
  "Founder",
  "Design Director",
  "Strategy Consultant",
  "Engineering Manager",
];
const clientNames = [
  "Ananya Sharma",
  "Maya Kapoor",
  "Isha Mehta",
  "Tara Sethi",
  "Riya Malhotra",
  "Kavya Rao",
  "Naina Shah",
  "Sara Menon",
];
const day = (n) => new Date(Date.now() - n * 86400000);
// Mirrors the freshness backfill migration: Mumbai profiles stay recent, others vary.
const confirmedDaysAgo = (i) => (i % 6 === 1 ? (i * 7) % 25 : (i * 37) % 150);
async function seed() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_RESET !== "true")
    throw new Error("Set ALLOW_DEMO_RESET=true to reset a production demo database.");
  await prisma.$transaction(
    async (db) => {
      await db.feedback.deleteMany();
      await db.preferenceSignal.deleteMany();
      await db.recommendation.deleteMany();
      await db.clientPreference.deleteMany();
      await db.client.deleteMany();
      await db.candidateProfile.deleteMany();
      await db.matchmaker.deleteMany();
      await db.matchmaker.createMany({
        data: [
          { id: "mm-a", name: "Aditi · Matchmaker A" },
          { id: "mm-b", name: "Neha · Matchmaker B" },
        ],
      });
      for (let i = 0; i < 60; i++)
        await db.candidateProfile.create({
          data: {
            id: `profile-${i + 1}`,
            name:
              i < 12 ? names[i] : `${firstNames[i % 12]} ${surnames[Math.floor((i - 12) / 12)]}`,
            age: 29 + (i % 8),
            city: cities[i % 6],
            occupation: occupations[i % 6],
            smoking: i % 11 === 8 ? "YES" : i % 17 === 10 ? null : "NO",
            children: i % 13 === 9 ? "NO" : "YES",
            relationshipIntent: "MARRIAGE",
            lastConfirmedAt: day(confirmedDaysAgo(i)),
            attributes: {
              career_ambition: i % 5 === 4 ? "MEDIUM" : "HIGH",
              family_orientation: i % 4 === 3 ? "MEDIUM" : "HIGH",
              lifestyle: i % 3 === 2 ? "TRADITIONAL" : "MODERN",
              relocation: i % 4 === 0 ? "UNKNOWN" : "OPEN",
            },
            valuesSummary:
              "Values a thoughtful partnership, family connection, and a meaningful career.",
            lifestyleSummary:
              i % 3 === 2
                ? "Enjoys a traditional, family-centred routine."
                : "An independent outlook, weekend travel, and time with close friends.",
          },
        });
      const sizes = [12, 12, 13, 13, 17, 17, 18, 18],
        acceptedCounts = [5, 5, 6, 6, 4, 4, 4, 3];
      let feedbackCount = 0;
      for (let i = 0; i < 8; i++) {
        const id = i === 0 ? "ananya" : `client-${i + 1}`;
        const prefs = [
          { key: "age_range", value: { min: 29, max: 35 }, type: "HARD", weight: 1 },
          { key: "smoking", value: { allowed: false }, type: "HARD", weight: 1 },
          { key: "children", value: { desired: "YES" }, type: "HARD", weight: 1 },
          {
            key: "location",
            value: { cities: i === 0 ? ["Delhi NCR"] : [cities[i % 6]] },
            type: "SOFT",
            weight: 1,
          },
          { key: "career_ambition", value: { level: "HIGH" }, type: "SOFT", weight: 0.9 },
          { key: "family_orientation", value: { level: "HIGH" }, type: "SOFT", weight: 0.8 },
        ];
        await db.client.create({
          data: {
            id,
            name: clientNames[i],
            age: 29 + (i % 5),
            city: cities[i % 6],
            occupation: ["Product Manager", "Brand Strategist", "Architect", "Consultant"][i % 4],
            matchmakerId: i < 4 ? "mm-a" : "mm-b",
            preferences: { create: prefs },
          },
        });
        const preferenceSnapshot = prefs;
        for (let j = 0; j < sizes[i]; j++) {
          const accepted = j < acceptedCounts[i],
            rejected = !accepted && j < acceptedCounts[i] + 5;
          const completed = accepted && j === 0,
            fixed = accepted && j <= 1,
            conversation = accepted && j <= 2,
            contact = accepted && j <= 3;
          const status = completed
            ? "MEETING_COMPLETED"
            : fixed
              ? "MEETING_FIXED"
              : conversation
                ? "CONVERSATION_STARTED"
                : contact
                  ? "CONTACT_SHARED"
                  : accepted
                    ? "ACCEPTED"
                    : rejected
                      ? "REJECTED"
                      : "SHARED";
          const rec = await db.recommendation.create({
            data: {
              id: `rec-${i}-${j}`,
              clientId: id,
              profileId: `profile-${j + 1}`,
              matchmakerId: i < 4 ? "mm-a" : "mm-b",
              status,
              sharedAt: day(20 - (j % 10)),
              acceptedAt: accepted ? day(14 - j) : null,
              contactSharedAt: contact ? day(8) : null,
              conversationAt: conversation ? day(6) : null,
              meetingFixedAt: fixed ? day(4) : null,
              completedAt: completed ? day(2) : null,
              preferenceSnapshot,
              createdAt: day(20 - (j % 10)),
            },
          });
          if (rejected) {
            const category = j % 2 === 0 ? "LIFESTYLE" : "LOCATION";
            const known = feedbackCount < 14;
            const actualCategory = known ? "LOCATION" : category;
            const raw =
              actualCategory === "LOCATION"
                ? "The location makes meeting regularly difficult."
                : "The lifestyle feels too traditional for me.";
            await db.feedback.create({
              data: {
                clientId: id,
                recommendationId: rec.id,
                rawText: raw,
                aiSummary:
                  actualCategory === "LOCATION" ? "Geographic mismatch" : "Lifestyle mismatch",
                source: "MANUAL",
                structured: {
                  decision: "REJECTED",
                  summary: raw,
                  reasons: [
                    {
                      category: actualCategory,
                      label:
                        actualCategory === "LOCATION"
                          ? "Geographic mismatch"
                          : "Traditional lifestyle",
                      strength: "MEDIUM",
                      knownPreference: known,
                      evidence: raw,
                    },
                  ],
                  suggestPreferenceReview: true,
                },
                createdAt: day(10 - (j % 5)),
              },
            });
            feedbackCount++;
          }
        }
      }
      // Ananya has exactly two reviewed lifestyle concerns: the next one creates a new signal.
      const feedback = await db.feedback.findMany({
        where: { clientId: "ananya" },
        orderBy: { id: "asc" },
      });
      for (const f of feedback.slice(-2))
        await db.feedback.update({
          where: { id: f.id },
          data: {
            rawText: "Feels too traditional for me.",
            structured: {
              decision: "REJECTED",
              summary: "Traditional lifestyle",
              reasons: [
                {
                  category: "LIFESTYLE",
                  label: "Traditional lifestyle",
                  strength: "MEDIUM",
                  knownPreference: false,
                  evidence: "Feels too traditional for me.",
                },
              ],
              suggestPreferenceReview: true,
            },
          },
        });
      // Keep the synthetic known-preference baseline at 14 of 40 while preserving the demo story.
      const replacements = await db.feedback.findMany({ where: { clientId: "client-8" }, take: 2 });
      for (const f of replacements)
        await db.feedback.update({
          where: { id: f.id },
          data: {
            rawText: "The location makes meeting regularly difficult.",
            structured: {
              decision: "REJECTED",
              summary: "Geographic mismatch",
              reasons: [
                {
                  category: "LOCATION",
                  label: "Geographic mismatch",
                  strength: "MEDIUM",
                  knownPreference: true,
                  evidence: "The location makes meeting regularly difficult.",
                },
              ],
              suggestPreferenceReview: true,
            },
          },
        });
      for (const c of await db.client.findMany()) await refreshSignals(db, c.id);
    },
    // Generous limit: every insert is a network round-trip on hosted databases such as Neon.
    { timeout: 180000, maxWait: 20000 },
  );
  console.log(
    "Seeded 8 synthetic clients, 60 profiles, 120 recommendations, 40 feedback records, and evidence-based signals.",
  );
}
seed().finally(() => prisma.$disconnect());
