import type { BuildingKind, FanKind, TeamId } from "./types";
import { uiFinalIconPath } from "./uiFinal";

export type TeamColor = "blue" | "red" | "grey";

/** Prefer Final-UI DB when released; else legacy icons/ui/. */
function uiPath(id: string, legacy: string): string {
  return uiFinalIconPath(id) ?? legacy;
}

const cache = new Map<string, HTMLImageElement>();
let preloadPromise: Promise<void> | null = null;

export function teamColor(team: TeamId | "neutral" | null | undefined): TeamColor {
  if (team === "ksc") return "blue";
  if (team === "vfb") return "red";
  return "grey";
}

export function standIconPath(
  kind: BuildingKind,
  color: TeamColor,
  level: number,
): string {
  const lv = Math.max(1, Math.min(5, Math.floor(level) || 1));
  const finalId = `stand${kind[0].toUpperCase()}${kind.slice(1)}${color[0].toUpperCase()}${color.slice(1)}${lv}`;
  return uiPath(finalId, `icons/stands/${kind}-${color}-${lv}.png`);
}

export function unitIconPath(
  kind: FanKind | "ordner",
  color: TeamColor,
  level = 1,
): string {
  const map: Record<FanKind | "ordner", string> = {
    normalos: "fan",
    ultras: "ultra",
    hooligans: "hooligan",
    ordner: "ordner",
  };
  const lv = Math.max(1, Math.min(5, Math.floor(level) || 1));
  const base = map[kind];
  const finalId = `${base}${color[0].toUpperCase()}${color.slice(1)}${lv}`;
  return uiPath(finalId, `icons/units/${base}-${color}-${lv}.png`);
}

export type SlotControl = "blue" | "red" | "grey";
export type SlotEmptyOrientation = "parallel" | "iso" | "persp";
/** Deploy-Default: Stadionboden-Perspektive (nicht Ortho/Quadrat). */
export const SLOT_EMPTY_ORIENTATION: SlotEmptyOrientation = "persp";

export const SCENE_ASSETS = {
  tribuneBlue: uiPath("tribuneBlue", "assets/tribune-block-blue.png"),
  tribuneGrey: uiPath("tribuneGrey", "assets/tribune-block-grey.png"),
  tribuneRed: uiPath("tribuneRed", "assets/tribune-block-red.png"),
  /** Binding match backdrop — see MATCH_LAYOUT_TOKENS.json / stadium-background rule */
  stadiumFloodlightDerby: "assets/stadium-floodlight-derby-bg.jpg",
} as const;

export function tribuneIconPath(blockId: number): string {
  if (blockId === 0) return SCENE_ASSETS.tribuneBlue;
  if (blockId === 2) return SCENE_ASSETS.tribuneRed;
  return SCENE_ASSETS.tribuneGrey;
}

/**
 * UI icons — released keys from UI_FINAL_DB (`icons/ui-final/…`).
 * Draw only with uniform scale (drawIcon / fitUniform) — never distort.
 */
