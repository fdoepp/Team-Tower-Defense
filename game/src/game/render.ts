import { Match } from "./Match";
import {
  BLOCK_META,
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

  // A2c atmosphere: cool stadium night → pitch glow
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#1a2e24");
  bg.addColorStop(0.35, "#14241c");
  bg.addColorStop(1, "#0c1612");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawPitch(ctx, m, w, h);
  drawBlocks(ctx, m, w, h);
  drawSeats(ctx, m, w, h);
  drawGang(ctx, m, w, h);
  drawSlots(ctx, m, w, h);
  drawReservedPads(ctx, m, w, h);
  drawFans(ctx, m, w, h);
  drawCombatOverlays(ctx, m, w, h);
  drawFloats(ctx, m, w, h);
}

function blockFill(m: Match, id: number): string {
  const owner = m.blockOwner[id];
  if (owner === "ksc") return "#2563eb";
  if (owner === "vfb") return "#dc2626";
  return BLOCK_META.find((b) => b.id === id)!.fill;
}

function drawPitch(
  ctx: CanvasRenderingContext2D,
  _m: Match,
  w: number,
  h: number,
): void {
  const ph = h * L.pitchH;
  // grass
  const g = ctx.createLinearGradient(0, 0, 0, ph);
  g.addColorStop(0, "#3aa85a");
  g.addColorStop(1, "#2d8a48");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, ph);
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) ctx.fillRect((w / 12) * i, 0, w / 12, ph);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(w * 0.3, ph * 0.12, w * 0.4, ph * 0.72);
  ctx.beginPath();
  ctx.arc(w / 2, ph, ph * 0.32, Math.PI, 0);
  ctx.stroke();
  // Match score / momentum live only in the HTML pitch-hud over this band
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
    ctx.fillStyle = "#0a1410";
    ctx.fillRect(rightEdge, top, gapPx, bh);
  }
  for (const b of BLOCK_META) {
    const cx = blockCenterX(b.id) * w;
    const y = top + Math.abs(b.id - 1.5) * h * 0.006;
    const bodyH = bh;
    const left = cx - bw / 2;
    // terrace body — square bottom so booths sit flush (no corner gaps)
    ctx.fillStyle = blockFill(m, b.id);
    roundRectTop(ctx, left, y, bw, bodyH, 12);
    ctx.fill();
    // seat rows (A2c benches)
    ctx.save();
    roundRectTop(ctx, left, y, bw, bodyH, 12);
    ctx.clip();
    for (let row = 0; row < 5; row++) {
      ctx.fillStyle = row % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
      ctx.fillRect(left + 4, y + 22 + row * (bodyH / 6), bw - 8, bodyH / 7);
    }
    ctx.restore();
    // header badge — show club crest when block stormed/owned
    ctx.fillStyle = "rgba(10,20,16,0.5)";
    roundRect(ctx, cx - bw * 0.32, y + 4, bw * 0.64, 18, 6);
    ctx.fill();
    const owner = m.blockOwner[b.id];
    if (owner === "ksc" || owner === "vfb") {
      drawClubCrest(ctx, cx - bw * 0.18, y + 13, 11, owner);
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${Math.floor(h * 0.018)}px Archivo Black, DM Sans`;
      ctx.textAlign = "left";
      ctx.fillText(owner === "ksc" ? "KSC" : "VfB", cx - bw * 0.08, y + 17);
    } else if (b.side === "neutral") {
      ctx.fillStyle = "#e5e7eb";
      ctx.font = `700 ${Math.floor(h * 0.016)}px Archivo Black, DM Sans`;
      ctx.textAlign = "center";
      ctx.fillText("NEUTRAL · einnehmbar", cx, y + 17);
    } else {
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${Math.floor(h * 0.02)}px Archivo Black, DM Sans`;
      ctx.textAlign = "center";
      ctx.fillText(b.label, cx, y + 17);
    }
    // arched tunnel into gang (mockup style)
    const d = doorPos(b.id);
    const doorW = bw * L.doorFrac;
    const corridorTop = d.y * h;
    const corridorH = h * gangY() - corridorTop + 2;
    const dx = d.x * w - doorW / 2;
    ctx.fillStyle = "#070a0c";
    // arch mouth at block bottom
    ctx.beginPath();
    ctx.moveTo(dx, corridorTop + 8);
    ctx.lineTo(dx, corridorTop);
    ctx.quadraticCurveTo(d.x * w, corridorTop - doorW * 0.35, dx + doorW, corridorTop);
    ctx.lineTo(dx + doorW, corridorTop + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(dx, corridorTop, doorW, corridorH);
    ctx.strokeStyle = "rgba(243,240,231,0.2)";
    ctx.lineWidth = 2;
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
      const emptyHeim = !occ && b.id === HEIM_BLOCK;
      // seat cushion
      ctx.fillStyle = emptyHeim
        ? "rgba(20,50,32,0.85)"
        : occ
          ? "rgba(0,0,0,0.2)"
          : "rgba(0,0,0,0.35)";
      roundRect(ctx, x - 12, y - 6, 24, 14, 3);
      ctx.fill();
      ctx.strokeStyle = sel
        ? "#6bcb77"
        : emptyHeim
          ? "rgba(107,203,119,0.7)"
          : "rgba(255,255,255,0.18)";
      ctx.lineWidth = sel || emptyHeim ? 2 : 1;
      ctx.stroke();
      if (emptyHeim) {
        ctx.fillStyle = "#6bcb77";
        ctx.font = "700 12px DM Sans";
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
  const g = ctx.createLinearGradient(0, y, 0, y + gh);
  g.addColorStop(0, "#2a3038");
  g.addColorStop(0.5, "#1e242c");
  g.addColorStop(1, "#171c22");
  ctx.fillStyle = g;
  ctx.fillRect(w * L.blocksLeft, y, w * (L.blocksRight - L.blocksLeft), gh);
  ctx.strokeStyle = "rgba(243,240,231,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(w * L.blocksLeft, y, w * (L.blocksRight - L.blocksLeft), gh);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 10; i++) {
    const tx = w * L.blocksLeft + (w * (L.blocksRight - L.blocksLeft) / 10) * i;
    ctx.beginPath();
    ctx.moveTo(tx, y + 4);
    ctx.lineTo(tx, y + gh - 4);
    ctx.stroke();
  }
  // Battle line markers (vorderste Ultras)
  const left = w * L.blocksLeft;
  const span = w * (L.blocksRight - L.blocksLeft);
  const px = left + span * m.linePlayer;
  const ax = left + span * m.lineAi;
  ctx.fillStyle = "rgba(59,130,246,0.85)";
  ctx.fillRect(px - 2, y + 2, 4, gh - 4);
  ctx.fillStyle = "rgba(239,68,68,0.85)";
  ctx.fillRect(ax - 2, y + 2, 4, gh - 4);
  ctx.fillStyle = "rgba(243,240,231,0.45)";
  ctx.font = `600 ${Math.floor(h * 0.018)}px DM Sans`;
  ctx.textAlign = "center";
  ctx.fillText("GANG · Kampflinie", w / 2, y + 12);
}

function drawCombatOverlays(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const f of m.fans) {
    if (f.hp <= 0 || !f.invading) continue;
    const x = f.x * w;
    const y = f.y * h;
    const pulse = 0.5 + 0.5 * Math.sin(m.realElapsed * 8);
    ctx.strokeStyle = f.team === "ksc" ? `rgba(59,130,246,${0.4 + pulse * 0.5})` : `rgba(239,68,68,${0.4 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 16 + pulse * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fbbf24";
    ctx.font = `700 ${Math.floor(h * 0.02)}px Archivo Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("KAMPF", x, y - 22);
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
  const grey = !!(s.greyNeutral && s.owner === "neutral");
  const player = s.owner === m.playerTeam;
  const ai = s.owner === m.aiTeam;
  const r = Math.min(8, Math.min(bw, bh) * 0.12);

  if (!s.building) {
    ctx.fillStyle = "rgba(12, 18, 22, 0.75)";
    roundRect(ctx, x, y, bw, bh, r);
    ctx.fill();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = sel ? "#6bcb77" : "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    roundRect(ctx, x + 2, y + 2, bw - 4, bh - 4, r);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(243,240,231,0.7)";
    ctx.font = `700 ${Math.max(9, Math.floor(bh * 0.22))}px Archivo Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BUDE", x + bw / 2, y + bh / 2);
    ctx.textBaseline = "alphabetic";
    return;
  }

  // mockup-like panel colors
  let wall = "#3f4650";
  if (!grey) {
    if (s.building === "bier") wall = player ? "#2f6b45" : ai ? "#7f1d1d" : "#4b5563";
    else if (s.building === "ordner")
      wall = player ? "#1e3a5f" : ai ? "#3f1d1d" : "#374151";
    else wall = player ? "#4c1d6a" : ai ? "#5b1a3a" : "#44403c";
  } else {
    wall = "#4b5563";
  }

  ctx.fillStyle = wall;
  roundRect(ctx, x, y, bw, bh, r);
  ctx.fill();
  // soft inner face
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(ctx, x + 3, y + 3, bw - 6, bh - 6, Math.max(2, r - 2));
  ctx.fill();

  const cx = x + bw / 2;
  const cy = y + bh * 0.48;
  const iconS = Math.min(bw, bh) * 0.42;

  if (s.building === "bier") drawBeerMug(ctx, cx, cy - bh * 0.1, iconS * 0.75, grey);
  else if (s.building === "ordner") drawOrdnerBadge(ctx, cx, cy - bh * 0.1, iconS * 0.75, grey);
  else drawShopJersey(ctx, cx, cy - bh * 0.1, iconS * 0.75, grey, player);

  // Clear type label
  const label =
    s.building === "bier" ? "BIER" : s.building === "ordner" ? "ORDNER" : "SHOP";
  ctx.fillStyle = grey ? "rgba(255,255,255,0.55)" : "#f3f0e7";
  ctx.font = `700 ${Math.max(8, Math.floor(bh * 0.16))}px Archivo Black, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(label, cx, y + bh - 6);

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

  // conversion progress
  if (s.convertAcc > 0.4) {
    const pct = Math.min(1, s.convertAcc / 10);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x + 4, y + bh * 0.55, bw - 8, 5);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(x + 4, y + bh * 0.55, (bw - 8) * pct, 5);
  }

  // level pips only — no text labels
  const lv = s.level || 1;
  if (!grey) {
    const pipW = Math.min(7, (bw - 12) / 5 - 1);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < lv ? "#fde68a" : "rgba(0,0,0,0.4)";
      ctx.fillRect(x + 5 + i * (pipW + 2), y + 4, pipW, 4);
    }
  }

  ctx.strokeStyle = sel
    ? "#6bcb77"
    : player
      ? "rgba(147,197,253,0.55)"
      : ai
        ? "rgba(252,165,165,0.55)"
        : "rgba(255,255,255,0.18)";
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
  ctx.strokeStyle = "#f3f0e7";
  ctx.lineWidth = Math.max(1.2, s * 0.08);
  ctx.stroke();
  // monogram
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.max(8, Math.floor(s * 0.55))}px Archivo Black, sans-serif`;
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
    drawMannchen(ctx, f, f.x * w, f.y * h, h);
  }
}

function teamJersey(f: FanUnit): string {
  if (f.team === "neutral") return "#9ca3af";
  if (f.team === "ksc") return "#1f6feb";
  return "#dc2626";
}

function drawMannchen(
  ctx: CanvasRenderingContext2D,
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
  // size by kind — ultras bulkier, familie smaller
  const scale =
    f.kind === "ultras" ? base * 1.15 : f.kind === "familie" ? base * 0.88 : base;
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

  if (f.kind === "ultras") {
    drawUltra(ctx, f, s, jersey, skin, onGang);
  } else if (f.kind === "familie") {
    drawFamilie(ctx, f, s, jersey, skin);
  } else {
    drawNormalo(ctx, f, s, jersey, skin);
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
  if (swing > 0.3) {
    ctx.fillStyle = "rgba(251,146,60,0.9)";
    ctx.beginPath();
    ctx.arc(ix, iy, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNormalo(
  ctx: CanvasRenderingContext2D,
  _f: FanUnit,
  s: number,
  jersey: string,
  skin: string,
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

  // waving scarf in hand
  ctx.strokeStyle = jersey;
  ctx.lineWidth = Math.max(2, s * 0.18);
  ctx.beginPath();
  ctx.moveTo(s * 0.45, -s * 0.05);
  ctx.quadraticCurveTo(s * 1.05, -s * 0.55, s * 0.85, s * 0.35);
  ctx.stroke();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1.2, s * 0.1);
  ctx.beginPath();
  ctx.moveTo(s * 0.5, 0);
  ctx.quadraticCurveTo(s * 0.95, -s * 0.4, s * 0.8, s * 0.25);
  ctx.stroke();

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

function drawFamilie(
  ctx: CanvasRenderingContext2D,
  _f: FanUnit,
  s: number,
  jersey: string,
  skin: string,
): void {
  // light beige pants
  ctx.strokeStyle = "#d6d3d1";
  ctx.lineWidth = Math.max(2, s * 0.2);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.22, s * 0.3);
  ctx.lineTo(-s * 0.28, s * 0.95);
  ctx.moveTo(s * 0.22, s * 0.3);
  ctx.lineTo(s * 0.3, s * 0.95);
  ctx.stroke();

  // body
  ctx.fillStyle = jersey;
  roundRect(ctx, -s * 0.45, -s * 0.25, s * 0.9, s * 0.7, 3);
  ctx.fill();

  // yellow backpack (behind / side — drawn large and clear)
  ctx.fillStyle = "#eab308";
  roundRect(ctx, s * 0.28, -s * 0.2, s * 0.42, s * 0.55, 3);
  ctx.fill();
  ctx.fillStyle = "#a16207";
  ctx.fillRect(s * 0.32, s * 0.05, s * 0.34, s * 0.08);

  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -s * 0.58, s * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // soft hair / no beanie
  ctx.fillStyle = "#78716c";
  ctx.beginPath();
  ctx.arc(0, -s * 0.7, s * 0.34, Math.PI, 0);
  ctx.fill();

  // program / flag stick
  ctx.strokeStyle = "#a8a29e";
  ctx.lineWidth = Math.max(1.5, s * 0.12);
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, s * 0.1);
  ctx.lineTo(-s * 0.55, -s * 0.55);
  ctx.stroke();
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(-s * 0.72, -s * 0.7, s * 0.35, s * 0.28);

  // arms — always two
  ctx.strokeStyle = skin;
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
  const skin = "#e8c4a0";
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, s * 1.15, s * 0.7, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // dark pants
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = Math.max(2.2, s * 0.24);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, s * 0.35);
  ctx.lineTo(-s * 0.32, s * 1.05);
  ctx.moveTo(s * 0.25, s * 0.35);
  ctx.lineTo(s * 0.35, s * 1.05);
  ctx.stroke();

  // hi-vis vest
  ctx.fillStyle = "#facc15";
  roundRect(ctx, -s * 0.55, -s * 0.3, s * 1.1, s * 0.85, 3);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-s * 0.55, -s * 0.05, s * 1.1, s * 0.12);
  ctx.fillRect(-s * 0.08, -s * 0.3, s * 0.16, s * 0.85);

  // head + cap
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -s * 0.65, s * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.78, s * 0.4, s * 0.18, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-s * 0.4, -s * 0.8, s * 0.8, s * 0.14);

  // badge
  ctx.fillStyle = "#fff";
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
  ctx.fillStyle = "#facc15";
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
    ctx.font = `700 ${Math.floor(h * 0.026)}px DM Sans`;
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
