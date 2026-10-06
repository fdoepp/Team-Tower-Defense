/** Shared normalized layout — 4 terrace blocks */

export const BLOCK_COUNT = 4;
export const HEIM_BLOCK = 0;
export const GAST_BLOCK = 3;
export const NEUTRAL_BLOCKS = [1, 2] as const;
export const SEATS_PER_BLOCK = 12; // 3 cols × 4 rows
export const SEAT_COLS = 3;
export const SEAT_ROWS = 4;

export const L = {
  pitchH: 0.11,
  blockTop: 0.135,
  blockH: 0.38,
  gangY: 0.58,
  gangH: 0.16,
  blocksLeft: 0.13,
  blocksRight: 0.97,
  blockGap: 0.035,
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

/** Door at bottom center of a block (normalized) */
export function doorPos(blockId: number): { x: number; y: number } {
  const top = L.blockTop + Math.abs(blockId - 1.5) * 0.008;
  return {
    x: blockCenterX(blockId),
    y: top + L.blockH * 0.7,
  };
}

/** Seat grid position inside a block (normalized) */
export function seatPos(blockId: number, seatIndex: number): { x: number; y: number } {
  const col = seatIndex % SEAT_COLS;
  const row = Math.floor(seatIndex / SEAT_COLS);
  const cx = blockCenterX(blockId);
  const bw = blockWidthNorm();
  const top = L.blockTop + Math.abs(blockId - 1.5) * 0.008 + 0.04;
  const usableH = L.blockH * 0.55;
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
    y: L.gangY + L.gangH * 0.5,
  };
}