export const UI_ICONS = {
  slotEmpty: uiPath("slotEmpty", "icons/ui/slot-empty.png"),
  slotEmptyParallel: uiPath("slotEmptyParallel", "icons/ui/slot-empty-parallel.png"),
  slotEmptyIso: uiPath("slotEmptyIso", "icons/ui/slot-empty-iso.png"),
  slotEmptyParallelBlue: uiPath(
    "slotEmptyParallelBlue",
    "icons/ui/slot-empty-parallel-blue.png",
  ),
  slotEmptyParallelRed: uiPath(
    "slotEmptyParallelRed",
    "icons/ui/slot-empty-parallel-red.png",
  ),
  slotEmptyIsoBlue: uiPath("slotEmptyIsoBlue", "icons/ui/slot-empty-iso-blue.png"),
  slotEmptyIsoRed: uiPath("slotEmptyIsoRed", "icons/ui/slot-empty-iso-red.png"),
  slotEmptyOrtho: uiPath("slotEmptyOrtho", "icons/ui/slot-empty-ortho.png"),
  slotEmptyOrthoBlue: uiPath("slotEmptyOrthoBlue", "icons/ui/slot-empty-ortho-blue.png"),
  slotEmptyOrthoRed: uiPath("slotEmptyOrthoRed", "icons/ui/slot-empty-ortho-red.png"),
  slotEmptyPersp: uiPath("slotEmptyPersp", "icons/ui/slot-empty-persp.png"),
  slotEmptyPerspBlue: uiPath("slotEmptyPerspBlue", "icons/ui/slot-empty-persp-blue.png"),
  slotEmptyPerspRed: uiPath("slotEmptyPerspRed", "icons/ui/slot-empty-persp-red.png"),
  currencyGold: uiPath("currencyGold", "icons/ui/currency-gold.png"),
  currencyGoldPlus: uiPath("currencyGoldPlus", "icons/ui-final/currency-gold-plus.png"),
  currencyGoldMinus: uiPath("currencyGoldMinus", "icons/ui-final/currency-gold-minus.png"),
  currencyBier: uiPath("currencyBier", "icons/ui/currency-bier.png"),
  currencyBierPlus: uiPath("currencyBierPlus", "icons/ui-final/currency-bier-plus.png"),
  currencyBierMinus: uiPath("currencyBierMinus", "icons/ui-final/currency-bier-minus.png"),
  currencyFanartikel: uiPath("currencyFanartikel", "icons/ui/currency-fanartikel.png"),
  currencyFanartikelPlus: uiPath(
    "currencyFanartikelPlus",
    "icons/ui-final/currency-fanartikel-plus.png",
  ),
  currencyFanartikelMinus: uiPath(
    "currencyFanartikelMinus",
    "icons/ui-final/currency-fanartikel-minus.png",
  ),
  currencySicherheit: uiPath("currencySicherheit", "icons/ui/currency-sicherheit.png"),
  currencySicherheitPlus: uiPath(
    "currencySicherheitPlus",
    "icons/ui-final/currency-sicherheit-plus.png",
  ),
  currencySicherheitMinus: uiPath(
    "currencySicherheitMinus",
    "icons/ui-final/currency-sicherheit-minus.png",
  ),
  moodPlus: uiPath("moodPlus", "icons/ui-final/mood-plus.png"),
  moodMinus: uiPath("moodMinus", "icons/ui-final/mood-minus.png"),
  waitAnger: uiPath("waitAnger", "icons/ui-final/wait-anger.png"),
  waitAngerHot: uiPath("waitAngerHot", "icons/ui-final/wait-anger-hot.png"),
  btnIconUltraBlue: uiPath("btnIconUltraBlue", "icons/ui-final/btn-icon-ultra-blue.png"),
  btnIconBierAmber: uiPath("btnIconBierAmber", "icons/ui-final/btn-icon-bier-amber.png"),
  btnIconAngriffRed: uiPath("btnIconAngriffRed", "icons/ui-final/btn-icon-angriff-red.png"),
  btnIconSquareRed: uiPath("btnIconSquareRed", "icons/ui-final/btn-icon-square-red.png"),
  btnIconSquareBlue: uiPath("btnIconSquareBlue", "icons/ui-final/btn-icon-square-blue.png"),
  btnIconSquareAmber: uiPath("btnIconSquareAmber", "icons/ui-final/btn-icon-square-amber.png"),
  btnIconUpgradePerson: uiPath(
    "btnIconUpgradePerson",
    "icons/ui-final/btn-icon-upgrade-person.png",
  ),
  btnIconUpgradeBuilding: uiPath(
    "btnIconUpgradeBuilding",
    "icons/ui-final/btn-icon-upgrade-building.png",
  ),
  iconUpgradeArrow: uiPath("iconUpgradeArrow", "icons/ui-final/icon-upgrade-arrow.png"),
  iconAngriffBlocksturm: uiPath(
    "iconAngriffBlocksturm",
    "icons/ui-final/icon-angriff-blocksturm.png",
  ),
  iconAngriffFaust: uiPath(
    "iconAngriffFaust",
    "icons/ui-final/icon-angriff-faust.png",
  ),
  iconAngriffPyro: uiPath(
    "iconAngriffPyro",
    "icons/ui-final/icon-angriff-pyro.png",
  ),
  btnKaufenGrey: uiPath("btnKaufenGrey", "icons/ui/btn-kaufen-grey.png"),
  btnKaufenGreen: uiPath("btnKaufenGreen", "icons/ui/btn-kaufen-green.png"),
  btnSendenGrey: uiPath("btnSendenGrey", "icons/ui/btn-senden-grey.png"),
  btnSendenGreen: uiPath("btnSendenGreen", "icons/ui/btn-senden-green.png"),
  btnSendenBlue: uiPath("btnSendenBlue", "icons/ui/btn-senden-blue.png"),
  btnSendenRed: uiPath("btnSendenRed", "icons/ui-final/btn-senden-red.png"),
  btnBauenAmber: uiPath("btnBauenAmber", "icons/ui/btn-bauen-amber.png"),
  btnBauenGrey: uiPath("btnBauenGrey", "icons/ui/btn-bauen-grey.png"),
  btnUpgradePurple: uiPath("btnUpgradePurple", "icons/ui/btn-upgrade-purple.png"),
  btnUpgradeGrey: uiPath("btnUpgradeGrey", "icons/ui/btn-upgrade-grey.png"),
  pennantKsc: uiPath("pennantKsc", "icons/ui/pennant-ksc.png"),
  pennantVfb: uiPath("pennantVfb", "icons/ui/pennant-vfb.png"),
  menuRail: uiPath("menuRail", "icons/ui/menu-rail-brown.png"),
  /** Referenz-Demo — nicht Runtime-Default */
  scoreboard: uiPath("scoreboard", "icons/ui/scoreboard-momentum.png"),
  /** Leeres Chrome — Runtime-Default (STORAGE_CANON) */
  scoreboardChrome: uiPath("scoreboardChrome", "icons/ui-final/scoreboard-chrome.png"),
} as const;

