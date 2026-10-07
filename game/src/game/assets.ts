import type { BuildingKind, FanKind, TeamId } from "./types";

export type TeamColor = "blue" | "red" | "grey";

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
  return `icons/stands/${kind}-${color}-${lv}.png`;
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
  return `icons/units/${map[kind]}-${color}-${lv}.png`;
}

export const UI_ICONS = {
  slotEmpty: "icons/ui/slot-empty.png",
  currencyGold: "icons/ui/currency-gold.png",
  currencyBier: "icons/ui/currency-bier.png",
  currencyFanartikel: "icons/ui/currency-fanartikel.png",
  currencySicherheit: "icons/ui/currency-sicherheit.png",
  btnKaufenGrey: "icons/ui/btn-kaufen-grey.png",
  btnKaufenGreen: "icons/ui/btn-kaufen-green.png",
  btnSendenGrey: "icons/ui/btn-senden-grey.png",
  btnSendenGreen: "icons/ui/btn-senden-green.png",
  pennantKsc: "icons/ui/pennant-ksc.png",
  pennantVfb: "icons/ui/pennant-vfb.png",
  menuRail: "icons/ui/menu-rail-brown.png",
  scoreboard: "icons/ui/scoreboard-momentum.png",
} as const;

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
