/**
 * Stadium floor grid — couples Bauplatz quads to the derby-BG ground plane.
 *
 * The floodlight derby background has a baked tile grid with a vanishing point
 * near the scoreboard. Plot cells are equal steps in inverse-depth (ground plane)
 * and equal column rays through that VP, so each Bauplatz is a screen-space
 * trapezoid that sits in a floor tile rather than an axis-aligned sprite box.
 */

export type QuadNorm = {
  /** Top-left, top-right, bottom-right, bottom-left — normalized 0..1 */
  tl: { x: number; y: number };
  tr: { x: number; y: number };
  br: { x: number; y: number };
  bl: { x: number; y: number };
};

/** Vanishing point of the stadium floor (normalized). Measured from derby BG. */
export const FLOOR_VP = { x: 0.5027, y: 0.0897 } as const;

/**
 * Side rails reserve — keep this band free on both edges.
 * Future left/right rails toggle in/out inside this margin.
 */
export const FLOOR_SIDE_MARGIN = 0.15;

/**
 * Near-plane column ray anchors (x at yNear), 12 lines → 11 cells.
 * Span = [FLOOR_SIDE_MARGIN .. 1-FLOOR_SIDE_MARGIN] (15% free each side).
 *
 * Pattern: Heim [0,2] · inter [3] · Neutral [4,6] · inter [7] · Gäste [8,10].
 * Intra gaps (esp. Neutral [5]) keep the block door exit corridor clear of plots.
 */
export const FLOOR_COL_XS_NEAR = [
  // Heim: both plots left of Heim door (~0.36) so the exit lane stays open
  0.15, 0.185, 0.195, 0.235,
  // inter → Neutral: plots flank mid door (~0.50), wide intra = exit lane
  0.4, 0.455, 0.545, 0.6,
  // inter → Gäste: both plots right of Gäste door (~0.64)
  0.76, 0.8, 0.81, 0.85,
] as const;

/** Depth of the near column anchors (normalized). */
export const FLOOR_Y_NEAR = 0.985;

/**
 * Row lines far → near (normalized).
 * Far Bau row sits ~10% screen-height below the block door (y≈0.50),
 * so the exit drop from tribüne → gang stays free of Bauplätze.
 */
export const FLOOR_ROW_YS = [0.64, 0.72, 0.86, 0.975] as const;

/** Shrink plot chrome toward cell center (0 = full cell, 0.3 ≈ 70% footprint). */
export const PLOT_DRAW_INSET = 0.3;

/** Bau-row r ∈ {0,1} → starting index into FLOOR_ROW_YS (skips the Gang). */
const BAU_ROW_LINE = [0, 2] as const;

/** When true, empty plots are drawn warped into floor-grid quads. */
export const FLOOR_GRID_COUPLE = true;

function invDepth(y: number): number {
  return 1 / (y - FLOOR_VP.y);
}

function yFromInv(id: number): number {
  return FLOOR_VP.y + 1 / id;
}

/**
 * Rebuild row ys: equal inv-depth steps inside each Bau band, keep the
 * middle Gang band's relative inv-depth width from FLOOR_ROW_YS.
 */
export function floorRowYs(): readonly number[] {
  const raw = FLOOR_ROW_YS;
  const id = raw.map(invDepth);
  const cellFar = id[0]! - id[1]!;
  const gang = id[1]! - id[2]!;
  const cellNear = id[2]! - id[3]!;
  // Average the two Bau cell depths so far/near rows feel equal on the ground.
  const cell = (cellFar + cellNear) / 2;
  const idNear = id[3]!;
  const idNearTop = idNear + cell;
  const idFarBot = idNearTop + gang;
  const idFarTop = idFarBot + cell;
  return [yFromInv(idFarTop), yFromInv(idFarBot), yFromInv(idNearTop), yFromInv(idNear)];
}

/** Fight corridor between the two Bau rows (normalized y). */
export function floorGangBand(): { y0: number; y1: number; mid: number; h: number } {
  const rows = floorRowYs();
  const y0 = rows[1]!;
  const y1 = rows[2]!;
  return { y0, y1, mid: (y0 + y1) / 2, h: y1 - y0 };
}

function xAtDepth(xNear: number, y: number): number {
  return (
    FLOOR_VP.x +
    ((y - FLOOR_VP.y) * (xNear - FLOOR_VP.x)) / (FLOOR_Y_NEAR - FLOOR_VP.y)
  );
}

/** Cell (c,r) with c∈0..7, r∈0..1 → perspective quad (skips Gang line). */
export function floorCellQuad(c: number, r: number): QuadNorm {
  const rows = floorRowYs();
  const li = BAU_ROW_LINE[Math.max(0, Math.min(1, r | 0))]!;
  const yTop = rows[li]!;
  const yBot = rows[li + 1]!;
  const maxC = FLOOR_COL_XS_NEAR.length - 2;
  const cc = Math.max(0, Math.min(maxC, c | 0));
  const xlN = FLOOR_COL_XS_NEAR[cc]!;
  const xrN = FLOOR_COL_XS_NEAR[cc + 1]!;
  return {
    tl: { x: xAtDepth(xlN, yTop), y: yTop },
    tr: { x: xAtDepth(xrN, yTop), y: yTop },
    br: { x: xAtDepth(xrN, yBot), y: yBot },
    bl: { x: xAtDepth(xlN, yBot), y: yBot },
  };
}

