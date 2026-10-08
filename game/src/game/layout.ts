/** Matchday Comic — ~⅓ scoreboard / ⅓ blocks / ⅓ gang */

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
  stadiumH: 0.32,
  /** Stands sit in the middle third */
  blockTop: 0.32,
  blockBodyH: 0.3,
  gangPadTop: 0.01,
  /** Gang is the bottom ~third — not half the screen */
  gangH: 0.34,
  blocksLeft: 0.04,
  blocksRight: 0.96,
  blockGap: 0.024,
  doorFrac: 0.14,
  plotW: 0.1,
  plotH: 0.095,
};

/** 4 plots per block → 12 total */
export const SLOTS_PER_BLOCK = 4;
export const BUILDABLE_INDICES = [0, 1, 2, 3] as const;
export const BUILDABLE_INDICES_COLORED = BUILDABLE_INDICES;
export const BUILDABLE_INDICES_NEUTRAL = BUILDABLE_INDICES;
export const ULTRA_PAD_INDEX = 0;

/**
 * 12 Baustellen packed into the bottom gang third.
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
  return gangY() + L.gangH * 0.42;
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

/**
 * Fan position in a block. Indices 0..11 keep a soft grid; higher indices
 * scatter inside the stand so blocks are not hard-capped at 12 people.
 */
export function seatPos(blockId: number, seatIndex: number): { x: number; y: number } {
  const cx = blockCenterX(blockId);
  const bw = blockWidthNorm();
  const top = blockTopY(blockId) + L.blockBodyH * 0.18;
  const usableH = L.blockBodyH * 0.72;
  const left = cx - bw * 0.38;
  const width = bw * 0.76;

  if (seatIndex >= 0 && seatIndex < SEATS_PER_BLOCK) {
    const col = seatIndex % SEAT_COLS;
    const row = Math.floor(seatIndex / SEAT_COLS);
    const stepX = width / (SEAT_COLS - 1 || 1);
    const stepY = usableH / (SEAT_ROWS - 1 || 1);
    const jx = (seatHash(seatIndex * 3 + blockId) - 0.5) * stepX * 0.35;
    const jy = (seatHash(seatIndex * 7 + blockId * 2) - 0.5) * stepY * 0.35;
    return {
      x: left + col * stepX + jx,
      y: top + row * stepY + jy,
    };
  }

  const u = seatHash(seatIndex * 17 + blockId * 13);
  const v = seatHash(seatIndex * 29 + blockId * 41);
  return {
    x: left + u * width,
    y: top + v * usableH,
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
