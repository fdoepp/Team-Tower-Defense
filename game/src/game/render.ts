import { Match } from "./Match";
import {
  ANIM_DRINK_SEC,
  ANIM_SHOP_SEC,
  ANIM_THROW_SEC,
  BLOCK_META,
  STAND_CONVERT_SEC,
  type BuildSlot,
  type FanUnit,
} from "./types";
import {
  GAST_BLOCK,
  HEIM_BLOCK,
  L,
  SEATS_PER_BLOCK,
  FLOOR_GRID_COUPLE,
  blockCenterX,
  blocksLeftNorm,
  blocksRightNorm,
  boothQuad,
  boothRect,
  doorPos,
  gangHeight,
  gangY,
  pennantPos,
  seatPos,
  syncTribuneLayout,
  tribuneRect,
} from "./layout";
import {
  SCENE_ASSETS,
  UI_ICONS,
  currencyIconPath,
  drawIcon,
  drawIconQuad,
  drawImageCover,
  drawToyIcon,
  drawToyProp,
  type ToyAnimMode,
  slotEmptyIconPath,
  standIconPath,
  teamColor,
  tribuneIconPath,
  unitIconPath,
  type SlotControl,
} from "./assets";
import { scaleQuad } from "./floorGrid";

export { SEATS_PER_BLOCK } from "./layout";
export { L, blockCenterX, blockWidthNorm, gangXToWorld, blockIdToGangX, gangY } from "./layout";

export function drawMatch(ctx: CanvasRenderingContext2D, m: Match): void {
  const w = m.width;
  const h = m.height;
  syncTribuneLayout(w, h);
  // Skip when shell is display:none / zero-sized — arcTo crashes on tiny/negative rects
  if (w < 32 || h < 32) return;
  ctx.clearRect(0, 0, w, h);

  drawStadiumAtmosphere(ctx, m, w, h);
  // Scoreboard chrome lives in DOM (.scoreboard-slot) — aspect-locked, no canvas squash
  drawBlocks(ctx, m, w, h);
  drawSeats(ctx, m, w, h);
  drawGang(ctx, m, w, h);
  drawFrontStandards(ctx, m, w, h);
  drawSlots(ctx, m, w, h);
  drawTerritoryPennants(ctx, m, w, h);
  drawFans(ctx, m, w, h);
  drawPyroShots(ctx, m, w, h);
  drawConfetti(ctx, m, w, h);
  drawMoodParticles(ctx, m, w, h);
  drawFloats(ctx, m, w, h);
}

/**
 * Binding stadium plate (stadium-floodlight-derby-bg.jpg) + light overlays.
 * Cover full canvas, uniform scale — never distort the JPG.
 */
