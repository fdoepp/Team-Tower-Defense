import { Match } from "./Match";
import {
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
  blockCenterX,
  blockWidthNorm,
  boothRect,
  doorPos,
  gangY,
  pennantPos,
  plotGangX,
  seatPos,
} from "./layout";
import {
  UI_ICONS,
  drawIcon,
  drawToyIcon,
  standIconPath,
  teamColor,
  unitIconPath,
} from "./assets";

export { SEATS_PER_BLOCK } from "./layout";
export { L, blockCenterX, blockWidthNorm, gangXToWorld, blockIdToGangX, gangY } from "./layout";

export function drawMatch(ctx: CanvasRenderingContext2D, m: Match): void {
  const w = m.width;
  const h = m.height;
  // Skip when shell is display:none / zero-sized — arcTo crashes on tiny/negative rects
  if (w < 32 || h < 32) return;
  ctx.clearRect(0, 0, w, h);

  drawStadiumAtmosphere(ctx, m, w, h);
  drawScoreboard(ctx, m, w, h);
  drawBlocks(ctx, m, w, h);
  drawSeats(ctx, m, w, h);
  drawGang(ctx, m, w, h);
  drawSlots(ctx, m, w, h);
  drawTerritoryPennants(ctx, m, w, h);
  drawFans(ctx, m, w, h);
  drawPyroShots(ctx, m, w, h);
  drawConfetti(ctx, m, w, h);
  drawMoodParticles(ctx, m, w, h);
  drawFloats(ctx, m, w, h);
}

