/**
 * Inspired-by club marks (not official trademarks).
 * Distinctive silhouettes + kit colors so matchups read at a glance.
 * National teams use procedural flag paint (kit colors stay separate for tint).
 */
import {
  brandingForSide,
  getClub,
  type Club,
  type ClubId,
  type FlagSpec,
} from "./clubs";

export type LogoMotif =
  | "roundel"
  | "shield"
  | "diamond"
  | "stripesV"
  | "stripesH"
  | "sash"
  | "band"
  | "halved"
  | "star"
  | "clover"
  | "bird"
  | "lion"
  | "eagle"
  | "wolf"
  | "goat"
  | "cat"
  | "owl"
  | "ball"
  | "cross"
  | "crown"
  | "cannon"
  | "anchor"
  | "blades"
  | "tower"
  | "rose"
  | "skull"
  | "ring"
  | "tri"
  | "hex"
  | "check"
  | "flame";

type LogoSpec = {
  motif: LogoMotif;
  /** Optional monogram override (defaults to club.short) */
  mono?: string;
  /** Swap primary/secondary for pattern fields (e.g. BVB yellow on black) */
  swap?: boolean;
};

/** Motifs loosely evoke well-known crests without copying artwork. */
const LOGO_SPEC: Record<string, LogoSpec> = {
  ksc: { motif: "diamond" },
  vfb: { motif: "shield" },
  bvb: { motif: "stripesV", swap: true },
  schalke: { motif: "shield" },
  hsv: { motif: "diamond" },
  stpauli: { motif: "skull" },
  leverkusen: { motif: "cross" },
  koeln: { motif: "goat" },
  liverpool: { motif: "bird" },
  manutd: { motif: "flame" },
  arsenal: { motif: "cannon" },
  tottenham: { motif: "bird" },
  newcastle: { motif: "stripesV" },
  sunderland: { motif: "cat" },
  portsmouth: { motif: "star" },
  southampton: { motif: "rose" },
  sheffutd: { motif: "blades" },
  sheffwed: { motif: "owl" },
  barcelona: { motif: "stripesV" },
  realmadrid: { motif: "crown" },
  athletic: { motif: "stripesV" },
  realsociedad: { motif: "stripesV" },
  betis: { motif: "stripesV" },
  sevilla: { motif: "roundel" },
  lazio: { motif: "eagle" },
  roma: { motif: "wolf" },
  acmilan: { motif: "stripesV" },
  inter: { motif: "stripesV" },
  genoa: { motif: "halved" },
  sampdoria: { motif: "ring" },
  marseille: { motif: "star" },
  psg: { motif: "tower" },
  lyon: { motif: "lion" },
  saintetienne: { motif: "roundel" },
  celtic: { motif: "clover" },
  rangers: { motif: "lion" },
  glentoran: { motif: "roundel" },
  linfield: { motif: "shield" },
  ajax: { motif: "tri" },
  feyenoord: { motif: "halved" },
  benfica: { motif: "eagle" },
  sporting: { motif: "lion" },
  olympiacos: { motif: "stripesV" },
  panathinaikos: { motif: "clover" },
  fenerbahce: { motif: "star" },
  galatasaray: { motif: "lion" },
  partizan: { motif: "halved" },
  redstar: { motif: "star" },
  hajduk: { motif: "shield" },
  dinamozagreb: { motif: "diamond" },
  velez: { motif: "roundel" },
  zrinjski: { motif: "shield" },
  dinamobuc: { motif: "roundel" },
  fcsb: { motif: "star" },
  cskasofia: { motif: "roundel" },
  levski: { motif: "shield" },
  dynamomoscow: { motif: "diamond" },
  spartakmoscow: { motif: "diamond" },
  boca: { motif: "band" },
  river: { motif: "sash" },
  nacional: { motif: "roundel" },
  penarol: { motif: "stripesV", swap: true },
  gremio: { motif: "stripesH" },
  internacional: { motif: "roundel" },
  flamengo: { motif: "stripesH" },
  fluminense: { motif: "stripesH" },
  corinthians: { motif: "roundel" },
  palmeiras: { motif: "roundel" },
  bahia: { motif: "halved" },
  vitoria: { motif: "stripesV" },
  independiente: { motif: "roundel" },
  racing: { motif: "roundel" },
  newells: { motif: "halved" },
  rosario: { motif: "band" },
  cerro: { motif: "halved" },
  olimpia: { motif: "roundel" },
  alianza: { motif: "stripesV" },
  universitario: { motif: "roundel" },
  america_cali: { motif: "roundel" },
  deporcali: { motif: "roundel" },
  colocolo: { motif: "shield" },
  udechile: { motif: "roundel" },
  blooming: { motif: "roundel" },
  oriente: { motif: "roundel" },
  barcelona_ecu: { motif: "roundel" },
  emelec: { motif: "roundel" },
  everton_chile: { motif: "roundel" },
  santiagow: { motif: "roundel" },
  alahly: { motif: "eagle" },
  zamalek: { motif: "roundel" },
  chivas: { motif: "stripesV" },
  clubamerica: { motif: "eagle" },
  raja: { motif: "eagle" },
  wydad: { motif: "roundel" },
  esteghlal: { motif: "roundel" },
  persepolis: { motif: "roundel" },
  kaizer: { motif: "flame" },
  orlando: { motif: "skull" },
  fcseoul: { motif: "roundel" },
  suwon: { motif: "roundel" },
  eastbengal: { motif: "flame" },
  mohunbagan: { motif: "roundel" },
  portland: { motif: "tri" },
  seattle: { motif: "hex" },
};

