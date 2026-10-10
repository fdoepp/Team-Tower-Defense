import { chromium } from "playwright";
import { STAND_WAIT_RADIUS } from "../src/game/layout.ts";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 30000 });
await page.locator("button:has-text('Solo'), #solo").first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(300);
await page.locator("#start, button:has-text('Anpfiff')").first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(800);

const setup = await page.evaluate(() => {
  const m = window.__match;
  if (!m) return { ok: false };
  m.gold = 800;
  m.currency.beer = 40;
  m.currency.merch = 40;
  m.currency.security = 80;
  let shops = 0;
  let biers = 0;
  for (const s of m.slots) {
    if (s.building || !m.inPlayerTerritory(s.blockId, s.index)) continue;
    if (s.blockId !== 0) continue;
    m.buildMenu = { blockId: s.blockId, index: s.index };
    m.selectedSlot = m.buildMenu;
    if (shops < 3 && m.tryBuild("fanshop")) {
      shops++;
      continue;
    }
    if (biers < 2 && m.tryBuild("bier")) {
      biers++;
      continue;
    }
  }
  for (let i = 0; i < 8; i++) m.tryBuyFanQuick("normalos");
  for (let i = 0; i < 4; i++) m.tryBuyFanQuick("hooligans");
  return { ok: true, shops, biers };
});

for (let i = 0; i < 140; i++) {
  await page.evaluate(() => {
    const m = window.__match;
    if (!m) return;
    for (let k = 0; k < 8; k++) m.update(0.05);
    m.tryBuyFanQuick?.("normalos");
  });
  await page.waitForTimeout(16);
}

await page.screenshot({
  path: "/opt/cursor/artifacts/stand-distribute-mid.png",
  fullPage: true,
});

const snap = await page.evaluate(() => {
  const m = window.__match;
  if (!m) return null;
  const stands = m.slots
    .filter(
      (s) =>
        s.owner === m.playerTeam &&
        (s.building === "fanshop" || s.building === "bier"),
    )
    .map((s) => {
      const key = `${s.blockId}:${s.index}`;
      const q = m.fans.filter(
        (f) =>
          f.hp > 0 &&
          !f.isSteward &&
          f.standKey === key &&
          (f.state === "stand" || f.state === "moving"),
      );
      const standing = q.filter((f) => f.state === "stand");
      let minD = null;
      for (let i = 0; i < standing.length; i++) {
        for (let j = i + 1; j < standing.length; j++) {
          const d = Math.hypot(
            standing[i].x - standing[j].x,
            standing[i].y - standing[j].y,
          );
          if (minD == null || d < minD) minD = d;
        }
      }
      return {
        key,
        building: s.building,
        queue: q.length,
        standing: standing.length,
        minDist: minD == null ? null : +minD.toFixed(4),
      };
    });
  return {
    minute: m.minute,
    score: [m.scoreKsc, m.scoreVfb],
    stands,
    targetsUsed: stands.filter((s) => s.queue > 0).length,
    maxQueue: Math.max(0, ...stands.map((s) => s.queue)),
  };
});

console.log(JSON.stringify({ setup, standWaitRadius: STAND_WAIT_RADIUS, snap }, null, 2));
await browser.close();
