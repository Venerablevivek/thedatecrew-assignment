import { test, expect } from "@playwright/test";
test("assistant shows sourced suggestions, opens the exact profile and clears client context", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const before = (await (await request.get("/api/clients/ananya")).json()).data;
  // Exercise the real server's guided path without spending a developer's Gemini quota.
  await page.route("**/api/assistant", async (route) => {
    if (route.request().method() === "POST")
      await route.continue({
        postData: JSON.stringify({ ...route.request().postDataJSON(), guided: true }),
      });
    else await route.continue();
  });
  await page.goto("/assistant?clientId=ananya");
  await expect(page.getByRole("heading", { name: "Your matchmaking assistant" })).toBeVisible();
  await page.getByRole("button", { name: /Who should I review next/ }).click();
  await expect(page.getByRole("heading", { name: "A focused shortlist to review" })).toBeVisible();
  await expect(
    page.getByText("Guided summary · generated from rules and records, not AI."),
  ).toBeVisible();
  const cards = page.locator(".assistant-profile");
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThanOrEqual(3);
  await page.getByText("View supporting records (1)", { exact: true }).click();
  await expect(page.locator(".assistant-evidence")).toContainText("unintroduced profiles");
  const name = await cards.first().locator("h3").textContent();
  await cards.first().click();
  await expect(page.getByRole("textbox", { name: "Search candidate profiles" })).toHaveValue(name);
  await expect(
    page.locator(".candidate-card").first().getByRole("heading", { name, exact: true }),
  ).toBeVisible();
  await page.goto("/assistant");
  await page.getByRole("button", { name: /Prepare my client brief/ }).click();
  await expect(page.getByRole("heading", { name: "Your client briefing" })).toBeVisible();
  const select = page.getByRole("combobox", { name: "Assistant client" });
  const other = await select
    .locator("option")
    .evaluateAll((els) => els.find((e) => e.value !== "ananya").value);
  await select.selectOption(other);
  await expect(page.locator(".assistant-answer")).toHaveCount(0);
  await expect(page.locator(".assistant-welcome")).toBeVisible();
  const after = (await (await request.get("/api/clients/ananya")).json()).data;
  expect(after).toEqual(before);
  expect(errors).toEqual([]);
});
test("assistant preserves failed questions and offers a guided recovery", async ({ page }) => {
  await page.route("**/api/assistant", async (route) => {
    const body = route.request().postDataJSON();
    if (!body.guided)
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: { message: "Gemini quota unavailable. Try guided summary." },
        }),
      });
    else await route.continue();
  });
  await page.goto("/assistant");
  await page
    .getByRole("textbox", { name: "Ask about this client" })
    .fill("What should I prioritize?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.locator(".assistant-chat [role=alert]")).toContainText(
    "Gemini quota unavailable",
  );
  await expect(page.getByRole("textbox", { name: "Ask about this client" })).toHaveValue(
    "What should I prioritize?",
  );
  await page.getByRole("button", { name: "Use guided summary" }).click();
  await expect(page.getByRole("heading", { name: "Your client briefing" })).toBeVisible();
});
test("assistant rejects malformed requests and unknown clients", async ({ request }) => {
  expect(
    (
      await request.post("/api/assistant", {
        data: { clientId: "ananya", mode: "question", question: "x".repeat(1201) },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/assistant", {
        data: { clientId: "missing-client", mode: "brief", question: "Brief", guided: true },
      })
    ).status(),
  ).toBe(404);
});