function specFor(clubId: string): LogoSpec {
  return LOGO_SPEC[clubId] ?? { motif: "roundel" };
}

function isDark(hex: string): boolean {
  const h = hex.replace("#", "").toLowerCase();
  if (h === "000" || h === "000000") return true;
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 120;
}

function inkOn(prim: string, sec: string): string {
  if (isDark(prim)) return "#f8fafc";
  if (sec === "#FFFFFF" || sec.toLowerCase() === "#fff") return "#0f172a";
  if (isDark(sec)) return "#f8fafc";
  return sec;
}

function strokeOn(sec: string): string {
  if (sec === "#FFFFFF" || sec.toLowerCase() === "#fff") return "rgba(248,250,252,0.92)";
  return sec;
}

function clipCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  paint: () => void,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  paint();
  ctx.restore();
}

function fillShield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string,
): void {
  const top = cy - r * 0.95;
  const bot = cy + r * 0.98;
  const left = cx - r * 0.78;
  const right = cx + r * 0.78;
  ctx.beginPath();
  ctx.moveTo(left, top + r * 0.15);
  ctx.quadraticCurveTo(left, top, cx, top);
  ctx.quadraticCurveTo(right, top, right, top + r * 0.15);
  ctx.lineTo(right, cy + r * 0.15);
  ctx.quadraticCurveTo(cx, bot, cx, bot);
  ctx.quadraticCurveTo(cx, bot, left, cy + r * 0.15);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawMotifIcon(
  ctx: CanvasRenderingContext2D,
  motif: LogoMotif,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.2, r * 0.08);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  switch (motif) {
    case "star": {
      const spikes = 5;
      const outer = r * 0.55;
      const inner = r * 0.24;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / spikes;
        const rad = i % 2 === 0 ? outer : inner;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "clover": {
      for (const [dx, dy] of [
        [0, -0.28],
        [0.28, 0],
        [0, 0.28],
        [-0.28, 0],
      ] as const) {
        ctx.beginPath();
        ctx.arc(cx + dx * r, cy + dy * r, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillRect(cx - r * 0.06, cy + r * 0.1, r * 0.12, r * 0.42);
      break;
    }
    case "bird": {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.45, cy + r * 0.1);
      ctx.quadraticCurveTo(cx - r * 0.1, cy - r * 0.45, cx + r * 0.15, cy - r * 0.15);
      ctx.quadraticCurveTo(cx + r * 0.45, cy - r * 0.35, cx + r * 0.5, cy - r * 0.05);
      ctx.quadraticCurveTo(cx + r * 0.2, cy + r * 0.05, cx + r * 0.05, cy + r * 0.25);
      ctx.quadraticCurveTo(cx - r * 0.15, cy + r * 0.45, cx - r * 0.45, cy + r * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "lion": {
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.05, r * 0.28, r * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      // mane ticks
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.28, cy - r * 0.05 + Math.sin(a) * r * 0.32);
        ctx.lineTo(cx + Math.cos(a) * r * 0.48, cy - r * 0.05 + Math.sin(a) * r * 0.5);
        ctx.stroke();
      }
      break;
    }
    case "eagle": {
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.35);
      ctx.lineTo(cx - r * 0.55, cy - r * 0.15);
      ctx.quadraticCurveTo(cx - r * 0.15, cy - r * 0.35, cx, cy - r * 0.2);
      ctx.quadraticCurveTo(cx + r * 0.15, cy - r * 0.35, cx + r * 0.55, cy - r * 0.15);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "wolf": {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.4, cy + r * 0.25);
      ctx.lineTo(cx - r * 0.35, cy - r * 0.35);
      ctx.lineTo(cx - r * 0.1, cy - r * 0.05);
      ctx.lineTo(cx, cy - r * 0.4);
      ctx.lineTo(cx + r * 0.1, cy - r * 0.05);
      ctx.lineTo(cx + r * 0.35, cy - r * 0.35);
      ctx.lineTo(cx + r * 0.4, cy + r * 0.25);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "goat": {
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.05, r * 0.28, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.2, cy - r * 0.15);
      ctx.quadraticCurveTo(cx - r * 0.45, cy - r * 0.55, cx - r * 0.15, cy - r * 0.35);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.2, cy - r * 0.15);
      ctx.quadraticCurveTo(cx + r * 0.45, cy - r * 0.55, cx + r * 0.15, cy - r * 0.35);
      ctx.fill();
      break;
    }
    case "cat": {
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.05, r * 0.3, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.28, cy - r * 0.05);
      ctx.lineTo(cx - r * 0.35, cy - r * 0.45);
      ctx.lineTo(cx - r * 0.08, cy - r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.28, cy - r * 0.05);
      ctx.lineTo(cx + r * 0.35, cy - r * 0.45);
      ctx.lineTo(cx + r * 0.08, cy - r * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "owl": {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.32, r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isDark(color) ? "#f8fafc" : color;
      // eyes punched with contrasting fill later — keep solid silhouette
      break;
    }
    case "ball": {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.08, r * 0.14, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.14, cy - r * 0.08 + Math.sin(a) * r * 0.14);
        ctx.lineTo(cx + Math.cos(a) * r * 0.4, cy + Math.sin(a) * r * 0.4);
        ctx.stroke();
      }
      break;
    }
    case "cross": {
      const t = r * 0.16;
      ctx.fillRect(cx - t, cy - r * 0.48, t * 2, r * 0.96);
      ctx.fillRect(cx - r * 0.48, cy - t, r * 0.96, t * 2);
      break;
    }
    case "crown": {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.45, cy + r * 0.2);
      ctx.lineTo(cx - r * 0.45, cy - r * 0.05);
      ctx.lineTo(cx - r * 0.2, cy + r * 0.1);
      ctx.lineTo(cx, cy - r * 0.35);
      ctx.lineTo(cx + r * 0.2, cy + r * 0.1);
      ctx.lineTo(cx + r * 0.45, cy - r * 0.05);
      ctx.lineTo(cx + r * 0.45, cy + r * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "cannon": {
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.05, cy + r * 0.05, r * 0.42, r * 0.16, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx + r * 0.25, cy - r * 0.12, r * 0.28, r * 0.14);
      ctx.beginPath();
      ctx.arc(cx - r * 0.25, cy + r * 0.28, r * 0.12, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.05, cy + r * 0.3, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "anchor": {
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.28, r * 0.14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.14);
      ctx.lineTo(cx, cy + r * 0.35);
      ctx.moveTo(cx - r * 0.22, cy - r * 0.02);
      ctx.lineTo(cx + r * 0.22, cy - r * 0.02);
      ctx.moveTo(cx, cy + r * 0.35);
      ctx.quadraticCurveTo(cx - r * 0.4, cy + r * 0.15, cx - r * 0.4, cy + r * 0.05);
      ctx.moveTo(cx, cy + r * 0.35);
      ctx.quadraticCurveTo(cx + r * 0.4, cy + r * 0.15, cx + r * 0.4, cy + r * 0.05);
      ctx.stroke();
      break;
    }
    case "blades": {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.35, cy + r * 0.4);
      ctx.lineTo(cx - r * 0.15, cy - r * 0.45);
      ctx.lineTo(cx - r * 0.02, cy - r * 0.35);
      ctx.lineTo(cx - r * 0.18, cy + r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.35, cy + r * 0.4);
      ctx.lineTo(cx + r * 0.15, cy - r * 0.45);
      ctx.lineTo(cx + r * 0.02, cy - r * 0.35);
      ctx.lineTo(cx + r * 0.18, cy + r * 0.4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "tower": {
      ctx.fillRect(cx - r * 0.18, cy - r * 0.15, r * 0.36, r * 0.55);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.28, cy - r * 0.15);
      ctx.lineTo(cx, cy - r * 0.5);
      ctx.lineTo(cx + r * 0.28, cy - r * 0.15);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "rose": {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(
          cx + Math.cos(a) * r * 0.22,
          cy + Math.sin(a) * r * 0.22,
          r * 0.16,
          r * 0.12,
          a,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "skull": {
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.08, r * 0.32, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - r * 0.18, cy + r * 0.12, r * 0.36, r * 0.2);
      break;
    }
    case "ring": {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(2, r * 0.14);
      ctx.stroke();
      break;
    }
    case "tri": {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.48);
      ctx.lineTo(cx + r * 0.45, cy + r * 0.38);
      ctx.lineTo(cx - r * 0.45, cy + r * 0.38);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "hex": {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        const x = cx + Math.cos(a) * r * 0.5;
        const y = cy + Math.sin(a) * r * 0.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "check": {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.35, cy);
      ctx.lineTo(cx - r * 0.1, cy + r * 0.3);
      ctx.lineTo(cx + r * 0.4, cy - r * 0.3);
      ctx.lineWidth = Math.max(2.5, r * 0.16);
      ctx.stroke();
      break;
    }
    case "flame": {
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.4);
      ctx.quadraticCurveTo(cx - r * 0.45, cy + r * 0.05, cx - r * 0.15, cy - r * 0.25);
      ctx.quadraticCurveTo(cx - r * 0.05, cy - r * 0.05, cx, cy - r * 0.45);
      ctx.quadraticCurveTo(cx + r * 0.05, cy - r * 0.05, cx + r * 0.15, cy - r * 0.25);
      ctx.quadraticCurveTo(cx + r * 0.45, cy + r * 0.05, cx, cy + r * 0.4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      break;
  }
}

function paintPatternBackground(
  ctx: CanvasRenderingContext2D,
  motif: LogoMotif,
  cx: number,
  cy: number,
  r: number,
  prim: string,
  sec: string,
): void {
  ctx.fillStyle = prim;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  if (motif === "stripesV") {
    clipCircle(ctx, cx, cy, r, () => {
      const n = 5;
      const w = (r * 2) / n;
      for (let i = 0; i < n; i++) {
        if (i % 2 === 0) continue;
        ctx.fillStyle = sec;
        ctx.fillRect(cx - r + i * w, cy - r, w + 0.5, r * 2);
      }
    });
  } else if (motif === "stripesH") {
    clipCircle(ctx, cx, cy, r, () => {
      const n = 5;
      const h = (r * 2) / n;
      for (let i = 0; i < n; i++) {
        if (i % 2 === 0) continue;
        ctx.fillStyle = sec;
        ctx.fillRect(cx - r, cy - r + i * h, r * 2, h + 0.5);
      }
    });
  } else if (motif === "sash") {
    // White/light field + diagonal primary sash (River-style), else prim field + sec sash
    const whiteSec =
      sec === "#FFFFFF" || sec.toLowerCase() === "#fff";
    if (whiteSec) {
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      clipCircle(ctx, cx, cy, r, () => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.65);
        ctx.fillStyle = prim;
        ctx.fillRect(-r * 1.2, -r * 0.18, r * 2.4, r * 0.36);
        ctx.restore();
      });
    } else {
      clipCircle(ctx, cx, cy, r, () => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.65);
        ctx.fillStyle = sec;
        ctx.fillRect(-r * 1.2, -r * 0.18, r * 2.4, r * 0.36);
        ctx.restore();
      });
    }
  } else if (motif === "band") {
    clipCircle(ctx, cx, cy, r, () => {
      ctx.fillStyle = sec;
      ctx.fillRect(cx - r, cy - r * 0.22, r * 2, r * 0.44);
    });
  } else if (motif === "halved") {
    clipCircle(ctx, cx, cy, r, () => {
      ctx.fillStyle = sec;
      ctx.fillRect(cx, cy - r, r, r * 2);
    });
  } else if (motif === "diamond") {
    ctx.fillStyle = prim;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = sec;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.72);
    ctx.lineTo(cx + r * 0.55, cy);
    ctx.lineTo(cx, cy + r * 0.72);
    ctx.lineTo(cx - r * 0.55, cy);
    ctx.closePath();
    ctx.fill();
  } else if (motif === "shield") {
    ctx.fillStyle = "rgba(0,0,0,0)";
    // clear circle then shield
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = prim;
    ctx.fill();
    fillShield(ctx, cx, cy, r * 0.92, prim);
    ctx.strokeStyle = strokeOn(sec);
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    fillShield(ctx, cx, cy, r * 0.92, prim);
    ctx.stroke();
  } else if (motif === "check") {
    clipCircle(ctx, cx, cy, r, () => {
      const cell = r * 0.45;
      for (let y = -2; y <= 2; y++) {
        for (let x = -2; x <= 2; x++) {
          if ((x + y) % 2 !== 0) continue;
          ctx.fillStyle = sec;
          ctx.fillRect(cx + x * cell, cy + y * cell, cell + 0.5, cell + 0.5);
        }
      }
    });
  }
}