/** Night stadium bowl + floodlights behind the stands (Matchday Comic) */
function drawStadiumAtmosphere(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const skyH = h * (L.blockTop + L.blockBodyH * 0.55);
  const sky = ctx.createLinearGradient(0, 0, 0, skyH);
  sky.addColorStop(0, "#04070f");
  sky.addColorStop(0.3, "#0c1528");
  sky.addColorStop(0.65, "#15233a");
  sky.addColorStop(1, "#1f2d44");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, skyH);

  // packed distant bowl — 3 color bands like mockup
  const rimY = h * 0.02;
  for (let tier = 0; tier < 4; tier++) {
    const ty = rimY + tier * h * 0.022;
    ctx.fillStyle = `rgba(15,23,42,${0.55 + tier * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, ty + h * 0.08, w * (0.78 - tier * 0.03), h * 0.07, 0, Math.PI, 0);
    ctx.fill();
    for (let i = 0; i < 120; i++) {
      const t = i / 120;
      const x = w * (0.06 + t * 0.88);
      const y = ty + h * 0.035 + Math.sin(i * 1.7 + tier) * h * 0.01;
      const side = t < 0.34 ? 0 : t < 0.66 ? 1 : 2;
      const a = 0.25 + ((i + tier) % 4) * 0.12;
      ctx.fillStyle =
        side === 0
          ? `rgba(59,130,246,${a})`
          : side === 2
            ? `rgba(239,68,68,${a})`
            : `rgba(148,163,184,${a * 0.85})`;
      ctx.fillRect(x, y, 2.4, 4.2);
    }
  }

  // floodlight masts + beams
  for (const lx of [0.08, 0.28, 0.72, 0.92]) {
    const x = w * lx;
    const y = h * 0.01;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x - 3, y, 6, h * 0.07);
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(x, y + h * 0.07, 5.5, 0, Math.PI * 2);
    ctx.fill();
    const beam = ctx.createRadialGradient(x, y + h * 0.08, 2, x, y + h * 0.28, h * 0.34);
    beam.addColorStop(0, "rgba(255,250,220,0.5)");
    beam.addColorStop(0.4, "rgba(255,250,220,0.14)");
    beam.addColorStop(1, "rgba(255,250,220,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x - 7, y + h * 0.07);
    ctx.lineTo(x + 7, y + h * 0.07);
    ctx.lineTo(x + w * 0.14, y + h * 0.38);
    ctx.lineTo(x - w * 0.14, y + h * 0.38);
    ctx.closePath();
    ctx.fill();
  }

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

  // open concourse asphalt
  const floorY = h * gangY();
  const floor = ctx.createLinearGradient(0, floorY - h * 0.04, 0, h);
  floor.addColorStop(0, "#9ca3af");
  floor.addColorStop(0.15, "#6b7280");
  floor.addColorStop(0.5, "#78716c");
  floor.addColorStop(1, "#44403c");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY - h * 0.04, w, h - floorY + h * 0.04);

  ctx.fillStyle = "rgba(15,23,42,0.06)";
  for (let i = 0; i < 28; i++) {
    ctx.fillRect(0, floorY + (i / 28) * (h - floorY), w, 1);
  }
  // soft lane arrows on gang
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(w * L.blocksLeft, floorY + h * L.gangH * 0.55);
  ctx.lineTo(w * L.blocksRight, floorY + h * L.gangH * 0.55);
  ctx.stroke();
  ctx.setLineDash([]);
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
  const labels = ["Heim", "Neutral", "Gäste"];

  for (const b of BLOCK_META) {
    const cx = blockCenterX(b.id) * w;
    const left = cx - bw / 2;
    const owner = m.blockOwner[b.id];
    // Gradual tint from people in the block (capture pressure)
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
    const lean = crowd > 0 ? (blue - red) / crowd : 0; // +heim blue, -gast red
    const pressure = Math.min(1, crowd / 8) * Math.abs(lean);

    let base =
      owner === "ksc" ? "#2563eb" : owner === "vfb" ? "#dc2626" : "#64748b";
    let deep =
      owner === "ksc" ? "#1e3a8a" : owner === "vfb" ? "#7f1d1d" : "#334155";
    if (owner === "neutral" && pressure > 0.08) {
      base = lean > 0 ? lerpHex("#64748b", "#2563eb", pressure) : lerpHex("#64748b", "#dc2626", pressure);
      deep = lean > 0 ? lerpHex("#334155", "#1e3a8a", pressure) : lerpHex("#334155", "#7f1d1d", pressure);
    }
    const glow =
      owner === "ksc" || (owner === "neutral" && lean > 0.15)
        ? `rgba(59,130,246,${0.25 + pressure * 0.35})`
        : owner === "vfb" || (owner === "neutral" && lean < -0.15)
          ? `rgba(248,113,113,${0.25 + pressure * 0.35})`
          : "rgba(148,163,184,0.25)";

    // colored glow under platform
    const g = ctx.createRadialGradient(cx, top + bh * 0.4, 10, cx, top + bh * 0.5, bw * 0.7);
    g.addColorStop(0, glow);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(left - 8, top - 12, bw + 16, bh + 24);

    // raised platform base (isometric lip)
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    roundRect(ctx, left + 6, top + 10, bw, bh, 20);
    ctx.fill();

    const shell = ctx.createLinearGradient(left, top, left, top + bh);
    shell.addColorStop(0, base);
    shell.addColorStop(0.35, deep);
    shell.addColorStop(0.75, "#0f172a");
    shell.addColorStop(1, "#020617");
    ctx.fillStyle = shell;
    roundRect(ctx, left, top, bw, bh, 20);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 2.5;
    roundRect(ctx, left + 2, top + 2, bw - 4, bh - 4, 18);
    ctx.stroke();

    // terrace steps
    ctx.save();
    roundRect(ctx, left, top, bw, bh, 20);
    ctx.clip();
    for (let row = 0; row < 5; row++) {
      const ry = top + bh * 0.2 + row * (bh * 0.14);
      ctx.fillStyle = row % 2 === 0 ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.3)";
      ctx.fillRect(left + 10, ry, bw - 20, bh * 0.11);
    }
    const canopy = ctx.createLinearGradient(left, top, left, top + bh * 0.18);
    canopy.addColorStop(0, "rgba(15,23,42,0.65)");
    canopy.addColorStop(1, "rgba(15,23,42,0)");
    ctx.fillStyle = canopy;
    ctx.fillRect(left, top, bw, bh * 0.18);
    ctx.restore();

    // label chip
    const label = labels[b.id] ?? "Block";
    const chipW = Math.max(54, bw * 0.55);
    const chipH = Math.max(18, h * 0.026);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    roundRect(ctx, cx - chipW / 2, top + 6, chipW, chipH, 9);
    ctx.fill();
    if (owner === "ksc" || owner === "vfb") {
      drawClubCrest(ctx, cx - chipW * 0.28, top + 6 + chipH / 2, chipH * 0.38, owner);
    }
    ctx.fillStyle = "#0f172a";
    ctx.font = `800 ${Math.floor(chipH * 0.55)}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx + (owner === "ksc" || owner === "vfb" ? 6 : 0), top + 6 + chipH / 2 + 0.5);
    ctx.textBaseline = "alphabetic";

    // exit tunnel
    const d = doorPos(b.id);
    const doorW = bw * L.doorFrac;
    const corridorTop = d.y * h;
    const corridorH = Math.max(10, h * gangY() - corridorTop + 6);
    const dx = d.x * w - doorW / 2;
    const tunnel = ctx.createLinearGradient(dx, corridorTop, dx, corridorTop + corridorH);
    tunnel.addColorStop(0, "#111827");
    tunnel.addColorStop(1, "#020617");
    ctx.fillStyle = tunnel;
    roundRect(ctx, dx, corridorTop - 2, doorW, corridorH + 4, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, dx + 3, corridorTop + 2, doorW - 6, Math.min(corridorH * 0.35, h * 0.03), 5);
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

