import type { BuildingKind, FanKind, TeamId } from "./types";

export type TeamColor = "blue" | "red" | "grey";

const cache = new Map<string, HTMLImageElement>();
let preloadPromise: Promise<void> | null = null;

export function teamColor(team: TeamId | "neutral" | null | undefined): TeamColor {
  if (team === "ksc") return "blue";
  if (team === "vfb") return "red";
  return "grey";
}

/** Soft-bound stand icon — always from `game/public/icons/stands/`. */
export function standIconPath(
  kind: BuildingKind,
  color: TeamColor,
  level: number,
): string {
  const lv = Math.max(1, Math.min(5, Math.floor(level) || 1));
  return `icons/stands/${kind}-${color}-${lv}.png`;
}

const UNIT_FILE: Record<FanKind | "ordner", string> = {
  normalos: "fan",
  ultras: "ultra",
  hooligans: "hooligan",
  ordner: "ordner",
};

/** Soft-bound unit icon — always from `game/public/icons/units/`. */
export function unitIconPath(
  kind: FanKind | "ordner",
  color: TeamColor,
  level = 1,
): string {
  const lv = Math.max(1, Math.min(5, Math.floor(level) || 1));
  return `icons/units/${UNIT_FILE[kind]}-${color}-${lv}.png`;
}

/** Soft-bound head crop for Personen-Rail (Icon-Agent heads/). */
export function unitHeadIconPath(
  kind: FanKind | "ordner",
  color: TeamColor,
  level = 1,
): string {
  const lv = Math.max(1, Math.min(5, Math.floor(level) || 1));
  return `icons/units/heads/${UNIT_FILE[kind]}-${color}-${lv}.png`;
}

/** Deploy-Default: parallel zum Bildrand (iso nur Alternate). */
export type SlotEmptyOrientation = "parallel" | "iso";
export const SLOT_EMPTY_ORIENTATION: SlotEmptyOrientation = "parallel";

export type SlotControl = "blue" | "red" | "grey";

/**
 * Kanonische UI-Assets (Icon-Agents / ASSET_DB).
 * Scoreboard: `scoreboard-top.png` (HUD_TOP_CANON) — nicht scoreboard-momentum.
 */
export const UI_ICONS = {
  slotEmpty: "icons/ui/slot-empty.png",
  slotEmptyParallel: "icons/ui/slot-empty-parallel.png",
  slotEmptyIso: "icons/ui/slot-empty-iso.png",
  slotEmptyParallelBlue: "icons/ui/slot-empty-parallel-blue.png",
  slotEmptyParallelRed: "icons/ui/slot-empty-parallel-red.png",
  slotEmptyIsoBlue: "icons/ui/slot-empty-iso-blue.png",
  slotEmptyIsoRed: "icons/ui/slot-empty-iso-red.png",
  /** Axis-aligned, flagless source — ground tinted by team; warped into floor-grid quads. */
  slotEmptyOrtho: "icons/ui/slot-empty-ortho.png",
  slotEmptyOrthoBlue: "icons/ui/slot-empty-ortho-blue.png",
  slotEmptyOrthoRed: "icons/ui/slot-empty-ortho-red.png",
  currencyGold: "icons/ui/currency-gold.png",
  currencyBier: "icons/ui/currency-bier.png",
  currencyFanartikel: "icons/ui/currency-fanartikel.png",
  currencySicherheit: "icons/ui/currency-sicherheit.png",
  btnKaufenGrey: "icons/ui/btn-kaufen-grey.png",
  btnKaufenGreen: "icons/ui/btn-kaufen-green.png",
  btnSendenGrey: "icons/ui/btn-senden-grey.png",
  btnSendenGreen: "icons/ui/btn-senden-green.png",
  btnSendenBlue: "icons/ui/btn-senden-blue.png",
  btnBauenAmber: "icons/ui/btn-bauen-amber.png",
  btnBauenGrey: "icons/ui/btn-bauen-grey.png",
  btnUpgradePurple: "icons/ui/btn-upgrade-purple.png",
  btnUpgradeGrey: "icons/ui/btn-upgrade-grey.png",
  pennantKsc: "icons/ui/pennant-ksc.png",
  pennantVfb: "icons/ui/pennant-vfb.png",
  menuRail: "icons/ui/menu-rail-brown.png",
  menuRailTile: "icons/ui/menu-rail-brown-tile.png",
  /** HUD_TOP_CANON — Broadcast Bubble (freigestellt) */
  scoreboard: "icons/ui/scoreboard-top.png",
  scoreboardOrbHeim: "icons/ui/scoreboard-top-orb-heim.png",
  scoreboardOrbGast: "icons/ui/scoreboard-top-orb-gast.png",
} as const;