const ICON_MOTIFS = new Set<LogoMotif>([
  "star",
  "clover",
  "bird",
  "lion",
  "eagle",
  "wolf",
  "goat",
  "cat",
  "owl",
  "ball",
  "cross",
  "crown",
  "cannon",
  "anchor",
  "blades",
  "tower",
  "rose",
  "skull",
  "ring",
  "tri",
  "hex",
  "flame",
]);

function drawMono(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  r: number,
  color: string,
  scale = 0.78,
): void {
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let px = Math.max(8, Math.floor(r * scale));
  ctx.font = `900 ${px}px Outfit, Manrope, system-ui, sans-serif`;
  while (px > 6 && ctx.measureText(text).width > r * 1.55) {
    px -= 1;
    ctx.font = `900 ${px}px Outfit, Manrope, system-ui, sans-serif`;
  }
  ctx.fillText(text, cx, cy + 0.5);
}

/** Paint a flag into a rectangle (top-left x,y). */
export function drawFlagRect(
  ctx: CanvasRenderingContext2D,
  flag: FlagSpec,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (flag.style === "h") {
    const n = Math.max(1, flag.colors.length);
    const sh = h / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = flag.colors[i] ?? "#888";
      ctx.fillRect(x, y + i * sh, w, sh + 0.5);
    }
  } else if (flag.style === "v") {
    const n = Math.max(1, flag.colors.length);
    const sw = w / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = flag.colors[i] ?? "#888";
      ctx.fillRect(x + i * sw, y, sw + 0.5, h);
    }
  } else if (flag.style === "cross") {
    ctx.fillStyle = flag.field;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = flag.cross;
    const tw = Math.max(2, w * 0.18);
    const th = Math.max(2, h * 0.18);
    ctx.fillRect(x + (w - tw) / 2, y, tw, h);
    ctx.fillRect(x, y + (h - th) / 2, w, th);
  } else if (flag.style === "nordic") {
    ctx.fillStyle = flag.field;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = flag.cross;
    const tw = Math.max(2, w * 0.16);
    const th = Math.max(2, h * 0.18);
    const cx = x + w * 0.36;
    ctx.fillRect(cx - tw / 2, y, tw, h);
    ctx.fillRect(x, y + (h - th) / 2, w, th);
  } else if (flag.style === "circle") {
    ctx.fillStyle = flag.field;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = flag.disc;
    const rr = Math.min(w, h) * 0.28;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, rr, 0, Math.PI * 2);
    ctx.fill();
  } else if (flag.style === "saltire") {
    ctx.fillStyle = flag.field;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = flag.saltire;
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.16);
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