/** Center scoreboard + momentum strip (Matchday Comic / mockup) */
function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const boardW = Math.min(w * 0.42, h * 0.55);
  const boardH = boardW * (720 / 1280) * 0.72;
  const bx = (w - boardW) / 2;
  const by = h * 0.012;
  // Soft stadium glow behind board
  const glow = ctx.createRadialGradient(
    w * 0.5,
    by + boardH * 0.55,
    4,
    w * 0.5,
    by + boardH * 0.4,
    boardW * 0.7,
  );
  glow.addColorStop(0, "rgba(255,250,220,0.18)");
  glow.addColorStop(1, "rgba(255,250,220,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(bx - 20, by - 8, boardW + 40, boardH + 24);

  const drew = drawIcon(ctx, UI_ICONS.scoreboard, bx, by, boardW, boardH, 0.02);
  if (!drew) {
    // fallback panel
    ctx.fillStyle = "rgba(15,23,42,0.88)";
    roundRect(ctx, bx, by, boardW, boardH * 0.62, 10);
    ctx.fill();
  }

  // Live score + minute overlaid on board face
  const faceY = by + boardH * 0.22;
  const faceH = boardH * 0.38;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f8fafc";
  ctx.font = `900 ${Math.max(16, Math.floor(faceH * 0.72))}px Outfit, Manrope, sans-serif`;
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 6;
  ctx.fillText(`${m.scoreKsc} : ${m.scoreVfb}`, w * 0.5, faceY + faceH * 0.42);
  ctx.shadowBlur = 0;
  ctx.font = `800 ${Math.max(10, Math.floor(faceH * 0.32))}px Outfit, Manrope, sans-serif`;
  ctx.fillStyle = "#e2e8f0";
  const min = Math.floor(m.minute ?? 0);
  ctx.fillText(`${min}′`, w * 0.5 + boardW * 0.38, by + boardH * 0.12);

  // Momentum / Torchance strip under the board
  const barY = by + boardH * 0.78;
  const barH = Math.max(14, boardH * 0.16);
  const barX = bx + boardW * 0.08;
  const barW = boardW * 0.84;
  const ch = m.goalChance();
  const heimPct = Math.max(0.05, Math.min(0.95, ch.pHeim));
  const gastPct = Math.max(0.05, Math.min(0.95, ch.pGast));
  const torchance = Math.round(ch.pTor * 100);
  roundRect(ctx, barX, barY, barW, barH, 6);
  ctx.fillStyle = "rgba(15,23,42,0.75)";
  ctx.fill();
  const split = barX + barW * heimPct;
  ctx.fillStyle = "#2563eb";
  roundRect(ctx, barX, barY, Math.max(4, split - barX), barH, 6);
  ctx.fill();
  ctx.fillStyle = "#dc2626";
  roundRect(ctx, split, barY, Math.max(4, barX + barW - split), barH, 6);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.font = `800 ${Math.max(9, Math.floor(barH * 0.55))}px Outfit, Manrope, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(`Heim ${Math.round(heimPct * 100)}%`, barX + 6, barY + barH / 2 + 0.5);
  ctx.textAlign = "right";
  ctx.fillText(`Gast ${Math.round(gastPct * 100)}%`, barX + barW - 6, barY + barH / 2 + 0.5);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fde68a";
  ctx.fillText(`Torchance ${torchance}%`, w * 0.5, barY + barH / 2 + 0.5);
  ctx.restore();
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

  // Soft open concourse — light territory wash only
  const pEdge = Math.min(px, ax);
  const aEdge = Math.max(px, ax);
  ctx.fillStyle = "rgba(59,130,246,0.18)";
  ctx.fillRect(left, y, Math.max(0, pEdge - left), gh);
  ctx.fillStyle = "rgba(239,68,68,0.18)";
  ctx.fillRect(aEdge, y, left + span - aEdge, gh);

  // Front lines
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(59,130,246,0.85)";
  ctx.beginPath();
  ctx.moveTo(px, y + 4);
  ctx.lineTo(px, y + gh - 4);
  ctx.stroke();
  ctx.strokeStyle = "rgba(239,68,68,0.85)";
  ctx.beginPath();
  ctx.moveTo(ax, y + 4);
  ctx.lineTo(ax, y + gh - 4);
  ctx.stroke();
  ctx.restore();
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

/**
 * Fahnen nur wenn die Frontlinie den Plot erreicht hat
 * (oder ein Team dort gebaut/geclaimt hat) — nie am Start in der Mitte.
 */
function plotPennantTeam(
  m: Match,
  s: BuildSlot,
): "ksc" | "vfb" | null {
  if (s.building && !s.greyNeutral && (s.owner === "ksc" || s.owner === "vfb")) {
    return s.owner;
  }
  const gx = plotGangX(s.blockId, s.index);
  // No starter flags — only after the front has actually moved onto the plot
  if (m.linePlayer > 0.1 && gx <= m.linePlayer - 0.01) return m.playerTeam;
  if (m.lineAi < 0.9 && gx >= m.lineAi + 0.01) return m.aiTeam;
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

/** Toy-3D Baustelle from slot-empty asset */
function drawBaustelle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bw: number,
  bh: number,
  sel: boolean,
): void {
  const drew = drawIcon(ctx, UI_ICONS.slotEmpty, x, y, bw, bh, 0.02);
  if (!drew) {
    // fallback fence plot
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
  if (sel) {
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3.5;
    roundRect(ctx, x + 2, y + 2, bw - 4, bh - 4, 10);
    ctx.stroke();
    // soft green pulse
    ctx.strokeStyle = "rgba(34,197,94,0.35)";
    ctx.lineWidth = 6;
    roundRect(ctx, x - 1, y - 1, bw + 2, bh + 2, 12);
    ctx.stroke();
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
  const cx = x + bw / 2;

  if (!s.building) {
    drawBaustelle(ctx, x, y, bw, bh, sel);
    return;
  }

  // plot pad under building
  ctx.fillStyle = "rgba(15,23,42,0.25)";
  roundRect(ctx, x + 4, y + bh * 0.55, bw - 8, bh * 0.38, r);
  ctx.fill();

  const color = teamColor(
    grey && !(s.convertBy && convT > 0.35) ? "neutral" : s.owner,
  );
  const lv = Math.max(1, Math.min(5, s.level || 1));
  const iconSrc = standIconPath(s.building, color, lv);
  // soft contact shadow
  ctx.fillStyle = "rgba(15,23,42,0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, y + bh * 0.88, bw * 0.32, bh * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Toy-3D bob on stands (same language as units)
  const size = Math.min(bw, bh) * 0.98;
  const drew = drawToyIcon(ctx, iconSrc, cx, y + bh * 0.78, size, {
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
    roundRect(ctx, x + 2, y + 2, bw - 4, bh - 4, r);
    ctx.stroke();
    ctx.restore();
  }

  if (s.convertBy && s.convertAcc > 0.15) {
    const pct = Math.min(1, s.convertAcc / STAND_CONVERT_SEC);
    const left = Math.max(0, STAND_CONVERT_SEC - s.convertAcc);
    const col = s.convertBy === "ksc" ? "#3b82f6" : "#ef4444";
    const rr = Math.min(bw, bh) * 0.16;
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, y + bh * 0.14, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, y + bh * 0.14, rr, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.max(9, Math.floor(rr * 0.7))}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.ceil(left)}`, cx, y + bh * 0.14 + 1);
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

  // level pips
  if (!grey || (s.convertBy && convT > 0.5)) {
    const pipW = Math.min(7, (bw - 12) / 5 - 1);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < lv ? "#fde68a" : "rgba(0,0,0,0.45)";
      ctx.fillRect(x + 5 + i * (pipW + 2), y + 3, pipW, 4);
    }
  }

  if (sel) {
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    roundRect(ctx, x + 1, y + 1, bw - 2, bh - 2, r);
    ctx.stroke();
  }

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
  const exiting =
    f.state === "moving" && f.y < gangY() + L.gangH * 0.22;
  const moving = f.state === "moving" || onGang;
  const fighting =
    (onGang || f.invading) && (f.armSwing > 0.15 || f.attackCd > 0.05);
  const cheering =
    !moving &&
    (f.cheerT > 0 ||
      (f.team === "ksc" ? m.moodHeim : f.team === "vfb" ? m.moodGaeste : 0) > 0.7);
  const sizeMul =
    f.kind === "ultras" ? 1.22 : f.kind === "hooligans" ? 1.12 : 1;
  const size = Math.max(26, h * (moving ? 0.085 : 0.068) * sizeMul);
  const color = teamColor(f.team);
  const lv = unitVisualLevel(m, f.team);
  const src = unitIconPath(f.kind, color, lv);
  const phase = (typeof f.id === "number" ? f.id : 0) * 0.73;
  const facing = fanFacing(f);
  const mode = fighting
    ? "fight"
    : exiting
      ? "exit"
      : moving
        ? "walk"
        : cheering
          ? "cheer"
          : "idle";

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
    mode,
    facing,
    hop: moving ? 1 : 0,
    strike: Math.max(f.armSwing, fighting ? 0.35 : 0),
  });
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
  const onGang = f.state === "gang" || f.state === "moving";

  if (
    drawToyIcon(ctx, src, x, y, size, {
      t: m.realElapsed,
      phase,
      mode: onGang ? "walk" : "idle",
      facing: f.patrolDir < 0 ? -1 : 1,
      hop: onGang ? 0.85 : 0,
    })
  ) {
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
