/** Matchday Comic — ~⅓ scoreboard / ⅓ blocks / ⅓ gang */

import {
  boothQuad,
  FLOOR_GRID_COUPLE,
  floorGangBand,
  quadCenter,
  quadPennantPos,
  quadToRect,
} from "./floorGrid";

export const BLOCK_COUNT = 3;
export const HEIM_BLOCK = 0;
export const NEUTRAL_BLOCK = 1;
export const GAST_BLOCK = 2;
export const NEUTRAL_BLOCKS = [NEUTRAL_BLOCK] as const;
export const SEATS_PER_BLOCK = 12;
export const SEAT_COLS = 3;
export const SEAT_ROWS = 4;

/**
 * Vertical pack (~thirds):
 * - top: stadium bowl + scoreboard + currencies
 * - middle: Heim | Neutral | Gäste stands
 * - bottom: gang with Baustellen
 */
export const L = {
  stadiumH: 0.34,
  /** Stands sit mid-screen; more room above plots for Anzeige */
  blockTop: 0.34,
  blockBodyH: 0.32,
  gangPadTop: 0.008,
  /** Gang packed lower — Bauplätze sit near bottom edge */
  gangH: 0.30,
  /**
   * Outer inset for the flush tribune strip (normalized).
   * Outer corners sit just inside the canvas / sidebars.
   */
  blocksLeft: 0.01,
  blocksRight: 0.99,
  /** Kept for legacy; flush pack uses 0 gap (face-overlap). */
  blockGap: 0,
  doorFrac: 0.14,
  plotW: 0.1,
  plotH: 0.095,
};

/**
 * Native tribune PNG sizes + floor-face transparent pads (px).
 * Facing pads are overlapped so platform floors meet flush.
 */
export const TRIBUNE_NATIVE = [
  // faceL/R: transparent pads at the floor + a little extra so 3D side
  // bevels tuck under the neighbor (true visual flush, not just AABB).
  { w: 426, h: 309, faceL: 6, faceR: 48 }, // Heim blue
  { w: 386, h: 308, faceL: 14, faceR: 14 }, // Neutral grey
  { w: 426, h: 309, faceL: 48, faceR: 6 }, // Gäste red
] as const;

export type TribuneRectNorm = { x: number; y: number; w: number; h: number };

type TribunePack = {
  aspect: number;
  rects: TribuneRectNorm[];
  centers: number[];
  widths: number[];
  left: number;
  right: number;
};

let _pack: TribunePack | null = null;

/**
 * Recompute flush tribune strip for the current canvas aspect (W/H).
 * Grey is centered; blue/red abut it; uniform scale per PNG (no distort).
 */
export function syncTribuneLayout(canvasW: number, canvasH: number): TribunePack {
  const aspect = canvasW / Math.max(1, canvasH);
  if (_pack && Math.abs(_pack.aspect - aspect) < 1e-5) return _pack;

  const edge = L.blocksLeft; // symmetric inset; blocksRight mirrored
  const avail = Math.max(0.2, 1 - edge * 2);

  // Vertical shelf: feet just above the far Bau row (floor sits lower → tribunes end lower).
  const shelfTop = 0.12;
  const shelfBottom = FLOOR_GRID_COUPLE
    ? Math.max(shelfTop + 0.3, floorGangBand().y0 - 0.012)
    : L.blockTop + L.blockBodyH;
  const maxH = Math.max(0.28, shelfBottom - shelfTop);

  /** Pack at height hNorm; returns AABB xs/ws + content span. */
  const packAt = (hNorm: number) => {
    const ws = TRIBUNE_NATIVE.map((t) => (t.w / t.h) * (hNorm / aspect));
    const xs = [0, 0, 0];
    // Overlap facing transparent pads so floors meet.
    const contentRight = (i: number, x: number, w: number) =>
      x + w * (1 - TRIBUNE_NATIVE[i]!.faceR / TRIBUNE_NATIVE[i]!.w);
    const contentLeft = (i: number, x: number, w: number) =>
      x + w * (TRIBUNE_NATIVE[i]!.faceL / TRIBUNE_NATIVE[i]!.w);

    xs[0] = 0;
    const bcr = contentRight(0, xs[0], ws[0]!);
    xs[1] = bcr - ws[1]! * (TRIBUNE_NATIVE[1]!.faceL / TRIBUNE_NATIVE[1]!.w);
    const gcr = contentRight(1, xs[1], ws[1]!);
    xs[2] = gcr - ws[2]! * (TRIBUNE_NATIVE[2]!.faceL / TRIBUNE_NATIVE[2]!.w);

    const leftC = contentLeft(0, xs[0], ws[0]!);
    const rightC = contentRight(2, xs[2], ws[2]!);
    return { xs, ws, leftC, rightC, span: rightC - leftC };
  };

  // Prefer filling nearly to the sidebars (width-driven), capped by shelf height.
  const unit = packAt(1);
  const hForWidth = avail / Math.max(1e-6, unit.span);
  const hNorm = Math.min(maxH, hForWidth);
  const packed = packAt(hNorm);

  // Center grey on screen; nudge only if outer content would clip.
  const greyCx = packed.xs[1]! + packed.ws[1]! / 2;
  let shift = 0.5 - greyCx;
  if (packed.leftC + shift < edge) shift = edge - packed.leftC;
  if (packed.rightC + shift > 1 - edge) shift = 1 - edge - packed.rightC;

  // Feet on the shelf above the Bau rows.
  const top = shelfBottom - hNorm;
  const rects: TribuneRectNorm[] = [0, 1, 2].map((i) => ({
    x: packed.xs[i]! + shift,
    y: top,
    w: packed.ws[i]!,
    h: hNorm,
  }));

  _pack = {
    aspect,
    rects,
    centers: rects.map((r) => r.x + r.w / 2),
    widths: rects.map((r) => r.w),
    left: rects[0]!.x,
    right: rects[2]!.x + rects[2]!.w,
  };
  return _pack;
}

