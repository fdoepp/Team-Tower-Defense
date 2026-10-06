import { Match } from "./Match";
import { FAN_STATS, LANE_SLOTS, type FanUnit } from "./types";

/** Layout fractions */
export const LAYOUT = {
  topH: 0.16,
  curvaW: 0.16,
  laneY: 0.42,
  laneH: 0.28,
};

export function drawMatch(ctx: CanvasRenderingContext2D, m: Match): void {
  const w = m.width;
  const h = m.height;
  ctx.clearRect(0, 0, w, h);

  // pitch-like background
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1a4d2e");
  g.addColorStop(0.5, "#246b3d");
  g.addColorStop(1, "#163d28");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // mowing stripes
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) ctx.fillRect(0, (h / 12) * i, w, h / 12);
  }

  const topH = h * LAYOUT.topH;
  const curvaW = w * LAYOUT.curvaW;
  const laneY = h * LAYOUT.laneY;
  const laneH = h * LAYOUT.laneH;
  const laneX0 = curvaW;
  const laneX1 = w - curvaW;
  const laneW = laneX1 - laneX0;

  // top panel bg
  ctx.fillStyle = "rgba(8,20,14,0.75)";
  ctx.fillRect(0, 0, w, topH);

  // curvas
  drawCurva(ctx, m, 0, topH, curvaW, h - topH, m.playerFans, true);
  drawCurva(ctx, m, laneX1, topH, curvaW, h - topH, m.aiFans, false);

  // lane
  ctx.fillStyle = "rgba(20,40,28,0.9)";
  roundRect(ctx, laneX0, laneY, laneW, laneH, 16);
  ctx.fill();
  // center line / neutral
  ctx.fillStyle = "rgba(243,240,231,0.12)";
  ctx.fillRect(laneX0 + laneW * 0.42, laneY, laneW * 0.16, laneH);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(laneX0 + laneW / 2, laneY + 8);
  ctx.lineTo(laneX0 + laneW / 2, laneY + laneH - 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(243,240,231,0.55)";
  ctx.font = "600 11px DM Sans";
  ctx.textAlign = "center";
  ctx.fillText("NEUTRAL", laneX0 + laneW / 2, laneY + 16);

  // pressure arrow
  const px = laneX0 + laneW * (0.5 + m.pressure * 0.35);
  ctx.fillStyle = m.pressure >= 0 ? "#1f6feb" : "#d4a017";
  ctx.beginPath();
  ctx.moveTo(px - 10, laneY + laneH - 10);
  ctx.lineTo(px + 10, laneY + laneH - 10);
  ctx.lineTo(px, laneY + laneH - 22);
  ctx.fill();

  // stands
  for (const s of m.stands) {
    const sx = laneX0 + ((s.slot + 0.5) / LANE_SLOTS) * laneW;
    const sy = laneY + laneH * 0.28;
    ctx.fillStyle =
      s.owner === "neutral"
        ? "#5a6a60"
        : s.owner === m.playerTeam
          ? "#c9a227"
          : "#8a7030";
    roundRect(ctx, sx - 22, sy - 16, 44, 32, 6);
    ctx.fill();
    ctx.fillStyle = "#0a1410";
    ctx.font = "700 9px DM Sans";
    ctx.textAlign = "center";
    ctx.fillText("BIER", sx, sy - 2);
    // beer bar on stand
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(sx - 18, sy + 6, 36, 6);
    ctx.fillStyle = "#f5d76e";
    ctx.fillRect(sx - 18, sy + 6, 36 * (s.beer / s.capacity), 6);
  }

  // empty slot markers for build
  for (let i = 0; i < LANE_SLOTS; i++) {
    if (m.stands.some((s) => s.slot === i)) continue;
    const sx = laneX0 + ((i + 0.5) / LANE_SLOTS) * laneW;
    const sy = laneY + laneH * 0.28;
    ctx.strokeStyle =
      m.selectedLaneSlot === i ? "#6bcb77" : "rgba(255,255,255,0.25)";
    ctx.lineWidth = m.selectedLaneSlot === i ? 2 : 1;
    ctx.strokeRect(sx - 20, sy - 14, 40, 28);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "700 14px DM Sans";
    ctx.fillText("+", sx, sy + 4);
  }

  // blocks
  for (const b of m.blocks) {
    const bx = laneX0 + b.x * laneW;
    const by = laneY + laneH * 0.72;
    const mine = b.team === m.playerTeam;
    ctx.fillStyle = mine ? "#1f6feb" : "#d4a017";
    roundRect(ctx, bx - 28, by - 18, 56, 36, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 10px DM Sans";
    ctx.textAlign = "center";
    const label = `U${b.ultras} N${b.normalos} F${b.familie}`;
    ctx.fillText(label, bx, by - 2);
    // hp
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(bx - 22, by + 8, 44, 4);
    ctx.fillStyle = "#6bcb77";
    ctx.fillRect(bx - 22, by + 8, 44 * (b.hp / b.maxHp), 4);
  }

  // pause overlay
  if (m.speed === 0 && !m.result) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(laneX0, laneY, laneW, laneH);
    ctx.fillStyle = "#fff";
    ctx.font = "700 22px Archivo Black, DM Sans";
    ctx.fillText("PAUSE", laneX0 + laneW / 2, laneY + laneH / 2);
  }
}

