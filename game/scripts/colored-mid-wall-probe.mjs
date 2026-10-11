/**
 * Blue/red Ordnerposts on formerly neutral mid must hard-wall advance
 * until destroyed (unlike grey-only damage gating for shoppers).
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const OUT = "/opt/cursor/artifacts";
await mkdir(`${OUT}/screenshots`, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/local/bin/google-chrome",
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });

async function clickText(re) {
  const el = page.locator("button", { hasText: re }).first();
  await el.waitFor({ state: "visible", timeout: 10000 });
  await el.click({ force: true });
}
await clickText(/Solo/i);
await page.waitForTimeout(120);
const tut = page.locator("button", { hasText: /Aufstellung|Weiter|Anpfiff/i }).first();
if (await tut.count()) {
  const t = await tut.textContent();
  if (/Aufstellung|Weiter/i.test(t || "")) {
    await tut.click({ force: true });
    await page.waitForTimeout(120);
  }
}
await clickText(/Anpfiff/i);
await page.waitForFunction(() => !!window.__match, null, { timeout: 20000 });

const result = await page.evaluate(async () => {
  const m = window.__match;
  m.speed = 0;
  m.gold = 9999;
  m.currency.beer = 200;
  m.currency.merch = 200;

  for (const f of m.fans) if (f.isSteward) f.hp = 0;
  m.fans = m.fans.filter((f) => f.hp > 0);

  // Blue Ordner on mid center (former neutral)
  const mid = m.slots.find((s) => s.blockId === 1 && s.index === 4);
  mid.building = "ordner";
  mid.owner = m.playerTeam;
  mid.greyNeutral = false;
  mid.level = 1;
  m.initOrdnerPostHp(mid);
  mid.structHp = mid.structMaxHp = 1600;

  // Red Ordner on a mid side plot (former neutral)
  const side = m.slots.find(
    (s) => s.blockId === 1 && s.index !== 4 && !s.building,
  );
  side.building = "ordner";
  side.owner = m.aiTeam;
  side.greyNeutral = false;
  side.level = 1;
  m.initOrdnerPostHp(side);
  side.structHp = side.structMaxHp = 1600;

  const midGx = m.postGangX(mid);
  const sideGx = m.postGangX(side);
  const wallP0 = m.hostilePostWallGx(m.playerTeam);
  const wallA0 = m.hostilePostWallGx(m.aiTeam);

  // Player push — blocked by red side until destroyed
  m.speed = 4;
  let sent = 0;
  while (m.tryHooliganOrder() && sent < 3) sent++;
  while (m.tryPyroFight() && sent < 6) sent++;

  let leakedPastRed = false;
  let damagedRed = false;
  let maxGxWhileRedUp = 0;
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 400));
    for (const f of m.fans) {
      if (f.team === m.playerTeam && f.onOffense && f.hp > 0) {
        f.hp = Math.max(f.hp, 220);
      }
    }
    const atk = m.fans.filter(
      (f) => f.hp > 0 && f.team === m.playerTeam && f.onOffense,
    );
    if (side.structHp > 0) {
      if (atk.length) {
        maxGxWhileRedUp = Math.max(
          maxGxWhileRedUp,
          ...atk.map((f) => f.gangX),
        );
      }
      if (atk.some((f) => f.gangX > sideGx + 0.02)) leakedPastRed = true;
    }
    if (side.structHp < 1600) damagedRed = true;
  }

  // Finish destroying red, confirm advance toward own blue mid is allowed
  side.structHp = 0;
  m.destroyOrdnerPost(side);
  await new Promise((r) => setTimeout(r, 2000));
  const atkAfter = m.fans.filter(
    (f) => f.hp > 0 && f.team === m.playerTeam && f.onOffense,
  );
  const maxGxAfterRedGone = atkAfter.length
    ? Math.max(...atkAfter.map((f) => f.gangX))
    : 0;

  // AI push — blocked by blue mid
  for (const f of m.fans) {
    if (
      f.team === m.aiTeam &&
      (f.kind === "hooligans" || f.kind === "ultras") &&
      f.hp > 0
    ) {
      f.onOffense = true;
      f.state = "gang";
      f.gangX = 0.88;
      f.invading = false;
      f.blockId = 2;
      f.hp = f.maxHp;
    }
  }
  let leakedPastBlue = false;
  let damagedBlue = false;
  let minAiGx = 1;
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 400));
    for (const f of m.fans) {
      if (f.team === m.aiTeam && f.onOffense && f.hp > 0) {
        f.hp = Math.max(f.hp, 220);
      }
    }
    const atk = m.fans.filter(
      (f) => f.hp > 0 && f.team === m.aiTeam && f.onOffense,
    );
    if (mid.structHp > 0) {
      if (atk.length) minAiGx = Math.min(minAiGx, ...atk.map((f) => f.gangX));
      if (atk.some((f) => f.gangX < midGx - 0.02)) leakedPastBlue = true;
    }
    if (mid.structHp < 1600) damagedBlue = true;
  }
  m.speed = 0;

  return {
    midGx,
    sideGx,
    wallP0,
    wallA0,
    playerWallIsRedSide:
      wallP0 != null && Math.abs(wallP0 - sideGx) < 0.05,
    aiWallIsBlueMid: wallA0 != null && Math.abs(wallA0 - midGx) < 0.05,
    leakedPastRed,
    damagedRed,
    maxGxWhileRedUp,
    advancedAfterRedGone: maxGxAfterRedGone > sideGx + 0.05,
    leakedPastBlue,
    damagedBlue,
    minAiGx,
  };
});

await page.screenshot({
  path: `${OUT}/screenshots/colored_mid_wall.png`,
  fullPage: false,
});
await page.screenshot({
  path: `${OUT}/colored_mid_wall.png`,
  fullPage: false,
});

const ok =
  result.playerWallIsRedSide &&
  result.aiWallIsBlueMid &&
  !result.leakedPastRed &&
  result.damagedRed &&
  result.advancedAfterRedGone &&
  !result.leakedPastBlue &&
  result.damagedBlue;

console.log(JSON.stringify(result, null, 2));
console.log(ok ? "PROBE_OK" : "PROBE_FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