/**
 * Leerer Bauplatz je Kontrolle — Deploy-Default = Perspektive (nicht Ortho).
 * `orthoSource` bleibt für Archiv-Warps, Runtime nutzt Persp-PNGs.
 */
export function slotEmptyIconPath(
  control: SlotControl | TeamId | "neutral" | null | undefined,
  orientation: SlotEmptyOrientation = SLOT_EMPTY_ORIENTATION,
  orthoSource = false,
): string {
  const c: SlotControl =
    control === "ksc" || control === "blue"
      ? "blue"
      : control === "vfb" || control === "red"
        ? "red"
        : "grey";
  if (orthoSource) {
    if (c === "blue") return UI_ICONS.slotEmptyOrthoBlue;
    if (c === "red") return UI_ICONS.slotEmptyOrthoRed;
    return UI_ICONS.slotEmptyOrtho;
  }
  if (orientation === "iso") {
    if (c === "blue") return UI_ICONS.slotEmptyIsoBlue;
    if (c === "red") return UI_ICONS.slotEmptyIsoRed;
    return UI_ICONS.slotEmptyIso;
  }
  // persp (default) + parallel-alias → Stadionboden-Perspektive
  if (c === "blue") return UI_ICONS.slotEmptyPerspBlue;
  if (c === "red") return UI_ICONS.slotEmptyPerspRed;
  return UI_ICONS.slotEmptyPersp;
}

function loadOne(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src);
  if (hit?.complete && hit.naturalWidth > 0) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      cache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      // Keep a placeholder so callers can fall back to vector draw
      cache.set(src, img);
      resolve(img);
    };
    img.src = src;
  });
}

/** All icon paths used in a match (stands × colors × levels + units + UI). */
function allIconPaths(): string[] {
  const paths = new Set<string>([
    ...Object.values(UI_ICONS),
    ...Object.values(SCENE_ASSETS),
  ]);
  for (const kind of ["bier", "fanshop", "ordner"] as BuildingKind[]) {
    for (const color of ["blue", "red", "grey"] as TeamColor[]) {
      for (let lv = 1; lv <= 5; lv++) paths.add(standIconPath(kind, color, lv));
    }
  }
  for (const kind of ["normalos", "ultras", "hooligans", "ordner"] as const) {
    for (const color of ["blue", "red", "grey"] as TeamColor[]) {
      for (let lv = 1; lv <= 5; lv++) paths.add(unitIconPath(kind, color, lv));
    }
  }
  for (const orient of ["parallel", "iso"] as SlotEmptyOrientation[]) {
    for (const c of ["grey", "blue", "red"] as SlotControl[]) {
      paths.add(slotEmptyIconPath(c, orient));
    }
  }
  for (const c of ["grey", "blue", "red"] as SlotControl[]) {
    paths.add(slotEmptyIconPath(c, undefined, true));
  }
  return [...paths];
}

