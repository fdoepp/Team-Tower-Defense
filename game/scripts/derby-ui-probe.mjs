/**
 * Browser smoke: free-pick Leverkusen vs Liverpool, check branding in match.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const OUT = "/opt/cursor/artifacts/screenshots";
await mkdir(OUT, { recursive: true });
const base = process.env.BASE_URL || "http://127.0.0.1:5173/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
await page.goto(base, { waitUntil: "networkidle" });

// Switch to free pick
await page.locator("button", { hasText: /^Frei$/ }).click();
await page.waitForTimeout(150);

await page.selectOption("#player-club", "leverkusen");
await page.waitForTimeout(100);
await page.selectOption("#ai-club", "liverpool");
await page.waitForTimeout(100);

const menuPreview = await page.evaluate(() => {
  const line = document.querySelector(".match-line")?.textContent ?? "";
  const ksc = getComputedStyle(document.documentElement).getPropertyValue("--ksc").trim();
  const vfb = getComputedStyle(document.documentElement).getPropertyValue("--vfb").trim();
  return { line, ksc, vfb };
});
console.log("MENU", menuPreview);
await page.screenshot({ path: `${OUT}/derby-menu-b04-liv.png`, fullPage: false });

await page.locator("button", { hasText: /Solo/i }).first().click();
await page.waitForTimeout(250);
// Tutorial → setup
const next = page.locator("button", { hasText: /Aufstellung|Weiter|Anpfiff/i }).first();
if (await next.count()) {
  const t = await next.textContent();
  if (/Aufstellung|Weiter/i.test(t || "")) {
    await next.click({ force: true });
    await page.waitForTimeout(200);
  }
}
await page.locator("button", { hasText: /Anpfiff/i }).first().click({ force: true });
await page.waitForSelector("canvas", { timeout: 20000 });
await page.waitForTimeout(600);

const live = await page.evaluate(() => {
  const m = window.__match;
  const root = getComputedStyle(document.documentElement);
  return {
    playerClub: m?.cfg?.settings?.playerClub,
    aiClub: m?.cfg?.settings?.aiClub,
    playerTeam: m?.playerTeam,
    aiTeam: m?.aiTeam,
    cssKsc: root.getPropertyValue("--ksc").trim(),
    cssVfb: root.getPropertyValue("--vfb").trim(),
    toastCapable: typeof m?.pushToast === "function",
  };
});
console.log("MATCH", live);
await page.screenshot({ path: `${OUT}/derby-match-b04-liv.png`, fullPage: false });

// Also check derby path: England → North West → Liverpool
await page.goto(base, { waitUntil: "networkidle" });
await page.locator("button", { hasText: /^Derby$/ }).click();
await page.selectOption("#country", "England");
await page.waitForTimeout(100);
await page.selectOption("#derby", "northwest");
await page.waitForTimeout(100);
await page.selectOption("#side", "a"); // Liverpool
const derbyMenu = await page.evaluate(() => ({
  line: document.querySelector(".match-line")?.textContent ?? "",
  hint: document.querySelector(".derby-hint")?.textContent ?? "",
  ksc: getComputedStyle(document.documentElement).getPropertyValue("--ksc").trim(),
  vfb: getComputedStyle(document.documentElement).getPropertyValue("--vfb").trim(),
}));
console.log("DERBY_NW", derbyMenu);
await page.screenshot({ path: `${OUT}/derby-menu-northwest.png`, fullPage: false });

const ok =
  menuPreview.line.includes("B04") &&
  menuPreview.line.includes("LIV") &&
  live.playerClub === "leverkusen" &&
  live.aiClub === "liverpool" &&
  live.cssKsc.toLowerCase() === "#e32221" &&
  live.cssVfb.toLowerCase() === "#c8102e" &&
  derbyMenu.line.includes("LIV") &&
  derbyMenu.line.includes("MUN");

console.log(JSON.stringify({ ok, menuPreview, live, derbyMenu }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
