import { Match } from "./Match";
import { BLOCK_META, FAN_STATS, type BuildSlot, type FanUnit } from "./types";

/** Layout in normalized canvas space */
export const L = {
  pitchH: 0.13,
  blockTop: 0.15,
  blockH: 0.38,
  gangY: 0.58,
  gangH: 0.16,
};

export function blockCenterX(blockId: number): number {
  return 0.12 + blockId * 0.19;
}

export function drawMatch(ctx: CanvasRenderingContext2D, m: Match): void {
  const w = m.width;
  const h = m.height;
  ctx.clearRect(0, 0, w, h);

  // background
  ctx.fillStyle = "#102418";
  ctx.fillRect(0, 0, w, h);

  drawPitch(ctx, m, w, h);
  drawBlocks(ctx, m, w, h);
  drawGang(ctx, m, w, h);
  drawSlots(ctx, m, w, h);
  drawFans(ctx, m, w, h);
  drawMoodMeter(ctx, m, w, h);

  if (m.speed === 0 && !m.result) {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, h * L.gangY, w, h * L.gangH);
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.floor(h * 0.06)}px Archivo Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", w / 2, h * (L.gangY + L.gangH / 2) + 8);
  }
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
  // stripes
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

  // HUD on pitch
  ctx.fillStyle = "#0a1410";
  ctx.font = `700 ${Math.floor(ph * 0.38)}px Archivo Black, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(`${m.scoreKsc} : ${m.scoreVfb}`, w / 2, ph * 0.48);
  ctx.fillStyle = "#f5d76e";
  ctx.font = `700 ${Math.floor(ph * 0.28)}px Archivo Black, sans-serif`;
  ctx.fillText(`${Math.floor(m.minute)}′`, w / 2, ph * 0.82);

  // momentum bar
  const mx = w * 0.22;
  const mw = w * 0.56;
  const my = ph * 0.92;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, mx, my - 5, mw, 8, 4);
  ctx.fill();
  // three zones
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
  _m: Match,
  w: number,
  h: number,
): void {
  const top = h * L.blockTop;
  const bh = h * L.blockH;
  for (const b of BLOCK_META) {
    const cx = blockCenterX(b.id) * w;
    const bw = w * 0.17;
    // arc bow: outer blocks slightly lower? facing pitch = flat top toward pitch
    const y = top + Math.abs(b.id - 2) * h * 0.012;
    // block body
    ctx.fillStyle = b.fill;
    roundRect(ctx, cx - bw / 2, y, bw, bh * 0.72, 10);
    ctx.fill();
    // stripes
    ctx.fillStyle = b.stripe;
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(cx - bw / 2 + 6 + i * (bw / 4), y + 6, bw / 10, bh * 0.72 - 12);
    }
    ctx.globalAlpha = 1;
    // label
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.floor(h * 0.028)}px DM Sans`;
    ctx.textAlign = "center";
    ctx.fillText(b.label, cx, y + 16);
    // door at bottom of block (toward gang)
    const doorY = y + bh * 0.72 - 4;
    ctx.fillStyle = "#0a1410";
    roundRect(ctx, cx - 14, doorY, 28, 16, 4);
    ctx.fill();
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
  // lane marks
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
    ctx.fillStyle = s.hasBier ? "#c9a227" : "rgba(0,0,0,0.25)";
    roundRect(ctx, p.x - 14, p.y - 10, 28, 20, 4);
    ctx.fill();
    ctx.stroke();
    if (s.hasBier) {
      ctx.fillStyle = "#0a1410";
      ctx.font = "700 8px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText("BIER", p.x, p.y + 2);
      // beer bar
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(p.x - 12, p.y + 6, 24, 3);
      ctx.fillStyle = "#f5d76e";
      ctx.fillRect(p.x - 12, p.y + 6, 24 * (s.beer / s.capacity), 3);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "700 12px DM Sans";
      ctx.textAlign = "center";
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
  return {
    x: cx + side * w * 0.045,
    y: above ? gangMid - h * 0.09 : gangMid + h * 0.09,
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
    const x = f.x * w;
    const y = f.y * h;
    drawMannchen(ctx, f, x, y, h);
  }
}

function drawMannchen(
  ctx: CanvasRenderingContext2D,
  f: FanUnit,
  x: number,
  y: number,
  h: number,
): void {
  const r = Math.max(5, h * 0.015);
  const col = FAN_STATS[f.kind].color;
  ctx.fillStyle = col;
  if (f.kind === "ultras") {
    // angular
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y + r);
    ctx.lineTo(x - r, y + r);
    ctx.closePath();
    ctx.fill();
  } else if (f.kind === "familie") {
    ctx.fillRect(x - r * 0.7, y - r, r * 1.4, r * 2);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // mini hp
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x - 8, y + r + 2, 16, 2);
  ctx.fillStyle = "#6bcb77";
  ctx.fillRect(x - 8, y + r + 2, 16 * (f.hp / f.maxHp), 2);
}

function drawMoodMeter(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const x = w * 0.015;
  const y = h * 0.2;
  const segH = h * 0.06;
  const filled = Math.floor(m.moodHeim) + 1; // 1..4 visual
  for (let i = 0; i < 4; i++) {
    const sy = y + (3 - i) * (segH + 4);
    ctx.fillStyle = i < filled ? "#1f6feb" : "rgba(255,255,255,0.12)";
    roundRect(ctx, x, sy, w * 0.028, segH, 4);
    ctx.fill();
  }
}

export function hitSlot(
  m: Match,
  mx: number,
  my: number,
): { blockId: number; index: number } | null {
  for (const s of m.slots) {
    if (s.blockId === 4) continue; // guest locked
    const p = slotPos(s, m.width, m.height);
    if (Math.abs(mx - p.x) < 18 && Math.abs(my - p.y) < 14) {
      return { blockId: s.blockId, index: s.index };
    }
  }
  return null;
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
