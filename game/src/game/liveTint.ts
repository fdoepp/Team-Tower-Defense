/**
 * Live kit tint: recolor blue/red team PNGs toward club primary colors.
 * Original assets stay in UI_FINAL_DB; tinted canvases are cached at runtime.
 */

import { clubPrimary, clubSecondary } from "./clubs";
import { UI_FINAL_PATHS, type LiveTintMeta } from "./uiFinal";

export type BasePalette = "blue" | "red";

const tintCache = new Map<string, HTMLCanvasElement>();
let brandEpoch = 0;

/** Call when side branding changes so caches refresh. */
export function bumpLiveTintEpoch(): void {
  brandEpoch++;
  tintCache.clear();
}

export function clearLiveTintCache(): void {
  tintCache.clear();
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return [
      parseInt(h[0]! + h[0]!, 16),
      parseInt(h[1]! + h[1]!, 16),
      parseInt(h[2]! + h[2]!, 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0,
    gp = 0,
    bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return [
    Math.round((rp + m) * 255),
    Math.round((gp + m) * 255),
    Math.round((bp + m) * 255),
  ];
}

/** Mask strength 0..1 for team-color pixels in the base palette. */
function teamMask(r: number, g: number, b: number, base: BasePalette): number {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (s < 0.08 || l < 0.06 || l > 0.94) return 0;
  if (base === "blue") {
    const hueOk = h >= 175 && h <= 265;
    const chanOk = b > r + 12 && b > g + 4 && b > 55;
    if (!hueOk && !chanOk) return 0;
    const hueW = hueOk ? 1 - Math.min(1, Math.abs(h - 215) / 55) : 0.35;
    const satW = Math.min(1, (s - 0.08) / 0.45);
    return Math.max(0, Math.min(1, hueW * 0.55 + satW * 0.45));
  }
  // red
  const hueOk = h <= 28 || h >= 335;
  const chanOk = r > g + 18 && r > b + 12 && r > 70;
  if (!hueOk && !chanOk) return 0;
  const hueDist = h <= 28 ? h : 360 - h;
  const hueW = hueOk ? 1 - Math.min(1, hueDist / 30) : 0.35;
  const satW = Math.min(1, (s - 0.08) / 0.45);
  return Math.max(0, Math.min(1, hueW * 0.55 + satW * 0.45));
}

export function recolorImageData(
  data: ImageData,
  base: BasePalette,
  primaryHex: string,
  secondaryHex?: string,
): void {
  const [tr, tg, tb] = parseHex(primaryHex);
  const [th, ts] = rgbToHsl(tr, tg, tb);
  const sec = secondaryHex ? parseHex(secondaryHex) : null;
  const [sh, ss] = sec ? rgbToHsl(sec[0], sec[1], sec[2]) : [0, 0];
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3]!;
    if (a < 10) continue;
    const r = px[i]!;
    const g = px[i + 1]!;
    const b = px[i + 2]!;
    const m = teamMask(r, g, b, base);
    if (m < 0.08) continue;
    const [, , l] = rgbToHsl(r, g, b);
    // Keep source lightness so shading/folds survive; pull hue/sat from kit
    const sat = Math.min(1, ts * 0.75 + 0.25 * m);
    let [nr, ng, nb] = hslToRgb(th, sat, l);
    // Soft secondary accents on very light team pixels (scarves/trim)
    if (sec && l > 0.72 && m > 0.35 && ss > 0.15) {
      const [sr, sg, sb] = hslToRgb(sh, Math.min(1, ss), Math.min(0.92, l));
      const t = (l - 0.72) / 0.28;
      nr = Math.round(nr * (1 - t) + sr * t);
      ng = Math.round(ng * (1 - t) + sg * t);
      nb = Math.round(nb * (1 - t) + sb * t);
    }
    px[i] = Math.round(r * (1 - m) + nr * m);
    px[i + 1] = Math.round(g * (1 - m) + ng * m);
    px[i + 2] = Math.round(b * (1 - m) + nb * m);
  }
}