function drawStadiumAtmosphere(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const drewBg = drawImageCover(ctx, SCENE_ASSETS.stadiumBg, 0, 0, w, h);
  if (!drewBg) {
    const skyH = h * (L.blockTop + L.blockBodyH * 0.55);
    const sky = ctx.createLinearGradient(0, 0, 0, skyH);
    sky.addColorStop(0, "#04070f");
    sky.addColorStop(0.55, "#15233a");
    sky.addColorStop(1, "#1f2d44");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, skyH);
  }

  // Soft dim so freigestellte Tribünen / HUD lesen klarer
  ctx.fillStyle = "rgba(4, 8, 18, 0.18)";
  ctx.fillRect(0, 0, w, h * L.blockTop * 0.55);

  // pyro / flare glow — guest side warm, heim cool
  {
    const gx = blockCenterX(GAST_BLOCK) * w;
    const gy = h * L.blockTop * 0.75;
    const a = 0.22 + Math.min(0.5, m.moodGaeste * 0.2);
    const g = ctx.createRadialGradient(gx, gy, 6, gx, gy, w * 0.32);
    g.addColorStop(0, `rgba(251,146,60,${a})`);
    g.addColorStop(0.35, `rgba(239,68,68,${a * 0.65})`);
    g.addColorStop(1, "rgba(239,68,68,0)");
    ctx.fillStyle = g;
    ctx.fillRect(gx - w * 0.32, gy - h * 0.14, w * 0.64, h * 0.32);
    for (let i = 0; i < 7; i++) {
      const ox = Math.sin(m.realElapsed * 0.85 + i * 1.1) * w * 0.05;
      ctx.fillStyle = `rgba(248,113,113,${0.06 + a * 0.18})`;
      ctx.beginPath();
      ctx.ellipse(
        gx + ox + (i - 3) * w * 0.028,
        gy - h * 0.05 - i * h * 0.014,
        w * 0.055,
        h * 0.035,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  {
    const hx = blockCenterX(HEIM_BLOCK) * w;
    const hy = h * L.blockTop * 0.75;
    const a = 0.14 + Math.min(0.4, m.moodHeim * 0.16);
    const g = ctx.createRadialGradient(hx, hy, 6, hx, hy, w * 0.26);
    g.addColorStop(0, `rgba(96,165,250,${a})`);
    g.addColorStop(1, "rgba(96,165,250,0)");
    ctx.fillStyle = g;
    ctx.fillRect(hx - w * 0.26, hy - h * 0.12, w * 0.52, h * 0.28);
  }

  // Soften gang readability without painting over the derby BG floor
  const floorY = h * gangY();
  const floor = ctx.createLinearGradient(0, floorY - h * 0.04, 0, h);
  floor.addColorStop(0, "rgba(55, 65, 81, 0.22)");
  floor.addColorStop(0.45, "rgba(68, 64, 60, 0.35)");
  floor.addColorStop(1, "rgba(28, 25, 23, 0.45)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY - h * 0.04, w, h - floorY + h * 0.04);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(w * blocksLeftNorm(), floorY + h * gangHeight() * 0.55);
  ctx.lineTo(w * blocksRightNorm(), floorY + h * gangHeight() * 0.55);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Freigestellte Tribünen (tribune-block-blue/grey/red.png) auf dem Derby-BG.
 * Flush strip: grey centered, blue/red abutting; uniform scale — never distort.
 */
function drawBlocks(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  syncTribuneLayout(w, h);
  const labels = ["Heim", "Neutral", "Gäste"];

  for (const b of BLOCK_META) {
    const tr = tribuneRect(b.id);
    const left = tr.x * w;
    const top = tr.y * h;
    const bw = tr.w * w;
    const bh = tr.h * h;
    const cx = left + bw / 2;
    const owner = m.blockOwner[b.id];

    let blue = 0;
    let red = 0;
    for (const f of m.fans) {
      if (f.hp <= 0 || f.isSteward) continue;
      if (f.blockId !== b.id) continue;
      if (f.state !== "block" && f.state !== "stand") continue;
      if (f.team === "ksc") blue++;
      else if (f.team === "vfb") red++;
    }
    const crowd = blue + red;
    const lean = crowd > 0 ? (blue - red) / crowd : 0;
    const pressure = Math.min(1, crowd / 8) * Math.abs(lean);
    const glow =
      owner === "ksc" || (owner === "neutral" && lean > 0.15)
        ? `rgba(59,130,246,${0.18 + pressure * 0.3})`
        : owner === "vfb" || (owner === "neutral" && lean < -0.15)
          ? `rgba(248,113,113,${0.18 + pressure * 0.3})`
          : "rgba(148,163,184,0.14)";

    const g = ctx.createRadialGradient(cx, top + bh * 0.45, 8, cx, top + bh * 0.5, bw * 0.72);
    g.addColorStop(0, glow);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(left - 10, top - 8, bw + 20, bh + 20);

    // Soft contact shadow under tribune (no procedural shell)
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, top + bh * 0.92, bw * 0.42, bh * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    const tribSrc = tribuneIconPath(b.id);
    // Exact pack rect, pad=0 — aspect already baked into tribuneLayout.
    const drew = drawIcon(ctx, tribSrc, left, top, bw, bh, 0);
    if (!drew) {
      ctx.fillStyle =
        b.id === 0 ? "#2563eb" : b.id === 2 ? "#dc2626" : "#64748b";
      roundRect(ctx, left, top, bw, bh, 18);
      ctx.fill();
    }

    // label chip
    const label = labels[b.id] ?? "Block";
    const chipW = Math.max(54, bw * 0.48);
    const chipH = Math.max(18, h * 0.024);
    const chipY = top + 4;
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    roundRect(ctx, cx - chipW / 2, chipY, chipW, chipH, 9);
    ctx.fill();
    if (owner === "ksc" || owner === "vfb") {
      drawClubCrest(ctx, cx - chipW * 0.28, chipY + chipH / 2, chipH * 0.38, owner);
    }
    ctx.fillStyle = "#0f172a";
    ctx.font = `800 ${Math.floor(chipH * 0.55)}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      label,
      cx + (owner === "ksc" || owner === "vfb" ? 6 : 0),
      chipY + chipH / 2 + 0.5,
    );
    ctx.textBaseline = "alphabetic";

    // Exit path toward gang (tribune arches already in PNG)
    const d = doorPos(b.id);
    const doorW = bw * L.doorFrac * 0.85;
    const corridorTop = d.y * h;
    const corridorH = Math.max(8, h * gangY() - corridorTop + 4);
    const dx = d.x * w - doorW / 2;
    ctx.fillStyle = "rgba(2,6,23,0.55)";
    roundRect(ctx, dx, corridorTop - 2, doorW, corridorH + 4, 6);
    ctx.fill();
  }
}

function drawSeats(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const b of BLOCK_META) {
    for (let i = 0; i < SEATS_PER_BLOCK; i++) {
      const p = seatPos(b.id, i);
      const x = p.x * w;
      const y = p.y * h;
      const occ = m.seatOccupied(b.id, i);
      // No buy "+" in blocks — hiring is via Personen-Rail only
      let cushion = occ ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.14)";
      if (occ?.team === "ksc") cushion = "rgba(37,99,235,0.18)";
      else if (occ?.team === "vfb") cushion = "rgba(220,38,38,0.18)";

      ctx.fillStyle = cushion;
      roundRect(ctx, x - 9, y - 3, 18, 8, 3);
      ctx.fill();

      // Capture ring on converting neutrals
      if (occ?.team === "neutral" && Math.abs(occ.captureProg) > 0.08) {
        const prog = Math.abs(occ.captureProg);
        ctx.strokeStyle =
          occ.captureProg > 0
            ? `rgba(59,130,246,${0.4 + prog * 0.5})`
            : `rgba(239,68,68,${0.4 + prog * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 11, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

function drawGang(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const y = h * gangY();
  const gh = h * gangHeight();
  const left = w * blocksLeftNorm();
  const span = w * (blocksRightNorm() - blocksLeftNorm());
  const px = left + span * m.linePlayer;
  const ax = left + span * m.lineAi;

  // Soft open concourse — light territory wash only
  const pEdge = Math.min(px, ax);
  const aEdge = Math.max(px, ax);
  ctx.fillStyle = "rgba(59,130,246,0.18)";
  ctx.fillRect(left, y, Math.max(0, pEdge - left), gh);
  ctx.fillStyle = "rgba(239,68,68,0.18)";
  ctx.fillRect(aEdge, y, left + span - aEdge, gh);

  // Front lines (thicker so territory edge is obvious)
  ctx.save();
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "rgba(59,130,246,0.95)";
  ctx.beginPath();
  ctx.moveTo(px, y + 4);
  ctx.lineTo(px, y + gh - 4);
  ctx.stroke();
  ctx.strokeStyle = "rgba(239,68,68,0.95)";
  ctx.beginPath();
  ctx.moveTo(ax, y + 4);
  ctx.lineTo(ax, y + gh - 4);
  ctx.stroke();
  ctx.restore();
}

/** Big flag standards planted at each team's frontmost battle line */
function drawFrontStandards(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const y = h * gangY();
  const gh = h * gangHeight();
  const left = w * blocksLeftNorm();
  const span = w * (blocksRightNorm() - blocksLeftNorm());
  const poles: { x: number; team: "ksc" | "vfb" }[] = [
    { x: left + span * m.linePlayer, team: m.playerTeam },
    { x: left + span * m.lineAi, team: m.aiTeam },
  ];
  for (const pole of poles) {
    const src = pole.team === "ksc" ? UI_ICONS.pennantKsc : UI_ICONS.pennantVfb;
    const baseY = y + gh * 0.88;
    const poleH = gh * 0.72;
    // pole
    ctx.strokeStyle = "#44403c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pole.x, baseY);
    ctx.lineTo(pole.x, baseY - poleH);
    ctx.stroke();
    // base disk
    ctx.fillStyle = "rgba(15,23,42,0.45)";
    ctx.beginPath();
    ctx.ellipse(pole.x, baseY + 2, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // flag
    const fw = Math.min(w * 0.07, h * 0.09);
    const fh = fw * 1.15;
    const bob = Math.sin(m.realElapsed * 3.5 + (pole.team === "ksc" ? 0 : 1)) * 2;
    drawIcon(ctx, src, pole.x - 2, baseY - poleH - fh * 0.15 + bob, fw, fh, 0.02);
  }
}

function drawPyroShots(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const p of m.pyroShots) {
    const x = p.x * w;
    const y = p.y * h;
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 10);
    glow.addColorStop(0, "#fff7ed");
    glow.addColorStop(0.35, "#fb923c");
    glow.addColorStop(1, "rgba(251,146,60,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(x - 1.5, y - 2, 3, 10);
    ctx.fillStyle = "rgba(148,163,184,0.45)";
    ctx.beginPath();
    ctx.ellipse(x - 4, y - 6, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSlots(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const s of m.slots) {
    const r = boothRect(s.blockId, s.index);
    const sel =
      m.selectedSlot?.blockId === s.blockId &&
      m.selectedSlot?.index === s.index;
    drawBuilding(
      ctx,
      s,
      r.x * w,
      r.y * h,
      r.w * w,
      r.h * h,
      sel,
      m,
    );
  }
}

/** Kontrolle eines leeren Bauplatzes → Icon-Farbe (Standarte im Slot-Asset). */
function slotControlForPlot(m: Match, s: BuildSlot): SlotControl {
  if (s.greyNeutral || s.owner === "neutral") return "grey";
  if (s.owner === "ksc") return "blue";
  if (s.owner === "vfb") return "red";

  const bo = m.blockOwner[s.blockId];
  if (bo === "ksc" || bo === "vfb") {
    if (bo === m.playerTeam && m.inPlayerTerritory(s.blockId, s.index)) {
      return bo === "ksc" ? "blue" : "red";
    }
    if (bo === m.aiTeam && m.inAiTerritory(s.blockId, s.index)) {
      return bo === "ksc" ? "blue" : "red";
    }
  }
  if (m.inPlayerTerritory(s.blockId, s.index)) {
    return m.playerTeam === "ksc" ? "blue" : "red";
  }
  if (m.inAiTerritory(s.blockId, s.index)) {
    return m.aiTeam === "ksc" ? "blue" : "red";
  }
  return "grey";
}

/**
 * Separate Standarten nur auf gebauten Buden.
 * Leere Plots: fahnenloses Slot-Icon mit Bodenton (kein Wimpel im Warp).
 */
function plotPennantTeam(
  m: Match,
  s: BuildSlot,
): "ksc" | "vfb" | null {
  void m;
  if (s.building && !s.greyNeutral && (s.owner === "ksc" || s.owner === "vfb")) {
    return s.owner;
  }
  return null;
}

function drawTerritoryPennants(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const s of m.slots) {
    const team = plotPennantTeam(m, s);
    if (!team) continue;
    const p = pennantPos(s.blockId, s.index);
    const src = team === "ksc" ? UI_ICONS.pennantKsc : UI_ICONS.pennantVfb;
    const pw = Math.min(w * 0.055, h * 0.065);
    const ph = pw * 1.15;
    const bob = Math.sin(m.realElapsed * 3.2 + s.blockId + s.index) * 2;
    drawIcon(ctx, src, p.x * w - pw * 0.15, p.y * h - ph * 0.35 + bob, pw, ph, 0.02);
  }
}

/** Baustelle — Slot-Icon, Auto-Swap mit Kontrolle; bei Floor-Grid in Zellen-Trapez. */
function drawBaustelle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bw: number,
  bh: number,
  sel: boolean,
  m: Match,
  s: BuildSlot,
): void {
  const control = slotControlForPlot(m, s);
  const src = slotEmptyIconPath(control, undefined, FLOOR_GRID_COUPLE);
  let drew = false;
  if (FLOOR_GRID_COUPLE) {
    const q = scaleQuad(boothQuad(s.blockId, s.index), m.width, m.height);
    drew = drawIconQuad(ctx, src, q.tl, q.tr, q.br, q.bl);
    if (sel) {
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(q.tl.x, q.tl.y);
      ctx.lineTo(q.tr.x, q.tr.y);
      ctx.lineTo(q.br.x, q.br.y);
      ctx.lineTo(q.bl.x, q.bl.y);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = "rgba(34,197,94,0.35)";
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  } else {
    drew = drawIcon(ctx, src, x, y, bw, bh, 0.02);
    if (sel) {
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3.5;
      roundRect(ctx, x + 2, y + 2, bw - 4, bh - 4, 10);
      ctx.stroke();
      ctx.strokeStyle = "rgba(34,197,94,0.35)";
      ctx.lineWidth = 6;
      roundRect(ctx, x - 1, y - 1, bw + 2, bh + 2, 12);
      ctx.stroke();
    }
  }
  if (!drew) {
    const r = Math.min(10, Math.min(bw, bh) * 0.12);
    ctx.fillStyle = "#4b5563";
    roundRect(ctx, x + 4, y + 4, bw - 8, bh - 8, r);
    ctx.fill();
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 3;
    roundRect(ctx, x + 6, y + 6, bw - 12, bh - 12, r - 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `800 ${Math.max(16, Math.floor(bh * 0.28))}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", x + bw / 2, y + bh / 2);
    ctx.textBaseline = "alphabetic";
  }
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  s: BuildSlot,
  x: number,
  y: number,
  bw: number,
  bh: number,
  sel: boolean,
  m: Match,
): void {
  const grey = !!(s.owner === "neutral" || s.greyNeutral);
  const player = s.owner === m.playerTeam;
  const ai = s.owner === m.aiTeam;
  const r = Math.min(10, Math.min(bw, bh) * 0.12);
  const convT = Math.min(1, s.convertAcc / STAND_CONVERT_SEC);

  if (!s.building) {
    drawBaustelle(ctx, x, y, bw, bh, sel, m, s);
    return;
  }

  // Built plot: Leerfläche is gone. Anchor the stand on the floor-grid cell center.
  let cx = x + bw / 2;
  let footY = y + bh * 0.78;
  let size = Math.min(bw, bh) * 0.98;
  let pq: ReturnType<typeof scaleQuad> | null = null;
  if (FLOOR_GRID_COUPLE) {
    pq = scaleQuad(boothQuad(s.blockId, s.index), m.width, m.height);
    const mid = {
      x: (pq.tl.x + pq.tr.x + pq.br.x + pq.bl.x) / 4,
      y: (pq.tl.y + pq.tr.y + pq.br.y + pq.bl.y) / 4,
    };
    const near = {
      x: (pq.bl.x + pq.br.x) / 2,
      y: (pq.bl.y + pq.br.y) / 2,
    };
    // Slightly bias foot toward the near edge so the stand sits in the cell.
    cx = mid.x * 0.55 + near.x * 0.45;
    footY = mid.y * 0.4 + near.y * 0.6;
    const cellW = Math.hypot(pq.br.x - pq.bl.x, pq.br.y - pq.bl.y);
    size = Math.max(28, cellW * 0.95);
  }

  const color = teamColor(
    grey && !(s.convertBy && convT > 0.35) ? "neutral" : s.owner,
  );
  const lv = Math.max(1, Math.min(5, s.level || 1));
  const iconSrc = standIconPath(s.building, color, lv);

  // Soft ground contact on the plot (no empty Bauplatz under a built stand).
  ctx.fillStyle = "rgba(15,23,42,0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, footY + size * 0.06, size * 0.32, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  const drew = drawToyIcon(ctx, iconSrc, cx, footY, size, {
    t: m.realElapsed,
    phase: s.blockId * 1.7 + s.index * 0.9,
    mode: s.prodFlash > 0.2 ? "cheer" : "idle",
    facing: 1,
    hop: 0,
  });
  if (!drew) {
    ctx.fillStyle = grey ? "#e2e8f0" : player ? "#eff6ff" : ai ? "#fef2f2" : "#f8fafc";
    roundRect(ctx, x, y, bw, bh, r);
    ctx.fill();
  }

  if (s.prodFlash > 0.05) {
    const flash = s.prodFlash;
    ctx.save();
    ctx.globalAlpha = 0.35 + flash * 0.55;
    ctx.strokeStyle =
      s.building === "bier" ? "#fbbf24" : s.building === "ordner" ? "#60a5fa" : "#c084fc";
    ctx.lineWidth = 3 + flash * 4;
    if (pq) {
      ctx.beginPath();
      ctx.moveTo(pq.tl.x, pq.tl.y);
      ctx.lineTo(pq.tr.x, pq.tr.y);
      ctx.lineTo(pq.br.x, pq.br.y);
      ctx.lineTo(pq.bl.x, pq.bl.y);
      ctx.closePath();
      ctx.stroke();
    } else {
      roundRect(ctx, x + 2, y + 2, bw - 4, bh - 4, r);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (s.convertBy && s.convertAcc > 0.15) {
    const pct = Math.min(1, s.convertAcc / STAND_CONVERT_SEC);
    const left = Math.max(0, STAND_CONVERT_SEC - s.convertAcc);
    const col = s.convertBy === "ksc" ? "#3b82f6" : "#ef4444";
    const rr = Math.min(bw, bh) * 0.16;
    const ringY = footY - size * 0.55;
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, ringY, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, ringY, rr, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.max(9, Math.floor(rr * 0.7))}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.ceil(left)}`, cx, ringY + 1);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  if (s.building === "ordner" && s.structMaxHp > 0) {
    const pct = Math.max(0, Math.min(1, s.structHp / s.structMaxHp));
    const barW = size * 0.7;
    const barX = cx - barW / 2;
    const barY = footY + size * 0.08;
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(barX, barY, barW, 4);
    ctx.fillStyle = pct > 0.45 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(barX, barY, barW * pct, 4);
  }

  // level pips above the stand
  if (!grey || (s.convertBy && convT > 0.5)) {
    const pipW = Math.min(7, size / 5 - 1);
    const pipX0 = cx - (5 * (pipW + 2) - 2) / 2;
    const pipY = footY - size * 0.95;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < lv ? "#fde68a" : "rgba(0,0,0,0.45)";
      ctx.fillRect(pipX0 + i * (pipW + 2), pipY, pipW, 4);
    }
  }

  if (sel) {
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    if (pq) {
      ctx.beginPath();
      ctx.moveTo(pq.tl.x, pq.tl.y);
      ctx.lineTo(pq.tr.x, pq.tr.y);
      ctx.lineTo(pq.br.x, pq.br.y);
      ctx.lineTo(pq.bl.x, pq.bl.y);
      ctx.closePath();
      ctx.stroke();
    } else {
      roundRect(ctx, x + 1, y + 1, bw - 2, bh - 2, r);
      ctx.stroke();
    }
  }

  if (s.building === "bier" && !grey) {
    const barW = size * 0.7;
    const barX = cx - barW / 2;
    const barY = footY + size * 0.1;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(barX, barY, barW, 4);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(barX, barY, barW * (s.beer / s.capacity), 4);
  }
}

/** Vereinswappen on captured stands / stormed blocks */
function drawClubCrest(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  team: "ksc" | "vfb",
): void {
  ctx.save();
  ctx.translate(x, y);
  // shield
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.55);
  ctx.lineTo(s * 0.45, -s * 0.25);
  ctx.lineTo(s * 0.4, s * 0.25);
  ctx.lineTo(0, s * 0.55);
  ctx.lineTo(-s * 0.4, s * 0.25);
  ctx.lineTo(-s * 0.45, -s * 0.25);
  ctx.closePath();
  ctx.fillStyle = team === "ksc" ? "#1d4ed8" : "#b91c1c";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1.2, s * 0.08);
  ctx.stroke();
  // monogram
  ctx.fillStyle = "#fff";
  ctx.font = `800 ${Math.max(8, Math.floor(s * 0.55))}px Outfit, Manrope, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(team === "ksc" ? "K" : "V", 0, s * 0.02);
  ctx.restore();
}

export function slotPos(
  s: BuildSlot,
  w: number,
  h: number,
): { x: number; y: number } {
  const r = boothRect(s.blockId, s.index);
  return { x: (r.x + r.w / 2) * w, y: (r.y + r.h / 2) * h };
}

function drawFans(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  // draw block fans first, then gang (depth)
  const sorted = [...m.fans].filter((f) => f.hp > 0).sort((a, b) => {
    const za = a.state === "gang" || a.invading ? 1 : 0;
    const zb = b.state === "gang" || b.invading ? 1 : 0;
    return za - zb || a.y - b.y;
  });
  for (const f of sorted) {
    drawMannchen(ctx, m, f, f.x * w, f.y * h, h);
  }
}

function teamJersey(f: FanUnit): string {
  if (f.team === "ksc") return "#1f6feb";
  if (f.team === "vfb") return "#dc2626";
  // Neutral leaning toward a side — slow color shift before full convert
  const lean = f.lean || 0;
  const prog = f.captureProg || 0;
  const t = Math.max(Math.abs(lean) * 0.45, Math.abs(prog) * 0.7);
  if (t < 0.08) return "#9ca3af";
  const towardHeim = lean > 0 || prog > 0;
  return towardHeim
    ? lerpHex("#9ca3af", "#1f6feb", Math.min(1, t))
    : lerpHex("#9ca3af", "#dc2626", Math.min(1, t));
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255,
    ag = (pa >> 8) & 255,
    ab = pa & 255;
  const br = (pb >> 16) & 255,
    bg = (pb >> 8) & 255,
    bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

function unitVisualLevel(m: Match, team: FanUnit["team"]): number {
  let maxLv = 1;
  for (const s of m.slots) {
    if (s.building && s.owner === team && !s.greyNeutral) {
      maxLv = Math.max(maxLv, s.level || 1);
    }
  }
  return Math.max(1, Math.min(5, maxLv));
}

function fanFacing(f: FanUnit): number {
  if (f.path.length > f.pathI) {
    const t = f.path[f.pathI]!;
    if (Math.abs(t.x - f.x) > 0.002) return t.x >= f.x ? 1 : -1;
  }
  if (f.team === "vfb") return -1;
  if (f.team === "ksc") return 1;
  return f.patrolDir < 0 ? -1 : 1;
}

function personAnimMode(m: Match, f: FanUnit): {
  mode: ToyAnimMode;
  hop: number;
  strike: number;
  actionProg: number;
  prop: "beer" | "pyro" | "fist" | "scarf" | "bag" | null;
  propI: number;
} {
  const onGang = f.state === "gang" || f.invading;
  const exiting =
    f.state === "moving" && f.y < gangY() + gangHeight() * 0.22;
  const moving = f.state === "moving" || onGang;
  const fighting =
    (onGang || f.invading || f.isSteward) &&
    (f.armSwing > 0.15 || f.attackCd > 0.05) &&
    f.throwT <= 0;
  const throwing = f.throwT > 0;
  const drinking = f.drinkT > 0;
  const shopping = f.shopT > 0;
  const cheering =
    !moving &&
    !drinking &&
    !shopping &&
    !throwing &&
    (f.cheerT > 0 ||
      (f.team === "ksc" ? m.moodHeim : f.team === "vfb" ? m.moodGaeste : 0) >
        0.7);

  let mode: ToyAnimMode = "idle";
  if (throwing) mode = "throw";
  else if (fighting) mode = "fight";
  else if (drinking) mode = "drink";
  else if (shopping) mode = "shop";
  else if (exiting) mode = "exit";
  else if (moving) mode = "walk";
  else if (cheering) mode = "cheer";

  const throwProg =
    f.throwT > 0 ? 1 - f.throwT / Math.max(0.01, ANIM_THROW_SEC) : 0;
  const drinkProg =
    f.drinkT > 0 ? 1 - f.drinkT / Math.max(0.01, ANIM_DRINK_SEC) : 0;
  const shopProg =
    f.shopT > 0 ? 1 - f.shopT / Math.max(0.01, ANIM_SHOP_SEC) : 0;

  let prop: "beer" | "pyro" | "fist" | "scarf" | "bag" | null = null;
  let propI = 0;
  if (drinking) {
    prop = "beer";
    propI = 0.55 + 0.45 * Math.min(1, drinkProg * 1.2);
  } else if (throwing) {
    prop = "pyro";
    propI = 0.4 + 0.6 * throwProg;
  } else if (fighting) {
    prop = "fist";
    propI = Math.max(f.armSwing, 0.35);
  } else if (shopping) {
    prop = "bag";
    propI = 0.5 + 0.4 * shopProg;
  } else if (cheering && f.kind === "normalos" && !f.isSteward) {
    prop = "scarf";
    propI = Math.min(1, f.cheerT / 2);
  } else if (cheering && f.kind === "ultras") {
    prop = "pyro";
    propI = 0.35 + 0.3 * Math.sin(m.realElapsed * 8);
  }

  return {
    mode,
    hop: moving || exiting ? 1 : fighting ? 0.7 : 0,
    strike: Math.max(
      f.armSwing,
      fighting ? 0.35 : 0,
      throwing ? 0.5 + 0.5 * throwProg : 0,
      drinking ? 0.4 : 0,
    ),
    actionProg: throwing
      ? throwProg
      : drinking
        ? drinkProg
        : shopping
          ? shopProg
          : Math.max(f.armSwing, fighting ? 0.35 : 0),
    prop,
    propI,
  };
}

function drawMannchen(
  ctx: CanvasRenderingContext2D,
  m: Match,
  f: FanUnit,
  x: number,
  y: number,
  h: number,
): void {
  if (f.isSteward) {
    drawSteward(ctx, m, f, x, y, h);
    return;
  }
  const onGang = f.state === "gang" || f.invading;
  const moving = f.state === "moving" || onGang;
  const sizeMul =
    f.kind === "ultras" ? 1.22 : f.kind === "hooligans" ? 1.12 : 1;
  const size = Math.max(26, h * (moving ? 0.085 : 0.068) * sizeMul);
  const color = teamColor(f.team);
  const lv = unitVisualLevel(m, f.team);
  const src = unitIconPath(f.kind, color, lv);
  const phase = (typeof f.id === "number" ? f.id : 0) * 0.73;
  const facing = fanFacing(f);
  const anim = personAnimMode(m, f);

  if (Math.abs(f.captureProg) > 0.12 && f.team === "neutral") {
    ctx.strokeStyle =
      f.captureProg > 0
        ? `rgba(59,130,246,${0.35 + Math.abs(f.captureProg) * 0.55})`
        : `rgba(239,68,68,${0.35 + Math.abs(f.captureProg) * 0.55})`;
    ctx.lineWidth = Math.max(2, size * 0.04);
    ctx.beginPath();
    ctx.arc(
      x,
      y - size * 0.35,
      size * 0.55,
      -Math.PI / 2,
      -Math.PI / 2 + Math.abs(f.captureProg) * Math.PI * 2,
    );
    ctx.stroke();
  }

  const drew = drawToyIcon(ctx, src, x, y, size, {
    t: m.realElapsed,
    phase,
    mode: anim.mode,
    facing,
    hop: anim.hop,
    strike: anim.strike,
    actionProg: anim.actionProg,
  });
  if (drew && anim.prop) {
    drawToyProp(
      ctx,
      anim.prop,
      x,
      y,
      size,
      facing,
      m.realElapsed + phase,
      anim.propI,
    );
  }
  if (!drew) {
    const s = size / 2.85;
    const jersey = teamJersey(f);
    const skin = f.team === "neutral" ? "#c4c4c4" : "#e8c4a0";
    ctx.save();
    ctx.translate(x, y);
    if (f.kind === "ultras") drawUltra(ctx, f, s, jersey, skin, onGang, m.realElapsed);
    else if (f.kind === "hooligans") drawHooligan(ctx, f, s, jersey, skin);
    else drawNormalo(ctx, f, s, jersey, skin, m.realElapsed);
    ctx.restore();
  }

  if (onGang || f.invading || f.state === "moving") {
    const bw = size * 0.7;
    const pct = Math.max(0, Math.min(1, f.hp / f.maxHp));
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(x - bw / 2, y + size * 0.12, bw, 3.5);
    ctx.fillStyle = pct > 0.45 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(x - bw / 2, y + size * 0.12, bw * pct, 3.5);
  }
}

function drawUltra(
  ctx: CanvasRenderingContext2D,
  f: FanUnit,
  s: number,
  jersey: string,
  skin: string,
  onGang: boolean,
  elapsed: number,
): void {
  // black cargo pants
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = Math.max(2.5, s * 0.28);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.28, s * 0.35);
  ctx.lineTo(-s * 0.4, s * 1.1);
  ctx.moveTo(s * 0.28, s * 0.35);
  ctx.lineTo(s * 0.42, s * 1.1);
  ctx.stroke();

  // hoodie body (darker overlay)
  ctx.fillStyle = jersey;
  roundRect(ctx, -s * 0.6, -s * 0.4, s * 1.2, s * 0.95, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, -s * 0.6, -s * 0.4, s * 1.2, s * 0.35, 4);
  ctx.fill();

  // thick team scarf
  ctx.fillStyle = jersey;
  ctx.fillRect(-s * 0.55, -s * 0.08, s * 1.1, s * 0.22);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(-s * 0.55, s * 0.02, s * 1.1, s * 0.08);
  ctx.fillStyle = jersey;
  ctx.fillRect(s * 0.4, -s * 0.08, s * 0.22, s * 0.7);

  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -s * 0.72, s * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // BLACK BEANIE on top of head (drawn after head)
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.arc(0, -s * 0.85, s * 0.48, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-s * 0.48, -s * 0.9, s * 0.96, s * 0.28);
  // pompon
  ctx.fillStyle = jersey;
  ctx.beginPath();
  ctx.arc(0, -s * 1.22, s * 0.16, 0, Math.PI * 2);
  ctx.fill();

  // arms — two limbs (swing + plant)
  const face = f.team === "vfb" ? -1 : 1;
  const swing = f.armSwing > 0 ? f.armSwing : onGang ? 0.2 : 0;
  const ang = (-0.8 + swing * 1.7) * face;
  ctx.strokeStyle = skin;
  ctx.lineWidth = Math.max(2.2, s * 0.22);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(face * s * 0.5, -s * 0.05);
  const ix = face * s * 0.5 + Math.cos(ang) * s * 1.15;
  const iy = -s * 0.05 + Math.sin(ang) * s * 1.15;
  ctx.lineTo(ix, iy);
  ctx.moveTo(-face * s * 0.5, -s * 0.02);
  ctx.lineTo(-face * s * 0.75, s * 0.45);
  ctx.stroke();
  if (f.rangedPyro && onGang && swing > 0.25) {
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(-0.55 * face);
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(-1.5, -s * 0.15, 3, s * 0.85);
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(0, -s * 0.2, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(148,163,184,0.55)";
    ctx.beginPath();
    ctx.ellipse(-face * s * 0.35, -s * 0.45, s * 0.45, s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    drawUltraHandPyro(ctx, f, s, jersey, face, elapsed);
  }
}

function drawUltraHandPyro(
  ctx: CanvasRenderingContext2D,
  f: FanUnit,
  s: number,
  jersey: string,
  face: number,
  elapsed: number,
): void {
  const flick = 0.85 + Math.sin(f.id * 3 + elapsed * 8) * 0.15;
  ctx.save();
  ctx.translate(face * s * 0.52, -s * 0.15);
  ctx.rotate(-0.35 * face);
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(-1.5, 0, 3, s * 0.72);
  const glow = ctx.createRadialGradient(0, -2, 1, 0, -2, s * 0.38 * flick);
  glow.addColorStop(0, "#fffbeb");
  glow.addColorStop(0.3, "#fb923c");
  glow.addColorStop(0.65, jersey);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -2, s * 0.32 * flick, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(148,163,184,0.35)";
  ctx.beginPath();
  ctx.ellipse(-face * s * 0.22, -s * 0.38, s * 0.28, s * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNormalo(
  ctx: CanvasRenderingContext2D,
  f: FanUnit,
  s: number,
  jersey: string,
  skin: string,
  elapsed: number,
): void {
  // blue jeans
  ctx.strokeStyle = "#1d4ed8";
  ctx.lineWidth = Math.max(2, s * 0.24);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, s * 0.35);
  ctx.lineTo(-s * 0.32, s * 1.05);
  ctx.moveTo(s * 0.25, s * 0.35);
  ctx.lineTo(s * 0.35, s * 1.05);
  ctx.stroke();

  // jersey body
  ctx.fillStyle = jersey;
  roundRect(ctx, -s * 0.5, -s * 0.3, s, s * 0.8, 3);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(-s * 0.12, -s * 0.15, s * 0.24, s * 0.45);

  // Schal (Fanartikel) — always visible
  ctx.fillStyle = jersey;
  ctx.fillRect(-s * 0.42, -s * 0.02, s * 0.84, s * 0.14);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-s * 0.42, s * 0.04, s * 0.84, s * 0.05);
  const wave = Math.sin(elapsed * 4 + f.id) * 0.12;
  ctx.strokeStyle = jersey;
  ctx.lineWidth = Math.max(2, s * 0.18);
  ctx.beginPath();
  ctx.moveTo(s * 0.45, -s * 0.05);
  ctx.quadraticCurveTo(s * 1.05, -s * 0.55 + wave, s * 0.85, s * 0.35);
  ctx.stroke();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1.2, s * 0.1);
  ctx.beginPath();
  ctx.moveTo(s * 0.5, 0);
  ctx.quadraticCurveTo(s * 0.95, -s * 0.4 + wave, s * 0.8, s * 0.25);
  ctx.stroke();

  // Fahne in linker Hand
  ctx.save();
  ctx.translate(-s * 0.55, -s * 0.1);
  ctx.rotate(-0.45 + wave);
  ctx.strokeStyle = "#a8a29e";
  ctx.lineWidth = Math.max(1.5, s * 0.1);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.5);
  ctx.lineTo(0, -s * 0.55);
  ctx.stroke();
  ctx.fillStyle = jersey;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.55);
  ctx.lineTo(s * 0.65, -s * 0.38);
  ctx.lineTo(0, -s * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, -s * 0.48, s * 0.22, s * 0.08);
  ctx.restore();

  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -s * 0.65, s * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // baseball cap — white/green so NOT team-colored like ultra beanie
  ctx.fillStyle = "#f3f0e7";
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.78, s * 0.4, s * 0.2, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-s * 0.42, -s * 0.82, s * 0.84, s * 0.14);
  // brim
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.ellipse(s * 0.28, -s * 0.72, s * 0.35, s * 0.11, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // arms — always two clear limbs
  ctx.strokeStyle = skin;
  ctx.lineWidth = Math.max(2, s * 0.18);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.48, -s * 0.05);
  ctx.lineTo(-s * 0.75, s * 0.35);
  ctx.moveTo(s * 0.48, -s * 0.05);
  ctx.lineTo(s * 0.85, -s * 0.35);
  ctx.stroke();
}

function drawHooligan(
  ctx: CanvasRenderingContext2D,
  f: FanUnit,
  s: number,
  jersey: string,
  _skin: string,
): void {
  void _skin;
  const ksc = f.team === "ksc";
  const hood = ksc ? "#1d4ed8" : jersey;

  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = Math.max(2, s * 0.2);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.22, s * 0.3);
  ctx.lineTo(-s * 0.28, s * 0.95);
  ctx.moveTo(s * 0.22, s * 0.3);
  ctx.lineTo(s * 0.3, s * 0.95);
  ctx.stroke();

  // Hoodie — vermummt, KSC blau erkennbar
  ctx.fillStyle = hood;
  roundRect(ctx, -s * 0.52, -s * 0.35, s * 1.04, s * 0.82, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  roundRect(ctx, -s * 0.52, -s * 0.35, s * 1.04, s * 0.38, 4);
  ctx.fill();
  if (ksc) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(-s * 0.12, -s * 0.08, s * 0.24, s * 0.35);
  }

  // Kapuze / Gesichtsschatten
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(0, -s * 0.62, s * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Sonnenbrille
  ctx.fillStyle = "#020617";
  ctx.fillRect(-s * 0.34, -s * 0.68, s * 0.68, s * 0.12);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(-s * 0.3, -s * 0.66, s * 0.22, s * 0.05);
  ctx.fillRect(s * 0.08, -s * 0.66, s * 0.22, s * 0.05);

  // arms — always two
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = Math.max(1.8, s * 0.16);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(s * 0.42, 0);
  ctx.lineTo(s * 0.62, s * 0.4);
  ctx.moveTo(-s * 0.42, 0);
  ctx.lineTo(-s * 0.7, -s * 0.35);
  ctx.stroke();
}

function drawSteward(
  ctx: CanvasRenderingContext2D,
  m: Match,
  f: FanUnit,
  x: number,
  y: number,
  h: number,
): void {
  const s = 10 * Math.max(1, h * 0.028 / 10);
  const neutral = f.team === "neutral";
  const hpCol = neutral ? "#a8a29e" : "#facc15";
  const size = Math.max(24, h * 0.07);
  const src = unitIconPath("ordner", teamColor(f.team), unitVisualLevel(m, f.team));
  const phase = (typeof f.id === "number" ? f.id : 0) * 0.73;
  const facing =
    f.state === "moving" || f.path.length > f.pathI
      ? fanFacing(f)
      : f.patrolDir < 0
        ? -1
        : 1;
  const anim = personAnimMode(m, f);

  if (
    drawToyIcon(ctx, src, x, y, size, {
      t: m.realElapsed,
      phase,
      mode: anim.mode === "idle" && (f.state === "gang" || f.state === "moving")
        ? "walk"
        : anim.mode,
      facing,
      hop: anim.hop || (f.state === "gang" || f.state === "moving" ? 0.85 : 0),
      strike: anim.strike,
      actionProg: anim.actionProg,
    })
  ) {
    if (anim.prop === "fist" || anim.mode === "fight") {
      drawToyProp(
        ctx,
        "fist",
        x,
        y,
        size,
        facing,
        m.realElapsed + phase,
        Math.max(anim.propI, f.armSwing),
      );
    }
    const bw = size * 0.7;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - bw / 2, y + size * 0.12, bw, 3);
    ctx.fillStyle = hpCol;
    ctx.fillRect(x - bw / 2, y + size * 0.12, bw * Math.max(0, f.hp / f.maxHp), 3);
    return;
  }

  ctx.save();
  ctx.translate(x, y);

  const skin = neutral ? "#c4c4c4" : "#e8c4a0";
  const vest = neutral ? "#9ca3af" : "#facc15";
  const vestStripe = neutral ? "#57534e" : "#0f172a";
  const cap = neutral ? "#6b7280" : "#1e293b";

  // dark pants
  ctx.strokeStyle = neutral ? "#44403c" : "#1e293b";
  ctx.lineWidth = Math.max(2.2, s * 0.24);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, s * 0.35);
  ctx.lineTo(-s * 0.32, s * 1.05);
  ctx.moveTo(s * 0.25, s * 0.35);
  ctx.lineTo(s * 0.35, s * 1.05);
  ctx.stroke();

  // vest
  ctx.fillStyle = vest;
  roundRect(ctx, -s * 0.55, -s * 0.3, s * 1.1, s * 0.85, 3);
  ctx.fill();
  ctx.fillStyle = vestStripe;
  ctx.fillRect(-s * 0.55, -s * 0.05, s * 1.1, s * 0.12);
  ctx.fillRect(-s * 0.08, -s * 0.3, s * 0.16, s * 0.85);

  // head + cap
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -s * 0.65, s * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.78, s * 0.4, s * 0.18, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-s * 0.4, -s * 0.8, s * 0.8, s * 0.14);

  // badge
  ctx.fillStyle = neutral ? "#e7e5e4" : "#fff";
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.05);
  ctx.lineTo(s * 0.22, s * 0.12);
  ctx.lineTo(0, s * 0.28);
  ctx.lineTo(-s * 0.22, s * 0.12);
  ctx.closePath();
  ctx.fill();

  // arms
  const face = f.team === "vfb" ? -1 : 1;
  const swing = f.armSwing > 0 ? f.armSwing : 0.1;
  const ang = (-0.5 + swing * 1.2) * face;
  ctx.strokeStyle = skin;
  ctx.lineWidth = Math.max(2, s * 0.2);
  ctx.beginPath();
  ctx.moveTo(face * s * 0.5, 0);
  ctx.lineTo(
    face * s * 0.5 + Math.cos(ang) * s,
    Math.sin(ang) * s,
  );
  ctx.moveTo(-face * s * 0.45, 0);
  ctx.lineTo(-face * s * 0.55, s * 0.4);
  ctx.stroke();

  ctx.restore();

  const bw = s * 2.2;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(x - bw / 2, y + s * 1.25, bw, 3);
  ctx.fillStyle = hpCol;
  ctx.fillRect(x - bw / 2, y + s * 1.25, bw * Math.max(0, f.hp / f.maxHp), 3);
}

function drawFloats(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const f of m.floats) {
    const alpha = Math.min(1, f.t / 0.35);
    ctx.globalAlpha = alpha;
    const x = f.x * w;
    const y = f.y * h;
    ctx.font = `800 ${Math.floor(h * 0.028)}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.fillStyle = f.good ? "#86efac" : "#fca5a5";

    if (f.currency) {
      const sz = Math.min(w, h) * 0.055;
      const ix = x - sz * 0.85;
      const iy = y - sz * 0.5;
      drawIcon(ctx, currencyIconPath(f.currency), ix, iy, sz, sz, 0.04);
      ctx.textAlign = "left";
      ctx.strokeText(f.text, x + sz * 0.2, y);
      ctx.fillText(f.text, x + sz * 0.2, y);
    } else {
      ctx.textAlign = "center";
      ctx.strokeText(f.text, x, y);
      ctx.fillText(f.text, x, y);
    }
  }
  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";
}

function drawConfetti(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const c of m.confetti) {
    const lifeLeft = 1 - c.t / c.life;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, lifeLeft * 1.2));
    ctx.translate(c.x * w, c.y * h);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    const pw = Math.max(3, h * 0.008);
    const ph = Math.max(5, h * 0.014);
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawMoodParticles(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const p of m.moodFx) {
    const lifeLeft = 1 - p.t / p.life;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, lifeLeft));
    const px = p.x * w;
    const py = p.y * h;
    if (p.kind === "note") {
      ctx.fillStyle = p.color;
      ctx.font = `700 ${Math.max(10, p.size * h * 1.8)}px Outfit, Manrope, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(p.size > 0.014 ? "♫" : "♪", px, py);
    } else if (p.kind === "smoke") {
      const rad = Math.max(4, p.size * h);
      const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, p.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "flare") {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(2, p.size * h * 2);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + p.vx * w * 0.08, py + p.vy * h * 0.08);
      ctx.stroke();
      const glow = ctx.createRadialGradient(px, py, 1, px, py, 8);
      glow.addColorStop(0, "#fff7ed");
      glow.addColorStop(0.5, "#fb923c");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2, p.size * h), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function hitSlot(
  m: Match,
  mx: number,
  my: number,
): { blockId: number; index: number } | null {
  let best: { blockId: number; index: number; d: number } | null = null;
  for (const s of m.slots) {
    // AI home plots are not clickable for the player
    if (s.blockId === GAST_BLOCK && s.owner === m.aiTeam && s.building) continue;
    const r = boothRect(s.blockId, s.index);
    const x0 = r.x * m.width;
    const y0 = r.y * m.height;
    const x1 = (r.x + r.w) * m.width;
    const y1 = (r.y + r.h) * m.height;
    if (mx >= x0 && mx <= x1 && my >= y0 && my <= y1) {
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      const d = Math.hypot(mx - cx, my - cy);
      if (!best || d < best.d) best = { blockId: s.blockId, index: s.index, d };
    }
  }
  return best ? { blockId: best.blockId, index: best.index } : null;
}

export function hitSeat(
  m: Match,
  mx: number,
  my: number,
): { blockId: number; seatIndex: number } | null {
  let best: { blockId: number; seatIndex: number; d: number } | null = null;
  for (let seatIndex = 0; seatIndex < SEATS_PER_BLOCK; seatIndex++) {
    const p = seatPos(HEIM_BLOCK, seatIndex);
    const x = p.x * m.width;
    const y = p.y * m.height;
    const d = Math.hypot(mx - x, my - y);
    if (d < 18 && (!best || d < best.d)) {
      best = { blockId: HEIM_BLOCK, seatIndex, d };
    }
  }
  return best ? { blockId: best.blockId, seatIndex: best.seatIndex } : null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (!(w > 0) || !(h > 0)) {
    ctx.beginPath();
    if (w !== 0 && h !== 0) ctx.rect(x, y, Math.max(0, w), Math.max(0, h));
    return;
  }
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
