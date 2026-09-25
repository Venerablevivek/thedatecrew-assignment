import "dotenv/config";
import { test, expect } from "@playwright/test";
import { prisma } from "../../lib/prisma.js";
const suffix = Date.now().toString(),
  cid = `tools-client-${suffix}`,
  mid = `tools-maker-${suffix}`;
let profiles = [],
  recs = [];
test.beforeAll(async () => {
  await prisma.matchmaker.create({ data: { id: mid, name: "Tools verification" } });
  await prisma.client.create({
    data: {
      id: cid,
      name: "Tools Test Client",
      age: 30,
      city: "Delhi",
      matchmakerId: mid,
      preferences: {
        create: [
          { key: "smoking", type: "HARD", value: { allowed: false } },
          { key: "location", type: "SOFT", value: { cities: ["Delhi"] }, weight: 1 },
        ],
      },
    },
  });
  for (let i = 0; i < 3; i++) {
    const p = await prisma.candidateProfile.create({
      data: {
        id: `tools-profile-${suffix}-${i}`,
        name: `Tools Candidate ${i}`,
        age: 32,
        city: i === 0 ? "Mumbai" : "Delhi",
        smoking: "NO",
        children: "YES",
        occupation: "Architect",
        attributes: {},
      },
    });
    profiles.push(p);
    if (i < 2)
      recs.push(
        await prisma.recommendation.create({
          data: {
            clientId: cid,
            profileId: p.id,
            matchmakerId: mid,
            status: "ACCEPTED",
            sharedAt: new Date(),
            acceptedAt: new Date(),
          },
        }),
      );
  }
});
test.afterAll(async () => {
  await prisma.client.deleteMany({ where: { id: cid } });
  await prisma.candidateProfile.deleteMany({ where: { id: { in: profiles.map((p) => p.id) } } });
  await prisma.matchmaker.deleteMany({ where: { id: mid } });
  await prisma.$disconnect();
});
test("compare, simulate, review a draft, and record reciprocal information", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const before = await prisma.clientPreference.findMany({ where: { clientId: cid } });
  await page.goto(`/match-queue?clientId=${cid}`);
  await expect(page.getByRole("combobox", { name: "Matching for" })).toHaveValue(cid);
  await page.getByRole("button", { name: /Decision history/ }).click();
  await page.getByRole("checkbox", { name: "Compare Tools Candidate 0", exact: true }).check();
  await page.getByRole("checkbox", { name: "Compare Tools Candidate 1", exact: true }).check();
  await page.getByRole("button", { name: "Compare profiles (2/3)", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Tools Candidate 0" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Tools Candidate 1" })).toBeVisible();
  await page.getByRole("button", { name: "Close panel" }).click();
  await page.getByRole("button", { name: "What-if preview", exact: true }).click();
  const slider = page.getByRole("slider").first();
  await slider.fill("0");
  await expect(slider).toHaveValue("0");
  await expect(page.getByText(/Simulation only/)).toBeVisible();
  await page.getByRole("button", { name: "Reset preview" }).click();
  await expect(slider).toHaveValue("1");
  await page.getByRole("button", { name: "Close panel" }).click();
  expect(await prisma.clientPreference.findMany({ where: { clientId: cid } })).toEqual(before);
  const card = page
    .locator(".candidate-card")
    .filter({ has: page.getByRole("heading", { name: "Tools Candidate 0", exact: true }) });
  await card.getByRole("button", { name: "Draft introduction", exact: true }).click();
  await page.getByRole("button", { name: "Generate introduction draft" }).click();
  await expect(page.getByRole("textbox", { name: "Introduction", exact: true })).toContainText(
    "Tools Candidate 0",
  );
  await expect(page.getByRole("button", { name: "Copy reviewed draft" })).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "I checked the draft against the recorded facts." })
    .check();
  await expect(page.getByRole("button", { name: "Copy reviewed draft" })).toBeEnabled();
  await page.getByRole("textbox", { name: "Introduction", exact: true }).fill("Edited draft");
  await expect(page.getByRole("button", { name: "Copy reviewed draft" })).toBeDisabled();
  await page.getByRole("button", { name: "Close panel" }).click();
  await card.getByRole("button", { name: "Two-sided: Incomplete" }).click();
  await page.getByRole("spinbutton", { name: "Minimum partner age" }).fill("25");
  await page.getByRole("spinbutton", { name: "Maximum partner age" }).fill("35");
  await page
    .getByRole("combobox", { name: "Open to introductions", exact: true })
    .selectOption("YES");
  await page
    .getByRole("checkbox", {
      name: "I verified the recorded information with the relevant people.",
    })
    .check();
  await page.getByRole("button", { name: "Save verified information" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(card.getByRole("button", { name: "Two-sided: Aligned" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Decision history/ }).click();
  await expect(card.getByRole("button", { name: "Two-sided: Aligned" })).toBeVisible();
  expect(errors).toEqual([]);
});
test("meeting plans persist, reject stale edits, prevent overlaps and guard acceptance", async ({
  page,
  request,
}) => {
  await page.goto("/meetings");
  const card = page
    .locator(".meeting-card")
    .filter({ has: page.getByRole("heading", { name: "Tools Test Client & Tools Candidate 0" }) });
  await card.getByRole("button", { name: "Plan meeting" }).click();
  await page
    .getByRole("textbox", { name: "Client availability", exact: true })
    .fill("Saturday afternoon");
  await page
    .getByRole("textbox", { name: "Candidate availability", exact: true })
    .fill("Saturday after 3 pm");
  await page.getByLabel("Meeting time", { exact: true }).fill("2099-01-01T15:00");
  await page.getByRole("textbox", { name: "Location or call link" }).fill("Demo cafe");
  await page.getByRole("combobox", { name: "Meeting status" }).selectOption("SCHEDULED");
  await page
    .getByRole("checkbox", { name: "Both participants confirmed this time and location." })
    .check();
  await page.getByRole("button", { name: "Save meeting plan" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(card.getByText("Demo cafe", { exact: true })).toBeVisible();
  const m = await prisma.meeting.findUnique({ where: { recommendationId: recs[0].id } });
  const payload = {
    recommendationId: recs[0].id,
    version: 0,
    clientAvailability: "",
    candidateAvailability: "",
    scheduledAt: m.scheduledAt.toISOString(),
    durationMinutes: 60,
    location: "Demo cafe",
    status: "SCHEDULED",
    followUpAt: null,
    followUpDone: false,
    notes: "",
    confirmed: true,
  };
  expect((await request.post("/api/meetings", { data: payload })).status()).toBe(409);
  expect(
    (
      await request.post("/api/meetings", { data: { ...payload, recommendationId: recs[1].id } })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/meetings", {
        data: { ...payload, version: m.version, confirmed: false },
      })
    ).status(),
  ).toBe(400);
  const nonaccepted = await prisma.recommendation.create({
    data: { clientId: cid, profileId: profiles[2].id, matchmakerId: mid, status: "SHARED" },
  });
  expect(
    (
      await request.post("/api/meetings", {
        data: { ...payload, recommendationId: nonaccepted.id },
      })
    ).status(),
  ).toBe(409);
  const saved = await request.post("/api/meetings", {
    data: { ...payload, version: m.version, status: "CANCELLED" },
  });
  expect(saved.status()).toBe(200);
  expect(
    (await prisma.meeting.findUnique({ where: { recommendationId: recs[0].id } })).status,
  ).toBe("CANCELLED");
});
test("known reciprocal conflicts block sharing and drafting at API boundary", async ({
  request,
}) => {
  const p = profiles[2];
  await prisma.recommendation.deleteMany({ where: { clientId: cid, profileId: p.id } });
  await prisma.candidateProfile.update({
    where: { id: p.id },
    data: {
      partnerRequirements: {
        reviewedAt: new Date().toISOString(),
        openToIntroductions: "YES",
        preferences: [{ key: "age_range", value: { min: 40, max: 50 }, type: "HARD", weight: 1 }],
      },
    },
  });
  expect(
    (
      await request.post("/api/recommendations", {
        data: { clientId: cid, profileId: p.id, action: "SHARED" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/introductions", { data: { clientId: cid, profileId: p.id } })
    ).status(),
  ).toBe(409);
});
