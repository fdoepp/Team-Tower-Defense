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
  drawFans(ctx, m, w, h);
  drawMoodMeter(ctx, m, w, h);
  drawFloats(ctx, m, w, h);

  if (m.speed === 0 && !m.result) {
    const gy = gangY();
    ctx.fillStyle = "rgba(8,16,12,0.35)";
    ctx.fillRect(0, h * gy, w, h * L.gangH);
    ctx.fillStyle = "#f3f0e7";
    ctx.font = `700 ${Math.floor(h * 0.055)}px Archivo Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", w / 2, h * (gy + L.gangH / 2) + 6);
  }
}

function blockFill(m: Match, id: number): string {
  const owner = m.blockOwner[id];
  if (owner === "ksc") return "#2563eb";
  if (owner === "vfb") return "#dc2626";
  return BLOCK_META.find((b) => b.id === id)!.fill;
}

function drawPitch(
  ctx: CanvasRenderingContext2D,
  m: Match,
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

  // A2c scoreboard plate
  const bx = w * 0.38;
  const by = ph * 0.08;
  const bw = w * 0.24;
  const bh = ph * 0.78;
  ctx.fillStyle = "rgba(15,22,18,0.72)";
  roundRect(ctx, bx, by, bw, bh, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(243,240,231,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#f3f0e7";
  ctx.font = `700 ${Math.floor(ph * 0.36)}px Archivo Black, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(`${m.scoreKsc} : ${m.scoreVfb}`, w / 2, by + bh * 0.42);
  ctx.fillStyle = "#f5d76e";
  ctx.font = `700 ${Math.floor(ph * 0.24)}px Archivo Black, sans-serif`;
  ctx.fillText(`${Math.floor(m.minute)}′`, w / 2, by + bh * 0.78);

  // momentum
  const mx = w * 0.24;
  const mw = w * 0.52;
  const my = ph * 0.94;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, mx, my - 5, mw, 8, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(37,99,235,0.55)";
  ctx.fillRect(mx, my - 5, mw / 3, 8);
  ctx.fillStyle = "rgba(156,163,175,0.4)";
  ctx.fillRect(mx + mw / 3, my - 5, mw / 3, 8);
  ctx.fillStyle = "rgba(220,38,38,0.55)";
  ctx.fillRect(mx + (2 * mw) / 3, my - 5, mw / 3, 8);
  const knob = mx + mw * ((m.momentum + 1) / 2);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(knob, my - 10);
  ctx.lineTo(knob - 5, my - 2);
  ctx.lineTo(knob + 5, my - 2);
  ctx.closePath();
  ctx.fill();
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
    // header badge
    ctx.fillStyle = "rgba(10,20,16,0.45)";
    roundRect(ctx, cx - bw * 0.28, y + 4, bw * 0.56, 16, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.floor(h * 0.022)}px DM Sans`;
    ctx.textAlign = "center";
    ctx.fillText(b.label, cx, y + 16);
    // door corridor through upper booth strip into gang
    const d = doorPos(b.id);
    const doorW = bw * L.doorFrac;
    const corridorTop = d.y * h;
    const corridorH = h * gangY() - corridorTop + 2;
    ctx.fillStyle = "#0a0e0c";
    ctx.fillRect(d.x * w - doorW / 2, corridorTop - 2, doorW, corridorH);
    ctx.fillStyle = "rgba(243,240,231,0.22)";
    ctx.fillRect(d.x * w - doorW / 2 + 3, corridorTop, 3, corridorH - 4);
    ctx.fillRect(d.x * w + doorW / 2 - 6, corridorTop, 3, corridorH - 4);
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
  _m: Match,
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
  // flush under booths — full width of booth band
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
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.moveTo(w * L.blocksLeft + 8, y + gh / 2);
  ctx.lineTo(w * L.blocksRight - 8, y + gh / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(243,240,231,0.4)";
  ctx.font = `600 ${Math.floor(h * 0.022)}px DM Sans`;
  ctx.textAlign = "center";
  ctx.fillText("GANG", w / 2, y + 13);
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

  if (!s.building) {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = sel ? "#6bcb77" : "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x, y, bw, bh);
    ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `700 ${Math.max(11, Math.floor(bh * 0.28))}px Archivo Black, DM Sans`;
    ctx.textAlign = "center";
    ctx.fillText("BAU", x + bw / 2, y + bh * 0.58);
    return;
  }

  let wall = "#78716c";
  if (!grey) {
    if (s.building === "bier") wall = player ? "#ca8a04" : ai ? "#9a3412" : "#a8a29e";
    else if (s.building === "ordner")
      wall = player ? "#2563eb" : ai ? "#1e3a8a" : "#64748b";
    else wall = player ? "#9333ea" : ai ? "#6b21a8" : "#7c3aed";
  }

  // flush booth body
  ctx.fillStyle = wall;
  ctx.fillRect(x, y, bw, bh);
  // roof strip at top edge (toward block)
  ctx.fillStyle = grey ? "#44403c" : "rgba(10,14,12,0.5)";
  ctx.fillRect(x, y, bw, Math.max(4, bh * 0.14));
  // counter
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x + 2, y + bh * 0.42, bw - 4, 3);

  const cx = x + bw / 2;
  const cy = y + bh * 0.55;
  const iconS = Math.min(bw * 0.55, bh * 0.48);

  if (s.building === "bier") drawBeerMug(ctx, cx, cy - 2, iconS, grey);
  else if (s.building === "ordner") drawOrdnerBadge(ctx, cx, cy - 2, iconS, grey);
  else drawShopJersey(ctx, cx, cy - 2, iconS, grey, player);

  // clear label
  const label =
    s.building === "bier" ? "BIER" : s.building === "ordner" ? "ORDNER" : "SHOP";
  ctx.fillStyle = grey ? "#e7e5e4" : "#fff";
  ctx.font = `700 ${Math.max(9, Math.floor(bh * 0.22))}px Archivo Black, DM Sans`;
  ctx.textAlign = "center";
  ctx.fillText(label, cx, y + bh - 5);

  ctx.strokeStyle = sel
    ? "#6bcb77"
    : player
      ? "#93c5fd"
      : ai
        ? "#fca5a5"
        : "rgba(255,255,255,0.2)";
  ctx.lineWidth = sel ? 2.5 : 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);

  if (s.building === "bier" && !grey) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + 4, y + bh * 0.32, bw - 8, 4);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(x + 4, y + bh * 0.32, (bw - 8) * (s.beer / s.capacity), 4);
  }
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
  const onGang = f.state === "gang" || f.invading;
  const scale = Math.max(0.85, h * (onGang ? 0.028 : 0.018) / 10);
  const s = 10 * scale;
  const jersey = teamJersey(f);
  const skin = f.team === "neutral" ? "#c4c4c4" : "#e8c4a0";
  const pants = f.kind === "ultras" ? "#111827" : "#1f2937";

  ctx.save();
  ctx.translate(x, y);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, s * 1.15, s * 0.7, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs
  ctx.strokeStyle = pants;
  ctx.lineWidth = Math.max(2, s * 0.22);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, s * 0.35);
  ctx.lineTo(-s * 0.35, s * 1.05);
  ctx.moveTo(s * 0.25, s * 0.35);
  ctx.lineTo(s * 0.4, s * 1.05);
  ctx.stroke();

  // body / jersey
  ctx.fillStyle = jersey;
  roundRect(ctx, -s * 0.55, -s * 0.35, s * 1.1, s * 0.85, 3);
  ctx.fill();
  // jersey stripes for teams
  if (f.team !== "neutral") {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(-s * 0.15, -s * 0.3, s * 0.3, s * 0.75);
  }

  // kind accents
  if (f.kind === "ultras") {
    // beanie
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(0, -s * 0.75, s * 0.42, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-s * 0.42, -s * 0.75, s * 0.84, s * 0.18);
    // scarf
    ctx.fillStyle = jersey;
    ctx.fillRect(-s * 0.5, -s * 0.05, s, s * 0.18);
    ctx.fillRect(s * 0.35, -s * 0.05, s * 0.18, s * 0.55);
  } else if (f.kind === "familie") {
    // backpack
    ctx.fillStyle = "#ca8a04";
    roundRect(ctx, s * 0.35, -s * 0.2, s * 0.35, s * 0.45, 2);
    ctx.fill();
  } else {
    // normalo scarf wave
    ctx.strokeStyle = jersey;
    ctx.lineWidth = Math.max(1.5, s * 0.15);
    ctx.beginPath();
    ctx.moveTo(s * 0.4, -s * 0.1);
    ctx.quadraticCurveTo(s * 0.9, -s * 0.4, s * 0.75, s * 0.2);
    ctx.stroke();
  }

  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -s * 0.7, s * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // swinging arm (combat)
  const face = f.team === "vfb" ? -1 : 1;
  const swing = f.armSwing > 0 ? f.armSwing : f.kind === "ultras" && onGang ? 0.15 : 0;
  const ang = (-0.7 + swing * 1.6) * face;
  ctx.strokeStyle = skin;
  ctx.lineWidth = Math.max(2, s * 0.2);
  ctx.beginPath();
  ctx.moveTo(face * s * 0.45, -s * 0.05);
  ctx.lineTo(face * s * 0.45 + Math.cos(ang) * s * 1.1, -s * 0.05 + Math.sin(ang) * s * 1.1);
  ctx.stroke();
  if (swing > 0.35) {
    const ix = face * s * 0.45 + Math.cos(ang) * s * 1.1;
    const iy = -s * 0.05 + Math.sin(ang) * s * 1.1;
    ctx.fillStyle = "rgba(245,215,110,0.85)";
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r = i % 2 === 0 ? s * 0.45 : s * 0.2;
      const px = ix + Math.cos(a) * r;
      const py = iy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // other arm down
  ctx.strokeStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-face * s * 0.4, 0);
  ctx.lineTo(-face * s * 0.55, s * 0.45);
  ctx.stroke();

  ctx.restore();

  // HP bar
  const bw = s * 2.2;
  const bx = x - bw / 2;
  const by = y + s * 1.25;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(bx, by, bw, 3);
  ctx.fillStyle = f.hp / f.maxHp > 0.35 ? "#6bcb77" : "#f87171";
  ctx.fillRect(bx, by, bw * Math.max(0, f.hp / f.maxHp), 3);
}

function drawMoodMeter(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const x = w * 0.01;
  const y = h * 0.18;
  const segH = h * 0.05;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const filled = Math.min(4, Math.floor(m.moodHeim) + 1);
  ctx.fillStyle = "rgba(243,240,231,0.45)";
  ctx.font = `600 ${Math.floor(h * 0.014)}px DM Sans`;
  ctx.textAlign = "left";
  ctx.fillText("STIMMUNG", x, y - 6);
  for (let i = 0; i < 4; i++) {
    const sy = y + (3 - i) * (segH + 3);
    ctx.fillStyle = i < filled ? colors[i] : "rgba(255,255,255,0.1)";
    roundRect(ctx, x, sy, w * 0.026, segH, 4);
    ctx.fill();
  }
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
  const rr = Math.min(r, w / 2, h / 2);
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
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
