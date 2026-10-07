/** Matchday Comic layout — 3 stands, open gang with scattered build plots */

export const BLOCK_COUNT = 3;
export const HEIM_BLOCK = 0;
export const NEUTRAL_BLOCK = 1;
export const GAST_BLOCK = 2;
export const NEUTRAL_BLOCKS = [NEUTRAL_BLOCK] as const;
export const SEATS_PER_BLOCK = 12;
export const SEAT_COLS = 3;
export const SEAT_ROWS = 4;

/**
 * Vertical pack (canvas is the center stadium column):
 * - Night sky / floodlights
 * - Bleacher blocks (Heim | Neutral | Gäste)
 * - Open gang with 12 scattered build plots
 */
export const L = {
  skyH: 0.1,
  blockTop: 0.13,
  blockBodyH: 0.27,
  gangPadTop: 0.02,
  /** Full open concourse (plots live inside this band) */
  gangH: 0.56,
  blocksLeft: 0.035,
  blocksRight: 0.965,
  blockGap: 0.022,
  doorFrac: 0.14,
  /** Plot footprint relative to canvas */
  plotW: 0.135,
  plotH: 0.145,
};

/** 4 plots per block → 12 total */
export const SLOTS_PER_BLOCK = 4;
export const BUILDABLE_INDICES = [0, 1, 2, 3] as const;
export const BUILDABLE_INDICES_COLORED = BUILDABLE_INDICES;
export const BUILDABLE_INDICES_NEUTRAL = BUILDABLE_INDICES;
export const ULTRA_PAD_INDEX = 0;

/**
 * Organic scatter of 12 plots on the gang (mockup-like, not a rigid bottom grid).
 * Coordinates are normalized canvas fractions (top-left of plot).
 */
export const PLOT_SCATTER: readonly { x: number; y: number; w: number; h: number }[] = [
  // upper gang row (closer to stands)
  { x: 0.05, y: 0.46, w: 0.13, h: 0.14 },
  { x: 0.22, y: 0.49, w: 0.125, h: 0.135 },
  { x: 0.40, y: 0.47, w: 0.13, h: 0.14 },
  { x: 0.58, y: 0.50, w: 0.125, h: 0.135 },
  { x: 0.74, y: 0.46, w: 0.13, h: 0.14 },
  { x: 0.06, y: 0.64, w: 0.13, h: 0.145 },
  // lower gang row
  { x: 0.24, y: 0.68, w: 0.135, h: 0.14 },
  { x: 0.42, y: 0.65, w: 0.13, h: 0.145 },
  { x: 0.60, y: 0.69, w: 0.135, h: 0.14 },
  { x: 0.78, y: 0.66, w: 0.13, h: 0.145 },
  { x: 0.14, y: 0.82, w: 0.13, h: 0.14 },
  { x: 0.70, y: 0.83, w: 0.135, h: 0.14 },
];

export function blockWidthNorm(): number {
  const span = L.blocksRight - L.blocksLeft;
  const gaps = BLOCK_COUNT - 1;
  return (span - gaps * L.blockGap) / BLOCK_COUNT;
}

export function blockCenterX(blockId: number): number {
  const bw = blockWidthNorm();
  return L.blocksLeft + bw / 2 + blockId * (bw + L.blockGap);
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

export function blockTopY(_blockId: number): number {
  return L.blockTop;
}

export function blockBodyBottom(blockId: number): number {
  return blockTopY(blockId) + L.blockBodyH;
}

/** Top of open gang band */
export function gangY(): number {
  return L.blockTop + L.blockBodyH + L.gangPadTop;
}

export function gangMidY(): number {
  return gangY() + L.gangH * 0.42;
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
  const cx = blockCenterX(blockId);
  const bw = blockWidthNorm();
  const top = blockTopY(blockId) + L.blockBodyH * 0.18;
  const usableH = L.blockBodyH * 0.7;
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

/** Flat 0..11 index for scatter plot list */
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

/**
 * Build plots scattered across the open gang (Matchday Comic).
 */
export function boothRect(
  blockId: number,
  index: number,
): { x: number; y: number; w: number; h: number } {
  const flat = Math.max(0, Math.min(PLOT_SCATTER.length - 1, slotFlatIndex(blockId, index)));
  const p = PLOT_SCATTER[flat]!;
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

export function boothCenter(blockId: number, index: number): { x: number; y: number } {
  const r = boothRect(blockId, index);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Territory pennant anchor near a plot */
export function pennantPos(blockId: number, index: number): { x: number; y: number } {
  const r = boothRect(blockId, index);
  return { x: r.x + r.w * 0.12, y: r.y + r.h * 0.12 };
}