/** Infer base palette from asset path / filename. */
export function paletteFromPath(src: string): BasePalette | null {
  const s = src.toLowerCase();
  // Prefer explicit tokens; avoid matching "red" inside unrelated words
  if (
    /(?:^|[/-])(?:fan|ultra|hooligan|ordner|bier|fanshop|stand|tribune|slot-empty|fist|pyro|pennant|wimpel)[^/]*red/.test(
      s,
    ) ||
    /(?:^|[/-])red(?:[-.]|$)/.test(s) ||
    /-red-/.test(s) ||
    /tribune-block-red/.test(s)
  ) {
    return "red";
  }
  if (
    /(?:^|[/-])(?:fan|ultra|hooligan|ordner|bier|fanshop|stand|tribune|slot-empty|fist|pyro|pennant|wimpel)[^/]*blue/.test(
      s,
    ) ||
    /(?:^|[/-])blue(?:[-.]|$)/.test(s) ||
    /-blue-/.test(s) ||
    /tribune-block-blue/.test(s)
  ) {
    return "blue";
  }
  return null;
}

export function liveTintMetaForPath(src: string): LiveTintMeta | null {
  const clean = src.replace(/^\.\//, "").replace(/^\//, "");
  for (const e of Object.values(UI_FINAL_PATHS) as Array<{
    file: string;
    path: string;
    liveTint?: LiveTintMeta;
  }>) {
    if (e.path === clean || clean.endsWith(e.file) || clean.endsWith(e.path)) {
      return e.liveTint ?? null;
    }
  }
  const pal = paletteFromPath(src);
  if (!pal) return null;
  return {
    enabled: true,
    basePalette: pal,
    pullsFrom: "sideKitPrimary",
    side: pal === "blue" ? "heim" : "gast",
  };
}

/**
 * Return a canvas with team pixels pulled to current club kit, or null to use original.
 */
export function getLiveTintedCanvas(
  img: HTMLImageElement,
  src: string,
): HTMLCanvasElement | null {
  const meta = liveTintMetaForPath(src);
  const base = meta?.basePalette ?? paletteFromPath(src);
  if (!base) return null;
  if (meta && meta.enabled !== true) return null;

  const side = meta?.side ?? (base === "blue" ? "heim" : "gast");
  const teamSide = side === "heim" ? "ksc" : "vfb";
  const primary = clubPrimary(teamSide);
  const secondary = clubSecondary(teamSide);
  const key = `${brandEpoch}|${src}|${primary}|${secondary}`;
  const hit = tintCache.get(key);
  if (hit) return hit;

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (w < 2 || h < 2) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  recolorImageData(imageData, base, primary, secondary);
  ctx.putImageData(imageData, 0, 0);
  tintCache.set(key, canvas);
  // Cap cache size
  if (tintCache.size > 220) {
    const first = tintCache.keys().next().value;
    if (first) tintCache.delete(first);
  }
  return canvas;
}

/** Hex primary for a side — for particles / procedural FX. */
export function sideKitHex(side: "ksc" | "vfb"): string {
  return clubPrimary(side);
}

export function sideKitRgba(side: "ksc" | "vfb", alpha: number): string {
  const [r, g, b] = parseHex(clubPrimary(side));
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Rewrite DOM <img> srcs that point at blue/red team assets to live-tinted data URLs.
 * Keeps `data-live-tint-src` as the original path for re-tint on branding change.
 */
export function applyLiveTintToDomImages(root: ParentNode = document): number {
  let n = 0;
  const imgs = root.querySelectorAll("img");
  imgs.forEach((imgEl) => {
    const el = imgEl as HTMLImageElement;
    const original =
      el.dataset.liveTintSrc || el.getAttribute("src") || "";
    if (!paletteFromPath(original)) return;
    el.dataset.liveTintSrc = original;
    const raw = new Image();
    raw.decoding = "async";
    raw.onload = () => {
      const canvas = getLiveTintedCanvas(raw, original);
      if (!canvas) return;
      try {
        el.src = canvas.toDataURL("image/png");
        el.dataset.liveTint = "1";
        n++;
      } catch {
        /* ignore */
      }
    };
    raw.src = original;
  });
  return n;
}
