/**
 * UI smoke: Nation pick + match with DE vs NL flags.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

mkdirSync("/opt/cursor/artifacts/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });

await page.locator("#solo").click();
await page.waitForTimeout(400);

const nationBtn = page.locator('[data-pick="national"]');
if ((await nationBtn.count()) === 0) throw new Error("Nation pick button missing");
await nationBtn.click();
await page.waitForTimeout(350);

const modes = await page.locator(".pick-mode").count();
console.log("pick modes", modes);
if (modes < 3) throw new Error("expected 3 pick modes");

// Ensure Klassiker DE–NL if available
const fix = page.locator("#nation-fixture");
if ((await fix.count()) > 0) {
  const opts = await fix.locator("option").allTextContents();
  console.log("fixtures sample", opts.slice(0, 3));
  await fix.selectOption("de-nl").catch(async () => {
    await fix.selectOption({ index: 0 });
  });
  await page.waitForTimeout(200);
}

const player = await page.locator("#player-club").inputValue();
const ai = await page.locator("#ai-club").inputValue();
console.log("nations", player, ai);

await page.screenshot({
  path: "/opt/cursor/artifacts/screenshots/national_matchup_denl.png",
  fullPage: true,
});

// Kit logos present
const logos = await page.locator(".kit-logo").count();
console.log("kit logos", logos);
if (logos < 2) throw new Error("kit logos missing");

await page.locator("#solo-next").click();
await page.waitForTimeout(400);

if ((await page.locator("#start").count()) === 0) {
  throw new Error("setup/Anpfiff missing after Nation matchup");
}
await page.screenshot({
  path: "/opt/cursor/artifacts/screenshots/national_setup_denl.png",
  fullPage: true,
});
await page.locator("#start").click();
await page.waitForTimeout(800);

const canvas = page.locator("canvas");
if ((await canvas.count()) === 0) throw new Error("match canvas missing");
await page.waitForTimeout(1200);
await page.screenshot({
  path: "/opt/cursor/artifacts/screenshots/national_match_denl.png",
  fullPage: true,
});

console.log("OK");
await browser.close();
