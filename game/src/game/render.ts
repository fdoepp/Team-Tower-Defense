import { Match } from "./Match";
import {
  BLOCK_META,
  BUILD_LABEL,
  FAN_STATS,
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
  doorPos,
  seatPos,
} from "./layout";

export { SEATS_PER_BLOCK } from "./layout";
export { L, blockCenterX, blockWidthNorm, gangXToWorld, blockIdToGangX } from "./layout";

export function drawMatch(ctx: CanvasRenderingContext2D, m: Match): void {
  const w = m.width;
  const h = m.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#102418";
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
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, h * L.gangY, w, h * L.gangH);
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.floor(h * 0.06)}px Archivo Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", w / 2, h * (L.gangY + L.gangH / 2) + 8);
  }
}

function blockFill(m: Match, id: number): string {
  const owner = m.blockOwner[id];
  if (owner === "ksc") return "#1f6feb";
  if (owner === "vfb") return "#dc2626";
  const meta = BLOCK_META.find((b) => b.id === id)!;
  return meta.fill;
}

function drawPitch(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const ph = h * L.pitchH;
  ctx.fillStyle = "#2f8a4a";
  ctx.fillRect(0, 0, w, ph);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) ctx.fillRect((w / 10) * i, 0, w / 10, ph);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.28, ph * 0.15, w * 0.44, ph * 0.7);
  ctx.beginPath();
  ctx.arc(w / 2, ph, ph * 0.35, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = "#0a1410";
  ctx.font = `700 ${Math.floor(ph * 0.38)}px Archivo Black, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(`${m.scoreKsc} : ${m.scoreVfb}`, w / 2, ph * 0.48);
  ctx.fillStyle = "#f5d76e";
  ctx.font = `700 ${Math.floor(ph * 0.28)}px Archivo Black, sans-serif`;
  ctx.fillText(`${Math.floor(m.minute)}′`, w / 2, ph * 0.82);

  const mx = w * 0.22;
  const mw = w * 0.56;
  const my = ph * 0.92;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, mx, my - 5, mw, 8, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(31,111,235,0.35)";
  ctx.fillRect(mx, my - 5, mw / 3, 8);
  ctx.fillStyle = "rgba(156,163,175,0.35)";
  ctx.fillRect(mx + mw / 3, my - 5, mw / 3, 8);
  ctx.fillStyle = "rgba(220,38,38,0.35)";
  ctx.fillRect(mx + (2 * mw) / 3, my - 5, mw / 3, 8);
  const knob = mx + mw * ((m.momentum + 1) / 2);
  ctx.fillStyle = "#f3f0e7";
  ctx.beginPath();
  ctx.arc(knob, my - 1, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawBlocks(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const top = h * L.blockTop;
  const bh = h * L.blockH;
  const bw = blockWidthNorm() * w;
  const gapPx = L.blockGap * w;
  for (let i = 0; i < BLOCK_COUNT - 1; i++) {
    const rightEdge = (blockCenterX(i) + blockWidthNorm() / 2) * w;
    ctx.fillStyle = "#0a1810";
    ctx.fillRect(rightEdge, top, gapPx, bh * 0.72);
  }
  for (const b of BLOCK_META) {
    const cx = blockCenterX(b.id) * w;
    const y = top + Math.abs(b.id - 1.5) * h * 0.008;
    ctx.fillStyle = blockFill(m, b.id);
    roundRect(ctx, cx - bw / 2, y, bw, bh * 0.7, 10);
    ctx.fill();
    ctx.strokeStyle = "#0a1410";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.save();
    roundRect(ctx, cx - bw / 2 + 2, y + 2, bw - 4, bh * 0.7 - 4, 8);
    ctx.clip();
    ctx.fillStyle = b.stripe;
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(cx - bw / 2 + 6 + i * (bw / 4), y + 5, bw / 14, bh * 0.7 - 10);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.floor(h * 0.026)}px DM Sans`;
    ctx.textAlign = "center";
    ctx.fillText(b.label, cx, y + 16);
    const d = doorPos(b.id);
    ctx.fillStyle = "#0a1410";
    roundRect(ctx, d.x * w - 14, d.y * h - 4, 28, 16, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(243,240,231,0.5)";
    ctx.font = `600 ${Math.floor(h * 0.016)}px DM Sans`;
    ctx.fillText("Tür", d.x * w, d.y * h + 8);
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
      ctx.strokeStyle = sel
        ? "#6bcb77"
        : emptyHeim
          ? "rgba(107,203,119,0.65)"
          : occ
            ? "rgba(255,255,255,0.12)"
            : "rgba(255,255,255,0.28)";
      ctx.lineWidth = sel || emptyHeim ? 2 : 1;
      ctx.fillStyle = emptyHeim
        ? "rgba(15,40,24,0.75)"
        : occ
          ? "rgba(0,0,0,0.12)"
          : "rgba(0,0,0,0.3)";
      roundRect(ctx, x - 11, y - 11, 22, 22, 3);
      ctx.fill();
      ctx.stroke();
      if (emptyHeim) {
        ctx.fillStyle = "#6bcb77";
        ctx.font = "700 13px DM Sans";
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
  const y = h * L.gangY;
  const gh = h * L.gangH;
  ctx.fillStyle = "#1a1f24";
  roundRect(ctx, w * 0.04, y, w * 0.92, gh, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(243,240,231,0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(w * 0.08, y + gh / 2);
  ctx.lineTo(w * 0.92, y + gh / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(243,240,231,0.55)";
  ctx.font = `600 ${Math.floor(h * 0.025)}px DM Sans`;
  ctx.textAlign = "center";
  ctx.fillText("GANG", w / 2, y + 14);
}

function drawSlots(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const s of m.slots) {
    const p = slotPos(s, w, h);
    const sel =
      m.selectedSlot?.blockId === s.blockId &&
      m.selectedSlot?.index === s.index;
    ctx.strokeStyle = sel ? "#6bcb77" : "rgba(255,255,255,0.3)";
    ctx.lineWidth = sel ? 2 : 1;
    if (s.greyNeutral && s.owner === "neutral") {
      ctx.fillStyle = "#6b7280";
    } else if (s.building) {
      // tint by owner so captures are obvious
      if (s.owner === m.playerTeam) {
        ctx.fillStyle =
          s.building === "bier"
            ? "#c9a227"
            : s.building === "ordner"
              ? "#3b82f6"
              : "#a855f7";
      } else if (s.owner === m.aiTeam) {
        ctx.fillStyle =
          s.building === "bier"
            ? "#b45309"
            : s.building === "ordner"
              ? "#1d4ed8"
              : "#7e22ce";
      } else {
        ctx.fillStyle = "#9ca3af";
      }
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
    }
    roundRect(ctx, p.x - 16, p.y - 11, 32, 22, 4);
    ctx.fill();
    // owner rim
    if (s.building && s.owner && s.owner !== "neutral") {
      ctx.strokeStyle = s.owner === m.playerTeam ? "#93c5fd" : "#fca5a5";
      ctx.lineWidth = sel ? 2.5 : 1.5;
      ctx.stroke();
    } else {
      ctx.stroke();
    }
    ctx.fillStyle = s.building || s.greyNeutral ? "#0a1410" : "rgba(255,255,255,0.5)";
    if (s.greyNeutral && s.owner === "neutral") ctx.fillStyle = "#e5e7eb";
    ctx.font = "700 8px DM Sans";
    ctx.textAlign = "center";
    if (s.greyNeutral && s.owner === "neutral" && s.building) {
      ctx.fillText(BUILD_LABEL[s.building].toUpperCase(), p.x, p.y + 2);
    } else if (s.greyNeutral && !s.building) {
      ctx.fillText("GRAU", p.x, p.y + 3);
    } else if (s.building) {
      ctx.fillText(BUILD_LABEL[s.building].toUpperCase(), p.x, p.y + 2);
      if (s.building === "bier") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(p.x - 12, p.y + 7, 24, 3);
        ctx.fillStyle = "#f5d76e";
        ctx.fillRect(p.x - 12, p.y + 7, 24 * (s.beer / s.capacity), 3);
      }
    } else {
      ctx.fillText("+", p.x, p.y + 4);
    }
  }
}

export function slotPos(
  s: BuildSlot,
  w: number,
  h: number,
): { x: number; y: number } {
  const cx = blockCenterX(s.blockId) * w;
  const above = s.index < 2;
  const side = s.index % 2 === 0 ? -1 : 1;
  const gangMid = h * (L.gangY + L.gangH / 2);
  const inset = blockWidthNorm() * w * 0.28;
  return {
    x: cx + side * inset,
    y: above ? gangMid - h * 0.08 : gangMid + h * 0.08,
  };
}

function drawFans(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const f of m.fans) {
    if (f.hp <= 0) continue;
    drawMannchen(ctx, f, f.x * w, f.y * h, h);
  }
}

function drawMannchen(
  ctx: CanvasRenderingContext2D,
  f: FanUnit,
  x: number,
  y: number,
  h: number,
): void {
  const onGang = f.state === "gang" || f.invading;
  const r = Math.max(5, h * (onGang ? 0.022 : 0.014));
  let col = FAN_STATS[f.kind].color;
  if (f.team === "neutral") col = "#9ca3af";
  else if (f.team === "ksc") col = f.kind === "ultras" ? "#1f6feb" : col;
  else if (f.team === "vfb") col = f.kind === "ultras" ? "#dc2626" : col;

  // swinging arm for ultras (and anyone mid-swing)
  if (f.armSwing > 0 || f.kind === "ultras") {
    const swing = f.armSwing > 0 ? f.armSwing : 0;
    const ang = (-0.9 + swing * 1.8) * (f.team === "vfb" ? -1 : 1);
    const armLen = r * 1.8;
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(2, r * 0.35);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + r * 0.2, y);
    ctx.lineTo(x + Math.cos(ang) * armLen, y + Math.sin(ang) * armLen);
    ctx.stroke();
    if (swing > 0.4) {
      // impact flash
      ctx.fillStyle = "rgba(245,215,110,0.7)";
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(ang) * armLen,
        y + Math.sin(ang) * armLen,
        4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  ctx.fillStyle = col;
  if (f.kind === "ultras") {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y + r);
    ctx.lineTo(x - r, y + r);
    ctx.closePath();
    ctx.fill();
  } else if (f.kind === "familie") {
    ctx.fillRect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const bw = r * 2.4;
  const bx = x - bw / 2;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(bx, y + r + 2, bw, 4);
  ctx.fillStyle = "#6bcb77";
  ctx.fillRect(bx, y + r + 2, bw * Math.max(0, f.hp / f.maxHp), 4);
}

function drawMoodMeter(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const x = w * 0.012;
  const y = h * 0.2;
  const segH = h * 0.055;
  const filled = Math.floor(m.moodHeim) + 1;
  for (let i = 0; i < 4; i++) {
    const sy = y + (3 - i) * (segH + 4);
    ctx.fillStyle = i < filled ? "#1f6feb" : "rgba(255,255,255,0.12)";
    roundRect(ctx, x, sy, w * 0.028, segH, 4);
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
    ctx.font = `700 ${Math.floor(h * 0.028)}px DM Sans`;
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
    const p = slotPos(s, m.width, m.height);
    if (Math.abs(mx - p.x) < 18 && Math.abs(my - p.y) < 14) {
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
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
