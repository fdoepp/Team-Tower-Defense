/**
 * UI smoke: Vereine/National scope + Klassiker DE–NL.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

mkdirSync("/opt/cursor/artifacts/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });

await page.locator("#solo").click();
await page.waitForTimeout(400);

const nationBtn = page.locator('[data-scope="nations"]');
if ((await nationBtn.count()) === 0) {
  throw new Error("Nationalmannschaften button missing");
}
await nationBtn.click();
await page.waitForTimeout(350);

const scopes = await page.locator("[data-scope]").count();
const picks = await page.locator("[data-pick]").count();
console.log("scopes", scopes, "sub picks", picks);
if (scopes < 2 || picks < 2) throw new Error("expected scope + sub pick rows");

const fix = page.locator("#nation-fixture");
if ((await fix.count()) === 0) throw new Error("nation-fixture missing in Klassiker");
const opts = await fix.locator("option").allTextContents();
console.log("fixtures", opts.length, opts.slice(0, 3));
if (opts.length < 8) throw new Error("expected ~10 national derbies");
await fix.selectOption("de-nl").catch(async () => {
  await fix.selectOption({ index: 0 });
});
await page.waitForTimeout(200);

await page.locator('[data-pick="free"]').click();
await page.waitForTimeout(200);
const nations = await page.locator("#player-club option").count();
console.log("free nations", nations);
if (nations < 25) throw new Error("expected FIFA Top 25+ nations");

await page.screenshot({
  path: "/opt/cursor/artifacts/screenshots/national_matchup_ui.png",
  fullPage: true,
});

await page.locator('[data-pick="fixture"]').click();
await page.waitForTimeout(150);
await page.locator("#solo-next").click();
await page.waitForTimeout(200);
await page.locator("#start").click();
await page.waitForTimeout(1200);
await page.screenshot({
  path: "/opt/cursor/artifacts/screenshots/national_denl_match.png",
  fullPage: true,
});

await browser.close();
console.log("national-ui-smoke OK");