export function preloadIcons(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  preloadPromise = Promise.all(allIconPaths().map(loadOne)).then(() => undefined);
  return preloadPromise;
}

export function getIcon(src: string): HTMLImageElement | null {
  const img = cache.get(src);
  if (img && img.complete && img.naturalWidth > 0) return img;
  if (!cache.has(src)) void loadOne(src);
  return null;
}

type Pt = { x: number; y: number };

/**
 * Draw a freigestelltes icon into a convex screen quad (TL,TR,BR,BL)
 * via two affine triangles — used to cut Bauplatz into the floor grid.
 */
export function drawIconQuad(
  ctx: CanvasRenderingContext2D,
  src: string,
  tl: Pt,
  tr: Pt,
  br: Pt,
  bl: Pt,
): boolean {
  const img = getIcon(src);
  if (!img) return false;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw < 2 || ih < 2) return false;
  drawTexturedTriangle(ctx, img, tl, tr, bl, { x: 0, y: 0 }, { x: iw, y: 0 }, { x: 0, y: ih });
  drawTexturedTriangle(ctx, img, tr, br, bl, { x: iw, y: 0 }, { x: iw, y: ih }, { x: 0, y: ih });
  return true;
}

/** Affine-map image triangle abc → screen triangle ABC. */
function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  a: Pt,
  b: Pt,
  c: Pt,
  ia: Pt,
  ib: Pt,
  ic: Pt,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
  ctx.clip();

  const denom =
    ia.x * (ib.y - ic.y) + ib.x * (ic.y - ia.y) + ic.x * (ia.y - ib.y);
  if (Math.abs(denom) < 1e-6) {
    ctx.restore();
    return;
  }
  const m11 =
    (a.x * (ib.y - ic.y) + b.x * (ic.y - ia.y) + c.x * (ia.y - ib.y)) / denom;
  const m12 =
    (a.x * (ic.x - ib.x) + b.x * (ia.x - ic.x) + c.x * (ib.x - ia.x)) / denom;
  const m13 =
    (a.x * (ib.x * ic.y - ic.x * ib.y) +
      b.x * (ic.x * ia.y - ia.x * ic.y) +
      c.x * (ia.x * ib.y - ib.x * ia.y)) /
    denom;
  const m21 =
    (a.y * (ib.y - ic.y) + b.y * (ic.y - ia.y) + c.y * (ia.y - ib.y)) / denom;
  const m22 =
    (a.y * (ic.x - ib.x) + b.y * (ia.x - ic.x) + c.y * (ib.x - ia.x)) / denom;
  const m23 =
    (a.y * (ib.x * ic.y - ic.x * ib.y) +
      b.y * (ic.x * ia.y - ia.x * ic.y) +
      c.y * (ia.x * ib.y - ib.x * ia.y)) /
    denom;

  ctx.transform(m11, m21, m12, m22, m13, m23);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/** Draw a freigestelltes icon centered in a rect, preserving aspect ratio. */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
  pad = 0.06,
): boolean {
  const img = getIcon(src);
  if (!img) return false;
  const px = w * pad;
  const py = h * pad;
  const aw = Math.max(1, w - px * 2);
  const ah = Math.max(1, h - py * 2);
  const scale = Math.min(aw / img.naturalWidth, ah / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return true;
}

export type ToyAnimMode =
  | "idle"
  | "planted"
  | "walk"
  | "cheer"
  | "fight"
  | "exit"
  | "drink"
  | "throw"
  | "shop";

export type ToyAnim = {
  t: number;
  phase?: number;
  mode?: ToyAnimMode;
  facing?: number;
  hop?: number;
  strike?: number;
  /** 0..1 progress within action (drink/throw/shop) for pose blending */
  actionProg?: number;
};

/**
 * Fake-3D toy billboard from a freigestelltes Lv1–5 PNG:
 * ground shadow, bob/squash, sway, walk hop, exit lean, fight/drink/throw.
 */
export function drawToyIcon(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  size: number,
  anim: ToyAnim = { t: 0 },
): boolean {
  const img = getIcon(src);
  if (!img) return false;
  const t = anim.t;
  const ph = anim.phase ?? 0;
  const mode = anim.mode ?? "idle";
  const facing = anim.facing ?? 1;
  const hop =
    anim.hop ??
    (mode === "walk" || mode === "exit" ? 1 : mode === "fight" ? 0.7 : 0);
  const strike = anim.strike ?? 0;
  const ap = Math.max(0, Math.min(1, anim.actionProg ?? strike));

  // Walk cadence ~2 steps/sec; exit slightly faster
  const stepHz = mode === "exit" ? 11 : mode === "walk" ? 10.2 : 9.5;
  const step = Math.sin(t * stepHz + ph);
  const stepAbs = Math.abs(step);

  const idleBob = Math.sin(t * 5.4 + ph) * size * 0.045;
  const cheerBob = Math.sin(t * 10.5 + ph) * size * 0.12;
  // Planted foot: lift on step peak, settle on zero-crossing
  const walkBob = (stepAbs * 0.18 + Math.max(0, step) * 0.04) * size * hop;
  const fightBob = Math.sin(t * 14 + ph) * size * 0.05 + strike * size * -0.1;
  // Drink: lean into mug, small sip bob
  const drinkBob = -size * 0.04 * ap + Math.sin(t * 7 + ph) * size * 0.02;
  // Throw: wind-up (back) then release (forward) based on actionProg
  const throwBob =
    ap < 0.45
      ? size * 0.02 * (ap / 0.45)
      : -size * 0.1 * ((ap - 0.45) / 0.55);
  const shopBob = Math.sin(t * 6 + ph) * size * 0.035;

  const bob =
    mode === "planted"
      ? 0
      : mode === "cheer"
        ? cheerBob
        : mode === "fight"
          ? fightBob
          : mode === "drink"
            ? drinkBob
            : mode === "throw"
              ? throwBob
              : mode === "shop"
                ? shopBob
                : mode === "walk" || mode === "exit"
                  ? -walkBob
                  : idleBob;

  const squashY =
    mode === "planted"
      ? 1
      : mode === "walk" || mode === "exit"
        ? 1 - stepAbs * 0.12 * hop
        : mode === "fight"
          ? 1 - strike * 0.14 + Math.sin(t * 14 + ph) * 0.03
          : mode === "cheer"
            ? 1 + Math.sin(t * 10.5 + ph) * 0.07
            : mode === "drink"
              ? 1 - 0.06 * ap
              : mode === "throw"
                ? 1 - (ap < 0.45 ? 0.04 : 0.1 * ((ap - 0.45) / 0.55))
                : mode === "shop"
                  ? 1 + Math.sin(t * 6 + ph) * 0.03
                  : 1 + Math.sin(t * 5.4 + ph) * 0.025;
  const squashX = 2 - squashY;

  const sway =
    mode === "planted"
      ? 0
      : mode === "cheer"
        ? Math.sin(t * 6.2 + ph) * 0.16
        : mode === "fight"
          ? Math.sin(t * 16 + ph) * 0.2 + strike * 0.28 * facing
          : mode === "drink"
            ? -0.12 * ap * facing + Math.sin(t * 5 + ph) * 0.03
            : mode === "throw"
              ? (ap < 0.45 ? -0.22 * (ap / 0.45) : 0.32 * ((ap - 0.45) / 0.55)) *
                facing
              : mode === "shop"
                ? Math.sin(t * 4.5 + ph) * 0.08
                : mode === "exit"
                  ? 0.18 * facing + step * 0.06
                  : mode === "walk"
                    ? step * 0.12 * hop
                    : Math.sin(t * 2.3 + ph) * 0.04;

  const shear =
    mode === "planted"
      ? 0
      : mode === "walk" || mode === "exit"
        ? step * 0.2 * hop * facing
        : mode === "fight"
          ? strike * 0.32 * facing
          : mode === "drink"
            ? 0.08 * ap * facing
            : mode === "throw"
              ? (ap < 0.45 ? -0.15 : 0.35) * facing * Math.min(1, ap * 1.4)
              : mode === "shop"
                ? Math.sin(t * 5 + ph) * 0.06 * facing
                : 0;

  const lean =
    mode === "exit"
      ? 0.22 * facing
      : mode === "fight"
        ? strike * 0.14 * facing
        : mode === "drink"
          ? 0.1 * ap * facing
          : mode === "throw"
            ? (ap < 0.45 ? -0.12 : 0.18) * facing
            : mode === "walk"
              ? step * 0.04 * hop * facing
              : 0;

  const shW = size * (0.4 + Math.abs(bob) * 0.004) * squashX;
  const shH = size * (0.11 - Math.min(0.04, Math.abs(bob) * 0.002));
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.34)";
  ctx.beginPath();
  ctx.ellipse(
    x + lean * size * 0.15,
    y + size * 0.1,
    shW,
    Math.max(3, shH),
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();

  const dw = size * squashX;
  const dh = size * squashY;
  ctx.save();
  ctx.translate(x + lean * size * 0.2, y + bob);
  ctx.transform(facing, 0, shear, 1, 0, 0);
  ctx.rotate(sway);
  const persp = mode === "exit" ? 0.92 : mode === "throw" ? 0.94 : 0.96;
  ctx.transform(1, 0, 0, persp, 0, 0);
  ctx.drawImage(img, -dw / 2, -dh * 0.92, dw, dh);

  if (
    mode === "cheer" ||
    mode === "fight" ||
    mode === "throw" ||
    strike > 0.2
  ) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha =
      mode === "cheer"
        ? 0.14
        : mode === "throw"
          ? 0.12 + ap * 0.18
          : 0.1 + strike * 0.15;
    ctx.drawImage(img, -dw / 2, -dh * 0.92, dw, dh);
  }
  ctx.restore();
  return true;
}