function ensureTribunePack(): TribunePack {
  if (_pack) return _pack;
  // Sensible landscape default until first draw/resize syncs.
  return syncTribuneLayout(16, 9);
}

export function tribuneRect(blockId: number): TribuneRectNorm {
  const p = ensureTribunePack();
  const i = Math.max(0, Math.min(2, blockId | 0));
  return p.rects[i]!;
}

/** Outer left of the flush tribune strip (normalized). */
export function blocksLeftNorm(): number {
  return ensureTribunePack().left;
}

/** Outer right of the flush tribune strip (normalized). */
export function blocksRightNorm(): number {
  return ensureTribunePack().right;
}

/** 4 plots per block → 12 total */
export const SLOTS_PER_BLOCK = 4;
export const BUILDABLE_INDICES = [0, 1, 2, 3] as const;
export const BUILDABLE_INDICES_COLORED = BUILDABLE_INDICES;
export const BUILDABLE_INDICES_NEUTRAL = BUILDABLE_INDICES;
export const ULTRA_PAD_INDEX = 0;

/**
 * Legacy AABB scatter (fallback if FLOOR_GRID_COUPLE is off).
 * flat 0–3 Heim (left), 4–7 Neutral (center), 8–11 Gäste (right).
 */
export const PLOT_SCATTER: readonly { x: number; y: number; w: number; h: number }[] = [
  // Heim — left (gang starts ~0.63)
  { x: 0.04, y: 0.655, w: 0.1, h: 0.095 },
  { x: 0.16, y: 0.69, w: 0.095, h: 0.09 },
  { x: 0.05, y: 0.79, w: 0.1, h: 0.095 },
  { x: 0.17, y: 0.875, w: 0.095, h: 0.09 },
  // Neutral — center
  { x: 0.37, y: 0.66, w: 0.1, h: 0.095 },
  { x: 0.50, y: 0.70, w: 0.095, h: 0.09 },
  { x: 0.38, y: 0.80, w: 0.1, h: 0.095 },
  { x: 0.51, y: 0.88, w: 0.095, h: 0.09 },
  // Gäste — right
  { x: 0.71, y: 0.655, w: 0.1, h: 0.095 },
  { x: 0.84, y: 0.69, w: 0.095, h: 0.09 },
  { x: 0.72, y: 0.79, w: 0.1, h: 0.095 },
  { x: 0.85, y: 0.875, w: 0.095, h: 0.09 },
];

/** Per-block tribune width (normalized). Pass blockId for accurate seats. */
export function blockWidthNorm(blockId = NEUTRAL_BLOCK): number {
  const p = ensureTribunePack();
  const i = Math.max(0, Math.min(2, blockId | 0));
  return p.widths[i]!;
}

export function blockCenterX(blockId: number): number {
  const p = ensureTribunePack();
  const i = Math.max(0, Math.min(2, blockId | 0));
  return p.centers[i]!;
}

