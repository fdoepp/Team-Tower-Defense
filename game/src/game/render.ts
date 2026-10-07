import { Match } from "./Match";
import {
  BLOCK_META,
  STAND_CONVERT_SEC,
  type BuildSlot,
  type FanUnit,
} from "./types";
import {
  BLOCK_COUNT,
  GAST_BLOCK,
  HEIM_BLOCK,
  L,
  SEATS_PER_BLOCK,
  blockCenterX,
  blockWidthNorm,
  boothRect,
  doorPos,
  gangY,
  seatPos,
} from "./layout";

export { SEATS_PER_BLOCK } from "./layout";
export { L, blockCenterX, blockWidthNorm, gangXToWorld, blockIdToGangX, gangY } from "./layout";

export function drawMatch(ctx: CanvasRenderingContext2D, m: Match): void {
  const w = m.width;
  const h = m.height;
  // Skip when shell is display:none / zero-sized — arcTo crashes on tiny/negative rects
  if (w < 32 || h < 32) return;
  ctx.clearRect(0, 0, w, h);

  // Clean stadium shell — soft cool daylight, Apple Sports clarity
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#dce6ee");
  bg.addColorStop(0.28, "#cfd9e3");
  bg.addColorStop(0.55, "#b8c5d1");
  bg.addColorStop(1, "#9aabba");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawPitch(ctx, m, w, h);
  drawBlocks(ctx, m, w, h);
  drawSeats(ctx, m, w, h);
  drawGang(ctx, m, w, h);
  drawSlots(ctx, m, w, h);
  drawReservedPads(ctx, m, w, h);
  drawFans(ctx, m, w, h);
  drawPyroShots(ctx, m, w, h);
  drawConfetti(ctx, m, w, h);
  drawMoodParticles(ctx, m, w, h);
  drawFloats(ctx, m, w, h);
}

function blockFill(m: Match, id: number): string {
  const owner = m.blockOwner[id];
  if (owner === "ksc") return "#3b82f6";
  if (owner === "vfb") return "#ef4444";
  return BLOCK_META.find((b) => b.id === id)!.fill;
}

function drawPitch(
  ctx: CanvasRenderingContext2D,
  _m: Match,
  w: number,
  h: number,
): void {
  const ph = h * L.pitchH;
  // crisp daylight grass
  const g = ctx.createLinearGradient(0, 0, 0, ph);
  g.addColorStop(0, "#4ade80");
  g.addColorStop(0.45, "#22c55e");
  g.addColorStop(1, "#16a34a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, ph);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) ctx.fillRect((w / 12) * i, 0, w / 12, ph);
  }
  // soft pitch frame
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.3, ph * 0.12, w * 0.4, ph * 0.72);
  ctx.beginPath();
  ctx.arc(w / 2, ph, ph * 0.32, Math.PI, 0);
  ctx.stroke();
  // subtle bottom vignette into stands
  const vig = ctx.createLinearGradient(0, ph * 0.7, 0, ph);
  vig.addColorStop(0, "rgba(15,23,42,0)");
  vig.addColorStop(1, "rgba(15,23,42,0.12)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, ph * 0.7, w, ph * 0.3);
}

