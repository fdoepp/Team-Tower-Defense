/**
 * Probe: building upgrade panel icons are square, live-tinted, no yield overlap.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

mkdirSync("/opt/cursor/artifacts/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });

await page.locator("#solo").click();
await page.waitForTimeout(200);
await page.locator("#solo-next").click();
await page.waitForTimeout(200);
await page.locator("#start").click();
await page.waitForTimeout(700);

await page.evaluate(() => {
  const m = window.__match;
  m.gold = 9999;
  m.buildMenu = { blockId: 0, index: 1 };
  m.selectedSlot = m.buildMenu;
  if (!m.tryBuild("bier")) throw new Error("tryBuild failed");
});

const hit = await page.evaluate(() => {
  const canvas = document.querySelector("#c");
  const rect = canvas.getBoundingClientRect();
  for (let y = 0.35; y < 0.95; y += 0.025) {
    for (let x = 0.02; x < 0.55; x += 0.025) {
      canvas.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          clientX: rect.left + rect.width * x,
          clientY: rect.top + rect.height * y,
          pointerId: 1,
        }),
      );
      if (document.querySelector("#build-upgrade-rows:not(.hidden) .upgrade-panel")) {
        return true;
      }
    }
  }
  return false;
});
if (!hit) throw new Error("upgrade panel not opened");
await page.waitForTimeout(400);

const metrics = await page.evaluate(() => {
  const ico = document.querySelector("#build-up-ico-focus");
  const chip = document.querySelector("#build-up-yield-focus");
  const ir = ico?.getBoundingClientRect();
  const cr = chip?.getBoundingClientRect();
  const overlap =
    ir && cr
      ? !(
          ir.bottom <= cr.top ||
          cr.bottom <= ir.top ||
          ir.right <= cr.left ||
          cr.right <= ir.left
        )
      : true;
  const previews = [...document.querySelectorAll(".up-stand-ico")].map((img) => ({
    live: img.dataset.liveTint,
    ratio: img.clientHeight
      ? +(img.clientWidth / img.clientHeight).toFixed(2)
      : 0,
    data: (img.getAttribute("src") || "").startsWith("data:"),
  }));
  return {
    focus: {
      live: ico?.dataset.liveTint,
      w: ico?.clientWidth ?? 0,
      h: ico?.clientHeight ?? 0,
      ratio: ico?.clientHeight
        ? +(ico.clientWidth / ico.clientHeight).toFixed(2)
        : 0,
      data: (ico?.getAttribute("src") || "").startsWith("data:"),
    },
    overlap,
    previews,
  };
});

const box = await page.locator(".upgrade-panel").boundingBox();
if (box) {
  await page.screenshot({
    path: "/opt/cursor/artifacts/screenshots/upgrade_icons_ok.png",
    clip: {
      x: box.x - 8,
      y: box.y - 8,
      width: box.width + 16,
      height: box.height + 16,
    },
  });
}

const ok =
  hit &&
  !metrics.overlap &&
  metrics.focus.live === "1" &&
  metrics.focus.data &&
  metrics.focus.w >= 40 &&
  Math.abs(metrics.focus.ratio - 1) < 0.15 &&
  metrics.previews.length === 2 &&
  metrics.previews.every((p) => p.live === "1" && p.data && Math.abs(p.ratio - 1) < 0.15);

console.log(JSON.stringify({ ok, metrics }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
