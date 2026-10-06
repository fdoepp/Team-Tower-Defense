/** Shared normalized layout — pitch HUD zone + blocks + gang + flush bottom booths */

export const BLOCK_COUNT = 4;
export const HEIM_BLOCK = 0;
export const GAST_BLOCK = 3;
export const NEUTRAL_BLOCKS = [1, 2] as const;
export const SEATS_PER_BLOCK = 12;
export const SEAT_COLS = 3;
export const SEAT_ROWS = 4;

/**
 * Vertical pack: larger green pitch (HUD lives only here),
 * then blocks, upper booths, gang, lower booths flush to y=1.
 * Pitch must be tall enough for score + momentum + mood chips
 * without spilling onto the colored blocks.
 */
export const L = {
  /** Green pitch — match HUD sits only in this band */
  pitchH: 0.28,
  blockTop: 0.285,
  blockBodyH: 0.21,
  boothH: 0.08,
  gangH: 0.115,
  blocksLeft: 0.04,
  blocksRight: 0.99,
  blockGap: 0.018,
  doorFrac: 0.15,
};

/** Colored blocks: skip index 0 (Ultra pad on Heim / unused on Gast) → 3 bauplätze */
export const SLOTS_PER_BLOCK = 4;
export const BUILDABLE_INDICES_COLORED = [1, 2, 3] as const;
export const BUILDABLE_INDICES_NEUTRAL = [0, 1, 2, 3] as const;
/** Heim top-left booth index reserved for Ultra → Gang control */
export const ULTRA_PAD_INDEX = 0;

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

export function blockTopY(blockId: number): number {
  return L.blockTop + Math.abs(blockId - 1.5) * 0.006;
}

export function blockBodyBottom(blockId: number): number {
  return blockTopY(blockId) + L.blockBodyH;
}

export function gangY(): number {
  return L.blockTop + L.blockBodyH + L.boothH;
}

export function gangMidY(): number {
  return gangY() + L.gangH * 0.5;
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
  const top = blockTopY(blockId) + L.blockBodyH * 0.12;
  const usableH = L.blockBodyH * 0.72;
  const left = cx - bw * 0.38;
  const stepX = (bw * 0.76) / (SEAT_COLS - 1 || 1);
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

/**
 * Booth rect: index 0,1 = above gang (L/R); 2,3 = below gang (L/R).
 * Lower booths flush to canvas bottom (y=1).
 */
export function boothRect(blockId: number, index: number): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const cx = blockCenterX(blockId);
  const bw = blockWidthNorm();
  const left = cx - bw / 2;
  const doorW = bw * L.doorFrac;
  const doorL = cx - doorW / 2;
  const doorR = cx + doorW / 2;
  const sideLeft = index % 2 === 0;
  const above = index < 2;

  const bx = sideLeft ? left : doorR;
  const bwBooth = sideLeft ? doorL - left : left + bw - doorR;

  const bodyBot = blockBodyBottom(blockId);
  const gy = gangY();
  if (above) {
    return { x: bx, y: bodyBot, w: bwBooth, h: Math.max(0.04, gy - bodyBot) };
  }
  const y0 = gy + L.gangH;
  return { x: bx, y: y0, w: bwBooth, h: Math.max(0.06, 1 - y0) };
}

export function boothCenter(blockId: number, index: number): { x: number; y: number } {
  const r = boothRect(blockId, index);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

export function isUltraPad(blockId: number, index: number): boolean {
  return blockId === HEIM_BLOCK && index === ULTRA_PAD_INDEX;
}

export function slotIndicesForBlock(blockId: number): readonly number[] {
  if (blockId === HEIM_BLOCK || blockId === GAST_BLOCK) return BUILDABLE_INDICES_COLORED;
  return BUILDABLE_INDICES_NEUTRAL;
}
