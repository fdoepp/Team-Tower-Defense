/**
 * Probe: fan survival past grey mid, Ordnerpost Sicherheit, grey only on offense.
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
await page.waitForTimeout(150);
const tut = page.locator("button", { hasText: /Aufstellung|Weiter|Anpfiff/i }).first();
if (await tut.count()) {
  const t = await tut.textContent();
  if (/Aufstellung|Weiter/i.test(t || "")) {
    await tut.click({ force: true });
    await page.waitForTimeout(150);
  }
}
await clickText(/Anpfiff/i);
await page.waitForFunction(() => !!window.__match, null, { timeout: 20000 });

const result = await page.evaluate(async () => {
  const m = window.__match;
  m.gold = 9999;
  m.currency.beer = 80;
  m.currency.merch = 80;
  m.speed = 3;
  for (const kind of ["ordner", "bier", "fanshop"]) {
    const s = m.slots.find((x) => x.blockId === 0 && !x.building);
    if (!s) break;
    m.buildMenu = { blockId: s.blockId, index: s.index };
    m.selectedSlot = m.buildMenu;
    m.tryBuild(kind);
  }
  const grey = m.slots.find(
    (s) => s.building === "ordner" && s.owner === "neutral",
  );
  const greyHp0 = grey.structHp;
  const sec0 = m.currency.security;

  m.speed = 0;
  const h = m.fans.find(
    (f) => f.team === m.playerTeam && f.kind === "hooligans" && f.hp > 0,
  );
  h.state = "gang";
  h.gangX = 0.5;
  h.x = 0.5;
  h.y = 0.75;
  h.onOffense = false;
  h.invading = false;
  h.blockId = 1;
  m.speed = 4;
  await new Promise((r) => setTimeout(r, 2000));
  m.speed = 0;
  const noDamageIdle = grey.structHp >= greyHp0 - 0.5;
  const idleSurvived = h.hp > 0;

  const ai = m.fans.find(
    (f) => f.team === m.aiTeam && f.kind === "ultras" && f.hp > 0,
  );
  ai.state = "gang";
  ai.gangX = 0.15;
  ai.x = 0.2;
  ai.y = 0.75;
  ai.onOffense = false;
  ai.invading = false;
  const thrShop = m.playerSecurityThreatened();
  m.speed = 3;
  await new Promise((r) => setTimeout(r, 1500));
  m.speed = 0;
  const sec1 = m.currency.security;

  ai.state = "gang";
  ai.gangX = 0.12;
  ai.x = 0.18;
  ai.y = 0.75;
  ai.onOffense = true;
  const thrOffense = m.playerSecurityThreatened();
  ai.onOffense = false;
  ai.invading = true;
  ai.blockId = 0;
  ai.state = "block";
  const thrInvade = m.playerSecurityThreatened();
  ai.invading = false;
  ai.state = "block";
  ai.blockId = 2;
  ai.gangX = 1;

  for (const f of m.fans) {
    if (f.team === m.playerTeam && !f.isSteward) {
      f.hp = f.maxHp;
      f.onOffense = false;
      f.invading = false;
      f.state = "block";
      f.blockId = 0;
      f.path = [];
      f.pathI = 0;
    }
  }
  m.speed = 4;
  m.currency.beer = 200;
  m.currency.merch = 200;
  let sent = 0;
  while (m.tryHooliganOrder() && sent < 3) sent++;
  while (m.tryPyroFight() && sent < 6) sent++;
  const greyBefore = grey.structHp;
  await new Promise((r) => setTimeout(r, 4000));
  m.speed = 0;
  const greyAfter = grey.structHp;

  return {
    noDamageIdle,
    idleSurvived,
    thrShop,
    thrOffense,
    thrInvade,
    secGrew: sec1 > sec0 + 0.3,
    sec0,
    sec1,
    sent,
    damageOnOffense: greyAfter < greyBefore - 5,
    greyBefore,
    greyAfter,
    ownPosts: m.ownOrdnerPostCount(),
  };
});

await page.screenshot({
  path: `${OUT}/screenshots/fans_security_grey.png`,
  fullPage: false,
});
await page.screenshot({
  path: `${OUT}/fans_security_grey.png`,
  fullPage: false,
});

const ok =
  result.noDamageIdle &&
  result.idleSurvived &&
  !result.thrShop &&
  result.thrOffense &&
  result.thrInvade &&
  result.secGrew &&
  result.damageOnOffense;

console.log(JSON.stringify(result, null, 2));
console.log(ok ? "PROBE_OK" : "PROBE_FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
