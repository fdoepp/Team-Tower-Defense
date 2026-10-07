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
  seatPos,
} from "./layout";
import {
  UI_ICONS,
  drawIcon,
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
  const skyH = h * (L.blockTop + L.blockBodyH * 0.42);
  const sky = ctx.createLinearGradient(0, 0, 0, skyH);
  sky.addColorStop(0, "#060a14");
  sky.addColorStop(0.35, "#0f1a2e");
  sky.addColorStop(0.7, "#1a2740");
  sky.addColorStop(1, "#243044");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, skyH);

  // distant upper tier (packed bowl)
  const rimY = skyH * 0.55;
  ctx.fillStyle = "#1a2233";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, rimY + h * 0.06, w * 0.72, h * 0.1, 0, Math.PI, 0);
  ctx.fill();
  // crowd speckles (blue | grey | red thirds)
  for (let i = 0; i < 90; i++) {
    const t = i / 90;
    const x = w * (0.08 + t * 0.84);
    const y = rimY + Math.sin(i * 2.7) * h * 0.018 + (i % 5) * h * 0.006;
    const side = t < 0.33 ? 0 : t < 0.66 ? 1 : 2;
    ctx.fillStyle =
      side === 0
        ? `rgba(59,130,246,${0.35 + (i % 3) * 0.15})`
        : side === 2
          ? `rgba(239,68,68,${0.35 + (i % 3) * 0.15})`
          : `rgba(148,163,184,${0.3 + (i % 3) * 0.12})`;
    ctx.fillRect(x, y, 2.2, 3.5);
  }

  // floodlight masts + beams
  for (const lx of [0.1, 0.32, 0.68, 0.9]) {
    const x = w * lx;
    const y = h * 0.015;
    ctx.fillStyle = "#334155";
    ctx.fillRect(x - 2.5, y, 5, h * 0.055);
    ctx.fillStyle = "rgba(255,251,235,0.95)";
    ctx.beginPath();
    ctx.arc(x, y + h * 0.055, 4.5, 0, Math.PI * 2);
    ctx.fill();
    const beam = ctx.createRadialGradient(x, y + h * 0.06, 2, x, y + h * 0.22, h * 0.28);
    beam.addColorStop(0, "rgba(255,250,220,0.42)");
    beam.addColorStop(0.45, "rgba(255,250,220,0.12)");
    beam.addColorStop(1, "rgba(255,250,220,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + h * 0.055);
    ctx.lineTo(x + 6, y + h * 0.055);
    ctx.lineTo(x + w * 0.12, y + h * 0.32);
    ctx.lineTo(x - w * 0.12, y + h * 0.32);
    ctx.closePath();
    ctx.fill();
  }

  // pyro / flare glow — guest side always warm, scales with mood
  {
    const gx = blockCenterX(GAST_BLOCK) * w;
    const gy = h * L.blockTop * 0.85;
    const a = 0.18 + Math.min(0.45, m.moodGaeste * 0.18);
    const g = ctx.createRadialGradient(gx, gy, 8, gx, gy, w * 0.28);
    g.addColorStop(0, `rgba(251,146,60,${a})`);
    g.addColorStop(0.4, `rgba(239,68,68,${a * 0.55})`);
    g.addColorStop(1, "rgba(239,68,68,0)");
    ctx.fillStyle = g;
    ctx.fillRect(gx - w * 0.28, gy - h * 0.12, w * 0.56, h * 0.28);
    // drifting smoke wisps
    ctx.fillStyle = `rgba(248,113,113,${0.08 + a * 0.2})`;
    for (let i = 0; i < 5; i++) {
      const ox = Math.sin(m.realElapsed * 0.7 + i) * w * 0.04;
      ctx.beginPath();
      ctx.ellipse(
        gx + ox + (i - 2) * w * 0.03,
        gy - h * 0.04 - i * h * 0.012,
        w * 0.05,
        h * 0.03,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  if (m.moodHeim > 0.35) {
    const hx = blockCenterX(HEIM_BLOCK) * w;
    const hy = h * L.blockTop * 0.85;
    const a = 0.12 + m.moodHeim * 0.14;
    const g = ctx.createRadialGradient(hx, hy, 8, hx, hy, w * 0.22);
    g.addColorStop(0, `rgba(96,165,250,${a})`);
    g.addColorStop(1, "rgba(96,165,250,0)");
    ctx.fillStyle = g;
    ctx.fillRect(hx - w * 0.22, hy - h * 0.1, w * 0.44, h * 0.24);
  }

  // open concourse / gang asphalt
  const floorY = h * gangY();
  const floor = ctx.createLinearGradient(0, floorY - h * 0.03, 0, h);
  floor.addColorStop(0, "#8b9199");
  floor.addColorStop(0.2, "#6b7280");
  floor.addColorStop(0.55, "#78716c");
  floor.addColorStop(1, "#57534e");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY - h * 0.03, w, h - floorY + h * 0.03);

  // asphalt grain + lane marks
  ctx.fillStyle = "rgba(15,23,42,0.07)";
  for (let i = 0; i < 22; i++) {
    ctx.fillRect(0, floorY + (i / 22) * (h - floorY), w, 1);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 14]);
  ctx.beginPath();
  ctx.moveTo(w * L.blocksLeft, floorY + h * L.gangH * 0.5);
  ctx.lineTo(w * L.blocksRight, floorY + h * L.gangH * 0.5);
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

  for (const b of BLOCK_META) {
    const cx = blockCenterX(b.id) * w;
    const left = cx - bw / 2;
    const owner = m.blockOwner[b.id];
    const base =
      owner === "ksc" ? "#1d4ed8" : owner === "vfb" ? "#b91c1c" : "#64748b";
    const deep =
      owner === "ksc" ? "#1e3a8a" : owner === "vfb" ? "#7f1d1d" : "#475569";

    // stand shell with depth lip
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(ctx, left + 5, top + 8, bw, bh, 18);
    ctx.fill();

    const shell = ctx.createLinearGradient(left, top, left + bw, top + bh);
    shell.addColorStop(0, base);
    shell.addColorStop(0.4, deep);
    shell.addColorStop(0.85, "#0f172a");
    shell.addColorStop(1, "#020617");
    ctx.fillStyle = shell;
    roundRect(ctx, left, top, bw, bh, 18);
    ctx.fill();

    // bright rim / canopy edge
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    roundRect(ctx, left + 1.5, top + 1.5, bw - 3, bh - 3, 16);
    ctx.stroke();

    // terrace steps
    ctx.save();
    roundRect(ctx, left, top, bw, bh, 18);
    ctx.clip();
    for (let row = 0; row < 6; row++) {
      const ry = top + bh * 0.16 + row * (bh * 0.13);
      ctx.fillStyle = row % 2 === 0 ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.28)";
      ctx.fillRect(left + 8, ry, bw - 16, bh * 0.1);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left + 10, ry + bh * 0.1);
      ctx.lineTo(left + bw - 10, ry + bh * 0.1);
      ctx.stroke();
    }
    // top canopy
    const canopy = ctx.createLinearGradient(left, top, left, top + bh * 0.14);
    canopy.addColorStop(0, "rgba(15,23,42,0.55)");
    canopy.addColorStop(1, "rgba(15,23,42,0.05)");
    ctx.fillStyle = canopy;
    ctx.fillRect(left, top, bw, bh * 0.14);
    ctx.restore();

    // badge
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    roundRect(ctx, cx - bw * 0.32, top + 6, bw * 0.64, Math.max(18, h * 0.028), 10);
    ctx.fill();
    if (owner === "ksc" || owner === "vfb") {
      drawClubCrest(ctx, cx - bw * 0.18, top + 15, Math.max(10, h * 0.016), owner);
      ctx.fillStyle = "#0f172a";
      ctx.font = `800 ${Math.floor(h * 0.015)}px Outfit, Manrope, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(owner === "ksc" ? "KSC" : "VfB", cx - bw * 0.08, top + 19);
    } else {
      ctx.fillStyle = "#64748b";
      ctx.font = `700 ${Math.floor(h * 0.013)}px Manrope, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("NEUTRAL", cx, top + 19);
    }

    // exit tunnel into open gang
    const d = doorPos(b.id);
    const doorW = bw * L.doorFrac;
    const corridorTop = d.y * h;
    const corridorH = Math.max(8, h * gangY() - corridorTop + 4);
    const dx = d.x * w - doorW / 2;
    const tunnel = ctx.createLinearGradient(dx, corridorTop, dx, corridorTop + corridorH);
    tunnel.addColorStop(0, "#1f2937");
    tunnel.addColorStop(1, "#111827");
    ctx.fillStyle = tunnel;
    roundRect(ctx, dx, corridorTop - 2, doorW, corridorH + 2, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, dx + 1, corridorTop, doorW - 2, Math.min(corridorH, h * 0.04), 5);
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

function drawTerritoryPennants(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  for (const s of m.slots) {
    if (!s.building || s.greyNeutral) continue;
    if (s.owner !== "ksc" && s.owner !== "vfb") continue;
    const r = boothRect(s.blockId, s.index);
    const src = s.owner === "ksc" ? UI_ICONS.pennantKsc : UI_ICONS.pennantVfb;
    const pw = Math.min(r.w * w * 0.42, h * 0.07);
    const ph = pw * 1.15;
    drawIcon(
      ctx,
      src,
      r.x * w + r.w * w * 0.02,
      r.y * h - ph * 0.15,
      pw,
      ph,
      0.02,
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
  const grey = !!(s.owner === "neutral" || s.greyNeutral);
  const player = s.owner === m.playerTeam;
  const ai = s.owner === m.aiTeam;
  const r = Math.min(8, Math.min(bw, bh) * 0.12);
  const convT = Math.min(1, s.convertAcc / STAND_CONVERT_SEC);
  const cx = x + bw / 2;

  if (!s.building) {
    const drew = drawIcon(ctx, UI_ICONS.slotEmpty, x, y, bw, bh, 0.02);
    if (!drew) {
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      roundRect(ctx, x, y, bw, bh, r);
      ctx.fill();
      ctx.fillStyle = sel ? "#16a34a" : "#64748b";
      ctx.font = `800 ${Math.max(16, Math.floor(bh * 0.36))}px Outfit, Manrope, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", x + bw / 2, y + bh / 2 + 1);
      ctx.textBaseline = "alphabetic";
    }
    if (sel) {
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 2.5;
      roundRect(ctx, x + 1, y + 1, bw - 2, bh - 2, r);
      ctx.stroke();
    }
    return;
  }

  const color = teamColor(
    grey && !(s.convertBy && convT > 0.35) ? "neutral" : s.owner,
  );
  const lv = Math.max(1, Math.min(5, s.level || 1));
  const iconSrc = standIconPath(s.building, color, lv);
  const drew = drawIcon(ctx, iconSrc, x, y, bw, bh, 0.02);
  if (!drew) {
    // fallback soft card
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
    const rr = Math.min(bw, bh) * 0.18;
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, y + bh * 0.18, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, y + bh * 0.18, rr, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = `700 ${Math.max(9, Math.floor(rr * 0.7))}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.ceil(left)}`, cx, y + bh * 0.18 + 1);
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
  const base = Math.max(0.9, h * (onGang ? 0.042 : 0.032) / 10);
  const scale =
    f.kind === "ultras" ? base * 1.25 : f.kind === "hooligans" ? base * 1.1 : base;
  const s = 10 * scale;
  const size = s * 2.85;
  const color = teamColor(f.team);
  const lv = unitVisualLevel(m, f.team);
  const src = unitIconPath(f.kind, color, lv);
  const bob = Math.sin(m.realElapsed * 5.2 + f.id * 0.85) * s * 0.12;
  const sway = Math.sin(m.realElapsed * 2.4 + f.id) * 0.04;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(sway);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, s * 1.15 - bob * 0.3, s * 0.7, s * 0.2, 0, 0, Math.PI * 2);
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
      s * 1.15,
      -Math.PI / 2,
      -Math.PI / 2 + Math.abs(f.captureProg) * Math.PI * 2,
    );
    ctx.stroke();
  }

  const drew = drawIcon(ctx, src, -size / 2, -size * 0.85, size, size, 0.02);
  if (!drew) {
    const jersey = teamJersey(f);
    const skin = f.team === "neutral" ? "#c4c4c4" : "#e8c4a0";
    if (f.kind === "ultras") drawUltra(ctx, f, s, jersey, skin, onGang, m.realElapsed);
    else if (f.kind === "hooligans") drawHooligan(ctx, f, s, jersey, skin);
    else drawNormalo(ctx, f, s, jersey, skin, m.realElapsed);
  }

  if ((onGang || f.invading) && f.hp < f.maxHp - 0.5) {
    const bw = s * 1.6;
    const pct = Math.max(0, Math.min(1, f.hp / f.maxHp));
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(-bw / 2, -s * 1.55, bw, 3.5);
    ctx.fillStyle = pct > 0.45 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(-bw / 2, -s * 1.55, bw * pct, 3.5);
  }

  ctx.restore();

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
  m: Match,
  f: FanUnit,
  x: number,
  y: number,
  h: number,
): void {
  const s = 10 * Math.max(1, h * 0.028 / 10);
  const neutral = f.team === "neutral";
  const hpCol = neutral ? "#a8a29e" : "#facc15";
  const size = s * 2.7;
  const src = unitIconPath("ordner", teamColor(f.team), unitVisualLevel(m, f.team));

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, s * 1.15, s * 0.7, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (drawIcon(ctx, src, -size / 2, -size * 0.85, size, size, 0.02)) {
    ctx.restore();
    const bw = s * 2.2;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - bw / 2, y + s * 1.25, bw, 3);
    ctx.fillStyle = hpCol;
    ctx.fillRect(x - bw / 2, y + s * 1.25, bw * Math.max(0, f.hp / f.maxHp), 3);
    return;
  }

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