function drawCurva(
  ctx: CanvasRenderingContext2D,
  _m: Match,
  x: number,
  y: number,
  w: number,
  h: number,
  fans: FanUnit[],
  player: boolean,
): void {
  ctx.fillStyle = player ? "rgba(31,111,235,0.18)" : "rgba(212,160,23,0.18)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = player ? "#1f6feb" : "#d4a017";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  ctx.fillStyle = "#f3f0e7";
  ctx.font = "700 12px DM Sans";
  ctx.textAlign = "center";
  ctx.fillText(player ? "EURE KURVE" : "GEGNER", x + w / 2, y + 18);

  const cols = 2;
  const alive = fans.filter((f) => f.hp > 0);
  alive.forEach((f, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const fx = x + 18 + col * ((w - 24) / cols);
    const fy = y + 36 + row * 34;
    const dim = f.zone === "neutral";
    ctx.globalAlpha = dim ? 0.35 : 1;
    ctx.fillStyle = FAN_STATS[f.kind].color;
    ctx.beginPath();
    ctx.arc(fx, fy, 8, 0, Math.PI * 2);
    ctx.fill();
    // mini bars: hp, thirst, aggro
    const barX = fx + 12;
    drawMini(ctx, barX, fy - 8, 28, f.hp / f.maxHp, "#6bcb77");
    drawMini(ctx, barX, fy - 2, 28, f.thirst / 100, "#5b8cff");
    drawMini(ctx, barX, fy + 4, 28, f.aggro / 100, "#e85d4c");
    ctx.globalAlpha = 1;
  });

  // hint for curva actions area
  if (player) {
    ctx.fillStyle = "rgba(243,240,231,0.4)";
    ctx.font = "600 10px DM Sans";
    ctx.fillText("Stimmung hier", x + w / 2, y + h - 10);
  }
}

function drawMini(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  pct: number,
  color: string,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, pct)), 4);
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

export function hitLaneSlot(
  m: Match,
  mx: number,
  my: number,
): number | null {
  const w = m.width;
  const h = m.height;
  const curvaW = w * LAYOUT.curvaW;
  const laneY = h * LAYOUT.laneY;
  const laneH = h * LAYOUT.laneH;
  const laneX0 = curvaW;
  const laneW = w - 2 * curvaW;
  if (my < laneY || my > laneY + laneH * 0.55) return null;
  if (mx < laneX0 || mx > laneX0 + laneW) return null;
  const t = (mx - laneX0) / laneW;
  const slot = Math.floor(t * LANE_SLOTS);
  return Math.max(0, Math.min(LANE_SLOTS - 1, slot));
}

export function hitPlayerCurva(m: Match, mx: number, my: number): boolean {
  const topH = m.height * LAYOUT.topH;
  const curvaW = m.width * LAYOUT.curvaW;
  return mx >= 0 && mx <= curvaW && my >= topH;
}
