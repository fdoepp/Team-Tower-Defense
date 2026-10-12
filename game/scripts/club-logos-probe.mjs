/**
 * Visual QA: inspired club logos on menu + scoreboard.
 * Run with Vite on :5173 — node scripts/club-logos-probe.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const OUT = "/opt/cursor/artifacts";
mkdirSync(OUT, { recursive: true });
mkdirSync("/tmp/club-logos", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://127.0.0.1:5173/?pick=free", {
  waitUntil: "networkidle",
  timeout: 60000,
});

// Dump logo sheet via in-page canvas
const sheet = await page.evaluate(async () => {
  const mod = await import("/src/game/clubLogos.ts");
  const clubsMod = await import("/src/game/clubs.ts");
  const clubs = clubsMod.allClubs();
  const cols = 12;
  const cell = 72;
  const rows = Math.ceil(clubs.length / cols);
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const motifs = {};
  clubs.forEach((c, i) => {
    motifs[c.id] = mod.logoMotifFor(c.id);
    const x = (i % cols) * cell + cell / 2;
    const y = Math.floor(i / cols) * cell + cell / 2;
    mod.drawClubLogo(ctx, c.id, x, y, cell * 0.4);
  });
  // Featured samples
  const samples = [
    "liverpool",
    "leverkusen",
    "bvb",
    "celtic",
    "boca",
    "river",
    "barcelona",
    "arsenal",
  ];
  const featured = {};
  for (const id of samples) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "#1e293b";
    x.fillRect(0, 0, 128, 128);
    mod.drawClubLogo(x, id, 64, 64, 54);
    featured[id] = c.toDataURL("image/png");
  }
  return {
    clubs: clubs.length,
    motifs,
    sheet: canvas.toDataURL("image/png"),
    featured,
    kitLogos: [...document.querySelectorAll(".kit-logo")].length,
  };
});

function saveDataUrl(path, dataUrl) {
  const b64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  writeFileSync(path, Buffer.from(b64, "base64"));
}

saveDataUrl(`${OUT}/club-logos-sheet.png`, sheet.sheet);
saveDataUrl("/tmp/club-logos/_all.png", sheet.sheet);
for (const [id, url] of Object.entries(sheet.featured)) {
  saveDataUrl(`${OUT}/club-logo-${id}.png`, url);
  saveDataUrl(`/tmp/club-logos/${id}.png`, url);
}

await page.screenshot({
  path: `${OUT}/club-logos-menu.png`,
  fullPage: true,
});

// Pick Leverkusen vs Liverpool and enter match for scoreboard crests
async function selectClub(selectId, value) {
  await page.selectOption(selectId, value);
  await page.waitForTimeout(150);
}

const freeBtn = page.locator("button.pick-mode", { hasText: /Frei|Free|Clubs/i }).first();
if ((await freeBtn.count()) > 0) await freeBtn.click();
await page.waitForTimeout(200);

if ((await page.locator("#player-club").count()) > 0) {
  await selectClub("#player-club", "leverkusen");
  await selectClub("#ai-club", "liverpool");
}

await page.screenshot({
  path: `${OUT}/club-logos-menu-b04-liv.png`,
  fullPage: true,
});

const solo = page.locator("button", { hasText: /Solo/i }).first();
if ((await solo.count()) > 0) {
  await solo.click();
  await page.waitForTimeout(400);
  // Tutorial → Aufstellung → Anpfiff
  await page.locator("#tut-next").click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.locator("#start, button:has-text('Anpfiff')").first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForSelector("canvas", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/club-logos-scoreboard.png` });
  // Crop-ish full page already shows scoreboard at top of canvas
}

const ok = sheet.clubs >= 90 && sheet.kitLogos >= 1;
console.log(
  JSON.stringify(
    {
      ok,
      clubs: sheet.clubs,
      kitLogos: sheet.kitLogos,
      sampleMotifs: Object.fromEntries(
        [
          "liverpool",
          "leverkusen",
          "bvb",
          "celtic",
          "boca",
          "river",
        ].map((id) => [id, sheet.motifs[id]]),
      ),
      artifacts: [
        "club-logos-sheet.png",
        "club-logos-menu.png",
        "club-logos-menu-b04-liv.png",
        "club-logos-scoreboard.png",
      ],
    },
    null,
    2,
  ),
);

await browser.close();
process.exit(ok ? 0 : 1);
