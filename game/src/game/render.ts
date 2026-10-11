import { Match } from "./Match";
import {
  ANIM_DRINK_SEC,
  ANIM_SHOP_SEC,
  ANIM_THROW_SEC,
  BEER_STEAL_CAPTURE,
  BLOCK_META,
  BLOCK_STORM_SEC,
  NEUTRAL_MID_GANG_INDEX,
  STAND_CONVERT_SEC,
  type BuildSlot,
  type FanUnit,
} from "./types";
import {
  GAST_BLOCK,
  HEIM_BLOCK,
  L,
  NEUTRAL_BLOCK,
  SEATS_PER_BLOCK,
  FLOOR_GRID_COUPLE,
  blockCenterX,
  blocksLeftNorm,
  blocksRightNorm,
  boothQuad,
  boothRect,
  gangHeight,
  gangY,
  seatPos,
  syncTribuneLayout,
  tribuneRect,
} from "./layout";
import {
  SCENE_ASSETS,
  UI_ICONS,
  drawIcon,
  drawToyIcon,
  drawToyProp,
  getIcon,
  type ToyAnimMode,
  baustelleSchildIconPath,
  pyroShotIconPath,
  slotEmptyIconPath,
  standarteSizePx,
  standIconPath,
  teamColor,
  tribuneIconPath,
  unitIconPath,
  type SlotControl,
} from "./assets";
import {
  boothFacadeQuad,
  scaleQuad,
  type ScreenQuad,
} from "./floorGrid";

export { SEATS_PER_BLOCK } from "./layout";
export { L, blockCenterX, blockWidthNorm, gangXToWorld, blockIdToGangX, gangY } from "./layout";

export function drawMatch(ctx: CanvasRenderingContext2D, m: Match): void {
  const w = m.width;
  const h = m.height;
  syncTribuneLayout(w, h);
  // Skip when shell is display:none / zero-sized — arcTo crashes on tiny/negative rects
  if (w < 32 || h < 32) return;
  ctx.clearRect(0, 0, w, h);

  drawStadiumAtmosphere(ctx, m, w, h);
  drawScoreboard(ctx, m, w, h);
  drawBlocks(ctx, m, w, h);
  drawSeats(ctx, m, w, h);
  drawGang(ctx, m, w, h);
  drawFrontStandards(ctx, m, w, h);
  drawSlots(ctx, m, w, h);
  // Plot/building pennants intentionally omitted — floor reads clearer without wimpel clutter.
  drawFans(ctx, m, w, h);
  drawStormBanner(ctx, m, w, h);
  drawPyroShots(ctx, m, w, h);
  drawConfetti(ctx, m, w, h);
  drawMoodParticles(ctx, m, w, h);
  drawFloats(ctx, m, w, h);
}

/**
 * Large occupation banner held up by Blocksturm invaders:
 * „Hier regiert der KSC / VfB“ — visible for BLOCK_STORM_SEC before win.
 */
function drawStormBanner(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const b = m.stormBanner;
  if (!b) return;
  const r = tribuneRect(b.blockId);
  const bob = Math.sin(m.realElapsed * 4.2) * h * 0.008;
  const raise = Math.min(1, b.holdT / 0.45);
  const cx = (r.x + r.w / 2) * w;
  const top = r.y * h + bob - h * 0.02 * raise;
  const bw = Math.min(w * 0.42, r.w * w * 1.15);
  const bh = Math.max(48, h * 0.085);
  const x = cx - bw / 2;
  const y = top + (1 - raise) * bh * 0.8;
  const isKsc = b.team === "ksc";
  const fill = isKsc ? "#1d4ed8" : "#b91c1c";
  const edge = isKsc ? "#93c5fd" : "#fca5a5";
  const label = isKsc ? "KSC" : "VfB";

  ctx.save();
  // Poles held by the crowd
  ctx.strokeStyle = "rgba(248,250,252,0.85)";
  ctx.lineWidth = Math.max(3, h * 0.006);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + bw * 0.08, y + bh);
  ctx.lineTo(x + bw * 0.08, y + bh + h * 0.06);
  ctx.moveTo(x + bw * 0.92, y + bh);
  ctx.lineTo(x + bw * 0.92, y + bh + h * 0.06);
  ctx.stroke();

  // Cloth
  roundRect(ctx, x, y, bw, bh, Math.min(14, bh * 0.22));
  const g = ctx.createLinearGradient(x, y, x + bw, y + bh);
  g.addColorStop(0, fill);
  g.addColorStop(0.5, isKsc ? "#2563eb" : "#dc2626");
  g.addColorStop(1, fill);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(3, h * 0.005);
  ctx.stroke();

  // Stripe fringe
  ctx.fillStyle = "rgba(248,250,252,0.92)";
  ctx.fillRect(x + 4, y + 4, bw - 8, Math.max(3, bh * 0.08));
  ctx.fillRect(x + 4, y + bh - Math.max(3, bh * 0.08) - 4, bw - 8, Math.max(3, bh * 0.08));

  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titlePx = Math.max(13, Math.floor(bh * 0.38));
  ctx.font = `900 ${titlePx}px Outfit, Manrope, sans-serif`;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 6;
  ctx.fillText(`Hier regiert der ${label}`, cx, y + bh * 0.42);
  ctx.shadowBlur = 0;

  // Hold progress under banner
  const pct = Math.min(1, b.holdT / BLOCK_STORM_SEC);
  const barW = bw * 0.72;
  const barH = Math.max(6, bh * 0.12);
  const barX = cx - barW / 2;
  const barY = y + bh * 0.72;
  ctx.fillStyle = "rgba(15,23,42,0.75)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(barX, barY, barW * pct, barH);
  ctx.fillStyle = "#fff7ed";
  ctx.font = `700 ${Math.max(9, Math.floor(barH * 1.1))}px Outfit, Manrope, sans-serif`;
  ctx.fillText(
    `${Math.ceil(Math.max(0, BLOCK_STORM_SEC - b.holdT))}s`,
    cx,
    barY + barH / 2 + 0.5,
  );

  ctx.restore();
}

