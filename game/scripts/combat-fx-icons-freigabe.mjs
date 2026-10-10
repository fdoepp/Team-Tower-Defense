/**
 * Nachhaken + Freigabe stills: Team-Faust, Pyro-Projektil, Heilungssymbol.
 */
import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: "/tmp/combat-fx-icons-vid", size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 30000 });
await page.locator("button:has-text('Solo'), #solo").first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(250);
await page.locator("#start, button:has-text('Anpfiff')").first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(700);

await page.evaluate(() => {
  const m = window.__match;
  m.gold = 500;
  m.currency.beer = 80;
  m.currency.merch = 80;
  m.currency.security = 80;
  for (const s of m.slots) {
    if (s.building || !m.inPlayerTerritory?.(s.blockId, s.index) || s.blockId !== 0) continue;
    m.buildMenu = { blockId: s.blockId, index: s.index };
    m.selectedSlot = m.buildMenu;
    m.tryBuild("ordner");
    break;
  }
  for (let i = 0; i < 3; i++) {
    m.tryBuyFanQuick("hooligans");
    m.tryBuyFanQuick("ultras");
  }
});

// --- Nahkampf: team fists (blue + red) ---
await page.evaluate(() => {
  const m = window.__match;
  const h =
    m.fans.find((f) => f.hp > 0 && f.kind === "hooligans" && f.team === m.playerTeam) ||
    m.fans.find((f) => f.hp > 0 && f.kind === "hooligans");
  let foe = m.fans.find((f) => f.hp > 0 && f.isSteward && f.team !== m.playerTeam);
  if (!foe) foe = m.fans.find((f) => f.hp > 0 && f.isSteward);
  if (!h || !foe) return;
  h.state = "gang";
  h.onOffense = true;
  h.rangedPyro = false;
  h.x = 0.45;
  h.y = 0.6;
  h.throwT = 0;
  h.armSwing = 1;
  h.attackCd = 0.55;
  foe.state = "gang";
  foe.x = 0.55;
  foe.y = 0.6;
  foe.throwT = 0;
  foe.armSwing = 1;
  foe.attackCd = 0.5;
  m.moodFx.push(
    {
      kind: "fistBlue",
      x: 0.48,
      y: 0.57,
      vx: 0.01,
      vy: -0.05,
      color: "#60a5fa",
      t: 0.05,
      life: 0.42,
      size: 0.02,
    },
    {
      kind: "fistRed",
      x: 0.52,
      y: 0.57,
      vx: -0.01,
      vy: -0.05,
      color: "#f87171",
      t: 0.05,
      life: 0.42,
      size: 0.02,
    },
    {
      kind: "fistGrey",
      x: 0.5,
      y: 0.54,
      vx: 0,
      vy: -0.04,
      color: "#a8a29e",
      t: 0.02,
      life: 0.45,
      size: 0.02,
    },
  );
  m.update(0.016);
});
await page.waitForTimeout(60);
await page.screenshot({ path: `${OUT}/freigabe_fx_nahkampf_faust.png`, fullPage: true });
await page.screenshot({
  path: `${OUT}/freigabe_fx_nahkampf_faust_close.png`,
  clip: { x: 420, y: 280, width: 440, height: 320 },
});

// --- Fernkampf: pyro projectile ---
await page.evaluate(() => {
  const m = window.__match;
  m.moodFx = [];
  m.pyroShots = [];
  const u =
    m.fans.find((f) => f.hp > 0 && f.kind === "ultras" && f.team === m.playerTeam) ||
    m.fans.find((f) => f.hp > 0 && f.kind === "ultras");
  if (!u) return;
  u.state = "gang";
  u.rangedPyro = true;
  u.x = 0.38;
  u.y = 0.6;
  u.throwT = 0.28;
  u.armSwing = 1;
  m.pyroShots.push({
    x: 0.48,
    y: 0.58,
    vx: 0.55,
    vy: -0.05,
    damage: 10,
    attackerId: u.id,
    targetFanId: null,
    targetSlotKey: null,
    team: u.team,
    t: 0.15,
    life: 0.55,
  });
  m.pyroShots.push({
    x: 0.58,
    y: 0.56,
    vx: 0.5,
    vy: 0.02,
    damage: 10,
    attackerId: u.id,
    targetFanId: null,
    targetSlotKey: null,
    team: u.team,
    t: 0.22,
    life: 0.55,
  });
  m.update(0.016);
});
await page.waitForTimeout(40);
await page.screenshot({ path: `${OUT}/freigabe_fx_pyro_shot.png`, fullPage: true });
await page.screenshot({
  path: `${OUT}/freigabe_fx_pyro_shot_close.png`,
  clip: { x: 400, y: 260, width: 480, height: 340 },
});

// --- Heilung ---
await page.evaluate(() => {
  const m = window.__match;
  m.pyroShots = [];
  m.moodFx = [];
  const st = m.fans.find((f) => f.hp > 0 && f.isSteward) || m.fans[0];
  if (!st) return;
  st.state = "gang";
  st.x = 0.5;
  st.y = 0.58;
  st.hp = Math.max(1, st.maxHp * 0.45);
  st.armSwing = 0;
  st.throwT = 0;
  m.moodFx.push(
    {
      kind: "heal",
      x: 0.5,
      y: 0.54,
      vx: 0,
      vy: -0.05,
      color: "#4ade80",
      t: 0.08,
      life: 0.9,
      size: 0.022,
    },
    {
      kind: "heal",
      x: 0.48,
      y: 0.56,
      vx: -0.01,
      vy: -0.04,
      color: "#4ade80",
      t: 0.2,
      life: 0.9,
      size: 0.018,
    },
  );
  m.update(0.016);
});
await page.waitForTimeout(40);
await page.screenshot({ path: `${OUT}/freigabe_fx_heal.png`, fullPage: true });
await page.screenshot({
  path: `${OUT}/freigabe_fx_heal_close.png`,
  clip: { x: 440, y: 260, width: 400, height: 320 },
});

// Icon sheet for Freigabe gallery
await page.setContent(`<!doctype html><html><body style="margin:0;background:#1c1917;display:flex;gap:24px;padding:32px;align-items:center;justify-content:center;font-family:system-ui">
${["fx-fist-blue","fx-fist-red","fx-fist-grey","fx-heal","fx-pyro-shot"].map((n) =>
  `<div style="text-align:center;color:#e7e5e4"><img src="http://127.0.0.1:5173/icons/ui-final/${n}.png" width="160" height="160" style="background:repeating-conic-gradient(#444 0% 25%,#333 0% 50%) 50%/16px 16px"/><div style="margin-top:8px;font-size:13px">${n}</div></div>`
).join("")}
</body></html>`);
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/freigabe_fx_icons_sheet.png`, fullPage: true });

const vid = page.video();
await context.close();
await browser.close();
if (vid) {
  const tmp = await vid.path();
  fs.copyFileSync(tmp, `${OUT}/freigabe_fx_icons_demo.webm`);
}
console.log("wrote freigabe_fx_* artifacts");
