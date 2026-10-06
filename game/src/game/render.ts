import { Match } from "./Match";
import { BLOCK_META, FAN_STATS, type BuildSlot, type FanUnit } from "./types";
import {
  L,
  blockCenterX,
  blockWidthNorm,
} from "./layout";

export { L, blockCenterX, blockWidthNorm, gangXToWorld, blockIdToGangX } from "./layout";

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
  const bw = blockWidthNorm() * w;
  const gapPx = L.blockGap * w;
  // paint gap strips first so separation is unmistakable
  for (let i = 0; i < 4; i++) {
    const rightEdge = (blockCenterX(i) + blockWidthNorm() / 2) * w;
    ctx.fillStyle = "#0a1810";
    ctx.fillRect(rightEdge, top, gapPx, bh * 0.72);
  }
  for (const b of BLOCK_META) {
    const cx = blockCenterX(b.id) * w;
    const y = top + Math.abs(b.id - 2) * h * 0.008;
    ctx.globalAlpha = 1;
    ctx.fillStyle = b.fill;
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
    const doorY = y + bh * 0.7 - 2;
    ctx.fillStyle = "#0a1410";
    roundRect(ctx, cx - 12, doorY, 24, 14, 4);
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
    if (s.greyNeutral && !s.hasBier) {
      ctx.fillStyle = "#6b7280";
    } else if (s.hasBier) {
      ctx.fillStyle =
        s.owner === m.playerTeam
          ? "#c9a227"
          : s.owner === m.aiTeam
            ? "#b45309"
            : "#9ca3af";
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
    }
    roundRect(ctx, p.x - 14, p.y - 10, 28, 20, 4);
    ctx.fill();
    ctx.stroke();
    if (s.greyNeutral && !s.hasBier) {
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "700 7px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText("GRAU", p.x, p.y + 2);
    } else if (s.hasBier) {
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
  const inset = blockWidthNorm() * w * 0.28;
  return {
    x: cx + side * inset,
    y: above ? gangMid - h * 0.085 : gangMid + h * 0.085,
  };
}

function drawFans(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  // clash sparks between opposing gang Ultras
  const gang = m.fans.filter((f) => f.hp > 0 && f.state === "gang");
  for (let i = 0; i < gang.length; i++) {
    for (let j = i + 1; j < gang.length; j++) {
      const a = gang[i];
      const b = gang[j];
      if (a.team === b.team || a.team === "neutral" || b.team === "neutral")
        continue;
      if (Math.abs(a.gangX - b.gangX) > 0.09) continue;
      const x = ((a.x + b.x) / 2) * w;
      const y = ((a.y + b.y) / 2) * h;
      ctx.fillStyle = "#f5d76e";
      ctx.beginPath();
      ctx.arc(x, y, 10 + Math.sin(Date.now() / 80) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0a1410";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 8);
      ctx.lineTo(x + 8, y + 8);
      ctx.moveTo(x + 8, y - 8);
      ctx.lineTo(x - 8, y + 8);
      ctx.stroke();
    }
  }
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
  const onGang = f.state === "gang";
  const r = Math.max(5, h * (onGang ? 0.022 : 0.015));
  let col = FAN_STATS[f.kind].color;
  if (f.team === "neutral") col = "#9ca3af";
  else if (f.team === "ksc") col = f.kind === "ultras" ? "#1f6feb" : col;
  else if (f.team === "vfb") col = f.kind === "ultras" ? "#dc2626" : col;

  if (onGang) {
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.fill();
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

  // mini bars
  const bw = r * 2.2;
  const bx = x - bw / 2;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(bx, y + r + 2, bw, 6);
  ctx.fillStyle = "#6bcb77";
  ctx.fillRect(bx, y + r + 2, bw * (f.hp / f.maxHp), 2);
  ctx.fillStyle = "#60a5fa";
  ctx.fillRect(bx, y + r + 4, bw * (f.thirst / 100), 2);
  ctx.fillStyle = "#f97316";
  ctx.fillRect(bx, y + r + 6, bw * (f.aggro / 100), 2);
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