/**
 * Plot assignment: per block → (c0,r0), (c0+2,r0), (c0,r1), (c0+2,r1).
 * +2 skips the intra-gap column between the pair.
 */
const BLOCK_COL0 = [0, 4, 8] as const;

/** Inset a floor quad toward its centroid (visual breathing room). */
export function insetQuad(q: QuadNorm, inset: number): QuadNorm {
  const t = Math.max(0, Math.min(0.45, inset));
  const cx = (q.tl.x + q.tr.x + q.br.x + q.bl.x) / 4;
  const cy = (q.tl.y + q.tr.y + q.br.y + q.bl.y) / 4;
  const map = (p: { x: number; y: number }) => ({
    x: cx + (p.x - cx) * (1 - t),
    y: cy + (p.y - cy) * (1 - t),
  });
  return { tl: map(q.tl), tr: map(q.tr), br: map(q.br), bl: map(q.bl) };
}

export function boothQuad(blockId: number, index: number): QuadNorm {
  const b = Math.max(0, Math.min(2, blockId | 0));
  const i = Math.max(0, Math.min(3, index | 0));
  const c0 = BLOCK_COL0[b]!;
  // Skip intra-gap column between the two plots of a block.
  const dc = (i % 2) * 2;
  const r = i < 2 ? 0 : 1;
  return floorCellQuad(c0 + dc, r);
}

export function quadToRect(q: QuadNorm): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const xs = [q.tl.x, q.tr.x, q.br.x, q.bl.x];
  const ys = [q.tl.y, q.tr.y, q.br.y, q.bl.y];
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const x1 = Math.max(...xs);
  const y1 = Math.max(...ys);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function quadCenter(q: QuadNorm): { x: number; y: number } {
  return {
    x: (q.tl.x + q.tr.x + q.br.x + q.bl.x) / 4,
    y: (q.tl.y + q.tr.y + q.br.y + q.bl.y) / 4,
  };
}

/**
 * Pennant foot on the plot cell — near the left edge, on the ground line.
 * Y is weighted toward the near (bottom) edge so the upright billboard
 * plants on the floor instead of floating at the far corner.
 */
export function quadPennantPos(q: QuadNorm): { x: number; y: number } {
  return {
    x: q.bl.x * 0.72 + q.tl.x * 0.28,
    y: q.bl.y * 0.88 + q.tl.y * 0.12,
  };
}

export function scaleQuad(
  q: QuadNorm,
  w: number,
  h: number,
): {
  tl: { x: number; y: number };
  tr: { x: number; y: number };
  br: { x: number; y: number };
  bl: { x: number; y: number };
} {
  return {
    tl: { x: q.tl.x * w, y: q.tl.y * h },
    tr: { x: q.tr.x * w, y: q.tr.y * h },
    br: { x: q.br.x * w, y: q.br.y * h },
    bl: { x: q.bl.x * w, y: q.bl.y * h },
  };
}

export type ScreenQuad = ReturnType<typeof scaleQuad>;

/**
 * Viewer-facing stand billboard for a Bau-slot.
 * Front always faces the camera (no yaw toward the stadium).
 * Per-slot perspective is a *soft* VP taper + lateral lean so iso art
 * stays recognizable while far/side slots still read depth.
 */
export function boothFacadeQuad(
  blockId: number,
  index: number,
  canvasW: number,
  canvasH: number,
  opts?: { widthScale?: number; heightScale?: number; taper?: number },
): ScreenQuad {
  const pq = scaleQuad(boothQuad(blockId, index), canvasW, canvasH);
  const widthScale = opts?.widthScale ?? 0.9;
  const heightScale = opts?.heightScale ?? 1.28;
  /** 0 = upright rect, 1 = full VP taper/lean. */
  const taperAmt = opts?.taper ?? 0.32;

  const footX = (pq.bl.x + pq.br.x) / 2;
  const footY = (pq.bl.y + pq.br.y) / 2;
  const nearW = Math.hypot(pq.br.x - pq.bl.x, pq.br.y - pq.bl.y);
  const baseHalf = Math.max(14, (nearW * widthScale) / 2);
  const height = Math.max(36, nearW * heightScale);

  const vp = { x: FLOOR_VP.x * canvasW, y: FLOOR_VP.y * canvasH };
  const topY = footY - height;
  const dyFoot = footY - vp.y;
  const rawDepth =
    Math.abs(dyFoot) < 1e-4 ? 1 : Math.max(0.5, (topY - vp.y) / dyFoot);
  const depthScale = 1 - (1 - rawDepth) * taperAmt;

  const rawTopCx =
    Math.abs(dyFoot) < 1e-4
      ? footX
      : vp.x + ((topY - vp.y) / dyFoot) * (footX - vp.x);
  // Soft lateral lean toward VP (keeps front mostly to the viewer).
  const topCx = footX + (rawTopCx - footX) * taperAmt;
  const topHalf = baseHalf * depthScale;

  return {
    tl: { x: topCx - topHalf, y: topY },
    tr: { x: topCx + topHalf, y: topY },
    br: { x: footX + baseHalf, y: footY },
    bl: { x: footX - baseHalf, y: footY },
  };
}

