import { Match } from "./Match";
import { TOWERS } from "./types";

export function drawMatch(ctx: CanvasRenderingContext2D, match: Match): void {
  const { width: w, height: h } = match;
  ctx.clearRect(0, 0, w, h);

  // background terrace gradient
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1b3d2c");
  g.addColorStop(0.55, "#245c3c");
  g.addColorStop(1, "#143024");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // pitch stripe suggestion at top
  ctx.fillStyle = "rgba(47, 107, 69, 0.55)";
  ctx.fillRect(0, 0, w, h * 0.12);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < 6; i++) {
    ctx.fillRect((w / 6) * i, 0, w / 12, h * 0.12);
  }

  // path
  const path = match.pathPoints();
  ctx.strokeStyle = "rgba(243,240,231,0.28)";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  path.forEach((p, i) => {
    const x = p.x * w;
    const y = p.y * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.strokeStyle = "rgba(212,160,23,0.35)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // base
  const base = path[path.length - 1];
  ctx.fillStyle = "#0d1c14";
  roundRect(ctx, base.x * w - 48, base.y * h - 18, 96, 36, 12);
  ctx.fill();
  ctx.fillStyle = "#f3f0e7";
  ctx.font = "700 12px DM Sans";
  ctx.textAlign = "center";
  ctx.fillText("CURVA", base.x * w, base.y * h + 4);

  // slots
  for (const s of match.player.slots) {
    const x = s.x * w;
    const y = s.y * h;
    const selected = match.selectedSlot === s.id;
    ctx.beginPath();
    ctx.arc(x, y, selected ? 22 : 18, 0, Math.PI * 2);
    ctx.fillStyle = selected ? "rgba(31,111,235,0.35)" : "rgba(0,0,0,0.28)";
    ctx.fill();
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.strokeStyle = selected ? "#1f6feb" : "rgba(243,240,231,0.35)";
    ctx.stroke();

    if (s.tower) {
      const def = TOWERS[s.tower];
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0a1410";
      ctx.font = "700 9px DM Sans";
      ctx.fillText(def.name.slice(0, 3).toUpperCase(), x, y + 3);
      if (s.level > 1) {
        ctx.fillStyle = "#f3f0e7";
        ctx.fillText(`L${s.level}`, x, y - 16);
      }
      if (def.range > 0) {
        ctx.beginPath();
        ctx.arc(x, y, def.range + s.level * 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "rgba(243,240,231,0.55)";
      ctx.font = "700 14px DM Sans";
      ctx.fillText("+", x, y + 5);
    }
  }

  // enemies
  for (const e of match.enemies) {
    const x = e.x * w;
    const y = e.y * h;
    const r = e.kind === "tank" || e.kind === "boss" ? 12 : e.kind === "swarm" ? 6 : 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle =
      e.kind === "boss"
        ? "#e85d4c"
        : e.kind === "tank"
          ? "#c084fc"
          : e.kind === "runner"
            ? "#fbbf24"
            : "#f3f0e7";
    ctx.fill();
    // hp
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x - 10, y - r - 8, 20, 3);
    ctx.fillStyle = "#6bcb77";
    ctx.fillRect(x - 10, y - r - 8, 20 * (e.hp / e.maxHp), 3);
  }

  // fever vignette
  if (match.fever) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.8);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(232,93,76,0.16)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
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

export function hitSlot(match: Match, mx: number, my: number): number | null {
  const { width: w, height: h } = match;
  for (const s of match.player.slots) {
    const x = s.x * w;
    const y = s.y * h;
    if (Math.hypot(mx - x, my - y) <= 28) return s.id;
  }
  return null;
}
