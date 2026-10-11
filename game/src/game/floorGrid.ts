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
 * Side rails reserve — keep a thin band free on both edges.
 * Plots may start near the canvas rim (user asked for edge-near placement).
 */
/** Outer plots may sit close to the screen edge for max horizontal spread. */
export const FLOOR_SIDE_MARGIN = 0.015;

/**
 * Near-plane column ray anchors (x at yNear) — 6 equal cells across
 * [FLOOR_SIDE_MARGIN .. 1-FLOOR_SIDE_MARGIN].
 * Kept for floorCellQuad helpers; boothQuad places via EXIT_BANDS pockets.
 */
export const FLOOR_COL_XS_NEAR = [
  0.04,
  0.2,
  0.36,
  0.5,
  0.64,
  0.8,
  0.96,
] as const;

/** Depth of the near column anchors (normalized). */
export const FLOOR_Y_NEAR = 0.985;

/**
 * Row lines far → near (normalized): [farTop, gangTop, gangBot, nearBot].
 * Far Bau starts ~8–10% below the block door (y≈0.50).
 * Plots stay clear of the gang by GANG_PLOT_BUFFER on both edges.
 */
export const FLOOR_ROW_YS = [0.58, 0.7, 0.84, 0.975] as const;

/**
 * Minimum clear space between Bau plots and the fight gang (normalized height).
 * Far plots end at gangTop − buffer; near plots start at gangBot + buffer.
 */
export const GANG_PLOT_BUFFER = 0.05;

/** Shrink plot chrome toward cell center (0 = full cell, 0.3 ≈ 70% footprint). */
export const PLOT_DRAW_INSET = 0.3;

/** When true, empty plots are drawn warped into floor-grid quads. */
export const FLOOR_GRID_COUPLE = true;

/**
 * Layout anchors: farTop · gangTop · gangBot · nearBot.
 * Kept literal so the gang buffer is not collapsed by inv-depth averaging.
 */
export function floorRowYs(): readonly number[] {
  return FLOOR_ROW_YS;
}

/**
 * Fight corridor = full clear span between the two Bau rows
 * (far/upper plot bottom → near/lower plot top).
 *
 * Typical values with FLOOR_ROW_YS + GANG_PLOT_BUFFER:
 *   upper Bau (far):  yTop≈0.58 … yBot≈0.65
 *   lower Bau (near): yTop≈0.89 … yBot≈0.975
 *   gang corridor:    y0≈0.65 … y1≈0.89  (all fighters roam here)
 */
export function floorGangBand(): { y0: number; y1: number; mid: number; h: number } {
  const far = floorBauBand(0);
  const near = floorBauBand(1);
  const y0 = far.yBot;
  const y1 = near.yTop;
  return { y0, y1, mid: (y0 + y1) / 2, h: Math.max(0.02, y1 - y0) };
}

/** Upper (far) + lower (near) Bau-row Y edges — for corridor / roam clamps. */
export function bauRowYEdges(): {
  upperTop: number;
  upperBot: number;
  lowerTop: number;
  lowerBot: number;
  corridorY0: number;
  corridorY1: number;
} {
  const far = floorBauBand(0);
  const near = floorBauBand(1);
  return {
    upperTop: far.yTop,
    upperBot: far.yBot,
    lowerTop: near.yTop,
    lowerBot: near.yBot,
    corridorY0: far.yBot,
    corridorY1: near.yTop,
  };
}

/** Bau band edges with gang buffer applied (r=0 far, r=1 near). */
export function floorBauBand(r: number): { yTop: number; yBot: number } {
  const rows = floorRowYs();
  const gangTop = rows[1]!;
  const gangBot = rows[2]!;
  const buf = GANG_PLOT_BUFFER;
  if ((r | 0) === 0) {
    const yTop = rows[0]!;
    const yBot = Math.max(yTop + 0.035, gangTop - buf);
    return { yTop, yBot };
  }
  const yBot = rows[3]!;
  const yTop = Math.min(yBot - 0.035, gangBot + buf);
  return { yTop, yBot };
}

function xAtDepth(xNear: number, y: number): number {
  return (
    FLOOR_VP.x +
    ((y - FLOOR_VP.y) * (xNear - FLOOR_VP.x)) / (FLOOR_Y_NEAR - FLOOR_VP.y)
  );
}

