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
 * Near-plane column ray anchors (x at yNear), 7 lines → 6 cells.
 * Grouped as Heim [0,1] · Neutral [2,3] · Gäste [4,5].
 */
export const FLOOR_COL_XS_NEAR = [
  0.1, 0.233333, 0.366667, 0.5, 0.633333, 0.766667, 0.9,
] as const;

/** Depth of the near column anchors (normalized). */
export const FLOOR_Y_NEAR = 0.985;

/**
 * Row lines far → near (normalized), 4 lines → 2 Bau rows + Gang:
 *   [0..1] far Bau row · [1..2] fight Gang · [2..3] near Bau row
 * Anchors are tuned in inv-depth so the middle band stays wider than a cell
 * (room for fights) while plots stay packed toward the bottom edge.
 */
/**
 * Far Bau · Gang · Near Bau — packed toward the bottom so tribune feet sit lower.
 * Gang band is intentionally narrow (upper half cut) so fight corridor is the lower strip.
 */
export const FLOOR_ROW_YS = [0.78, 0.86, 0.925, 0.988] as const;

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

/**
 * Fight corridor between the two Bau rows (normalized y).
 * Uses only the lower half of the raw gang band (“obere Hälfte wegschneiden”).
 */
export function floorGangBand(): { y0: number; y1: number; mid: number; h: number } {
  const rows = floorRowYs();
  const raw0 = rows[1]!;
  const y1 = rows[2]!;
  const y0 = (raw0 + y1) / 2;
  return { y0, y1, mid: (y0 + y1) / 2, h: y1 - y0 };
}

/** Map a near-plane X (at FLOOR_Y_NEAR) to X at depth y — perspective ray. */
export function xAtDepth(xNear: number, y: number): number {
  return (
    FLOOR_VP.x +
    ((y - FLOOR_VP.y) * (xNear - FLOOR_VP.x)) / (FLOOR_Y_NEAR - FLOOR_VP.y)
  );
}

/** Point-in-trapezoid (TL→TR→BR→BL), normalized coords. */
export function pointInQuad(q: QuadNorm, x: number, y: number): boolean {
  const pts = [q.tl, q.tr, q.br, q.bl];
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i]!.x;
    const yi = pts[i]!.y;
    const xj = pts[j]!.x;
    const yj = pts[j]!.y;
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Cell (c,r) with c∈0..5, r∈0..1 → perspective quad (skips Gang line). */
export function floorCellQuad(c: number, r: number): QuadNorm {
  const rows = floorRowYs();
  const li = BAU_ROW_LINE[Math.max(0, Math.min(1, r | 0))]!;
  const yTop = rows[li]!;
  const yBot = rows[li + 1]!;
  const xlN = FLOOR_COL_XS_NEAR[c]!;
  const xrN = FLOOR_COL_XS_NEAR[c + 1]!;
  return {
    tl: { x: xAtDepth(xlN, yTop), y: yTop },
    tr: { x: xAtDepth(xrN, yTop), y: yTop },
    br: { x: xAtDepth(xrN, yBot), y: yBot },
    bl: { x: xAtDepth(xlN, yBot), y: yBot },
  };
}

/**
 * Plot assignment matching prior scatter order:
 * per block → (c0,r0), (c1,r0), (c0,r1), (c1,r1).
 */
const BLOCK_COL0 = [0, 2, 4] as const;

export function boothQuad(blockId: number, index: number): QuadNorm {
  const b = Math.max(0, Math.min(2, blockId | 0));
  const i = Math.max(0, Math.min(3, index | 0));
  const c0 = BLOCK_COL0[b]!;
  const dc = i % 2;
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

/** Pennant sits near the far-left corner of the plot cell. */
export function quadPennantPos(q: QuadNorm): { x: number; y: number } {
  return {
    x: q.tl.x * 0.65 + q.bl.x * 0.35,
    y: q.tl.y * 0.75 + q.tr.y * 0.25,
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