function drawBlocks(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const top = h * L.blockTop;
  const bh = h * L.blockBodyH;
  const bw = blockWidthNorm() * w;
  const gapPx = L.blockGap * w;
  for (let i = 0; i < BLOCK_COUNT - 1; i++) {
    const rightEdge = (blockCenterX(i) + blockWidthNorm() / 2) * w;
    ctx.fillStyle = "rgba(148,163,184,0.35)";
    ctx.fillRect(rightEdge, top, gapPx, bh);
  }
  for (const b of BLOCK_META) {
    const cx = blockCenterX(b.id) * w;
    const y = top;
    const bodyH = bh;
    const left = cx - bw / 2;
    ctx.fillStyle = "rgba(15,23,42,0.12)";
    roundRectTop(ctx, left + 2, y + 3, bw, bodyH, 14);
    ctx.fill();
    ctx.fillStyle = blockFill(m, b.id);
    roundRectTop(ctx, left, y, bw, bodyH, 14);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    roundRectTop(ctx, left + 3, y + 3, bw - 6, bodyH * 0.22, 10);
    ctx.fill();
    ctx.save();
    roundRectTop(ctx, left, y, bw, bodyH, 14);
    ctx.clip();
    for (let row = 0; row < 5; row++) {
      ctx.fillStyle =
        row % 2 === 0 ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
      ctx.fillRect(left + 4, y + 22 + row * (bodyH / 6), bw - 8, bodyH / 7);
    }
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    roundRect(ctx, cx - bw * 0.34, y + 5, bw * 0.68, 18, 9);
    ctx.fill();
    const owner = m.blockOwner[b.id];
    if (owner === "ksc" || owner === "vfb") {
      drawClubCrest(ctx, cx - bw * 0.2, y + 14, 11, owner);
      ctx.fillStyle = "#0f172a";
      ctx.font = `800 ${Math.floor(h * 0.016)}px Outfit, Manrope, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(owner === "ksc" ? "KSC" : "VfB", cx - bw * 0.1, y + 18);
    } else if (b.side === "neutral") {
      ctx.fillStyle = "#64748b";
      ctx.font = `700 ${Math.floor(h * 0.014)}px Manrope, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("NEUTRAL", cx, y + 18);
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.font = `800 ${Math.floor(h * 0.016)}px Outfit, Manrope, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(b.label, cx, y + 18);
    }
    const d = doorPos(b.id);
    const doorW = bw * L.doorFrac;
    const corridorTop = d.y * h;
    const corridorH = h * gangY() - corridorTop + 2;
    const dx = d.x * w - doorW / 2;
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(dx, corridorTop + 8);
    ctx.lineTo(dx, corridorTop);
    ctx.quadraticCurveTo(d.x * w, corridorTop - doorW * 0.35, dx + doorW, corridorTop);
    ctx.lineTo(dx + doorW, corridorTop + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(dx, corridorTop, doorW, Math.max(4, corridorH));
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dx + 3, corridorTop + 6);
    ctx.quadraticCurveTo(d.x * w, corridorTop - doorW * 0.28, dx + doorW - 3, corridorTop + 6);
    ctx.stroke();
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
      const sel =
        m.selectedSeat?.blockId === b.id && m.selectedSeat?.seatIndex === i;
      // "+" on free seats in blocks the player controls (Heim or captured)
      const buyable = !occ && m.canBuyInBlock(b.id);

      let cushion = buyable
        ? "rgba(220,252,231,0.95)"
        : occ
          ? "rgba(0,0,0,0.2)"
          : "rgba(0,0,0,0.28)";
      if (occ && (b.id === 1 || b.id === 2)) {
        if (occ.team === "ksc") cushion = "rgba(37,99,235,0.45)";
        else if (occ.team === "vfb") cushion = "rgba(220,38,38,0.45)";
        else {
          const lean = occ.lean || 0;
          const prog = occ.captureProg || 0;
          const t = Math.max(Math.abs(lean), Math.abs(prog));
          if (t > 0.15) {
            cushion =
              lean > 0 || prog > 0
                ? `rgba(37,99,235,${0.12 + t * 0.4})`
                : `rgba(220,38,38,${0.12 + t * 0.4})`;
          } else cushion = "rgba(120,120,128,0.35)";
        }
      } else if (occ?.team === "ksc") cushion = "rgba(37,99,235,0.35)";
      else if (occ?.team === "vfb") cushion = "rgba(220,38,38,0.35)";

      ctx.fillStyle = cushion;
      roundRect(ctx, x - 12, y - 6, 24, 14, 3);
      ctx.fill();
      ctx.strokeStyle = sel
        ? "#6bcb77"
        : buyable
          ? "rgba(107,203,119,0.75)"
          : "rgba(255,255,255,0.14)";
      ctx.lineWidth = sel || buyable ? 2 : 1;
      ctx.stroke();

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

      if (buyable) {
        ctx.fillStyle = "#6bcb77";
        ctx.font = "800 12px Outfit, Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("+", x, y + 5);
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
  const gh = h * L.gangH;
  const left = w * L.blocksLeft;
  const span = w * (L.blocksRight - L.blocksLeft);
  const px = left + span * m.linePlayer;
  const ax = left + span * m.lineAi;

  // Asphalt base
  ctx.fillStyle = "#334155";
  ctx.fillRect(left, y, span, gh);

  // Besitz / Bauzone: blau = Heim+Vorstoß, rot = Gast, Mitte umkämpft
  ctx.fillStyle = "rgba(37,99,235,0.42)";
  ctx.fillRect(left, y, Math.max(0, px - left), gh);
  ctx.fillStyle = "rgba(220,38,38,0.42)";
  ctx.fillRect(ax, y, left + span - ax, gh);
  if (px < ax) {
    const gMid = ctx.createLinearGradient(px, 0, ax, 0);
    gMid.addColorStop(0, "rgba(148,163,184,0.55)");
    gMid.addColorStop(0.5, "rgba(100,116,139,0.65)");
    gMid.addColorStop(1, "rgba(148,163,184,0.55)");
    ctx.fillStyle = gMid;
    ctx.fillRect(px, y, ax - px, gh);
  }

  // Block-Trennlinien im Gang
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let b = 1; b < BLOCK_COUNT; b++) {
    const tx = left + span * (b / (BLOCK_COUNT - 1));
    ctx.beginPath();
    ctx.moveTo(tx, y + 2);
    ctx.lineTo(tx, y + gh - 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(left, y, span, gh);

  // Dynamische Kampfgrenzen (Frontlinien)
  ctx.save();
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(59,130,246,0.95)";
  ctx.beginPath();
  ctx.moveTo(px, y + 2);
  ctx.lineTo(px, y + gh - 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(239,68,68,0.95)";
  ctx.beginPath();
  ctx.moveTo(ax, y + 2);
  ctx.lineTo(ax, y + gh - 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  // Center corridor label pill
  const label = "GANG";
  ctx.font = `800 ${Math.floor(h * 0.016)}px Outfit, Manrope, sans-serif`;
  const tw = ctx.measureText(label).width;
  const lx = w / 2 - tw / 2 - 10;
  const ly = y + 4;
  ctx.fillStyle = "rgba(15,23,42,0.72)";
  roundRect(ctx, lx, ly, tw + 20, 16, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(label, w / 2, y + 16);
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

/** Heim Ultra pad + Gast empty pad (index 0) so booth row stays flush */
function drawReservedPads(
  ctx: CanvasRenderingContext2D,
  _m: Match,
  w: number,
  h: number,
): void {
  // Gast top-left: empty dark pad (no build) so the row still reads as 3+gap
  const gast = boothRect(GAST_BLOCK, 0);
  ctx.fillStyle = "rgba(8, 12, 16, 0.55)";
  roundRect(ctx, gast.x * w, gast.y * h, gast.w * w, gast.h * h, 8);
  ctx.fill();

  // Heim Ultra pad backdrop under the HTML button
  const heim = boothRect(HEIM_BLOCK, 0);
  const hx = heim.x * w;
  const hy = heim.y * h;
  const hw = heim.w * w;
  const hh = heim.h * h;
  const g = ctx.createLinearGradient(hx, hy, hx + hw, hy + hh);
  g.addColorStop(0, "#1e3a8a");
  g.addColorStop(1, "#172554");
  ctx.fillStyle = g;
  roundRect(ctx, hx, hy, hw, hh, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(147, 197, 253, 0.45)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, hx + 1, hy + 1, hw - 2, hh - 2, 7);
  ctx.stroke();
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
  const r = Math.min(8, Math.min(bw, bh) * 0.12);

  if (!s.building) {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    roundRect(ctx, x, y, bw, bh, r);
    ctx.fill();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = sel ? "#16a34a" : "rgba(100,116,139,0.45)";
    ctx.lineWidth = 2;
    roundRect(ctx, x + 2, y + 2, bw - 4, bh - 4, Math.max(4, r - 1));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = sel ? "#16a34a" : "#64748b";
    ctx.font = `800 ${Math.max(16, Math.floor(bh * 0.36))}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", x + bw / 2, y + bh / 2 + 1);
    ctx.textBaseline = "alphabetic";
    return;
  }

  // Clean booth cards — light surfaces, team tint
  let wall = "#f1f5f9";
  if (!grey) {
    if (s.building === "bier") wall = player ? "#ecfdf5" : ai ? "#fef2f2" : "#f8fafc";
    else if (s.building === "ordner")
      wall = player ? "#eff6ff" : ai ? "#fef2f2" : "#f8fafc";
    else wall = player ? "#eff6ff" : ai ? "#fef2f2" : "#f8fafc";
  } else {
    wall = "#e2e8f0";
  }
  const convT = Math.min(1, s.convertAcc / STAND_CONVERT_SEC);
  if (s.convertBy && convT > 0.05) {
    const toward = s.convertBy === "ksc" ? "#1d4ed8" : "#b91c1c";
    wall = lerpHex(wall, toward, 0.25 + convT * 0.55);
  }

  ctx.fillStyle = wall;
  roundRect(ctx, x, y, bw, bh, r);
  ctx.fill();
  // soft inner face
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  roundRect(ctx, x + 3, y + 3, bw - 6, bh - 6, Math.max(2, r - 2));
  ctx.fill();

  const cx = x + bw / 2;
  const cy = y + bh * 0.52;
  const iconS = Math.min(bw, bh) * 0.48;
  const iconGrey = grey && !(s.convertBy && convT > 0.35);

  if (s.building === "bier") drawBeerMug(ctx, cx, cy, iconS * 0.8, iconGrey);
  else if (s.building === "ordner") drawOrdnerBadge(ctx, cx, cy, iconS * 0.8, iconGrey);
  else drawShopJersey(ctx, cx, cy, iconS * 0.8, iconGrey, player);

  // Club crest when stand is owned (not grey neutral)
  if (!grey && (player || ai)) {
    drawClubCrest(
      ctx,
      x + bw - Math.min(bw, bh) * 0.22,
      y + Math.min(bw, bh) * 0.22,
      Math.min(bw, bh) * 0.32,
      s.owner === "ksc" ? "ksc" : "vfb",
    );
  }

  // Visible production pulse (Ertrag)
  if (s.prodFlash > 0.05) {
    const flash = s.prodFlash;
    ctx.save();
    ctx.globalAlpha = 0.35 + flash * 0.55;
    ctx.strokeStyle = s.building === "bier" ? "#fbbf24" : s.building === "ordner" ? "#60a5fa" : "#c084fc";
    ctx.lineWidth = 3 + flash * 4;
    roundRect(ctx, x + 2, y + 2, bw - 4, bh - 4, r);
    ctx.stroke();
    ctx.restore();
  }

  // Übernahme-Ticker in Teamfarbe (countdown ring)
  if (s.convertBy && s.convertAcc > 0.15) {
    const pct = Math.min(1, s.convertAcc / STAND_CONVERT_SEC);
    const left = Math.max(0, STAND_CONVERT_SEC - s.convertAcc);
    const col = s.convertBy === "ksc" ? "#3b82f6" : "#ef4444";
    const rr = Math.min(bw, bh) * 0.22;
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, y + bh * 0.22, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, y + bh * 0.22, rr, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = `700 ${Math.max(9, Math.floor(rr * 0.7))}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.ceil(left)}`, cx, y + bh * 0.22 + 1);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  if (s.building === "ordner" && s.structMaxHp > 0) {
    const pct = Math.max(0, Math.min(1, s.structHp / s.structMaxHp));
    const barW = bw - 10;
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(x + 5, y + bh - 8, barW, 4);
    ctx.fillStyle = pct > 0.45 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(x + 5, y + bh - 8, barW * pct, 4);
  }

  // level pips only — no text labels
  const lv = s.level || 1;
  if (!grey || (s.convertBy && convT > 0.5)) {
    const pipW = Math.min(7, (bw - 12) / 5 - 1);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < lv ? "#fde68a" : "rgba(0,0,0,0.4)";
      ctx.fillRect(x + 5 + i * (pipW + 2), y + 4, pipW, 4);
    }
  }

  ctx.strokeStyle = sel
    ? "#16a34a"
    : player
      ? "rgba(37,99,235,0.45)"
      : ai
        ? "rgba(220,38,38,0.4)"
        : "rgba(100,116,139,0.35)";
  ctx.lineWidth = sel ? 2.5 : 1.5;
  roundRect(ctx, x + 0.5, y + 0.5, bw - 1, bh - 1, r);
  ctx.stroke();

  if (s.building === "bier" && !grey) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + 6, y + bh - 10, bw - 12, 4);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(x + 6, y + bh - 10, (bw - 12) * (s.beer / s.capacity), 4);
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

