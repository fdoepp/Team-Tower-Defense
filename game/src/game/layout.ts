/** Shared normalized layout — 4 terrace blocks + flush booth strips */

export const BLOCK_COUNT = 4;
export const HEIM_BLOCK = 0;
export const GAST_BLOCK = 3;
export const NEUTRAL_BLOCKS = [1, 2] as const;
export const SEATS_PER_BLOCK = 12;
export const SEAT_COLS = 3;
export const SEAT_ROWS = 4;

export const L = {
  pitchH: 0.1,
  blockTop: 0.12,
  blockH: 0.33,
  /** booth strip height between block and gang / under gang */
  boothH: 0.1,
  gangH: 0.15,
  blocksLeft: 0.12,
  blocksRight: 0.98,
  blockGap: 0.028,
  /** door gap as fraction of block width */
  doorFrac: 0.22,
};

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

export function blockBodyBottom(blockId: number): number {
  const top = L.blockTop + Math.abs(blockId - 1.5) * 0.008;
  return top + L.blockH * 0.7;
}

/** Gang starts flush under the upper booth strip */
export function gangY(): number {
  return L.blockTop + L.blockH * 0.7 + L.boothH;
}

/** Door at bottom center of a block (normalized) */
export function doorPos(blockId: number): { x: number; y: number } {
  return {
    x: blockCenterX(blockId),
    y: blockBodyBottom(blockId),
  };
}

/** Seat grid position inside a block (normalized) */
export function seatPos(blockId: number, seatIndex: number): { x: number; y: number } {
  const col = seatIndex % SEAT_COLS;
  const row = Math.floor(seatIndex / SEAT_COLS);
  const cx = blockCenterX(blockId);
  const bw = blockWidthNorm();
  const top = L.blockTop + Math.abs(blockId - 1.5) * 0.008 + 0.035;
  const usableH = L.blockH * 0.52;
  const left = cx - bw * 0.38;
  const stepX = (bw * 0.76) / (SEAT_COLS - 1 || 1);
  const stepY = usableH / (SEAT_ROWS - 1 || 1);
  return {
    x: left + col * stepX,
    y: top + row * stepY,
  };
}

/** Mid-gang lane under a block door */
export function gangLanePos(blockId: number): { x: number; y: number } {
  return {
    x: blockCenterX(blockId),
    y: gangY() + L.gangH * 0.5,
  };
}

/**
 * Booth rect flush to block/gang, full width except door path.
 * index 0,1 = above gang (L/R); 2,3 = below gang (L/R)
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
    return { x: bx, y: bodyBot, w: bwBooth, h: gy - bodyBot };
  }
  const y0 = gy + L.gangH;
  return { x: bx, y: y0, w: bwBooth, h: L.boothH };
}

export function boothCenter(blockId: number, index: number): { x: number; y: number } {
  const r = boothRect(blockId, index);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
