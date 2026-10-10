/** Screenshot Ordnerpost smoke → fire → rubble destroy. */
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 30000 });
await page.locator("button:has-text('Solo'), #solo").first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(300);
await page.locator("#start, button:has-text('Anpfiff')").first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(700);

const findPost = () =>
  page.evaluate(() => {
    const m = window.__match;
    if (!m) return null;
    const s = m.slots.find((x) => x.building === "ordner" && x.structMaxHp > 0);
    if (!s) return null;
    return { b: s.blockId, i: s.index, hp: s.structHp, max: s.structMaxHp };
  });

let post = await findPost();
if (!post) {
  await page.evaluate(() => {
    const m = window.__match;
    m.gold = 200;
    for (const s of m.slots) {
      if (s.building || !m.inPlayerTerritory(s.blockId, s.index)) continue;
      m.buildMenu = { blockId: s.blockId, index: s.index };
      m.selectedSlot = m.buildMenu;
      if (m.tryBuild("ordner")) break;
    }
  });
  post = await findPost();
}

const setHpPct = async (pct) => {
  await page.evaluate((p) => {
    const m = window.__match;
    const s = m.slots.find((x) => x.building === "ordner" && x.structMaxHp > 0);
    if (!s) return;
    const target = Math.max(1, Math.floor(s.structMaxHp * p));
    const dmg = s.structHp - target;
    if (dmg > 0) m.damageOrdnerPost?.(s, dmg, m.fans[0]) ||
      (() => {
        // damageOrdnerPost is private — reduce HP then poke update + mirror FX via public path
        const prev = s.structHp;
        s.structHp = target;
        // force band burst by calling update enough; also manually push if exposed
        if (typeof m._testDamagePost === "function") m._testDamagePost(s, prev - target);
      })();
  }, pct);
};

// Use evaluate to apply damage through private method via bracket access in page context
const damageToPct = async (pct) => {
  await page.evaluate((p) => {
    const m = window.__match;
    const s = m.slots.find((x) => x.building === "ordner" && x.structMaxHp > 0);
    if (!s) return;
    const target = Math.max(1, Math.floor(s.structMaxHp * p));
    const dmg = Math.max(0, s.structHp - target);
    const atk = m.fans.find((f) => f.hp > 0) || m.fans[0];
    m["damageOrdnerPost"](s, dmg, atk);
    for (let i = 0; i < 8; i++) m.update(0.05);
  }, pct);
};

await damageToPct(0.4);
await page.waitForTimeout(200);
await page.screenshot({ path: "/opt/cursor/artifacts/post-fx-orange-smoke.png", fullPage: true });

await damageToPct(0.15);
await page.waitForTimeout(250);
await page.screenshot({ path: "/opt/cursor/artifacts/post-fx-red-fire.png", fullPage: true });

const destroyed = await page.evaluate(() => {
  const m = window.__match;
  const s = m.slots.find((x) => x.structMaxHp > 0 && x.building === "ordner")
    || m.slots.find((x) => x.blockId === 1 && x.index === 0);
  // find any remaining post or the one we damaged
  let target = m.slots.find((x) => x.building === "ordner" && x.structHp > 0);
  if (!target) {
    return { ok: false, reason: "no post" };
  }
  const key = `${target.blockId}:${target.index}`;
  const atk = m.fans.find((f) => f.hp > 0) || m.fans[0];
  m["damageOrdnerPost"](target, 99999, atk);
  for (let i = 0; i < 4; i++) m.update(0.05);
  const slot = m.slots.find((x) => `${x.blockId}:${x.index}` === key);
  return {
    ok: true,
    building: slot?.building ?? null,
    rubble: m.moodFx.filter((p) => p.kind === "rubble").length,
    smoke: m.moodFx.filter((p) => p.kind === "smoke").length,
    flame: m.moodFx.filter((p) => p.kind === "flame").length,
  };
});

await page.screenshot({ path: "/opt/cursor/artifacts/post-fx-destroy-rubble.png", fullPage: true });
console.log(JSON.stringify({ post, destroyed }, null, 2));
await browser.close();