/** Native pixel size of scoreboard-top.png — never squash/stretch away from this AR. */
export const SCOREBOARD_NATIVE = { w: 1041, h: 508 } as const;
export const SCOREBOARD_AR = SCOREBOARD_NATIVE.w / SCOREBOARD_NATIVE.h;

/**
 * Stadium scene (Konzept-Agent / stadium-background.mdc).
 * Derby-BG + freigestellte Tribünen — nie verzerren (Cover/Contain).
 */
export const SCENE_ASSETS = {
  stadiumBg: "assets/stadium-floodlight-derby-bg.jpg",
  tribuneBlue: "assets/tribune-block-blue.png",
  tribuneGrey: "assets/tribune-block-grey.png",
  tribuneRed: "assets/tribune-block-red.png",
} as const;

export function tribuneIconPath(blockId: number): string {
  if (blockId === 0) return SCENE_ASSETS.tribuneBlue;
  if (blockId === 2) return SCENE_ASSETS.tribuneRed;
  return SCENE_ASSETS.tribuneGrey;
}

export function currencyIconPath(
  currency: "beer" | "merch" | "security" | "gold",
): string {
  if (currency === "beer") return UI_ICONS.currencyBier;
  if (currency === "merch") return UI_ICONS.currencyFanartikel;
  if (currency === "security") return UI_ICONS.currencySicherheit;
  return UI_ICONS.currencyGold;
}

/**
 * Leerer Bauplatz je Kontrolle.
 * Team → Plot + Standarte im Icon; grau → ohne Standarte.
 *
 * When `orthoSource` is true (floor-grid couple), return the axis-aligned
 * flagless source PNGs (team color via ground tint) — warped into the cell.
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
  if (c === "blue") return UI_ICONS.slotEmptyParallelBlue;
  if (c === "red") return UI_ICONS.slotEmptyParallelRed;
  return UI_ICONS.slotEmptyParallel;
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
  // Triangle 1: TL-TR-BL  ←→  (0,0)-(iw,0)-(0,ih)
  drawTexturedTriangle(ctx, img, tl, tr, bl, { x: 0, y: 0 }, { x: iw, y: 0 }, { x: 0, y: ih });
  // Triangle 2: TR-BR-BL  ←→  (iw,0)-(iw,ih)-(0,ih)
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

  // Solve affine: [x y 1] = [u v 1] * M
  const denom =
    ia.x * (ib.y - ic.y) + ib.x * (ic.y - ia.y) + ic.x * (ia.y - ib.y);
  if (Math.abs(denom) < 1e-6) {
    ctx.restore();
    return;
  }
  // Map from texture → screen
  // Using determinant form for the 2x3 affine matrix
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

  // Multiply onto current transform (keeps main.ts DPR scale).
  ctx.transform(m11, m21, m12, m22, m13, m23);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
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
      cache.set(src, img);
      resolve(img);
    };
    img.src = src;
  });
}

function allIconPaths(): string[] {
  const paths = new Set<string>([
    ...Object.values(UI_ICONS),
    ...Object.values(SCENE_ASSETS),
  ]);
  for (const orient of ["parallel", "iso"] as SlotEmptyOrientation[]) {
    for (const c of ["grey", "blue", "red"] as SlotControl[]) {
      paths.add(slotEmptyIconPath(c, orient));
    }
  }
  for (const kind of ["bier", "fanshop", "ordner"] as BuildingKind[]) {
    for (const color of ["blue", "red", "grey"] as TeamColor[]) {
      for (let lv = 1; lv <= 5; lv++) paths.add(standIconPath(kind, color, lv));
    }
  }
  for (const kind of ["normalos", "ultras", "hooligans", "ordner"] as const) {
    for (const color of ["blue", "red", "grey"] as TeamColor[]) {
      for (let lv = 1; lv <= 5; lv++) {
        paths.add(unitIconPath(kind, color, lv));
        paths.add(unitHeadIconPath(kind, color, lv));
      }
    }
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

/** Uniform fit of a native size into a max box — never squash. */
export function fitUniform(
  natW: number,
  natH: number,
  maxW: number,
  maxH: number,
): { w: number; h: number; scale: number } {
  const nw = Math.max(1, natW);
  const nh = Math.max(1, natH);
  const scale = Math.min(maxW / nw, maxH / nh);
  return { w: nw * scale, h: nh * scale, scale };
}