export function blockIdToGangX(blockId: number): number {
  return blockId / (BLOCK_COUNT - 1);
}

export function gangXToWorld(gangX: number): number {
  const left = blockCenterX(0);
  const right = blockCenterX(BLOCK_COUNT - 1);
  const t = Math.max(0, Math.min(1, gangX));
  return left + t * (right - left);
}

/** Map a world X (0..1) to battle-line gangX (0..1). */
export function worldXToGangX(worldX: number): number {
  const left = blockCenterX(0);
  const right = blockCenterX(BLOCK_COUNT - 1);
  if (right <= left) return 0.5;
  return Math.max(0, Math.min(1, (worldX - left) / (right - left)));
}

export function blockTopY(blockId: number): number {
  return tribuneRect(blockId).y;
}

export function blockBodyBottom(blockId: number): number {
  const r = tribuneRect(blockId);
  return r.y + r.h;
}

export function gangY(): number {
  if (FLOOR_GRID_COUPLE) {
    // Fight corridor starts at the near edge of the far Bau row.
    return floorGangBand().y0;
  }
  return L.blockTop + L.blockBodyH + L.gangPadTop;
}

export function gangMidY(): number {
  if (FLOOR_GRID_COUPLE) {
    return floorGangBand().mid;
  }
  return gangY() + L.gangH * 0.42;
}

/** Normalized gang band height (floor-grid corridor when coupled). */
export function gangHeight(): number {
  if (FLOOR_GRID_COUPLE) return floorGangBand().h;
  return L.gangH;
}

export function doorPos(blockId: number): { x: number; y: number } {
  return {
    x: blockCenterX(blockId),
    y: blockBodyBottom(blockId),
  };
}

export function seatPos(blockId: number, seatIndex: number): { x: number; y: number } {
  const col = seatIndex % SEAT_COLS;
  const row = Math.floor(seatIndex / SEAT_COLS);
  const r = tribuneRect(blockId);
  const cx = r.x + r.w / 2;
  const bw = r.w;
  const top = r.y + r.h * 0.2;
  const usableH = r.h * 0.68;
  const left = cx - bw * 0.36;
  const stepX = (bw * 0.72) / (SEAT_COLS - 1 || 1);
  const stepY = usableH / (SEAT_ROWS - 1 || 1);
  return {
    x: left + col * stepX,
    y: top + row * stepY,
  };
}

export function gangLanePos(blockId: number): { x: number; y: number } {
  return {
    x: blockCenterX(blockId),
    y: gangMidY(),
  };
}

export function slotIndicesForBlock(_blockId: number): readonly number[] {
  return BUILDABLE_INDICES;
}

export function isUltraPad(blockId: number, index: number): boolean {
  return blockId === HEIM_BLOCK && index === ULTRA_PAD_INDEX;
}

export function slotFlatIndex(blockId: number, index: number): number {
  let n = 0;
  for (let b = 0; b < BLOCK_COUNT; b++) {
    for (const i of slotIndicesForBlock(b)) {
      if (b === blockId && i === index) return n;
      n++;
    }
  }
  return 0;
}

export function boothRect(
  blockId: number,
  index: number,
): { x: number; y: number; w: number; h: number } {
  if (FLOOR_GRID_COUPLE) {
    return quadToRect(boothQuad(blockId, index));
  }
  const flat = Math.max(0, Math.min(PLOT_SCATTER.length - 1, slotFlatIndex(blockId, index)));
  const p = PLOT_SCATTER[flat]!;
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

export function boothCenter(blockId: number, index: number): { x: number; y: number } {
  if (FLOOR_GRID_COUPLE) {
    return quadCenter(boothQuad(blockId, index));
  }
  const r = boothRect(blockId, index);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Battle-line position of a plot (0=heim … 1=gäste). */
export function plotGangX(blockId: number, index: number): number {
  return worldXToGangX(boothCenter(blockId, index).x);
}

export function pennantPos(blockId: number, index: number): { x: number; y: number } {
  if (FLOOR_GRID_COUPLE) {
    return quadPennantPos(boothQuad(blockId, index));
  }
  const r = boothRect(blockId, index);
  return { x: r.x + r.w * 0.08, y: r.y + r.h * 0.05 };
}

export { boothQuad, FLOOR_GRID_COUPLE, floorGangBand, quadCenter } from "./floorGrid";