function drawBeerMug(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  grey: boolean,
): void {
  ctx.fillStyle = grey ? "#d6d3d1" : "#fbbf24";
  roundRect(ctx, x - s * 0.45, y - s * 0.35, s * 0.75, s * 0.9, 2);
  ctx.fill();
  ctx.fillStyle = grey ? "#f5f5f4" : "#fff7ed";
  ctx.fillRect(x - s * 0.4, y - s * 0.5, s * 0.65, s * 0.28);
  ctx.strokeStyle = grey ? "#a8a29e" : "#92400e";
  ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.beginPath();
  ctx.arc(x + s * 0.4, y + s * 0.1, s * 0.28, -0.8, 0.8);
  ctx.stroke();
}

function drawOrdnerBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  grey: boolean,
): void {
  ctx.fillStyle = grey ? "#a8a29e" : "#facc15";
  roundRect(ctx, x - s * 0.5, y - s * 0.15, s, s * 0.7, 2);
  ctx.fill();
  ctx.fillStyle = grey ? "#57534e" : "#0f172a";
  ctx.beginPath();
  ctx.arc(x, y - s * 0.4, s * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grey ? "#e7e5e4" : "#fff";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s * 0.28, y + s * 0.28);
  ctx.lineTo(x, y + s * 0.55);
  ctx.lineTo(x - s * 0.28, y + s * 0.28);
  ctx.closePath();
  ctx.fill();
}