/** Cell (c,r) with c∈0..7, r∈0..1 → perspective quad (skips Gang + buffer). */
export function floorCellQuad(c: number, r: number): QuadNorm {
  const { yTop, yBot } = floorBauBand(r);
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
 * Vertical dark Ausgangskorridore visible on the derby floor (screen x):
 * inter-block aisle shadows + neutral center lane. Heim/Gäste center doors
 * sit inside the outer pockets' right/left edges and stay clear via pad.
 */
const EXIT_BANDS = [
  { L: 0.36, R: 0.445 }, // aisle Heim ↔ Neutral (wide gap → plots further apart)
  { L: 0.47, R: 0.53 }, // Neutral center corridor
  { L: 0.555, R: 0.64 }, // aisle Neutral ↔ Gäste
] as const;

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

type Seg = { L: number; R: number };

/** Usable band minus Ausgangsbänder → free pockets (side margins reserved). */
function freePockets(xMin: number, xMax: number): Seg[] {
  let free: Seg[] = [{ L: xMin, R: xMax }];
  for (const d of EXIT_BANDS) {
    const next: Seg[] = [];
    for (const s of free) {
      if (d.R <= s.L || d.L >= s.R) {
        next.push(s);
        continue;
      }
      if (d.L > s.L) next.push({ L: s.L, R: Math.min(s.R, d.L) });
      if (d.R < s.R) next.push({ L: Math.max(s.L, d.R), R: s.R });
    }
    free = next.filter((s) => s.R - s.L > 0.018);
  }
  return free;
}

/**
 * Eight centers across [xMin,xMax]: 3·1·1·3 in the free pockets around the
 * three dark corridors — Heim/Gäste get an extra outer column each.
 */
function pocketCenters(xMin: number, xMax: number, plotHalf: number): number[] {
  const pockets = freePockets(xMin, xMax);
  const target = 8;
  const counts =
    pockets.length === 4
      ? [3, 1, 1, 3]
      : pockets.map(() =>
          Math.max(1, Math.ceil(target / Math.max(1, pockets.length))),
        );
  // Tiny pad so outer plots sit near pocket / screen edges
  const pad = plotHalf * 0.2;
  const centers: number[] = [];
  for (let i = 0; i < pockets.length && centers.length < target; i++) {
    const p = pockets[i]!;
    const n = Math.min(counts[i] ?? 1, target - centers.length);
    const L = p.L + pad;
    const R = p.R - pad;
    if (R <= L) {
      for (let k = 0; k < n; k++) centers.push((p.L + p.R) / 2);
      continue;
    }
    // Spread evenly across the full pocket width
    for (let k = 0; k < n; k++) {
      centers.push(L + ((k + 0.5) / n) * (R - L));
    }
  }
  while (centers.length < target) centers.push((xMin + xMax) / 2);
  return centers.slice(0, target);
}

/** Screen-space bau quad for a global slot 0..7 at row r (0=far, 1=near). */
function evenSlotQuad(slot: number, r: number): QuadNorm {
  const { yTop, yBot } = floorBauBand(r);
  const xMin = FLOOR_SIDE_MARGIN;
  const xMax = 1 - FLOOR_SIDE_MARGIN;
  const span = xMax - xMin;
  const pockets = freePockets(xMin, xMax);
  const minPocket = pockets.reduce((m, p) => Math.min(m, p.R - p.L), span);
  // Smaller footprints so spaced centers don't visually collide
  const maxW = r === 0 ? 0.03 : 0.038;
  const plotW = Math.min(
    maxW,
    (span / 8) * 0.38,
    Math.max(0.02, minPocket * 0.38),
  );
  const half = plotW / 2;
  const centers = pocketCenters(xMin, xMax, half * 0.9);
  const s = Math.max(0, Math.min(7, slot | 0));
  const cx = centers[s]!;
  const topHalf = half * (r === 0 ? 0.9 : 0.95);
  const botHalf = half * (r === 0 ? 1.06 : 1.03);
  return {
    tl: { x: cx - topHalf, y: yTop },
    tr: { x: cx + topHalf, y: yTop },
    br: { x: cx + botHalf, y: yBot },
    bl: { x: cx - botHalf, y: yBot },
  };
}

/** Mid-gang Ordnerpost — same footprint as a near-row (bottom) Bau plot. */
function midGangOrdnerQuad(): QuadNorm {
  const band = floorGangBand();
  const ref = evenSlotQuad(0, 1);
  const half = Math.abs(ref.br.x - ref.bl.x) / 2;
  const h = Math.abs(ref.br.y - ref.tr.y);
  const cx = 0.5;
  const mid = band.mid;
  const topHalf = half * 0.95;
  const botHalf = half * 1.03;
  return {
    tl: { x: cx - topHalf, y: mid - h / 2 },
    tr: { x: cx + topHalf, y: mid - h / 2 },
    br: { x: cx + botHalf, y: mid + h / 2 },
    bl: { x: cx - botHalf, y: mid + h / 2 },
  };
}

/**
 * Heim/Gäste: index 0..2 far, 3..5 near → global columns 0..2 / 5..7.
 * Neutral Bau: index 0..1 far, 2..3 near → columns 3..4.
 * Neutral mid-gang Ordner: index 4.
 */
export function boothQuad(blockId: number, index: number): QuadNorm {
  const b = Math.max(0, Math.min(2, blockId | 0));
  const i = Math.max(0, index | 0);
  if (b === 1 && i === 4) return midGangOrdnerQuad();
  if (b === 0) {
    // Heim — 3 columns
    const col = i % 3;
    const r = i < 3 ? 0 : 1;
    return evenSlotQuad(col, r);
  }
  if (b === 2) {
    // Gäste — 3 columns on the right (global 5..7)
    const col = 5 + (i % 3);
    const r = i < 3 ? 0 : 1;
    return evenSlotQuad(col, r);
  }
  // Neutral Bau empty — 2 columns (global 3..4)
  const col = 3 + (i % 2);
  const r = i < 2 ? 0 : 1;
  return evenSlotQuad(col, r);
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