/** Small handheld / standard flag with pole. */
export function drawFlagOnPole(
  ctx: CanvasRenderingContext2D,
  flag: FlagSpec,
  footX: number,
  footY: number,
  size: number,
  wave = 0,
): void {
  const poleH = size * 0.92;
  const fw = size * 0.58;
  const fh = size * 0.38;
  const topY = footY - poleH;
  const flutter = Math.sin(wave) * size * 0.02;
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.28)";
  ctx.beginPath();
  ctx.ellipse(footX, footY + 2, size * 0.18, size * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = Math.max(2, size * 0.04);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(footX, footY);
  ctx.lineTo(footX, topY);
  ctx.stroke();
  // Slight perspective warp via two quads is overkill — rect + wave offset.
  drawFlagRect(ctx, flag, footX + 1, topY + flutter, fw, fh);
  ctx.strokeStyle = "rgba(15,23,42,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(footX + 1, topY + flutter, fw, fh);
  ctx.restore();
}

/**
 * Draw an inspired club mark centered at (cx,cy) with outer radius `r`.
 */
export function drawClubLogo(
  ctx: CanvasRenderingContext2D,
  clubId: ClubId,
  cx: number,
  cy: number,
  r: number,
): void {
  let club: Club;
  try {
    club = getClub(clubId);
  } catch {
    club = getClub("ksc");
  }

  // Nationals: circular flag badge + short code
  if (club.kind === "national" && club.flag) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = club.primary;
    ctx.fill();
    clipCircle(ctx, cx, cy, r * 0.92, () => {
      drawFlagRect(ctx, club.flag!, cx - r, cy - r, r * 2, r * 2);
    });
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = strokeOn(club.secondary);
    ctx.lineWidth = Math.max(1.5, r * 0.1);
    ctx.stroke();
    if (r >= 14) {
      // Soft plate behind monogram for readability on busy flags
      ctx.fillStyle = "rgba(15,23,42,0.45)";
      const bw = r * 1.15;
      const bh = r * 0.42;
      ctx.fillRect(cx - bw / 2, cy + r * 0.28, bw, bh);
      drawMono(ctx, club.short, cx, cy + r * 0.5, r * 0.55, "#f8fafc", 0.78);
    }
    return;
  }

  const spec = specFor(club.id);
  const { motif } = spec;
  const prim = spec.swap ? club.secondary : club.primary;
  const sec = spec.swap ? club.primary : club.secondary;
  const ink = inkOn(prim, sec);

  // Outer disc / pattern
  if (
    motif === "stripesV" ||
    motif === "stripesH" ||
    motif === "sash" ||
    motif === "band" ||
    motif === "halved" ||
    motif === "diamond" ||
    motif === "shield" ||
    motif === "check"
  ) {
    paintPatternBackground(ctx, motif, cx, cy, r, prim, sec);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = prim;
    ctx.fill();
  }

  // Rim
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = strokeOn(sec);
  ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.stroke();

  if (ICON_MOTIFS.has(motif)) {
    const iconInk =
      motif === "ring" || motif === "ball" || motif === "anchor"
        ? ink
        : isDark(prim)
          ? "#f8fafc"
          : ink;
    if (r >= 20) {
      drawMotifIcon(ctx, motif, cx, cy - r * 0.12, r * 0.85, iconInk);
      drawMono(ctx, club.short, cx, cy + r * 0.58, r * 0.5, iconInk, 0.72);
    } else {
      drawMotifIcon(ctx, motif, cx, cy, r * 0.95, iconInk);
    }
  } else {
    // Pattern motifs: monogram on top
    const monoInk =
      motif === "sash" && (sec === "#FFFFFF" || sec.toLowerCase() === "#fff")
        ? "#0f172a"
        : motif === "diamond" && !isDark(sec)
          ? isDark(prim)
            ? "#f8fafc"
            : "#0f172a"
          : ink;
    // For diamond, put mono in center over secondary diamond
    if (motif === "diamond") {
      drawMono(
        ctx,
        club.short,
        cx,
        cy,
        r,
        isDark(sec) ? "#f8fafc" : isDark(prim) ? prim : "#0f172a",
        0.7,
      );
    } else if (motif === "shield") {
      drawMono(ctx, club.short, cx, cy + r * 0.05, r * 0.85, ink, 0.72);
    } else {
      drawMono(ctx, club.short, cx, cy, r, monoInk, 0.72);
    }
  }
}

/** Draw logo for a side slot using live branding. */
export function drawSideClubLogo(
  ctx: CanvasRenderingContext2D,
  side: "ksc" | "vfb",
  cx: number,
  cy: number,
  r: number,
): void {
  const brand = brandingForSide(side);
  drawClubLogo(ctx, brand?.id ?? side, cx, cy, r);
}

const dataUrlCache = new Map<string, string>();

/** Cached PNG data-URL for DOM (menu kit swatches, HUD). */
export function clubLogoDataUrl(clubId: ClubId, size = 64): string {
  const key = `${clubId}@${size}`;
  const hit = dataUrlCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  drawClubLogo(ctx, clubId, size / 2, size / 2, size * 0.46);
  const url = canvas.toDataURL("image/png");
  dataUrlCache.set(key, url);
  return url;
}

export function clearClubLogoCache(): void {
  dataUrlCache.clear();
}

export function logoMotifFor(clubId: ClubId): LogoMotif {
  return specFor(clubId).motif;
}