function drawShopJersey(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  grey: boolean,
  player: boolean,
): void {
  const col = grey ? "#d6d3d1" : player ? "#1d4ed8" : "#b91c1c";
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.55, y - s * 0.2);
  ctx.lineTo(x - s * 0.75, y + s * 0.15);
  ctx.lineTo(x - s * 0.4, y + s * 0.15);
  ctx.lineTo(x - s * 0.4, y + s * 0.65);
  ctx.lineTo(x + s * 0.4, y + s * 0.65);
  ctx.lineTo(x + s * 0.4, y + s * 0.15);
  ctx.lineTo(x + s * 0.75, y + s * 0.15);
  ctx.lineTo(x + s * 0.55, y - s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - s * 0.12, y, s * 0.24, s * 0.35);
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

function drawMannchen(
  ctx: CanvasRenderingContext2D,
  m: Match,
  f: FanUnit,
  x: number,
  y: number,
  h: number,
): void {
  if (f.isSteward) {
    drawSteward(ctx, f, x, y, h);
    return;
  }
  const onGang = f.state === "gang" || f.invading;
  const base = Math.max(0.9, h * (onGang ? 0.03 : 0.02) / 10);
  // size by kind — ultras bulkier, hooligans bulk
  const scale =
    f.kind === "ultras" ? base * 1.15 : f.kind === "hooligans" ? base * 0.88 : base;
  const s = 10 * scale;
  const jersey = teamJersey(f);
  const skin = f.team === "neutral" ? "#c4c4c4" : "#e8c4a0";

  ctx.save();
  ctx.translate(x, y);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, s * 1.2, s * 0.75, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  if (Math.abs(f.captureProg) > 0.12 && f.team === "neutral") {
    ctx.strokeStyle =
      f.captureProg > 0
        ? `rgba(59,130,246,${0.35 + Math.abs(f.captureProg) * 0.55})`
        : `rgba(239,68,68,${0.35 + Math.abs(f.captureProg) * 0.55})`;
    ctx.lineWidth = Math.max(2, s * 0.1);
    ctx.beginPath();
    ctx.arc(
      0,
      -s * 0.15,
      s * 1.05,
      -Math.PI / 2,
      -Math.PI / 2 + Math.abs(f.captureProg) * Math.PI * 2,
    );
    ctx.stroke();
  }

  if (f.kind === "ultras") {
    drawUltra(ctx, f, s, jersey, skin, onGang, m.realElapsed);
  } else if (f.kind === "hooligans") {
    drawHooligan(ctx, f, s, jersey, skin);
  } else {
    drawNormalo(ctx, f, s, jersey, skin, m.realElapsed);
  }

  // HP bar during Gang / invade fights
  if ((onGang || f.invading) && f.hp < f.maxHp - 0.5) {
    const bw = s * 1.6;
    const pct = Math.max(0, Math.min(1, f.hp / f.maxHp));
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(-bw / 2, -s * 1.55, bw, 3.5);
    ctx.fillStyle = pct > 0.45 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(-bw / 2, -s * 1.55, bw * pct, 3.5);
  }

  if (f.cheerT > 0.05 && f.kind === "normalos" && !f.isSteward) {
    const wave = Math.sin(m.realElapsed * 10 + f.id) * 0.35;
    ctx.save();
    ctx.translate(-s * 0.55, -s * 0.2);
    ctx.rotate(-0.5 + wave);
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = Math.max(1.5, s * 0.1);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.55);
    ctx.lineTo(0, -s * 0.55);
    ctx.stroke();
    ctx.fillStyle = jersey;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(s * 0.7, -s * 0.35);
    ctx.lineTo(0, -s * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // HP bar only — no text tags on fans
  const bw = s * 2.2;
  const bx = x - bw / 2;
  const by = y + s * 1.35;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(bx, by, bw, 3);
  ctx.fillStyle = f.hp / f.maxHp > 0.35 ? "#6bcb77" : "#f87171";
  ctx.fillRect(bx, by, bw * Math.max(0, f.hp / f.maxHp), 3);
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
  f: FanUnit,
  x: number,
  y: number,
  h: number,
): void {
  const s = 10 * Math.max(1, h * 0.028 / 10);
  const neutral = f.team === "neutral";
  const skin = neutral ? "#c4c4c4" : "#e8c4a0";
  // Neutral buffer Ordners stay grey; team Ordners keep hi-vis
  const vest = neutral ? "#9ca3af" : "#facc15";
  const vestStripe = neutral ? "#57534e" : "#0f172a";
  const cap = neutral ? "#6b7280" : "#1e293b";
  const hpCol = neutral ? "#a8a29e" : "#facc15";

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, s * 1.15, s * 0.7, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

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
    ctx.font = `700 ${Math.floor(h * 0.026)}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.fillStyle = f.good ? "#6bcb77" : "#f87171";
    const x = f.x * w;
    const y = f.y * h;
    ctx.strokeText(f.text, x, y);
    ctx.fillText(f.text, x, y);
  }
  ctx.globalAlpha = 1;
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
  for (const s of m.slots) {
    if (s.blockId === GAST_BLOCK) continue;
    const r = boothRect(s.blockId, s.index);
    const x0 = r.x * m.width;
    const y0 = r.y * m.height;
    const x1 = (r.x + r.w) * m.width;
    const y1 = (r.y + r.h) * m.height;
    if (mx >= x0 && mx <= x1 && my >= y0 && my <= y1) {
      return { blockId: s.blockId, index: s.index };
    }
  }
  return null;
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

/** Rounded top corners only — flat bottom for flush booth seams */
function roundRectTop(
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
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
