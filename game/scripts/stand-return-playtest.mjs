/**
 * Playtest: stand→home return, grey tribune occupancy, invade path into enemy block.
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
await page.waitForTimeout(250);
const tut = page.locator("button", { hasText: /Aufstellung|Weiter|Anpfiff/i }).first();
if (await tut.count()) {
  const t = await tut.textContent();
  if (/Aufstellung|Weiter/i.test(t || "")) {
    await tut.click({ force: true });
    await page.waitForTimeout(250);
  }
}
await clickText(/Anpfiff/i);
await page.waitForFunction(() => !!window.__match, null, { timeout: 20000 });
await page.waitForTimeout(400);

// Seed shops so greys + colored can visit
await page.evaluate(() => {
  const m = window.__match;
  m.gold = 9999;
  m.currency.beer = 80;
  m.currency.merch = 80;
  m.speed = 3;
  for (const kind of ["bier", "fanshop", "bier", "fanshop"]) {
    const s = m.slots.find((x) => x.blockId === 0 && !x.building);
    if (!s) break;
    m.buildMenu = { blockId: s.blockId, index: s.index };
    m.selectedSlot = m.buildMenu;
    m.tryBuild(kind);
  }
  // AI side shops too
  for (const kind of ["bier", "fanshop"]) {
    const s = m.slots.find((x) => x.blockId === 2 && !x.building);
    if (!s) continue;
    s.building = kind;
    s.owner = m.aiTeam;
    s.greyNeutral = false;
    s.level = 1;
    s.beer = kind === "bier" ? 80 : 0;
    s.merch = kind === "fanshop" ? 80 : 0;
    s.capacity = 100;
  }
});

function snap() {
  return page.evaluate(() => {
    const m = window.__match;
    const alive = m.fans.filter((f) => f.hp > 0 && !f.isSteward);
    const byTeam = { ksc: 0, vfb: 0, neutral: 0 };
    const inHomeBlock = { ksc: 0, vfb: 0, neutral: 0 };
    const wrongBlock = [];
    const atStand = [];
    const onGang = [];
    const moving = [];
    const strandedStand = [];
    for (const f of alive) {
      byTeam[f.team] = (byTeam[f.team] || 0) + 1;
      const home =
        f.homeBlockId ??
        (f.team === m.playerTeam ? 0 : f.team === m.aiTeam ? 2 : 1);
      if (f.state === "block" && f.blockId === home && !f.invading) {
        inHomeBlock[f.team] = (inHomeBlock[f.team] || 0) + 1;
      }
      if (
        f.state === "block" &&
        !f.invading &&
        !f.onOffense &&
        f.blockId !== home
      ) {
        wrongBlock.push({
          id: f.id,
          team: f.team,
          blockId: f.blockId,
          home,
          kind: f.kind,
        });
      }
      if (f.state === "stand") {
        atStand.push({
          id: f.id,
          team: f.team,
          drinkT: +f.drinkT.toFixed(2),
          shopT: +f.shopT.toFixed(2),
          onOffense: f.onOffense,
        });
        if (f.drinkT <= 0 && f.shopT <= 0 && !f.onOffense) {
          strandedStand.push(f.id);
        }
      }
      if (f.state === "gang") {
        onGang.push({
          id: f.id,
          team: f.team,
          onOffense: f.onOffense,
          gx: +f.gangX.toFixed(3),
        });
      }
      if (f.state === "moving") {
        moving.push({
          id: f.id,
          team: f.team,
          after: f._after || "",
          onOffense: f.onOffense,
        });
      }
    }
    return {
      minute: +m.minute.toFixed(1),
      byTeam,
      inHomeBlock,
      wrongBlock,
      atStand: atStand.length,
      strandedStand,
      onGang: onGang.length,
      movingHome: moving.filter((x) => x.after === "home").length,
      movingOther: moving.filter((x) => x.after !== "home").length,
      dead: m.fans.filter((f) => f.hp <= 0 && !f.isSteward).length,
      neutralAlive: byTeam.neutral,
    };
  });
}

const samples = [];
samples.push({ tag: "t0", ...(await snap()) });
await page.screenshot({ path: `${OUT}/screenshots/playtest_t0.png` });

// Run ~45s wall at speed 3 ≈ long shopping cycle
for (let i = 1; i <= 6; i++) {
  await page.waitForTimeout(4000);
  samples.push({ tag: `t${i}`, ...(await snap()) });
}
await page.screenshot({ path: `${OUT}/screenshots/playtest_mid.png` });

// Force mid-visit stands to finish + give paths time to complete home
await page.evaluate(async () => {
  const m = window.__match;
  m.speed = 4;
  for (const f of m.fans) {
    if (f.hp > 0 && f.state === "stand" && !f.onOffense) {
      f.drinkT = 0;
      f.shopT = 0;
    }
    // Pause further shopping so tribunes can refill
    if (f.hp > 0 && !f.isSteward) {
      f.satisfiedUntil = m.realElapsed + 60;
      f.shopUntil = m.realElapsed + 60;
    }
  }
  await new Promise((r) => setTimeout(r, 6000));
  m.speed = 0;
});
samples.push({ tag: "afterSettle", ...(await snap()) });
await page.screenshot({
  path: `${OUT}/screenshots/playtest_settle.png`,
  fullPage: false,
});
await page.screenshot({
  path: `${OUT}/tribune_crowd_settled.png`,
  fullPage: false,
});

const stuckMoving = await page.evaluate(() => {
  const m = window.__match;
  return m.fans.filter(
    (f) => f.hp > 0 && !f.isSteward && f.state === "moving" && !f.onOffense,
  ).length;
});

// Invade path into enemy block — recall fighters home first, then send
const invade = await page.evaluate(async () => {
  const m = window.__match;
  m.currency.beer = 200;
  m.currency.merch = 200;
  m.speed = 4;
  for (const s of m.slots) {
    if (s.owner === m.aiTeam && s.building === "ordner") {
      s.structHp = Math.min(s.structHp, 40);
    }
  }
  // Pull combat kinds home so attackReadyList can see them
  for (const f of m.fans) {
    if (f.hp <= 0 || f.isSteward || f.team !== m.playerTeam) continue;
    if (f.kind !== "hooligans" && f.kind !== "ultras") continue;
    f.onOffense = false;
    f.invading = false;
    f.standKey = null;
    f.drinkT = 0;
    f.shopT = 0;
    f.satisfiedUntil = m.realElapsed + 120;
    f.shopUntil = m.realElapsed + 120;
    m.returnFanToHomeBlock(f);
  }
  await new Promise((r) => setTimeout(r, 4000));
  let sent = 0;
  while (m.tryHooliganOrder() && sent < 4) sent++;
  while (m.tryPyroFight() && sent < 8) sent++;
  const pathSamples = [];
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 450));
    for (const f of m.fans) {
      if (f.team === m.playerTeam && f.onOffense && f.hp > 0) {
        f.hp = Math.max(f.hp, 220);
      }
    }
    const attackers = m.fans.filter(
      (f) =>
        f.hp > 0 &&
        f.team === m.playerTeam &&
        (f.kind === "ultras" || f.kind === "hooligans") &&
        (f.onOffense || f.invading || f.state === "gang"),
    );
    pathSamples.push({
      i,
      n: attackers.length,
      maxGx: attackers.length
        ? Math.max(...attackers.map((f) => f.gangX))
        : null,
      invading: attackers.filter((f) => f.invading).length,
      inGast: attackers.filter((f) => f.blockId === 2).length,
      states: attackers.reduce((a, f) => {
        a[f.state] = (a[f.state] || 0) + 1;
        return a;
      }, {}),
    });
  }
  m.speed = 0;
  return { sent, pathSamples };
});
await page.screenshot({
  path: `${OUT}/screenshots/playtest_invade.png`,
  fullPage: false,
});
await page.screenshot({
  path: `${OUT}/invade_enemy_block.png`,
  fullPage: false,
});

const last = samples[samples.length - 1];
const greyNeverLost = samples.every((s) => (s.neutralAlive ?? 0) >= 18);
const noWrongAfterSettle =
  (last.wrongBlock?.length ?? 0) === 0 &&
  (last.strandedStand?.length ?? 0) === 0;
const greyHomeOk = (last.inHomeBlock?.neutral ?? 0) >= 12;
const colorHomeOk =
  (last.inHomeBlock?.ksc ?? 0) + (last.inHomeBlock?.vfb ?? 0) >= 6;
const fewStuck = stuckMoving <= 4;
const invadeReached =
  invade.sent > 0 &&
  (invade.pathSamples.some((p) => (p.maxGx ?? 0) > 0.55) ||
    invade.pathSamples.some((p) => p.inGast > 0 || p.invading > 0));

const summary = {
  greyNeverLost,
  noWrongAfterSettle,
  greyHomeOk,
  colorHomeOk,
  fewStuck,
  stuckMoving,
  invadeReached,
  final: {
    byTeam: last.byTeam,
    inHomeBlock: last.inHomeBlock,
    wrongBlock: last.wrongBlock,
    strandedStand: last.strandedStand,
    atStand: last.atStand,
  },
  invadeSent: invade.sent,
  invadeMaxGx: Math.max(...invade.pathSamples.map((p) => p.maxGx ?? 0)),
  invadeGast: Math.max(...invade.pathSamples.map((p) => p.inGast)),
};

const ok =
  summary.greyNeverLost &&
  summary.noWrongAfterSettle &&
  summary.greyHomeOk &&
  summary.colorHomeOk &&
  summary.fewStuck &&
  summary.invadeReached;

console.log(JSON.stringify({ samples, invade, summary }, null, 2));
console.log(ok ? "PLAYTEST_OK" : "PLAYTEST_FAIL");

await browser.close();
process.exit(ok ? 0 : 1);
