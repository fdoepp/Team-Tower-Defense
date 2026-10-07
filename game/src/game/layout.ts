/** Matchday Comic layout — stadium stands, open gang, 2×6 build plots */

export const BLOCK_COUNT = 4;
export const HEIM_BLOCK = 0;
export const GAST_BLOCK = 3;
export const NEUTRAL_BLOCKS = [1, 2] as const;
export const SEATS_PER_BLOCK = 12;
export const SEAT_COLS = 3;
export const SEAT_ROWS = 4;

/**
 * Vertical pack (canvas is the center stadium column between side rails):
 * - Night sky / floodlights
 * - Bleacher blocks (Heim | Neutral | Neutral | Gäste)
 * - Open gang / concourse
 * - 2×6 fenced build plots
 */
export const L = {
  skyH: 0.1,
  /** Room for distant bowl + floodlights above stands */
  blockTop: 0.14,
  blockBodyH: 0.28,
  /** Open street between stands and plot grid */
  gangPadTop: 0.015,
  gangH: 0.22,
  plotPadTop: 0.012,
  plotAreaH: 0.3,
  blocksLeft: 0.035,
  blocksRight: 0.965,
  blockGap: 0.018,
  doorFrac: 0.14,
  plotCols: 6,
  plotRows: 2,
  plotGapX: 0.014,
  plotGapY: 0.022,
};

/** Colored blocks: 3 plots; neutrals also 3 → 12 total */
export const SLOTS_PER_BLOCK = 4;
export const BUILDABLE_INDICES_COLORED = [1, 2, 3] as const;
export const BUILDABLE_INDICES_NEUTRAL = [0, 1, 2] as const;
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
  return gangY() + L.gangH * 0.55;
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

export function slotIndicesForBlock(blockId: number): readonly number[] {
  if (blockId === HEIM_BLOCK || blockId === GAST_BLOCK) return BUILDABLE_INDICES_COLORED;
  return BUILDABLE_INDICES_NEUTRAL;
}

export function isUltraPad(blockId: number, index: number): boolean {
  return blockId === HEIM_BLOCK && index === ULTRA_PAD_INDEX;
}

/** Flat 0..11 index for the 2×6 plot grid */
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
 * All buildable plots sit in a 2×6 grid in the lower open area
 * (Matchday Comic: umzäunte Rechtecke auf dem Gang).
 */
export function boothRect(
  blockId: number,
  index: number,
): { x: number; y: number; w: number; h: number } {
  const flat = slotFlatIndex(blockId, index);
  const cols = L.plotCols;
  const rows = L.plotRows;
  const col = flat % cols;
  const row = Math.floor(flat / cols) % rows;

  const left = L.blocksLeft;
  const right = L.blocksRight;
  const gapX = L.plotGapX;
  const gapY = L.plotGapY;
  const areaW = right - left;
  const cellW = (areaW - gapX * (cols - 1)) / cols;
  const y0 = gangY() + L.gangH + L.plotPadTop;
  const cellH = (L.plotAreaH - gapY * (rows - 1)) / rows;

  return {
    x: left + col * (cellW + gapX),
    y: y0 + row * (cellH + gapY),
    w: cellW,
    h: cellH,
  };
}

export function boothCenter(blockId: number, index: number): { x: number; y: number } {
  const r = boothRect(blockId, index);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Territory pennant anchor near a plot */
export function pennantPos(blockId: number, index: number): { x: number; y: number } {
  const r = boothRect(blockId, index);
  return { x: r.x + r.w * 0.12, y: r.y + r.h * 0.15 };
}
