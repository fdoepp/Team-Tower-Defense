/**
 * Probe: derby club kit colors on world + DOM (liveTint).
 * Expect CEL green / BVB yellow after Frei pick.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const OUT = "/opt/cursor/artifacts/screenshots";
await mkdir(OUT, { recursive: true });
const base = process.env.BASE_URL || "http://127.0.0.1:5173/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
await page.goto(base + "?probe=livetint", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

await page.locator("button", { hasText: /^Frei$/ }).click();
await page.selectOption("#player-club", "celtic");
await page.selectOption("#ai-club", "bvb");
await page.locator("button", { hasText: /Solo/i }).first().click();
await page.waitForTimeout(120);
const next = page.locator("button", { hasText: /Aufstellung/i }).first();
if (await next.count()) await next.click({ force: true });
await page.locator("button", { hasText: /Anpfiff/i }).first().click({ force: true });
await page.waitForSelector("canvas", { timeout: 20000 });
await page.waitForTimeout(1200);
await page.locator("#tool-personen").click({ force: true });
await page.waitForTimeout(700);

const live = await page.evaluate(() => {
  const sample = (nx, ny, r = 14) => {
    const c = document.querySelector("canvas");
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const w = c.width;
    const h = c.height;
    const x = Math.floor(nx * w);
    const y = Math.floor(ny * h);
    const d = ctx.getImageData(Math.max(0, x - r), Math.max(0, y - r), r * 2, r * 2).data;
    let R = 0,
      G = 0,
      B = 0,
      n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue;
      R += d[i];
      G += d[i + 1];
      B += d[i + 2];
      n++;
    }
    return n ? { r: Math.round(R / n), g: Math.round(G / n), b: Math.round(B / n) } : null;
  };
  const units = [...document.querySelectorAll("#person-rail img")].filter((i) =>
    /fan|ultra|hooligan|ordner/.test(i.dataset.liveTintSrc || ""),
  );
  return {
    clubs: [window.__match?.cfg?.settings?.playerClub, window.__match?.cfg?.settings?.aiClub],
    cssKsc: getComputedStyle(document.documentElement).getPropertyValue("--ksc").trim(),
    cssVfb: getComputedStyle(document.documentElement).getPropertyValue("--vfb").trim(),
    leftTribune: sample(0.18, 0.38),
    rightTribune: sample(0.82, 0.38),
    domDataUrls: units.filter((i) => (i.getAttribute("src") || "").startsWith("data:")).length,
    domTotal: units.length,
  };
});

await page.screenshot({ path: `${OUT}/livetint-cel-bvb-persons.png` });

const worldOk =
  live.leftTribune &&
  live.rightTribune &&
  live.leftTribune.g > live.leftTribune.r + 25 &&
  live.rightTribune.r > 120 &&
  live.rightTribune.g > 100;
const domOk = live.domDataUrls >= 6;
const cssOk = live.cssKsc.toLowerCase() === "#018749" && live.cssVfb.toLowerCase() === "#fde100";

const result = {
  ok: worldOk && domOk && cssOk,
  worldOk,
  domOk,
  cssOk,
  live,
  verdict: worldOk && domOk
    ? "LiveTint: tribunes/units/DOM pull club kit colors (CEL green / BVB yellow)."
    : "LiveTint incomplete",
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.ok ? 0 : 2);
