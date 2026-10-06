/** Shared normalized layout for blocks + gang */

export const L = {
  pitchH: 0.12,
  blockTop: 0.145,
  blockH: 0.36,
  gangY: 0.575,
  gangH: 0.17,
  blocksLeft: 0.13,
  blocksRight: 0.97,
  blockGap: 0.03,
};

export function blockWidthNorm(): number {
  const span = L.blocksRight - L.blocksLeft;
  return (span - 4 * L.blockGap) / 5;
}

export function blockCenterX(blockId: number): number {
  const bw = blockWidthNorm();
  return L.blocksLeft + bw / 2 + blockId * (bw + L.blockGap);
}

export function gangXToWorld(gangX: number): number {
  const left = blockCenterX(0);
  const right = blockCenterX(4);
  const t = Math.max(0, Math.min(1, gangX));
  return left + t * (right - left);
}

export function blockIdToGangX(blockId: number): number {
  return blockId / 4;
}
