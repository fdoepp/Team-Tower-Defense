/** Matchday Comic — ~⅓ scoreboard / ⅓ blocks / ⅓ gang */

import {
  boothQuad,
  FLOOR_GRID_COUPLE,
  floorGangBand,
  floorRowYs,
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
/** Soft visual packing — gameplay can exceed; positions wrap into this density. */
export const VISUAL_CROWD_SOFT_CAP = 20;

/**
 * Vertical pack (~thirds):
 * - top: stadium bowl + scoreboard + currencies
 * - middle: Heim | Neutral | Gäste stands
 * - bottom: gang with Baustellen
 */
export const L = {
  stadiumH: 0.32,
  /** Stands sit in the middle third */
  blockTop: 0.32,
  blockBodyH: 0.3,
  gangPadTop: 0.01,
  /** Gang is the bottom ~third — not half the screen */
  gangH: 0.34,
  /**
   * Outer inset for the flush tribune strip (normalized).
   * Outer corners sit just inside the canvas / sidebars.
   */
  blocksLeft: 0.01,
  blocksRight: 0.99,
  /** Kept for legacy; flush pack uses face-overlap. */
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

  const edge = L.blocksLeft;
  const avail = Math.max(0.2, 1 - edge * 2);
  const shelfTop = 0.16;
  const shelfBottom = FLOOR_GRID_COUPLE
    ? Math.max(shelfTop + 0.2, floorRowYs()[0]! - 0.025)
    : L.blockTop + L.blockBodyH;
  const maxH = Math.max(0.18, shelfBottom - shelfTop);

  const packAt = (hNorm: number) => {
    const ws = TRIBUNE_NATIVE.map((t) => (t.w / t.h) * (hNorm / aspect));
    const xs = [0, 0, 0];
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

  const unit = packAt(1);
  const hForWidth = avail / Math.max(1e-6, unit.span);
  const hNorm = Math.min(maxH, hForWidth);
  const packed = packAt(hNorm);

  const greyCx = packed.xs[1]! + packed.ws[1]! / 2;
  let shift = 0.5 - greyCx;
  if (packed.leftC + shift < edge) shift = edge - packed.leftC;
  if (packed.rightC + shift > 1 - edge) shift = 1 - edge - packed.rightC;

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
  return syncTribuneLayout(16, 9);
}

export function tribuneRect(blockId: number): TribuneRectNorm {
  const p = ensureTribunePack();
  const i = Math.max(0, Math.min(2, blockId | 0));
  return p.rects[i]!;
}

export function blocksLeftNorm(): number {
  return ensureTribunePack().left;
}

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
  // Neutral CANONICAL: Heim Ordner | empty | empty | Gast Ordner
  { x: 0.33, y: 0.70, w: 0.1, h: 0.095 },
  { x: 0.43, y: 0.78, w: 0.095, h: 0.09 },
  { x: 0.52, y: 0.78, w: 0.095, h: 0.09 },
  { x: 0.62, y: 0.70, w: 0.1, h: 0.095 },
  // Gäste — right
  { x: 0.71, y: 0.655, w: 0.1, h: 0.095 },
  { x: 0.84, y: 0.69, w: 0.095, h: 0.09 },
  { x: 0.72, y: 0.79, w: 0.1, h: 0.095 },
  { x: 0.85, y: 0.875, w: 0.095, h: 0.09 },
];

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

/** Pseudo-random in [0,1) from seat index (stable per seat). */
function seatHash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Usable crowd rectangle inside a stand block (fans may wander freely here). */
export function blockCrowdRect(blockId: number): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const r = tribuneRect(blockId);
  return {
    left: r.x + r.w * 0.12,
    top: r.y + r.h * 0.18,
    width: r.w * 0.76,
    height: r.h * 0.72,
  };
}

/** Random point inside a block's crowd area (for free stand wandering). */
export function randomCrowdPos(blockId: number): { x: number; y: number } {
  const r = blockCrowdRect(blockId);
  const pad = 0.012;
  return {
    x: r.left + pad + Math.random() * Math.max(0.01, r.width - pad * 2),
    y: r.top + pad + Math.random() * Math.max(0.01, r.height - pad * 2),
  };
}

/**
 * Stable roughly-spread home slot inside a block (jittered grid).
 * Fans idle near this point and bob/cheer — not stacked on one cell.
 */
export function crowdHomePos(
  blockId: number,
  index: number,
): { x: number; y: number } {
  const r = blockCrowdRect(blockId);
  const cols = 4;
  const rows = 3;
  const cells = cols * rows;
  const idx = Math.max(0, index | 0);
  const slot = idx % cells;
  const layer = Math.floor(idx / cells);
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  const padX = r.width * 0.08;
  const padY = r.height * 0.1;
  const cellW = (r.width - padX * 2) / cols;
  const cellH = (r.height - padY * 2) / rows;
  const jx = (seatHash(slot * 11 + blockId * 3 + layer) - 0.5) * cellW * 0.55;
  const jy = (seatHash(slot * 19 + blockId * 7 + layer * 5) - 0.5) * cellH * 0.55;
  const layerJ = (seatHash(layer * 29 + blockId) - 0.5) * 0.012;
  return {
    x: r.left + padX + (col + 0.5) * cellW + jx + layerJ,
    y: r.top + padY + (row + 0.5) * cellH + jy + layerJ * 0.6,
  };
}

/**
 * Fan spawn / home-anchor position in a block.
 * Gameplay has no hard seat cap; indices wrap for density.
 * Living fans then wander freely inside {@link blockCrowdRect}.
 */
export function seatPos(blockId: number, seatIndex: number): { x: number; y: number } {
  const r = blockCrowdRect(blockId);
  const { left, top, width, height: usableH } = r;

  const idx = Math.max(0, seatIndex | 0);
  const slot = idx % VISUAL_CROWD_SOFT_CAP;
  const layer = Math.floor(idx / VISUAL_CROWD_SOFT_CAP);
  const layerJ = (seatHash(layer * 19 + blockId) - 0.5) * 0.018;

  if (slot < SEATS_PER_BLOCK) {
    const col = slot % SEAT_COLS;
    const row = Math.floor(slot / SEAT_COLS);
    const stepX = width / (SEAT_COLS - 1 || 1);
    const stepY = usableH / (SEAT_ROWS - 1 || 1);
    const jx = (seatHash(slot * 3 + blockId) - 0.5) * stepX * 0.4 + layerJ;
    const jy = (seatHash(slot * 7 + blockId * 2) - 0.5) * stepY * 0.4 + layerJ * 0.6;
    return {
      x: left + col * stepX + jx,
      y: top + row * stepY + jy,
    };
  }

  const u = seatHash(slot * 17 + blockId * 13);
  const v = seatHash(slot * 29 + blockId * 41);
  return {
    x: left + u * width + layerJ,
    y: top + v * usableH + layerJ * 0.5,
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
