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
 * Six equal-width plot cells (0.065) spaced across the full band; door exits
 * sit in the wider gaps so no Bauplatz sits in a vertical Ausgangskorridor:
 *   Heim [0,2] · door · Neutral [4,6] · door · Gäste [8,10]
 */
export const FLOOR_COL_XS_NEAR = [
  0.15, 0.215, 0.258, 0.323, // Heim pair (equal plots)
  0.399, 0.464, // after Heim door → Neutral left
  0.536, 0.601, // after Neutral door → Neutral right
  0.662, 0.727, 0.785, 0.85, // after Gäste door → Gäste pair
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

/** Fight corridor between the two Bau rows (normalized y). */
export function floorGangBand(): { y0: number; y1: number; mid: number; h: number } {
  const rows = floorRowYs();
  const y0 = rows[1]!;
  const y1 = rows[2]!;
  return { y0, y1, mid: (y0 + y1) / 2, h: y1 - y0 };
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
 * Plot assignment: per block → (c0,r0), (c0+2,r0), (c0,r1), (c0+2,r1).
 * +2 skips the intra-gap / door column between the pair.
 */
const BLOCK_COL0 = [0, 4, 8] as const;

/**
 * Screen-space door lanes (with pad) — vertical Ausgangskorridore.
 * Far-row plots are laid out in the free bands between these lanes.
 */
const DOOR_CLEAR_LANES = [
  { L: 0.338, R: 0.388 }, // Heim
  { L: 0.475, R: 0.525 }, // Neutral
  { L: 0.612, R: 0.662 }, // Gäste
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

/**
 * Far-row plots in screen space: equal widths, spread across the visible
 * floor band (perspective-compressed), never inside a door exit lane.
 * Slot order 0..5 = Heim0, Heim1, Neu0, Neu1, Gast0, Gast1.
 */
function farRowQuad(blockId: number, index: number): QuadNorm {
  const { yTop, yBot } = floorBauBand(0);
  const yMid = (yTop + yBot) / 2;
  const xMin = xAtDepth(FLOOR_SIDE_MARGIN, yMid);
  const xMax = xAtDepth(1 - FLOOR_SIDE_MARGIN, yMid);

  // Free intervals = floor band minus door lanes
  type Seg = { L: number; R: number };
  let free: Seg[] = [{ L: xMin, R: xMax }];
  for (const d of DOOR_CLEAR_LANES) {
    const next: Seg[] = [];
    for (const seg of free) {
      if (d.R <= seg.L || d.L >= seg.R) {
        next.push(seg);
        continue;
      }
      if (d.L > seg.L) next.push({ L: seg.L, R: Math.min(seg.R, d.L) });
      if (d.R < seg.R) next.push({ L: Math.max(seg.L, d.R), R: seg.R });
    }
    free = next.filter((s) => s.R - s.L > 0.01);
  }

  // Perspective compresses the far band — end pockets are tight, so prefer
  // 1·2·2·1 (one in each door-adjacent pocket, two in the wider mid bands).
  const pad = 0.006;
  const inset = free.map((s) => ({
    L: s.L + pad,
    R: s.R - pad,
  })).filter((s) => s.R > s.L);
  const counts =
    inset.length === 4 ? [1, 2, 2, 1] : inset.map(() => Math.ceil(6 / inset.length));
  const total = inset.reduce((s, f) => s + (f.R - f.L), 0);
  const plotW = Math.min(0.048, (total / 6) * 0.65);
  const centers: number[] = [];
  for (let fi = 0; fi < inset.length && centers.length < 6; fi++) {
    const seg = inset[fi]!;
    const n = Math.min(counts[fi] ?? 1, 6 - centers.length);
    for (let k = 0; k < n; k++) {
      centers.push(seg.L + ((k + 0.5) / n) * (seg.R - seg.L));
    }
  }
  while (centers.length < 6) {
    centers.push((xMin + xMax) / 2);
  }

  const slot = Math.max(0, Math.min(2, blockId)) * 2 + (index % 2);
  const cx = centers[slot]!;
  const half = plotW / 2;
  // Slight perspective taper top vs bottom of the bau band
  const topHalf = half * 0.92;
  const botHalf = half * 1.05;
  return {
    tl: { x: cx - topHalf, y: yTop },
    tr: { x: cx + topHalf, y: yTop },
    br: { x: cx + botHalf, y: yBot },
    bl: { x: cx - botHalf, y: yBot },
  };
}

export function boothQuad(blockId: number, index: number): QuadNorm {
  const b = Math.max(0, Math.min(2, blockId | 0));
  const i = Math.max(0, Math.min(3, index | 0));
  const r = i < 2 ? 0 : 1;
  if (r === 0) return farRowQuad(b, i);
  const c0 = BLOCK_COL0[b]!;
  const dc = (i % 2) * 2;
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