/** Cover-draw stadium-floodlight-derby-bg when available (Rahmenlogik). */
function drawStadiumBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): boolean {
  const img = getIcon(SCENE_ASSETS.stadiumFloodlightDerby);
  if (!img?.complete || !img.naturalWidth) return false;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return true;
}

/** Night stadium bowl + floodlights behind the stands (Matchday Comic) */
function drawStadiumAtmosphere(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  if (drawStadiumBackdrop(ctx, w, h)) {
    // Soft asphalt veil so gang sprites stay readable over photo BG
    const floorY = h * gangY();
    const veil = ctx.createLinearGradient(0, floorY - h * 0.02, 0, h);
    veil.addColorStop(0, "rgba(55, 58, 64, 0.15)");
    veil.addColorStop(1, "rgba(40, 42, 48, 0.35)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, floorY - h * 0.02, w, h - floorY + h * 0.02);
    return;
  }

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
}

/**
 * Freigestellte Tribünen — flush strip, grey centered, uniform scale (no distort).
 */
function drawBlocks(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  syncTribuneLayout(w, h);

  for (const b of BLOCK_META) {
    const tr = tribuneRect(b.id);
    const left = tr.x * w;
    const top = tr.y * h;
    const bw = tr.w * w;
    const bh = tr.h * h;
    const cx = left + bw / 2;
    const owner = m.blockOwner[b.id];

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
    const lean = crowd > 0 ? (blue - red) / crowd : 0;
    const pressure = Math.min(1, crowd / 8) * Math.abs(lean);
    const glow =
      owner === "ksc" || (owner === "neutral" && lean > 0.15)
        ? `rgba(59,130,246,${0.18 + pressure * 0.3})`
        : owner === "vfb" || (owner === "neutral" && lean < -0.15)
          ? `rgba(248,113,113,${0.18 + pressure * 0.3})`
          : "rgba(148,163,184,0.14)";

    const g = ctx.createRadialGradient(cx, top + bh * 0.45, 8, cx, top + bh * 0.5, bw * 0.72);
    g.addColorStop(0, glow);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(left - 10, top - 8, bw + 20, bh + 20);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, top + bh * 0.92, bw * 0.42, bh * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    const tribSrc = tribuneIconPath(b.id);
    // Cell already native-aspect packed — pad 0 so faces stay 0.5% apart
    // Tribune assets have solid fronts (no arch tunnels); exit pathing unchanged.
    const drew = drawIcon(ctx, tribSrc, left, top, bw, bh, 0);
    if (!drew) {
      ctx.fillStyle =
        b.id === 0 ? "#2563eb" : b.id === 2 ? "#dc2626" : "#64748b";
      roundRect(ctx, left, top, bw, bh, 18);
      ctx.fill();
    }
    // Keine Heim/Neutral/Gäste-Überschriften auf den Tribünen
  }
}

function drawSeats(
  ctx: CanvasRenderingContext2D,
  _m: Match,
  w: number,
  h: number,
): void {
  // Decorative terrace marks only — fans wander freely, so no fixed
  // team-colored "occupied seat" cushions glued to the grid.
  for (const b of BLOCK_META) {
    for (let i = 0; i < SEATS_PER_BLOCK; i++) {
      const p = seatPos(b.id, i);
      const x = p.x * w;
      const y = p.y * h;
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      roundRect(ctx, x - 8, y - 2, 16, 6, 3);
      ctx.fill();
    }
  }
}

/** Scoreboard slots — scoreboard-slots.json (0–1 on chrome box). */
const SB_SLOTS = {
  logoHeim: { x: 0.08, y: 0.28, w: 0.18, h: 0.44 },
  logoGast: { x: 0.74, y: 0.28, w: 0.18, h: 0.44 },
  score: { x: 0.32, y: 0.3, w: 0.36, h: 0.36 },
  clock: { x: 0.45, y: 0.17, w: 0.1, h: 0.14 },
  momentumTrack: { x: 0.1, y: 0.7, w: 0.8, h: 0.24 },
} as const;

/** Empty chrome + live overlays (STORAGE_CANON). Sizes: MATCH_LAYOUT_TOKENS. */
function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const boardW = Math.min(w * 0.598, h * 0.48);
  const boardH = Math.min(boardW * (508 / 1041), h * 0.1725);
  const bx = (w - boardW) / 2;
  const by = h * 0.03;

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

  const drew = drawIcon(ctx, UI_ICONS.scoreboardChrome, bx, by, boardW, boardH, 0.02);
  if (!drew) {
    ctx.fillStyle = "rgba(15,23,42,0.88)";
    roundRect(ctx, bx, by, boardW, boardH * 0.62, 10);
    ctx.fill();
  }

  const slot = (key: keyof typeof SB_SLOTS) => {
    const s = SB_SLOTS[key];
    return {
      x: bx + s.x * boardW,
      y: by + s.y * boardH,
      w: s.w * boardW,
      h: s.h * boardH,
    };
  };

  // Logos are baked into scoreboardChrome — no live Wimpel overlays

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const sc = slot("score");
  ctx.fillStyle = "#f8fafc";
  ctx.font = `900 ${Math.max(16, Math.floor(sc.h * 0.62))}px Outfit, Manrope, sans-serif`;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 5;
  ctx.fillText(`${m.scoreKsc} : ${m.scoreVfb}`, sc.x + sc.w / 2, sc.y + sc.h / 2);
  ctx.shadowBlur = 0;

  const ck = slot("clock");
  const min = Math.floor(m.minute ?? 0);
  ctx.fillStyle = "#0f2310";
  ctx.font = `800 ${Math.max(10, Math.floor(ck.h * 0.55))}px Outfit, Manrope, sans-serif`;
  ctx.fillText(`${min}′`, ck.x + ck.w / 2, ck.y + ck.h / 2);

  // Momentum bar only (Torwahrscheinlichkeit label removed — LIVE ticker below)
  const mt = slot("momentumTrack");
  const ch = m.goalChance();
  const heimPct = Math.max(0.05, Math.min(0.95, ch.pHeim));
  roundRect(ctx, mt.x, mt.y, mt.w, mt.h, 7);
  ctx.fillStyle = "rgba(15,23,42,0.8)";
  ctx.fill();
  const split = mt.x + mt.w * heimPct;
  const fillY = mt.y + mt.h * 0.18;
  const fillH = mt.h * 0.72;
  ctx.fillStyle = "#2563eb";
  roundRect(ctx, mt.x, fillY, Math.max(4, split - mt.x), fillH, 5);
  ctx.fill();
  ctx.fillStyle = "#dc2626";
  roundRect(ctx, split, fillY, Math.max(4, mt.x + mt.w - split), fillH, 5);
  ctx.fill();

  const pctY = fillY + fillH / 2;
  const sidePx = Math.max(10, Math.floor(fillH * 0.48));
  ctx.font = `800 ${sidePx}px Outfit, Manrope, sans-serif`;
  ctx.lineWidth = Math.max(2, sidePx * 0.16);
  ctx.strokeStyle = "rgba(15,23,42,0.75)";
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.strokeText(`Heim ${Math.round(heimPct * 100)}%`, mt.x + 7, pctY);
  ctx.fillText(`Heim ${Math.round(heimPct * 100)}%`, mt.x + 7, pctY);
  ctx.textAlign = "right";
  ctx.strokeText(
    `Gast ${Math.round((1 - heimPct) * 100)}%`,
    mt.x + mt.w - 7,
    pctY,
  );
  ctx.fillText(
    `Gast ${Math.round((1 - heimPct) * 100)}%`,
    mt.x + mt.w - 7,
    pctY,
  );

  drawTorBall(ctx, split, pctY, fillH * 1.15, m.torBallAngle);

  // Prominent LIVE ticker directly under the momentum bar
  drawLiveTicker(ctx, m, bx, by, boardW, boardH, mt);
  ctx.restore();
}