export type ToyPropKind = "beer" | "pyro" | "fist" | "scarf" | "bag";

/** Small action prop overlay next to a toy unit (drink / throw / fight). */
export function drawToyProp(
  ctx: CanvasRenderingContext2D,
  kind: ToyPropKind,
  x: number,
  y: number,
  size: number,
  facing: number,
  t: number,
  intensity = 1,
): void {
  const i = Math.max(0, Math.min(1, intensity));
  if (i < 0.05) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.55 + 0.45 * i;
  if (kind === "beer") {
    const bx = facing * size * 0.38;
    const by = -size * (0.42 + 0.08 * Math.sin(t * 7));
    const mw = size * 0.16;
    const mh = size * 0.22;
    ctx.fillStyle = "#f59e0b";
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = Math.max(1, size * 0.03);
    ctx.beginPath();
    ctx.moveTo(bx - mw / 2, by - mh / 2 + 2);
    ctx.lineTo(bx + mw / 2, by - mh / 2 + 2);
    ctx.lineTo(bx + mw / 2 - 1, by + mh / 2);
    ctx.lineTo(bx - mw / 2 + 1, by + mh / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff7ed";
    ctx.fillRect(bx - mw / 2 + 1, by - mh / 2, mw - 2, size * 0.05);
  } else if (kind === "pyro") {
    const px = facing * size * (0.45 + 0.08 * i);
    const py = -size * (0.55 - 0.12 * i);
    const g = ctx.createRadialGradient(px, py, 1, px, py, size * 0.16);
    g.addColorStop(0, "#fff7ed");
    g.addColorStop(0.45, "#fb923c");
    g.addColorStop(1, "rgba(239,68,68,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = Math.max(2, size * 0.04);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(facing * size * 0.22, -size * 0.2);
    ctx.lineTo(px, py);
    ctx.stroke();
  } else if (kind === "fist") {
    const fx = facing * size * (0.5 + 0.2 * i);
    const fy = -size * 0.25;
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(fx, fy, size * (0.08 + 0.04 * i), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(251,191,36,${0.35 + 0.4 * i})`;
    ctx.lineWidth = Math.max(2, size * 0.05);
    ctx.beginPath();
    ctx.arc(fx, fy, size * (0.14 + 0.06 * i), 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "scarf") {
    const sx = facing * size * 0.05;
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = Math.max(2, size * 0.05);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx - size * 0.12, -size * 0.55);
    ctx.quadraticCurveTo(
      sx,
      -size * (0.75 + 0.05 * Math.sin(t * 8)),
      sx + size * 0.12,
      -size * 0.55,
    );
    ctx.stroke();
  } else if (kind === "bag") {
    const bx = facing * size * 0.4;
    const by = -size * 0.15;
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(bx - size * 0.1, by - size * 0.08, size * 0.2, size * 0.18);
    ctx.strokeStyle = "#5b21b6";
    ctx.lineWidth = Math.max(1, size * 0.025);
    ctx.strokeRect(bx - size * 0.1, by - size * 0.08, size * 0.2, size * 0.18);
  }
  ctx.restore();
}
