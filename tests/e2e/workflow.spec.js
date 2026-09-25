import { test, expect } from "@playwright/test";
test("complete reviewed-feedback workflow persists and creates a signal", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your matchmaking overview" })).toBeVisible();
  await page.getByRole("button", { name: "Live demo", exact: true }).click();
  await expect(page.getByText("Recorded decisions · updates as you work")).toBeVisible();
  const before = await (await request.get("/api/dashboard")).json();
  const queue = await (await request.get("/api/match-queue?clientId=ananya")).json();
  const candidate = queue.data.matches.find(
    (m) => m.eligible && !m.recommendation && m.profile.city === "Mumbai",
  );
  await page.goto("/match-queue?clientId=ananya");
  await expect(page.getByRole("heading", { name: "Find the next introduction" })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search candidate profiles" })
    .fill(candidate.profile.name);
  const card = page
    .locator(".candidate-card")
    .filter({ has: page.getByRole("heading", { name: candidate.profile.name, exact: true }) })
    .first();
  await card.getByRole("button", { name: "How this score was calculated" }).click();
  await expect(
    card.getByText("A transparent ranking aid, not a probability of compatibility."),
  ).toBeVisible();
  await card.getByRole("button", { name: "Mark shared" }).click();
  await expect(page.getByRole("status")).toContainText("Marked as shared");
  await page.getByRole("button", { name: /Decision history/ }).click();
  // Ranking order keeps the newly shared top profile in the first page of history.
  const shared = page
    .locator(".candidate-card")
    .filter({ has: page.getByRole("heading", { name: candidate.profile.name, exact: true }) })
    .first();
  await shared.getByRole("button", { name: "Reject", exact: true }).click();
  await page.getByRole("button", { name: "Use demo example" }).click();
  await page.getByRole("button", { name: "Analyze feedback", exact: true }).click();
  await expect(page.getByText(/Demo rules • no AI request/)).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Category 1", exact: true })).toHaveValue(
    "LIFESTYLE",
  );
  await expect(page.getByRole("combobox", { name: "Category 2", exact: true })).toHaveValue(
    "LOCATION",
  );
  // Analysis must not mutate the database.
  const draft = await (await request.get("/api/dashboard")).json();
  expect(draft.data.metrics.feedbackCount).toBe(before.data.metrics.feedbackCount);
  await page.getByLabel("I reviewed the interpretation against the client’s words.").check();
  await page.getByRole("button", { name: "Confirm & save" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const after = await (await request.get("/api/dashboard")).json();
  expect(after.data.metrics.feedbackCount).toBe(before.data.metrics.feedbackCount + 1);
  expect(after.data.metrics.profilesShared).toBe(before.data.metrics.profilesShared + 1);
  expect(after.data.metrics.rejected).toBe(before.data.metrics.rejected + 1);
  await page.goto("/clients/ananya");
  await expect(
    page.getByRole("heading", { name: "Lifestyle appears in repeated feedback" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Lifestyle appears in repeated feedback" }),
  ).toBeVisible();
});
test("signal confirmation and explicit preference application are separate", async ({
  page,
  request,
}) => {
  await page.goto("/clients/ananya");
  const card = page.locator(".signal-card").filter({
    has: page.getByRole("heading", { name: "Location may be more flexible than stated" }),
  });
  await card.getByRole("button", { name: "Confirm signal" }).click();
  await expect(
    card.getByText("Confirming the signal has not changed the preference."),
  ).toBeVisible();
  const before = await (await request.get("/api/clients/ananya")).json();
  expect(before.data.client.preferences.find((p) => p.key === "location").weight).toBe(1);
  await card.getByLabel("I confirmed location flexibility with the client.").check();
  await card.getByRole("button", { name: "Apply flexible location" }).click();
  await expect(card.getByText("Location flexibility applied by a human.")).toBeVisible();
  const after = await (await request.get("/api/clients/ananya")).json();
  expect(after.data.client.preferences.find((p) => p.key === "location").weight).toBe(0.25);
});
test("API rejects blocked sharing, invalid transitions, and malformed input", async ({
  request,
}) => {
  const q = await (await request.get("/api/match-queue?clientId=ananya")).json();
  const blocked = q.data.matches.find((m) => !m.eligible && !m.recommendation);
  expect(
    (
      await request.post("/api/recommendations", {
        data: { clientId: "ananya", profileId: blocked.profile.id, action: "SHARED" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/recommendations", {
        data: { clientId: "ananya", profileId: blocked.profile.id, action: "MEETING_COMPLETED" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/feedback/analyze", { data: { clientId: "ananya", feedback: "" } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/feedback", {
        headers: { "Content-Type": "application/json" },
        data: "{",
      })
    ).status(),
  ).toBe(400);
});
test("all pages render without browser errors or horizontal overflow", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const viewport of [
    { width: 1440, height: 1100 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of ["/dashboard", "/clients", "/clients/ananya", "/match-queue", "/feedback"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
