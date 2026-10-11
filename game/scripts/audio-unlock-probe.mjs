/**
 * Audio: first-click SFX must not be dropped while AudioContext resumes.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const OUT = "/opt/cursor/artifacts";
await mkdir(`${OUT}/screenshots`, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/local/bin/google-chrome",
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });

async function clickText(re) {
  const el = page.locator("button", { hasText: re }).first();
  await el.waitFor({ state: "visible", timeout: 10000 });
  await el.click({ force: true });
}

// Menu: Solo unlocks + UI SFX queued/flushed
await clickText(/Solo/i);
await page.waitForTimeout(250);
const afterSolo = await page.evaluate(() => window.__audio?.() ?? null);

const tut = page.locator("button", { hasText: /Aufstellung|Weiter|Anpfiff/i }).first();
if (await tut.count()) {
  const t = await tut.textContent();
  if (/Aufstellung|Weiter/i.test(t || "")) {
    await tut.click({ force: true });
    await page.waitForTimeout(200);
  }
}

await clickText(/Anpfiff/i);
await page.waitForTimeout(400);
const afterKick = await page.evaluate(() => window.__audio?.() ?? null);

// Mute label
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
const muteLabel = await page.locator("#mute-audio").textContent();
await page.locator("#mute-audio").click({ force: true });
await page.waitForTimeout(100);
const muteLabelOff = await page.locator("#mute-audio").textContent();
await page.locator("#mute-audio").click({ force: true });
await page.waitForTimeout(100);
const muteLabelOn = await page.locator("#mute-audio").textContent();

await page.screenshot({
  path: `${OUT}/screenshots/audio_menu_mute.png`,
  fullPage: false,
});
await page.screenshot({ path: `${OUT}/audio_menu_mute.png`, fullPage: false });

// Simulate suspended→running flush path
const flushTest = await page.evaluate(async () => {
  const mod = await import("/src/game/sound.ts");
  // Force a fresh unlock path by calling public API
  mod.unlockAudio();
  // Fire whistle while possibly still settling
  mod.sfx("whistle");
  mod.sfx("ui");
  mod.startAmbience("match");
  await new Promise((r) => setTimeout(r, 200));
  return mod.audioDebugState();
});

const summary = {
  afterSolo,
  afterKick,
  muteLabel,
  muteLabelOff,
  muteLabelOn,
  flushTest,
};

const ok =
  afterSolo?.unlocked === true &&
  afterKick?.unlocked === true &&
  afterKick?.ctxState === "running" &&
  (afterKick?.ambience === "match" || afterKick?.ambNodes > 0) &&
  /Ton:\s*an/i.test(muteLabel || "") &&
  /Ton:\s*aus/i.test(muteLabelOff || "") &&
  /Ton:\s*an/i.test(muteLabelOn || "") &&
  flushTest?.ctxState === "running" &&
  flushTest?.pending === 0;

console.log(JSON.stringify(summary, null, 2));
console.log(ok ? "AUDIO_PROBE_OK" : "AUDIO_PROBE_FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