/**
 * Draw a freigestelltes icon centered in a rect, preserving aspect ratio.
 * Never squash/stretch — only uniform scale (Contain).
 */
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
  const { w: dw, h: dh } = fitUniform(img.naturalWidth, img.naturalHeight, aw, ah);
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return true;
}

/**
 * Draw image at exact native aspect into a max box (top-centered).
 * Returns the drawn rect, or null if not loaded.
 */
export function drawUniformInBox(
  ctx: CanvasRenderingContext2D,
  src: string,
  boxX: number,
  boxY: number,
  maxW: number,
  maxH: number,
): { x: number; y: number; w: number; h: number } | null {
  const img = getIcon(src);
  if (!img) return null;
  const natW = img.naturalWidth || SCOREBOARD_NATIVE.w;
  const natH = img.naturalHeight || SCOREBOARD_NATIVE.h;
  const { w: dw, h: dh } = fitUniform(natW, natH, maxW, maxH);
  const dx = boxX + (maxW - dw) / 2;
  const dy = boxY;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { x: dx, y: dy, w: dw, h: dh };
}

/**
 * Cover a rect with an image (uniform scale, crop overflow).
 * Preserves aspect — never distorts.
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const img = getIcon(src);
  if (!img) return false;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

export type ToyAnim = {
  t: number;
  phase?: number;
  mode?: "idle" | "walk" | "cheer" | "fight" | "exit";
  facing?: number;
  hop?: number;
  strike?: number;
};

/**
 * Fake-3D toy billboard from a freigestelltes Lv1–5 PNG:
 * ground shadow, bob/squash, sway, walk hop, exit lean, fight strike.
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

  const step = Math.sin(t * (mode === "exit" ? 11 : 9.5) + ph);
  const idleBob = Math.sin(t * 5.4 + ph) * size * 0.045;
  const cheerBob = Math.sin(t * 10.5 + ph) * size * 0.1;
  const walkBob = Math.abs(step) * size * 0.16 * hop;
  const fightBob = Math.sin(t * 14 + ph) * size * 0.05 + strike * size * -0.08;
  const bob =
    mode === "cheer"
      ? cheerBob
      : mode === "fight"
        ? fightBob
        : mode === "walk" || mode === "exit"
          ? -walkBob
          : idleBob;

  const squashY =
    mode === "walk" || mode === "exit"
      ? 1 - Math.abs(step) * 0.1 * hop
      : mode === "fight"
        ? 1 - strike * 0.12 + Math.sin(t * 14 + ph) * 0.03
        : mode === "cheer"
          ? 1 + Math.sin(t * 10.5 + ph) * 0.06
          : 1 + Math.sin(t * 5.4 + ph) * 0.025;
  const squashX = 2 - squashY;
  const sway =
    mode === "cheer"
      ? Math.sin(t * 6.2 + ph) * 0.14
      : mode === "fight"
        ? Math.sin(t * 16 + ph) * 0.18 + strike * 0.25 * facing
        : mode === "exit"
          ? 0.18 * facing + step * 0.06
          : mode === "walk"
            ? step * 0.1 * hop
            : Math.sin(t * 2.3 + ph) * 0.04;
  const shear =
    mode === "walk" || mode === "exit"
      ? step * 0.16 * hop * facing
      : mode === "fight"
        ? strike * 0.28 * facing
        : 0;
  const lean =
    mode === "exit" ? 0.22 * facing : mode === "fight" ? strike * 0.12 * facing : 0;

  const shW = size * (0.4 + Math.abs(bob) * 0.004) * squashX;
  const shH = size * (0.11 - Math.min(0.04, Math.abs(bob) * 0.002));
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.34)";
  ctx.beginPath();
  ctx.ellipse(x + lean * size * 0.15, y + size * 0.1, shW, Math.max(3, shH), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const dw = size * squashX;
  const dh = size * squashY;
  ctx.save();
  ctx.translate(x + lean * size * 0.2, y + bob);
  ctx.transform(facing, 0, shear, 1, 0, 0);
  ctx.rotate(sway);
  const persp = mode === "exit" ? 0.92 : 0.96;
  ctx.transform(1, 0, 0, persp, 0, 0);
  ctx.drawImage(img, -dw / 2, -dh * 0.92, dw, dh);

  if (mode === "cheer" || mode === "fight" || strike > 0.2) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = mode === "cheer" ? 0.14 : 0.1 + strike * 0.15;
    ctx.drawImage(img, -dw / 2, -dh * 0.92, dw, dh);
  }
  ctx.restore();
  return true;
}
