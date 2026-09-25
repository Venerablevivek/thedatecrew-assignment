import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
for (const [name, path] of [
  ["dashboard", "/dashboard"],
  ["clients", "/clients"],
  ["client-intelligence", "/clients/ananya"],
  ["match-queue", "/match-queue"],
  ["feedback", "/feedback"],
]) {
  await page.goto(`http://127.0.0.1:3000${path}`);
  await page.locator("h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `docs/screenshots/${name}.png`,
    fullPage: name === "client-intelligence",
  });
}
await page.goto("http://127.0.0.1:3000/match-queue");
await page.getByRole("textbox", { name: "Search candidate profiles" }).fill("Mumbai");
const candidateName = await page.locator(".candidate-card").first().locator("h2").textContent();
await page.locator(".candidate-card").first().getByRole("button", { name: "Mark shared" }).click();
await page.getByRole("button", { name: /Decision history/ }).click();
await page.getByRole("textbox", { name: "Search candidate profiles" }).fill(candidateName);
await page
  .locator(".candidate-card")
  .first()
  .getByRole("button", { name: "Reject", exact: true })
  .click();
await page.getByRole("button", { name: "Use demo example" }).click();
await page.getByRole("button", { name: "Analyze feedback", exact: true }).click();
await page.getByText("Review the interpretation").waitFor();
await page.setViewportSize({ width: 1440, height: 1600 });
await page.screenshot({ path: "docs/screenshots/feedback-analyzer.png" });
await page.getByRole("button", { name: "Close feedback" }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:3000/dashboard");
await page.locator("h1").waitFor();
await page.screenshot({ path: "docs/screenshots/mobile.png", fullPage: true });
await browser.close();
console.log("Captured six desktop views and a mobile overview.");
