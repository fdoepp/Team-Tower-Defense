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
/** Soft visual packing — gameplay can exceed; positions wrap into this density. */
export const VISUAL_CROWD_SOFT_CAP = 20;

/**
 * Vertical pack (~thirds):
 * - top: stadium bowl + scoreboard + currencies
 * - middle: Heim | Neutral | Gäste stands
 * - bottom: gang with Baustellen
 */
export const L = {
  stadiumH: 0.3,
  /**
   * Tribünen-Band per MATCH_LAYOUT_TOKENS:
   * von Bildmitte 20% nach oben → y0=0.30 … y1=0.50 (Höhe = 20%).
   */
  blockTop: 0.3,
  blockBodyH: 0.2,
  /**
   * Ziel ~0.5% sichtbarer Abstand zwischen opaken Plattformkanten.
   * Etwas unter 0.5%, weil Glow/Schatten der PNG-Kanten optisch addieren.
   */
  tribuneGap: 0.002,
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
 * Native tribune PNG sizes + opaque floor-face pads (px, measured).
 * Transparent side pads are overlapped so visible platforms sit 0.5% apart.
 */
export const TRIBUNE_NATIVE = [
  { w: 426, h: 309, faceL: 6, faceR: 29 }, // Heim blue
  { w: 386, h: 308, faceL: 6, faceR: 6 }, // Neutral grey
  { w: 426, h: 309, faceL: 28, faceR: 6 }, // Gäste red
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
 * Native aspect per PNG (no distort); opaque faces spaced by tribuneGap (0.5%).
 */
export function syncTribuneLayout(canvasW: number, canvasH: number): TribunePack {
  const aspect = canvasW / Math.max(1, canvasH);
  if (_pack && Math.abs(_pack.aspect - aspect) < 1e-5) return _pack;

  const edge = L.blocksLeft;
  const shelfBottom = L.blockTop + L.blockBodyH; // 0.50
  const maxH = L.blockBodyH; // 0.20
  const gap = L.tribuneGap;

  const packAt = (hNorm: number) => {
    const ws = TRIBUNE_NATIVE.map(
      (n) => (hNorm * (n.w / n.h)) / Math.max(1e-6, aspect),
    );
    const faceL = TRIBUNE_NATIVE.map((n, i) => (n.faceL / n.w) * ws[i]!);
    const faceR = TRIBUNE_NATIVE.map((n, i) => (n.faceR / n.w) * ws[i]!);
    const xs = [0, 0, 0];
    // Place so opaque content edges are exactly `gap` apart
    xs[0] = 0;
    const contentR0 = xs[0]! + ws[0]! - faceR[0]!;
    xs[1] = contentR0 + gap - faceL[1]!;
    const contentR1 = xs[1]! + ws[1]! - faceR[1]!;
    xs[2] = contentR1 + gap - faceL[2]!;
    const leftC = xs[0]!;
    const rightC = xs[2]! + ws[2]!;
    return { xs, ws, leftC, rightC, span: rightC - leftC };
  };

  let hNorm = maxH;
  let packed = packAt(hNorm);
  const maxSpan = Math.max(0.2, 1 - edge * 2);
  if (packed.span > maxSpan) {
    hNorm *= maxSpan / packed.span;
    packed = packAt(hNorm);
  }

  // Center grey; keep strip inside pitch edges
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

/**
 * Heim/Gäste: 3 far + 3 near = 6 (extra outer slot top & bottom).
 * Neutral: 2 far + 2 near empty Bau + mid-gang Ordner (index 4).
 */
export const SLOTS_PER_BLOCK_COLORED = 6;
export const BUILDABLE_INDICES_COLORED = [0, 1, 2, 3, 4, 5] as const;
export const BUILDABLE_INDICES_NEUTRAL = [0, 1, 2, 3, 4] as const;
/** @deprecated prefer slotIndicesForBlock — colored blocks now have 6 */
export const SLOTS_PER_BLOCK = 6;
export const BUILDABLE_INDICES = BUILDABLE_INDICES_COLORED;
export const ULTRA_PAD_INDEX = 0;
/** Neutral mid-gang Ordnerpost (same as types.NEUTRAL_MID_GANG_INDEX) */
export const NEUTRAL_MID_GANG_SLOT = 4;

/**
 * Legacy AABB scatter (fallback if FLOOR_GRID_COUPLE is off).
 * Heim 6 · Neutral 4 Bau + mid-gang · Gäste 6.
 */
export const PLOT_SCATTER: readonly { x: number; y: number; w: number; h: number }[] = [
  // Heim — left (3 far + 3 near)
  { x: 0.02, y: 0.655, w: 0.08, h: 0.09 },
  { x: 0.11, y: 0.67, w: 0.08, h: 0.09 },
  { x: 0.20, y: 0.655, w: 0.08, h: 0.09 },
  { x: 0.02, y: 0.86, w: 0.08, h: 0.09 },
  { x: 0.11, y: 0.875, w: 0.08, h: 0.09 },
  { x: 0.20, y: 0.86, w: 0.08, h: 0.09 },
  // Neutral Bau empty (far/near) + mid-gang Ordner last
  { x: 0.38, y: 0.67, w: 0.08, h: 0.09 },
  { x: 0.48, y: 0.67, w: 0.08, h: 0.09 },
  { x: 0.38, y: 0.875, w: 0.08, h: 0.09 },
  { x: 0.48, y: 0.875, w: 0.08, h: 0.09 },
  { x: 0.455, y: 0.74, w: 0.07, h: 0.07 }, // mid-gang
  // Gäste — right (3 far + 3 near)
  { x: 0.70, y: 0.655, w: 0.08, h: 0.09 },
  { x: 0.79, y: 0.67, w: 0.08, h: 0.09 },
  { x: 0.88, y: 0.655, w: 0.08, h: 0.09 },
  { x: 0.70, y: 0.86, w: 0.08, h: 0.09 },
  { x: 0.79, y: 0.875, w: 0.08, h: 0.09 },
  { x: 0.88, y: 0.86, w: 0.08, h: 0.09 },
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

/** Stable 0..1 hash from unit id (for lane stagger). */
function unitLaneHash(unitId: number): number {
  const x = Math.sin((unitId + 1) * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Personal gang Y across nearly the full fight corridor (between Bau rows).
 * Stagger so stacked attackers fill the strip, not a single mid-lane.
 */
export function gangLaneYForUnit(unitId: number): number {
  const y0 = gangY();
  const h = Math.max(0.02, gangHeight());
  const u = unitLaneHash(unitId);
  return y0 + h * (0.04 + u * 0.92);
}

export function gangLanePosForUnit(
  blockId: number,
  unitId: number,
): { x: number; y: number } {
  return {
    x: blockCenterX(blockId),
    y: gangLaneYForUnit(unitId),
  };
}

/**
 * Wait / queue band outside the building footprint (normalized 0–1 field).
 * Starts at the booth outer edge and covers the next ~5% of free field space.
 */
export const STAND_WAIT_BAND = 0.05;
/** @deprecated use STAND_WAIT_BAND + booth footprint; kept for separation scale */
export const STAND_WAIT_RADIUS = 0.06;

export function slotIndicesForBlock(blockId: number): readonly number[] {
  if (blockId === NEUTRAL_BLOCK) return BUILDABLE_INDICES_NEUTRAL;
  return BUILDABLE_INDICES_COLORED;
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
