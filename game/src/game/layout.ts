/** Matchday Comic — stadium top third, 3 stands, gang with 12 Baustellen */

export const BLOCK_COUNT = 3;
export const HEIM_BLOCK = 0;
export const NEUTRAL_BLOCK = 1;
export const GAST_BLOCK = 2;
export const NEUTRAL_BLOCKS = [NEUTRAL_BLOCK] as const;
export const SEATS_PER_BLOCK = 12;
export const SEAT_COLS = 3;
export const SEAT_ROWS = 4;

/**
 * Vertical pack:
 * - ~top third: night stadium bowl + scoreboard zone
 * - stands (Heim | Neutral | Gäste) sit in the bowl
 * - open gang with 12 scattered Baustellen
 */
export const L = {
  /** Stadium atmosphere fills roughly top third */
  stadiumH: 0.34,
  blockTop: 0.16,
  blockBodyH: 0.2,
  gangPadTop: 0.015,
  /** Gang + Baustellen fill the remaining field */
  gangH: 0.6,
  blocksLeft: 0.04,
  blocksRight: 0.96,
  blockGap: 0.024,
  doorFrac: 0.14,
  plotW: 0.14,
  plotH: 0.15,
};

/** 4 plots per block → 12 total */
export const SLOTS_PER_BLOCK = 4;
export const BUILDABLE_INDICES = [0, 1, 2, 3] as const;
export const BUILDABLE_INDICES_COLORED = BUILDABLE_INDICES;
export const BUILDABLE_INDICES_NEUTRAL = BUILDABLE_INDICES;
export const ULTRA_PAD_INDEX = 0;

/**
 * 12 Baustellen on the gang, ordered by territory:
 * flat 0–3 Heim (left), 4–7 Neutral (center), 8–11 Gäste (right).
 * Normalized canvas fractions (top-left of plot).
 */
export const PLOT_SCATTER: readonly { x: number; y: number; w: number; h: number }[] = [
  // Heim — left column cluster
  { x: 0.04, y: 0.44, w: 0.135, h: 0.145 },
  { x: 0.18, y: 0.50, w: 0.13, h: 0.14 },
  { x: 0.06, y: 0.64, w: 0.135, h: 0.145 },
  { x: 0.20, y: 0.78, w: 0.13, h: 0.14 },
  // Neutral — center
  { x: 0.36, y: 0.46, w: 0.135, h: 0.145 },
  { x: 0.50, y: 0.52, w: 0.13, h: 0.14 },
  { x: 0.38, y: 0.66, w: 0.135, h: 0.145 },
  { x: 0.52, y: 0.78, w: 0.13, h: 0.14 },
  // Gäste — right
  { x: 0.68, y: 0.44, w: 0.135, h: 0.145 },
  { x: 0.82, y: 0.50, w: 0.13, h: 0.14 },
  { x: 0.70, y: 0.64, w: 0.135, h: 0.145 },
  { x: 0.83, y: 0.78, w: 0.13, h: 0.14 },
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

/** Map a world X (0..1) to battle-line gangX (0..1). */
export function worldXToGangX(worldX: number): number {
  const left = blockCenterX(0);
  const right = blockCenterX(BLOCK_COUNT - 1);
  if (right <= left) return 0.5;
  return Math.max(0, Math.min(1, (worldX - left) / (right - left)));
}

export function blockTopY(_blockId: number): number {
  return L.blockTop;
}

export function blockBodyBottom(blockId: number): number {
  return blockTopY(blockId) + L.blockBodyH;
}

export function gangY(): number {
  return L.blockTop + L.blockBodyH + L.gangPadTop;
}

export function gangMidY(): number {
  return gangY() + L.gangH * 0.4;
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
  const top = blockTopY(blockId) + L.blockBodyH * 0.2;
  const usableH = L.blockBodyH * 0.68;
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
  const flat = Math.max(0, Math.min(PLOT_SCATTER.length - 1, slotFlatIndex(blockId, index)));
  const p = PLOT_SCATTER[flat]!;
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

export function boothCenter(blockId: number, index: number): { x: number; y: number } {
  const r = boothRect(blockId, index);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Battle-line position of a plot (0=heim … 1=gäste). */
export function plotGangX(blockId: number, index: number): number {
  return worldXToGangX(boothCenter(blockId, index).x);
}

export function pennantPos(blockId: number, index: number): { x: number; y: number } {
  const r = boothRect(blockId, index);
  return { x: r.x + r.w * 0.08, y: r.y + r.h * 0.05 };
}
