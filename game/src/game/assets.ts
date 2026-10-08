import type { BuildingKind, FanKind, TeamId } from "./types";

export type TeamColor = "blue" | "red" | "grey";

const cache = new Map<string, HTMLImageElement>();
let preloadPromise: Promise<void> | null = null;

export function teamColor(team: TeamId | "neutral" | null | undefined): TeamColor {
  if (team === "ksc") return "blue";
  if (team === "vfb") return "red";
  return "grey";
}

/**
 * Kanonischer Stand-Icon-Pfad (soft-bound).
 * Action Cards / Rail / Render laden immer diese Datei zur Laufzeit —
 * keine eingebackenen Gebäude-Kachel-PNGs. Icon-Updates unter
 * `game/public/icons/stands/` greifen beim nächsten Deploy/Preload.
 */
export function standIconPath(
  kind: BuildingKind,
  color: TeamColor,
  level: number,
): string {
  const lv = Math.max(1, Math.min(5, Math.floor(level) || 1));
  return `icons/stands/${kind}-${color}-${lv}.png`;
}

/**
 * Kanonischer Unit-Icon-Pfad (soft-bound).
 * Action Cards laden immer diese Datei — Updates unter
 * `game/public/icons/units/` greifen beim Preload.
 */
const UNIT_FILE: Record<FanKind | "ordner", string> = {
  normalos: "fan",
  ultras: "ultra",
  hooligans: "hooligan",
  ordner: "ordner",
};

export function unitIconPath(
  kind: FanKind | "ordner",
  color: TeamColor,
  level = 1,
): string {
  const lv = Math.max(1, Math.min(5, Math.floor(level) || 1));
  return `icons/units/${UNIT_FILE[kind]}-${color}-${lv}.png`;
}

/** Kopf-Crop (Kinn → Kopfbedeckung) für kompakte Personen-Rail — Level soft-bound. */
export function unitHeadIconPath(
  kind: FanKind | "ordner",
  color: TeamColor,
  level = 1,
): string {
  const lv = Math.max(1, Math.min(5, Math.floor(level) || 1));
  return `icons/units/heads/${UNIT_FILE[kind]}-${color}-${lv}.png`;
}

/**
 * Bauplatz-Orientierung (Deploy-Default: parallel zum Bildrand).
 * Iso-Varianten liegen parallel als `slot-empty-iso*.png` bereit.
 */
export type SlotEmptyOrientation = "parallel" | "iso";
export const SLOT_EMPTY_ORIENTATION: SlotEmptyOrientation = "parallel";

/** Kontrolle eines leeren Bauplatzes → Icon (Standarte an/aus). */
export type SlotControl = "blue" | "red" | "grey";

export const UI_ICONS = {
  /** Neutral / grau — ohne Standarte (Default Deploy) */
  slotEmpty: "icons/ui/slot-empty.png",
  slotEmptyParallel: "icons/ui/slot-empty-parallel.png",
  slotEmptyIso: "icons/ui/slot-empty-iso.png",
  slotEmptyParallelBlue: "icons/ui/slot-empty-parallel-blue.png",
  slotEmptyParallelRed: "icons/ui/slot-empty-parallel-red.png",
  slotEmptyIsoBlue: "icons/ui/slot-empty-iso-blue.png",
  slotEmptyIsoRed: "icons/ui/slot-empty-iso-red.png",
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
  /** Kanonische Standarten (Holz + Streifenfahne) */
  pennantKsc: "icons/ui/pennant-ksc.png",
  pennantVfb: "icons/ui/pennant-vfb.png",
  menuRail: "icons/ui/menu-rail-brown.png",
  scoreboard: "icons/ui/scoreboard-top.png",
  scoreboardOrbHeim: "icons/ui/scoreboard-top-orb-heim.png",
  scoreboardOrbGast: "icons/ui/scoreboard-top-orb-gast.png",
} as const;

/** Native pixel size of scoreboard-top.png — never squash/stretch. */
export const SCOREBOARD_NATIVE = { w: 1041, h: 508 } as const;
export const SCOREBOARD_AR = SCOREBOARD_NATIVE.w / SCOREBOARD_NATIVE.h;

export function currencyIconPath(
  currency: "beer" | "merch" | "security" | "gold",
): string {
  if (currency === "beer") return UI_ICONS.currencyBier;
  if (currency === "merch") return UI_ICONS.currencyFanartikel;
  if (currency === "security") return UI_ICONS.currencySicherheit;
  return UI_ICONS.currencyGold;
}

/**
 * Leerer Bauplatz-Icon je Kontrolle.
 * - grey/neutral → ohne Standarte
 * - blue (KSC) / red (VfB) → Plot + Standarte in Teamfarbe
 * Wird bei jedem Match-Start geladen und zur Laufzeit automatisch getauscht.
 */
export function slotEmptyIconPath(
  control: SlotControl | TeamId | "neutral" | null | undefined,
  orientation: SlotEmptyOrientation = SLOT_EMPTY_ORIENTATION,
): string {
  const c: SlotControl =
    control === "ksc" || control === "blue"
      ? "blue"
      : control === "vfb" || control === "red"
        ? "red"
        : "grey";
  if (orientation === "iso") {
    if (c === "blue") return UI_ICONS.slotEmptyIsoBlue;
    if (c === "red") return UI_ICONS.slotEmptyIsoRed;
    return UI_ICONS.slotEmptyIso;
  }
  if (c === "blue") return UI_ICONS.slotEmptyParallelBlue;
  if (c === "red") return UI_ICONS.slotEmptyParallelRed;
  return UI_ICONS.slotEmptyParallel;
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
  const paths = new Set<string>(Object.values(UI_ICONS));
  // Explizit alle Bauplatz-/Standarten-Varianten (Deploy + Auto-Swap)
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
    mode === "cheer"
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
    mode === "walk" || mode === "exit"
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
    mode === "cheer"
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
    mode === "walk" || mode === "exit"
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
