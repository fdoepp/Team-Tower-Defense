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
  return `icons/units/${map[kind]}-${color}-${lv}.png`;
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
  scoreboard: "icons/ui/scoreboard-momentum.png",
} as const;

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
      for (let lv = 1; lv <= 5; lv++) paths.add(unitIconPath(kind, color, lv));
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

export type ToyAnim = {
  /** seconds */
  t: number;
  /** per-unit phase offset */
  phase?: number;
  /** idle | walk | cheer | fight | exit */
  mode?: "idle" | "walk" | "cheer" | "fight" | "exit";
  /** face left (-1) or right (1) */
  facing?: number;
  /** 0..1 hop intensity */
  hop?: number;
  /** 0..1 punch / hit flash */
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

  // soft ground shadow (fake contact) — stretches with hop
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
  // slight perspective foreshorten (toy tilt)
  const persp = mode === "exit" ? 0.92 : 0.96;
  ctx.transform(1, 0, 0, persp, 0, 0);
  ctx.drawImage(img, -dw / 2, -dh * 0.92, dw, dh);

  // rim light for “toy plastic” pop
  if (mode === "cheer" || mode === "fight" || strike > 0.2) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = mode === "cheer" ? 0.14 : 0.1 + strike * 0.15;
    ctx.drawImage(img, -dw / 2, -dh * 0.92, dw, dh);
  }
  ctx.restore();
  return true;
}