const TICKER_COLORS: Record<string, string> = {
  match: "#ffffff", // Spielnachrichten — weiß
  combat: "#ef4444", // Kampfmeldungen — rot
  crowd: "#3b82f6", // Personen / Stimmung — blau
  build: "#f97316", // Bau / Ressourcen — orange
};

function drawLiveTicker(
  ctx: CanvasRenderingContext2D,
  m: Match,
  bx: number,
  _by: number,
  boardW: number,
  boardH: number,
  mt: { x: number; y: number; w: number; h: number },
): void {
  void _by;
  const item = m.activeTicker?.() ?? m.tickerQueue?.[0];
  if (!item) return;
  const tw = boardW * 0.98;
  const th = Math.max(22, boardH * 0.28);
  const tx = bx + (boardW - tw) / 2;
  const ty = mt.y + mt.h + Math.max(6, boardH * 0.08);
  roundRect(ctx, tx, ty, tw, th, 8);
  ctx.fillStyle = "rgba(15,23,42,0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.lineWidth = 1.2;
  roundRect(ctx, tx, ty, tw, th, 8);
  ctx.stroke();

  const tagW = Math.max(36, tw * 0.11);
  const tagH = th * 0.62;
  const tagX = tx + 6;
  const tagY = ty + (th - tagH) / 2;
  roundRect(ctx, tagX, tagY, tagW, tagH, 5);
  ctx.fillStyle = "#0ea5e9";
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = `900 ${Math.max(9, Math.floor(tagH * 0.55))}px Outfit, Manrope, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LIVE", tagX + tagW / 2, tagY + tagH / 2 + 0.5);

  const col = TICKER_COLORS[item.channel] ?? TICKER_COLORS.match;
  ctx.fillStyle = col;
  ctx.font = `800 ${Math.max(12, Math.floor(th * 0.48))}px Outfit, Manrope, sans-serif`;
  ctx.textAlign = "left";
  const textX = tagX + tagW + 10;
  const maxW = tw - tagW - 22;
  let label = item.text;
  while (ctx.measureText(label).width > maxW && label.length > 4) {
    label = label.slice(0, -2);
  }
  if (label !== item.text) label = `${label.trimEnd()}…`;
  ctx.fillText(label, textX, ty + th / 2 + 0.5);
  ctx.textBaseline = "alphabetic";
}

/** Classic football overlay on the Torwahrscheinlichkeit split. */
function drawTorBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
): void {
  const r = Math.max(5, size * 0.48);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = "rgba(15,23,42,0.85)";
  ctx.lineWidth = Math.max(1.2, r * 0.12);
  ctx.stroke();
  // Simple panel seams
  ctx.strokeStyle = "rgba(15,23,42,0.75)";
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
    ctx.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
    ctx.stroke();
  }
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * r * 0.22;
    const py = Math.sin(a) * r * 0.22;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGang(
  _ctx: CanvasRenderingContext2D,
  _m: Match,
  _w: number,
  _h: number,
): void {
  // Territory is marked by front standards only — no colored helper lines in the gang.
}

/** Big flag standards planted at each team's frontmost battle line */
function drawFrontStandards(
  ctx: CanvasRenderingContext2D,
  m: Match,
  w: number,
  h: number,
): void {
  const y = h * gangY();
  const gh = h * gangHeight();
  const left = w * blocksLeftNorm();
  const span = w * (blocksRightNorm() - blocksLeftNorm());
  const poles: { x: number; team: "ksc" | "vfb" }[] = [
    { x: left + span * m.linePlayer, team: m.playerTeam },
    { x: left + span * m.lineAi, team: m.aiTeam },
  ];
  for (const pole of poles) {
    const src = pole.team === "ksc" ? UI_ICONS.pennantKsc : UI_ICONS.pennantVfb;
    const baseY = y + gh * 0.88;
    const size = standarteSizePx(w, h);
    const bob = Math.sin(m.realElapsed * 3.5 + (pole.team === "ksc" ? 0 : 1)) * 2;
    // Full standarte asset (includes pole) — upright billboard, no duplicate stroke pole.
    drawPennantUpright(ctx, src, pole.x, baseY + bob, size);
  }
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
    const life = 1 - p.t / Math.max(0.01, p.life);
    const ih = Math.max(26, Math.min(w, h) * 0.058) * (0.92 + 0.12 * life);
    const ang = Math.atan2(p.vy * h, p.vx * w);
    const src = pyroShotIconPath(teamColor(p.team));
    ctx.save();
    ctx.translate(x, y);
    // Icon burns at the tip (upper-right in asset); align tip with velocity.
    ctx.rotate(ang - Math.PI / 4);
    ctx.globalAlpha = 0.75 + 0.25 * life;
    if (!drawIcon(ctx, src, -ih / 2, -ih / 2, ih, ih, 0.02)) {
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 10);
      glow.addColorStop(0, "#fff7ed");
      glow.addColorStop(0.35, "#fb923c");
      glow.addColorStop(1, "rgba(251,146,60,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(-1.5, -2, 3, 10);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
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

function slotControlForPlot(m: Match, s: BuildSlot): SlotControl {
  // Built neutral/grey posts stay grey; empty plots take team color once buildable
  if (s.building && (s.greyNeutral || s.owner === "neutral")) return "grey";
  if (s.owner === "ksc") return "blue";
  if (s.owner === "vfb") return "red";

  // Empty grey/neutral Bauplätze: Schildfarbe follows who can build there
  if (!s.building) {
    if (m.inPlayerTerritory(s.blockId, s.index)) {
      return m.playerTeam === "ksc" ? "blue" : "red";
    }
    if (m.inAiTerritory(s.blockId, s.index)) {
      return m.aiTeam === "ksc" ? "blue" : "red";
    }
    return "grey";
  }

  const bo = m.blockOwner[s.blockId];
  if (bo === "ksc" || bo === "vfb") {
    if (bo === m.playerTeam && m.inPlayerTerritory(s.blockId, s.index)) {
      return bo === "ksc" ? "blue" : "red";
    }
    if (bo === m.aiTeam && m.inAiTerritory(s.blockId, s.index)) {
      return bo === "ksc" ? "blue" : "red";
    }
  }
  if (m.inPlayerTerritory(s.blockId, s.index)) {
    return m.playerTeam === "ksc" ? "blue" : "red";
  }
  if (m.inAiTerritory(s.blockId, s.index)) {
    return m.aiTeam === "ksc" ? "blue" : "red";
  }
  return "grey";
}

/** Foot-anchored upright blit — pole reads screen-vertical in the VP floor. */
function drawPennantUpright(
  ctx: CanvasRenderingContext2D,
  src: string,
  footX: number,
  footY: number,
  size: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.28)";
  ctx.beginPath();
  ctx.ellipse(footX, footY + 2, size * 0.22, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // drawIcon rect with bottom-center at foot
  drawIcon(ctx, src, footX - size * 0.5, footY - size * 0.92, size, size, 0.02);
}

/** Baustelle — floor chrome + team jackhammer sign at plot center. */
function drawBaustelle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bw: number,
  bh: number,
  sel: boolean,
  m: Match,
  s: BuildSlot,
): void {
  const control = slotControlForPlot(m, s);
  const src = slotEmptyIconPath(control, "persp", false);
  let drew = false;
  let footX = x + bw / 2;
  let footY = y + bh / 2;
  if (FLOOR_GRID_COUPLE) {
    const cell = boothQuad(s.blockId, s.index);
    const q = scaleQuad(cell, m.width, m.height);
    footX = (q.tl.x + q.tr.x + q.br.x + q.bl.x) / 4;
    footY = (q.tl.y + q.tr.y + q.br.y + q.bl.y) / 4;
  }
  // Same screen-size Bauplatz marker top & bottom (no far-row shrink).
  const standarte = standarteSizePx(m.width, m.height);
  const signSize = standarte * 1.25;
  const padSize = signSize * 0.95;
  ctx.save();
  ctx.globalAlpha = sel ? 1 : 0.9;
  drew = drawIcon(
    ctx,
    src,
    footX - padSize * 0.5,
    footY - padSize * 0.35,
    padSize,
    padSize * 0.7,
    0.02,
  );
  ctx.restore();

  const signSrc = baustelleSchildIconPath(control);
  drawPennantUpright(ctx, signSrc, footX, footY, signSize);

  if (!drew) {
    const r = Math.min(10, Math.min(bw, bh) * 0.12);
    ctx.fillStyle = "rgba(75,85,99,0.55)";
    roundRect(ctx, x + 4, y + 4, bw - 8, bh - 8, r);
    ctx.fill();
  }
  if (sel) {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `800 ${Math.max(14, Math.floor(bh * 0.2))}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", footX, footY - signSize * 0.55);
    ctx.textBaseline = "alphabetic";
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

  if (!s.building) {
    drawBaustelle(ctx, x, y, bw, bh, sel, m, s);
    return;
  }

  // Built plot: front faces the viewer (upright). Per-slot perspective only
  // sets foot position + size from the VP facade math — no icon warp/yaw.
  let cx = x + bw / 2;
  let footY = y + bh * 0.78;
  // Same Gebäude scale for Bau-row stands and mid-gang Ordner
  const BUILD_SCALE = 2.8125;
  const facadeOpts = {
    widthScale: 1.35,
    heightScale: 1.92,
    taper: 0.32,
  };
  const isMidGang =
    s.blockId === NEUTRAL_BLOCK && s.index === NEUTRAL_MID_GANG_INDEX;
  let size = Math.min(bw, bh) * 0.98 * BUILD_SCALE;
  let pq: ReturnType<typeof scaleQuad> | null = null;
  let facade: ReturnType<typeof boothFacadeQuad> | null = null;
  if (FLOOR_GRID_COUPLE) {
    pq = scaleQuad(boothQuad(s.blockId, s.index), m.width, m.height);
    facade = boothFacadeQuad(s.blockId, s.index, m.width, m.height, facadeOpts);
  }

  const color = teamColor(
    grey && !(s.convertBy && convT > 0.35) ? "neutral" : s.owner,
  );
  const lv = Math.max(1, Math.min(5, s.level || 1));
  const iconSrc = standIconPath(s.building, color, lv);

  /** Pixel size matching a near-row (bottom) Bau building. */
  const nearRowIconSize = (): number => {
    const ref = boothFacadeQuad(HEIM_BLOCK, 3, m.width, m.height, facadeOpts);
    const refW = Math.hypot(ref.br.x - ref.bl.x, ref.br.y - ref.bl.y);
    const refFoot = (ref.bl.y + ref.br.y) / 2;
    const refTop = (ref.tl.y + ref.tr.y) / 2;
    const refH = Math.max(1, refFoot - refTop);
    return Math.max(34, Math.min(refW * 1.05, refH) * BUILD_SCALE);
  };

  let drew = false;
  if (facade && pq) {
    cx = (facade.bl.x + facade.br.x) / 2;
    footY = (facade.bl.y + facade.br.y) / 2;
    const baseW = Math.hypot(facade.br.x - facade.bl.x, facade.br.y - facade.bl.y);
    const topY = (facade.tl.y + facade.tr.y) / 2;
    const facadeH = Math.max(1, footY - topY);
    size = isMidGang
      ? nearRowIconSize()
      : Math.max(34, Math.min(baseW * 1.05, facadeH) * BUILD_SCALE);
    ctx.fillStyle = "rgba(15,23,42,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, footY + 2, baseW * 0.32, baseW * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    drew = drawToyIcon(ctx, iconSrc, cx, footY, size, {
      t: 0,
      phase: 0,
      mode: "planted",
      facing: 1,
      hop: 0,
    });
  }
  if (!drew) {
    ctx.fillStyle = "rgba(15,23,42,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, footY + size * 0.04, size * 0.3, size * 0.075, 0, 0, Math.PI * 2);
    ctx.fill();
    drew = drawToyIcon(ctx, iconSrc, cx, footY, size, {
      t: 0,
      phase: 0,
      mode: "planted",
      facing: 1,
      hop: 0,
    });
  }
  if (!drew) {
    ctx.fillStyle = grey ? "#e2e8f0" : player ? "#eff6ff" : ai ? "#fef2f2" : "#f8fafc";
    roundRect(ctx, x, y, bw, bh, r);
    ctx.fill();
  }

  // Affordable upgrade cue — purple arrow at upper-right of building
  if (player && s.building && !grey) {
    const upCost = m.upgradeCost(s);
    if (upCost != null && m.gold >= upCost) {
      const ah = Math.max(16, size * 0.28);
      const ax = cx + size * 0.28;
      const ay = footY - size * 0.92;
      drawIcon(ctx, UI_ICONS.iconUpgradeArrow, ax - ah / 2, ay - ah / 2, ah, ah, 0.02);
    }
  }

  if (s.convertBy && s.convertAcc > 0.15 && s.building === "fanshop") {
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

  // Leer-trinken Fortschritt an fremden Bierständen
  if (s.building === "bier" && s.beerStealAcc > 0.5) {
    const pct = Math.min(1, s.beerStealAcc / BEER_STEAL_CAPTURE);
    const barW = Math.max(36, size * 0.85);
    const barH = Math.max(11, Math.floor(size * 0.12));
    const barX = cx - barW / 2;
    const barY = footY - size * 1.05;
    ctx.save();
    ctx.fillStyle = "rgba(15,23,42,0.9)";
    ctx.fillRect(barX - 2, barY - 14, barW + 4, barH + 16);
    ctx.fillStyle = "#fde68a";
    ctx.font = `800 ${Math.max(9, Math.floor(barH * 0.95))}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Leer trinken", cx, barY - 2);
    ctx.fillStyle = "rgba(30,41,59,0.98)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.fillStyle = "#fff7ed";
    ctx.font = `700 ${Math.max(8, Math.floor(barH * 0.8))}px Outfit, Manrope, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${Math.floor(s.beerStealAcc)}/${BEER_STEAL_CAPTURE}`,
      cx,
      barY + barH / 2 + 0.5,
    );
    ctx.restore();
  }

  if (s.building === "ordner" && s.structMaxHp > 0) {
    const pct = Math.max(0, Math.min(1, s.structHp / s.structMaxHp));
    const barW = Math.max(28, bw * 0.92);
    const barH = Math.max(10, Math.floor(bh * 0.13));
    const barX = x + (bw - barW) / 2;
    // Sit just above the booth so it doesn't hide under feet / floor grid
    const barY = y + bh * 0.02;
    ctx.fillStyle = "rgba(15,23,42,0.92)";
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    ctx.strokeStyle = "rgba(248,250,252,0.75)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);
    ctx.fillStyle = "rgba(30,41,59,0.98)";
    ctx.fillRect(barX, barY, barW, barH);
    const fillCol =
      pct > 0.55 ? "#22c55e" : pct > 0.28 ? "#f59e0b" : "#ef4444";
    ctx.fillStyle = fillCol;
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(barX, barY, barW * pct, Math.max(3, barH * 0.4));
    // Tiny HP readout for damaged posts
    if (pct < 0.98) {
      ctx.fillStyle = "#f8fafc";
      ctx.font = `800 ${Math.max(9, Math.floor(barH * 0.85))}px Outfit, Manrope, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(pct * 100)}%`, barX + barW / 2, barY + barH / 2 + 0.5);
      ctx.textBaseline = "alphabetic";
    }
  }

  // level pips
  if (!grey || (s.convertBy && convT > 0.5)) {
    const pipW = Math.min(7, (bw - 12) / 5 - 1);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < lv ? "#fde68a" : "rgba(0,0,0,0.45)";
      ctx.fillRect(x + 5 + i * (pipW + 2), y + 3, pipW, 4);
    }
  }

  void sel;

  if (s.building === "bier" && !grey) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + 6, y + bh - 10, bw - 12, 4);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(x + 6, y + bh - 10, (bw - 12) * (s.beer / s.capacity), 4);
  }
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
    const x = f.x * w;
    const y = f.y * h;
    drawMannchen(ctx, m, f, x, y, h);
  }
}

function teamJersey(f: FanUnit): string {
  if (f.team === "ksc") return "#1f6feb";
  if (f.team === "vfb") return "#dc2626";
  // Grey fans stay permanently grey (no lean / capture tint)
  return "#9ca3af";
}

function unitVisualLevel(f: FanUnit): number {
  return Math.max(1, Math.min(5, Math.floor(f.level) || 1));
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

function personAnimMode(m: Match, f: FanUnit): {
  mode: ToyAnimMode;
  hop: number;
  strike: number;
  actionProg: number;
  prop: "beer" | "pyro" | "fist" | "scarf" | "bag" | null;
  propI: number;
} {
  const onGang = f.state === "gang" || f.invading;
  const exiting =
    f.state === "moving" && f.y < gangY() + gangHeight() * 0.22;
  const moving = f.state === "moving" || onGang;
  const fighting =
    (onGang || f.invading || f.isSteward) &&
    (f.armSwing > 0.15 || f.attackCd > 0.05) &&
    f.throwT <= 0;
  const throwing = f.throwT > 0;
  const drinking = f.drinkT > 0;
  const shopping = f.shopT > 0;
  const cheering =
    !moving &&
    !drinking &&
    !shopping &&
    !throwing &&
    (f.cheerT > 0 ||
      (f.team === "ksc" ? m.moodHeim : f.team === "vfb" ? m.moodGaeste : 0) >
        0.7);

  let mode: ToyAnimMode = "idle";
  if (throwing) mode = "throw";
  else if (fighting) mode = "fight";
  else if (drinking) mode = "drink";
  else if (shopping) mode = "shop";
  else if (exiting) mode = "exit";
  else if (moving) mode = "walk";
  else if (cheering) mode = "cheer";

  const throwProg =
    f.throwT > 0 ? 1 - f.throwT / Math.max(0.01, ANIM_THROW_SEC) : 0;
  const drinkProg =
    f.drinkT > 0 ? 1 - f.drinkT / Math.max(0.01, ANIM_DRINK_SEC) : 0;
  const shopProg =
    f.shopT > 0 ? 1 - f.shopT / Math.max(0.01, ANIM_SHOP_SEC) : 0;

  let prop: "beer" | "pyro" | "fist" | "scarf" | "bag" | null = null;
  let propI = 0;
  if (drinking) {
    prop = "beer";
    propI = 0.55 + 0.45 * Math.min(1, drinkProg * 1.2);
  } else if (throwing) {
    prop = "pyro";
    propI = 0.4 + 0.6 * throwProg;
  } else if (fighting) {
    prop = "fist";
    propI = Math.max(f.armSwing, 0.35);
  } else if (shopping) {
    prop = "bag";
    propI = 0.5 + 0.4 * shopProg;
  } else if (cheering && f.kind === "normalos" && !f.isSteward) {
    prop = "scarf";
    propI = Math.min(1, Math.max(0.55, f.cheerT / 3));
  } else if (cheering && f.kind === "ultras") {
    prop = "pyro";
    propI = 0.55 + 0.4 * Math.sin(m.realElapsed * 10);
  } else if (cheering && f.kind === "hooligans") {
    prop = "beer";
    propI = 0.5 + 0.35 * Math.abs(Math.sin(m.realElapsed * 7 + f.id));
  }

  return {
    mode,
    hop: moving || exiting ? 1 : fighting ? 0.7 : 0,
    strike: Math.max(
      f.armSwing,
      fighting ? 0.35 : 0,
      throwing ? 0.5 + 0.5 * throwProg : 0,
      drinking ? 0.4 : 0,
    ),
    actionProg: throwing
      ? throwProg
      : drinking
        ? drinkProg
        : shopping
          ? shopProg
          : Math.max(f.armSwing, fighting ? 0.35 : 0),
    prop,
    propI,
  };
}

/** Draw size by location only — same place ⇒ same size for every unit kind. */
function personDrawSize(f: FanUnit, h: number): number {
  const onGang = f.state === "gang" || f.invading;
  const moving = f.state === "moving" || onGang;
  // +10% vs prior baseline
  return Math.max(28, h * (moving ? 0.0935 : 0.0748));
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
  const size = personDrawSize(f, h);
  const color = teamColor(f.team);
  const lv = unitVisualLevel(f);
  const src = unitIconPath(f.kind, color, lv);
  const phase = (typeof f.id === "number" ? f.id : 0) * 0.73;
  const facing = fanFacing(f);
  const anim = personAnimMode(m, f);

  const drew = drawToyIcon(ctx, src, x, y, size, {
    t: m.realElapsed,
    phase,
    mode: anim.mode,
    facing,
    hop: anim.hop,
    strike: anim.strike,
    actionProg: anim.actionProg,
  });
  if (drew && anim.prop) {
    drawToyProp(
      ctx,
      anim.prop,
      x,
      y,
      size,
      facing,
      m.realElapsed + phase,
      anim.propI,
      teamColor(f.team),
    );
  }
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
  const size = personDrawSize(f, h);
  const s = size / 2.85;
  const neutral = f.team === "neutral";
  const hpCol = neutral ? "#a8a29e" : "#facc15";
  const src = unitIconPath("ordner", teamColor(f.team), unitVisualLevel(f));
  const phase = (typeof f.id === "number" ? f.id : 0) * 0.73;
  const facing =
    f.state === "moving" || f.path.length > f.pathI
      ? fanFacing(f)
      : f.patrolDir < 0
        ? -1
        : 1;
  const anim = personAnimMode(m, f);

  if (
    drawToyIcon(ctx, src, x, y, size, {
      t: m.realElapsed,
      phase,
      mode: anim.mode === "idle" && (f.state === "gang" || f.state === "moving")
        ? "walk"
        : anim.mode,
      facing,
      hop: anim.hop || (f.state === "gang" || f.state === "moving" ? 0.85 : 0),
      strike: anim.strike,
      actionProg: anim.actionProg,
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

/** Map float labels → freigestellte Zuwachs/Abnahme-Icons. */
function floatCurrencyIcon(text: string, good: boolean): string | null {
  const t = text.toLowerCase();
  if (t.includes("bier") || t.includes("fass")) {
    return good ? UI_ICONS.currencyBierPlus : UI_ICONS.currencyBierMinus;
  }
  if (t.includes("sicherheit") || t.includes("sec")) {
    return good ? UI_ICONS.currencySicherheitPlus : UI_ICONS.currencySicherheitMinus;
  }
  if (t.includes("fanartikel") || t.includes("merch") || t.includes("shop")) {
    return good
      ? UI_ICONS.currencyFanartikelPlus
      : UI_ICONS.currencyFanartikelMinus;
  }
  if (t.includes("€") || t.includes("gold")) {
    return good ? UI_ICONS.currencyGoldPlus : UI_ICONS.currencyGoldMinus;
  }
  if (t.includes("stimmung") || t.includes("mood") || t.includes("momentum")) {
    return good ? UI_ICONS.moodPlus : UI_ICONS.moodMinus;
  }
  return null;
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
    const fontPx = Math.max(12, Math.floor(h * 0.026));
    ctx.font = `700 ${fontPx}px Outfit, Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.fillStyle = f.good ? "#6bcb77" : "#f87171";
    const x = f.x * w;
    const y = f.y * h;
    const icon = floatCurrencyIcon(f.text, f.good);
    if (icon) {
      // Currency / mood deltas: change icon only — no amount/label text.
      // ≥2× prior size (was fontPx * 1.55)
      const ih = fontPx * 3.2;
      drawIcon(ctx, icon, x - ih / 2, y - ih / 2, ih, ih, 0.02);
    } else {
      ctx.strokeText(f.text, x, y);
      ctx.fillText(f.text, x, y);
    }
  }
  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";
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
    } else if (p.kind === "flame") {
      const rad = Math.max(5, p.size * h);
      const g = ctx.createRadialGradient(px, py + rad * 0.2, 0, px, py - rad * 0.4, rad);
      g.addColorStop(0, "#fff7ed");
      g.addColorStop(0.35, p.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(px, py + rad * 0.55);
      ctx.quadraticCurveTo(px + rad * 0.7, py, px, py - rad * 0.95);
      ctx.quadraticCurveTo(px - rad * 0.7, py, px, py + rad * 0.55);
      ctx.fill();
      ctx.fillStyle = "rgba(253, 224, 71, 0.7)";
      ctx.beginPath();
      ctx.arc(px, py - rad * 0.15, rad * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "rubble") {
      const rad = Math.max(3, p.size * h);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((p.t * 9 + p.vx * 40) % (Math.PI * 2));
      ctx.fillStyle = p.color;
      ctx.fillRect(-rad * 0.7, -rad * 0.45, rad * 1.4, rad * 0.9);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(-rad * 0.35, -rad * 0.2, rad * 0.55, rad * 0.35);
      ctx.restore();
    } else if (p.kind === "flare" || p.kind === "rocket") {
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
    } else if (p.kind === "mug") {
      const ih = Math.max(10, p.size * h * 2.2);
      drawIcon(ctx, UI_ICONS.currencyBier, px - ih / 2, py - ih / 2, ih, ih, 0.02);
    } else if (
      p.kind === "waitAnger" ||
      p.kind === "waitAngerHot" ||
      p.kind === "moodPlus" ||
      p.kind === "moodMinus"
    ) {
      const src =
        p.kind === "waitAnger"
          ? UI_ICONS.waitAnger
          : p.kind === "waitAngerHot"
            ? UI_ICONS.waitAngerHot
            : p.kind === "moodPlus"
              ? UI_ICONS.moodPlus
              : UI_ICONS.moodMinus;
      const ih = Math.max(14, p.size * h * 2.4);
      drawIcon(ctx, src, px - ih / 2, py - ih / 2, ih, ih, 0.02);
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

function pointInQuad(q: ScreenQuad, mx: number, my: number): boolean {
  const pts = [q.tl, q.tr, q.br, q.bl];
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const yi = pts[i]!.y;
    const yj = pts[j]!.y;
    const xi = pts[i]!.x;
    const xj = pts[j]!.x;
    const intersect =
      yi > my !== yj > my &&
      mx < ((xj - xi) * (my - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function hitSlot(
  m: Match,
  mx: number,
  my: number,
): { blockId: number; index: number } | null {
  let best: { blockId: number; index: number; d: number } | null = null;
  /**
   * Generous touch targets — buildings are large visually but plot AABBs are
   * small; expand well past the booth so Baumenü opens easily (units ignore clicks).
   */
  const minPad = Math.max(36, Math.min(m.width, m.height) * 0.055);
  const expand = Math.max(22, Math.min(m.width, m.height) * 0.032);
  for (const s of m.slots) {
    // AI home plots are not clickable for the player
    if (s.blockId === GAST_BLOCK && s.owner === m.aiTeam && s.building) continue;
    const r = boothRect(s.blockId, s.index);
    let x0 = r.x * m.width - expand;
    let y0 = r.y * m.height - expand;
    let x1 = (r.x + r.w) * m.width + expand;
    let y1 = (r.y + r.h) * m.height + expand;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    if (x1 - x0 < minPad * 2) {
      x0 = cx - minPad;
      x1 = cx + minPad;
    }
    if (y1 - y0 < minPad * 2) {
      y0 = cy - minPad;
      y1 = cy + minPad;
    }
    let hit = mx >= x0 && mx <= x1 && my >= y0 && my <= y1;
    if (FLOOR_GRID_COUPLE) {
      // Expanded cell + radius so large buildings stay easy to tap
      const q = scaleQuad(boothQuad(s.blockId, s.index), m.width, m.height);
      if (pointInQuad(q, mx, my)) hit = true;
      const qcx = (q.tl.x + q.tr.x + q.br.x + q.bl.x) / 4;
      const qcy = (q.tl.y + q.tr.y + q.br.y + q.bl.y) / 4;
      const reach = Math.max(minPad, Math.hypot(q.br.x - q.bl.x, q.br.y - q.bl.y) * 0.85);
      if (Math.hypot(mx - qcx, my - qcy) <= reach) hit = true;
    }
    if (hit) {
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
