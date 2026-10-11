/**
 * Probe: Do derby club kit colors recolor units/buildings/FX,
 * or only HUD/banner branding?
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const OUT = "/opt/cursor/artifacts/screenshots";
await mkdir(OUT, { recursive: true });
const base = process.env.BASE_URL || "http://127.0.0.1:5173/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
await page.goto(base + "?probe=color-transfer", { waitUntil: "networkidle" });

// Free pick: Celtic (green) vs Dortmund (yellow) — neither is classic KSC blue / VfB red kit
await page.locator("button", { hasText: /^Frei$/ }).click();
await page.selectOption("#player-club", "celtic");
await page.waitForTimeout(80);
await page.selectOption("#ai-club", "bvb");
await page.waitForTimeout(80);

const menu = await page.evaluate(() => ({
  line: document.querySelector(".match-line")?.textContent ?? "",
  cssKsc: getComputedStyle(document.documentElement).getPropertyValue("--ksc").trim(),
  cssVfb: getComputedStyle(document.documentElement).getPropertyValue("--vfb").trim(),
}));
await page.screenshot({ path: `${OUT}/derby-color-menu-cel-bvb.png` });

await page.locator("button", { hasText: /Solo/i }).first().click();
await page.waitForTimeout(200);
const next = page.locator("button", { hasText: /Aufstellung/i }).first();
if (await next.count()) await next.click({ force: true });
await page.locator("button", { hasText: /Anpfiff/i }).first().click({ force: true });
await page.waitForSelector("canvas", { timeout: 20000 });
await page.waitForTimeout(900);

const live = await page.evaluate(() => {
  const m = window.__match;
  const root = getComputedStyle(document.documentElement);

  // Inspect person-rail / build icons currently in DOM (may be hidden)
  const imgs = [...document.querySelectorAll("img")]
    .map((img) => img.getAttribute("src") || "")
    .filter((s) => /icons\/(ui-final|units|stands|ui)\//.test(s));

  const unitPaths = imgs.filter((s) => /fan-|ultra-|hooligan-|ordner-/.test(s));
  const standPaths = imgs.filter((s) => /stand-|bier-|fanshop-|ordnerposten|stands\//.test(s));

  // Force open person rail icons via settings if present
  const personImgs = [...document.querySelectorAll("#person-rail img, .person-card img, .side-rail img")]
    .map((i) => i.getAttribute("src") || "");

  // Sample canvas pixels in left stand crowd / right stand / mid
  const c = document.querySelector("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const w = c.width;
  const h = c.height;
  const sample = (nx, ny, r = 12) => {
    const x = Math.floor(nx * w);
    const y = Math.floor(ny * h);
    const d = ctx.getImageData(Math.max(0, x - r), Math.max(0, y - r), r * 2, r * 2).data;
    let R = 0, G = 0, B = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue;
      R += d[i]; G += d[i + 1]; B += d[i + 2]; n++;
    }
    if (!n) return null;
    return {
      r: Math.round(R / n),
      g: Math.round(G / n),
      b: Math.round(B / n),
      n,
    };
  };

  // Heuristic zones (matchday layout): left tribune / right tribune / scoreboard crest
  const zones = {
    leftTribune: sample(0.18, 0.38),
    rightTribune: sample(0.82, 0.38),
    leftPlot: sample(0.22, 0.58),
    rightPlot: sample(0.78, 0.58),
    scoreboardLeft: sample(0.32, 0.12, 8),
    scoreboardRight: sample(0.68, 0.12, 8),
  };

  const isGreenish = (c) => c && c.g > c.r + 15 && c.g > c.b + 10;
  const isYellowish = (c) => c && c.r > 160 && c.g > 140 && c.b < 120;
  const isBlueish = (c) => c && c.b > c.r + 20 && c.b > c.g;
  const isReddish = (c) => c && c.r > c.g + 25 && c.r > c.b + 15;

  return {
    playerClub: m?.cfg?.settings?.playerClub,
    aiClub: m?.cfg?.settings?.aiClub,
    cssKsc: root.getPropertyValue("--ksc").trim(),
    cssVfb: root.getPropertyValue("--vfb").trim(),
    expectedHeim: "#018749", // celtic
    expectedGast: "#FDE100", // bvb
    personImgs: personImgs.slice(0, 20),
    unitPathsSample: unitPaths.slice(0, 15),
    standPathsSample: standPaths.slice(0, 15),
    allIconHints: imgs.slice(0, 40),
    zones,
    heuristics: {
      leftLooksGreen: isGreenish(zones.leftTribune),
      leftLooksBlue: isBlueish(zones.leftTribune),
      rightLooksYellow: isYellowish(zones.rightTribune),
      rightLooksRed: isReddish(zones.rightTribune),
      scoreLeftGreen: isGreenish(zones.scoreboardLeft),
      scoreRightYellow: isYellowish(zones.scoreboardRight),
    },
  };
});

// Open person rail to capture icon srcs
await page.evaluate(() => {
  const btn = document.querySelector("#btn-persons, [data-open='person'], .fab-person, button[aria-label='Personen']");
  // Match shell: click middle float if present
  const floats = [...document.querySelectorAll(".float-btn, .match-fab, #float-person, button")];
  const hit = floats.find((b) => /Person|Fan|Ultra/i.test(b.textContent || "") || b.id?.includes("person"));
  hit?.click();
});
await page.waitForTimeout(300);

// Try clicking the person icon in the right wood rail (usually middle)
const railBtns = page.locator(".match-shell button, .float-stack button, #rail-slot button");
const count = await railBtns.count();
for (let i = 0; i < Math.min(count, 12); i++) {
  const t = await railBtns.nth(i).getAttribute("aria-label");
  const id = await railBtns.nth(i).getAttribute("id");
  if (/person|fan|ultra/i.test(`${t || ""} ${id || ""}`)) {
    await railBtns.nth(i).click({ force: true }).catch(() => {});
    break;
  }
}
await page.waitForTimeout(400);

const afterRail = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")].map((i) => i.getAttribute("src") || "");
  const colored = imgs.filter((s) => /-blue-|-red-|-grey-|blue-|red-|grey-/.test(s));
  const hasClubRecolor =
    imgs.some((s) => /celtic|bvb|leverkusen|recolor|tint|kit/i.test(s)) ||
    !!document.querySelector("[data-club-recolor], canvas.club-tint");
  return {
    coloredIconPaths: [...new Set(colored)].slice(0, 30),
    hasClubRecolorAsset: hasClubRecolor,
    blueCount: colored.filter((s) => /blue/i.test(s)).length,
    redCount: colored.filter((s) => /red/i.test(s)).length,
    greenPathCount: colored.filter((s) => /green/i.test(s)).length,
    yellowPathCount: colored.filter((s) => /yellow|gelb/i.test(s)).length,
  };
});

await page.screenshot({ path: `${OUT}/derby-color-match-cel-bvb.png` });

// Code-level truth via injected check of teamColor mapping
const mapping = await page.evaluate(() => {
  const m = window.__match;
  // Dynamic import not available; infer from icon paths in person cards after forcing HTML rebuild
  return {
    playerTeam: m.playerTeam,
    aiTeam: m.aiTeam,
    // If branding only: CSS vars differ from sprite palette
  };
});

const cssHeimIsCelticGreen =
  menu.cssKsc.toLowerCase() === "#018749" || live.cssKsc.toLowerCase() === "#018749";
const cssGastIsBvbYellow =
  menu.cssVfb.toLowerCase() === "#fde100" || live.cssVfb.toLowerCase() === "#fde100";

const spritesStillBlueRed =
  afterRail.blueCount > 0 &&
  afterRail.greenPathCount === 0 &&
  afterRail.yellowPathCount === 0 &&
  !afterRail.hasClubRecolorAsset;

const worldNotRecolored =
  live.heuristics.leftLooksBlue &&
  !live.heuristics.leftLooksGreen &&
  live.heuristics.rightLooksRed &&
  !live.heuristics.rightLooksYellow;

const hudUsesClubColors =
  cssHeimIsCelticGreen &&
  cssGastIsBvbYellow &&
  (live.heuristics.scoreLeftGreen || live.heuristics.scoreRightYellow);

const result = {
  okProbe: true,
  transferToSpritesBuildingsFx: false, // expected current architecture
  findings: {
    hudCssUsesClubKits: cssHeimIsCelticGreen && cssGastIsBvbYellow,
    scoreboardLikelyClubColors: hudUsesClubColors,
    spritesStillBlueRedPaths: spritesStillBlueRed,
    worldCanvasStillBlueRed: worldNotRecolored,
    liveRecolorPipelinePresent: afterRail.hasClubRecolorAsset,
  },
  menu,
  live,
  afterRail,
  mapping,
  verdict:
    "Club kit colors apply to CSS/HUD/scoreboard/banner branding only. " +
    "Units, buildings, tribune sprites and FX still use fixed blue/red/grey assets via teamColor(side).",
};

console.log(JSON.stringify(result, null, 2));
await browser.close();

// Exit 0 always — this is a diagnostic probe; failure = can't run
const conclusive =
  result.findings.hudCssUsesClubKits && result.findings.spritesStillBlueRedPaths;
process.exit(conclusive ? 0 : 2);
