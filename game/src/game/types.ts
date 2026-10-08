export type TeamId = "ksc" | "vfb";
/** Fan = Stimmung/Sicherheit/Fanshop · Ultra = Pyro/beide Stände · Hool = Nahkampf/Bier */
export type FanKind = "ultras" | "normalos" | "hooligans";
export type FanMix = Record<FanKind, number>;
export type AiDifficulty = "easy" | "normal" | "hard";
export type AiBehavior =
  | "patient"
  | "balanced"
  | "aggro"
  | "beer"
  | "earlywin";

export type SoloSettings = {
  difficulty: AiDifficulty;
  behavior: AiBehavior;
  playerTeam: TeamId;
};

export type SetupConfig = {
  mix: FanMix;
};

export type MatchPhase = "regular" | "et" | "pens" | "ended";
export type SpeedMode = 0 | 1 | 2;

export type FanState = "block" | "stand" | "gang" | "moving";

export type BuildingKind = "bier" | "ordner" | "fanshop";

export type FanUnit = {
  id: number;
  kind: FanKind;
  team: TeamId | "neutral";
  blockId: number;
  state: FanState;
  seatIndex: number | null;
  standKey: string | null;
  hp: number;
  maxHp: number;
  thirst: number;
  satisfiedUntil: number;
  shopUntil: number;
  aggro: number;
  lean: number;
  captureProg: number;
  gangX: number;
  x: number;
  y: number;
  path: { x: number; y: number }[];
  pathI: number;
  armSwing: number;
  attackCd: number;
  invading: boolean;
  isSteward: boolean;
  homeStandKey: string | null;
  homeBlockId: number;
  patrolDir: number;
  cheerT: number;
  /** Ultra sent via Pyro-Kampf — ranged smoker, low HP */
  rangedPyro: boolean;
  /** Sent via Angriff / Pyro Wurf — keep pushing, don't auto-return to seat */
  onOffense: boolean;
  /** Unit level 1..UPGRADE_MAX — combat + visit payout scale with this */
  level: number;
  _after?: string;
  _homeSeat?: number | null;
};

export type BuildSlot = {
  blockId: number;
  index: number;
  building: BuildingKind | null;
  greyNeutral: boolean;
  beer: number;
  capacity: number;
  owner: TeamId | "neutral" | null;
  level: number;
  stewardCd: number;
  convertAcc: number;
  convertBy: TeamId | null;
  prodFlash: number;
  /** Ordnerposten structural HP — must be destroyed before pushing past */
  structHp: number;
  structMaxHp: number;
};

export type Currencies = {
  beer: number;
  merch: number;
  security: number;
};

export const START_GOLD = 75;
/** Starting Sicherheit; grey mid-post can regen back up to this cap. */
export const START_SECURITY = 50;
/** Without own Ordnerposten, Sicherheit cannot exceed this. */
export const SECURITY_BASE_CAP = 50;
/** Regen toward SECURITY_BASE_CAP from intact grey neutral Ordnerposten when safe. */
export const SECURITY_BASE_REGEN = 0.55;

/** Buy costs — each type tied to its currency (early costs aligned) */
export const BUY_COST = {
  normalos: { beer: 0, merch: 0, security: 12, gold: 0 },
  ultras: { beer: 0, merch: 12, security: 0, gold: 0 },
  hooligans: { beer: 12, merch: 0, security: 0, gold: 0 },
} as const;

export const BUILD_COST: Record<BuildingKind, number> = {
  bier: 65,
  ordner: 45,
  fanshop: 35,
};

export const BUILD_LABEL: Record<BuildingKind, string> = {
  bier: "Bier",
  ordner: "Ordner",
  fanshop: "Shop",
};

export const UPGRADE_MAX = 5;
/** Building upgrade gold to reach level index (Lv2..Lv5) */
export const UPGRADE_COST = [0, 0, 40, 75, 120, 180] as const;
/**
 * Unit upgrade gold to reach level index (Lv2..Lv5).
 * Cheaper than buildings — you upgrade many people.
 */
export const UNIT_UPGRADE_COST = [0, 0, 22, 40, 65, 100] as const;
/** +% HP / Atk / Def / Jubel per level above 1 */
export const UNIT_LEVEL_STAT = 0.14;

export function productionRate(level: number): number {
  return 0.7 + level * 0.5;
}

/** Multiplier for combat / payout stats at unit level */
export function unitLevelMul(level: number): number {
  const lv = Math.max(1, Math.min(UPGRADE_MAX, Math.floor(level) || 1));
  return 1 + (lv - 1) * UNIT_LEVEL_STAT;
}

export function unitUpgradeCost(fromLevel: number): number | null {
  const next = Math.floor(fromLevel) + 1;
  if (next > UPGRADE_MAX) return null;
  return UNIT_UPGRADE_COST[next] ?? null;
}

export const MIX_MIN = { normalos: 1, ultras: 1, hooligans: 1 } as const;
export const MIX_MAX = { normalos: 5, ultras: 5, hooligans: 4 } as const;
export const MIX_TOTAL = 8;

export const REGULAR_REAL_SEC = 390;
export const ET_REAL_SEC = 70;
export const FEVER_FROM_MIN = 80;

/** Hooligan → Gang (Nahkampf) — beer cost, no CD */
export const HOOLIGAN_ORDER_BEER = 8;
/** Ultra → Gang as ranged Pyro-Kampf — merch cost, no CD */
export const PYRO_FIGHT_MERCH = 8;

export const HIT_DAMAGE = 22;
export const HIT_CD = 0.55;
/** Melee must be nearly overlapping */
export const MELEE_RANGE = 0.14;
/** Fernkämpfer (Bengalo) ≈ 5× Nahkampf */
export const RANGED_RANGE = MELEE_RANGE * 5;

/**
 * Gebäude-HP: Lv1 schon klar über jeder Figur (auch Ordner/Hool Lv-max).
 * Ein Posten soll lange stehen — es ist ein Bauwerk, kein Runner.
 */
export const ORDNER_POST_HP = 1100;
export const ORDNER_POST_HP_PER_LEVEL = 220;
export const HIT_DAMAGE_SCALE = 0.7;
/** Pyro ranged damage scale (vs melee) */
export const RANGED_DAMAGE_SCALE = 0.85;
/** Extra damage Ultras deal to Ordnerposten (ranged + melee) */
export const ULTRA_VS_POST_MUL = 1.35;
/** HP multiplier when Ultra enters Pyro-Kampf */
export const PYRO_FIGHT_HP_MUL = 0.65;
/** Cement gate: move speed while pressing the wall */
export const CEMENT_SLOW_MUL = 0.35;
/** Cement gate: HP lost per second while pressing past cement */
export const CEMENT_DOT_PER_SEC = 10;
/**
 * How far past cement edge attackers may creep.
 * 0 = must clear front Ordner/post before advancing (no random walkthrough).
 */
export const CEMENT_BREAKTHROUGH = 0;
/**
 * Standarte / Fortschrittsbalken: base crawl toward living attacker depth
 * (gangX per second). Extra catch-up scales with lag so the banner does
 * not sit still while Ultras walk ahead.
 */
export const BANNER_ADVANCE_SPEED = 0.055;
/** Extra advance per second per gangX of lag behind the attack front */
export const BANNER_CATCHUP = 0.22;
/**
 * Standarte retreat toward the cemented floor — slower than advance so
 * the frontier stays forward and only slowly gives ground.
 */
export const BANNER_RETREAT_SPEED = 0.012;
/** Minimum grey gap between opposing Standarten (gangX). */
export const BANNER_MIN_GAP = 0.05;
/** Standarte / build rights stop this far before an enemy Ordnerpost. */
export const BANNER_POST_STANDOFF = 0.035;

export const STEWARD_HIRE_GOLD = 22;
export const STEWARD_CAP = 2;
export const NEUTRAL_STEWARD_RESPAWN = 32;
export const BLOCK_STORM_COUNT = 4;
export const BLOCK_STORM_SEC = 7;
export const STAND_CONVERT_SEC = 11;
export const STAND_CONVERT_SEAT_MAJORITY = true;
/** Soft gold upkeep per Ordner / s — low enough that defense stays affordable */
export const STEWARD_GOLD_PER_SEC = 0.32;

/**
 * How often each group walks to Bier / Fanshop (real seconds, Lv1).
 * `0` = this group never visits that stand.
 * Fans = Stimmung + Fanshop · Hools = Bier only · Ultras = both (light).
 */
export const VISIT_INTERVAL = {
  normalos: { beer: 0, shop: 26 },
  ultras: { beer: 32, shop: 38 },
  hooligans: { beer: 16, shop: 0 },
} as const;

/** @deprecated use VISIT_INTERVAL — kept as aliases for clarity in call sites */
export const ULTRA_BEER_INTERVAL = VISIT_INTERVAL.ultras.beer;
export const NORMALO_BEER_INTERVAL = VISIT_INTERVAL.normalos.beer;
export const HOOLIGAN_BEER_INTERVAL = VISIT_INTERVAL.hooligans.beer;

/** Gold paid into the till when a unit buys at a Bierstand (Lv1 base) */
export const BEER_VISIT_GOLD = 6;
/** Gold paid into the till when a unit buys at a Fanshop (Lv1 base) */
export const SHOP_VISIT_GOLD = 7;
/** Visit interval shrinks this much per unit level above 1 */
export const VISIT_LEVEL_SPEED = 0.04;

/** `null` = this kind never visits that place */
export function visitInterval(
  kind: FanKind,
  place: "beer" | "shop",
  level: number,
): number | null {
  const base = VISIT_INTERVAL[kind][place];
  if (base <= 0) return null;
  const lv = Math.max(1, Math.min(UPGRADE_MAX, Math.floor(level) || 1));
  return base * (1 - (lv - 1) * VISIT_LEVEL_SPEED);
}

export function canVisit(kind: FanKind, place: "beer" | "shop"): boolean {
  return VISIT_INTERVAL[kind][place] > 0;
}

/** Gold earned by stand owner from one visit (scales with buyer level) */
export function visitGoldPayout(
  place: "beer" | "shop",
  level: number,
): number {
  const base = place === "beer" ? BEER_VISIT_GOLD : SHOP_VISIT_GOLD;
  return Math.max(1, Math.round(base * unitLevelMul(level)));
}

export const PROD_BEER = 0.28;
export const PROD_SECURITY = 0.3;
export const PROD_MERCH = 0.34;
export const PROD_SHOP_MOOD = 0.018;

/** Seconds between pitch goal rolls (before fever) */
export const GOAL_ROLL_INTERVAL = 22;
/** Base p(goal) on a roll; scales with |momentum| */
export const GOAL_P_TOR_BASE = 0.14;
export const GOAL_P_TOR_MOMENTUM = 0.35;
export const GOAL_P_TOR_MIN = 0.08;
export const GOAL_P_TOR_MAX = 0.7;

/** AI start gold bonus over START_GOLD */
export const AI_START_GOLD_BONUS = 5;
/** Soft AI beer/merch regen per second */
export const AI_SOFT_REGEN = 0.4;

export const FAN_STATS: Record<
  FanKind,
  {
    maxHp: number;
    attack: number;
    defense: number;
    fight: number;
    drink: number;
    jubel: number;
    color: string;
    label: string;
  }
> = {
  normalos: {
    maxHp: 150,
    attack: 0.45,
    defense: 0.6,
    fight: 0.55,
    drink: 0.7,
    /** Mood specialist — stays seated, shops merch, drives Stimmung */
    jubel: 1.35,
    color: "#16a34a",
    label: "Fan",
  },
  ultras: {
    maxHp: 140,
    attack: 0.9,
    defense: 0.7,
    /** Schneller als Hools → mehrere Pyro-Würfe bevor Nahkampf */
    fight: 1.15,
    drink: 0.6,
    jubel: 0.85,
    color: "#1f6feb",
    label: "Ultra",
  },
  hooligans: {
    maxHp: 240,
    attack: 1.35,
    defense: 1.05,
    /** Langsamer als Ultras; Nahkampf bleibt über Atk/HP stark */
    fight: 0.72,
    drink: 1.1,
    jubel: 0.75,
    color: "#b45309",
    label: "Hooligan",
  },
};

/**
 * Ordner: niedrigere Basis-HP, dafür langsame Heilung nahe dem Posten.
 * Tempo unter Ultra-Gang-Speed, damit Ultras Abstand halten können.
 */
export const STEWARD_STATS = {
  maxHpBase: 170,
  maxHpPerLevel: 22,
  attack: 0.85,
  defense: 1.25,
  vsUltraMul: 1.2,
  patrolSpeed: 0.05,
  /** Under Ultra gang speed (~0.075) so Ultras can open range for Pyro */
  chaseSpeed: 0.06,
  /** Patrol / heal radius around own post (gangX) */
  postRadius: 0.11,
  chaseRadius: 0.2,
  healPerSec: 10,
};

export const BLOCK_META = [
  { id: 0, side: "heim" as const, label: "HEIM", fill: "#1f6feb", stripe: "#f3f0e7" },
  { id: 1, side: "neutral" as const, label: "NEUTRAL", fill: "#9ca3af", stripe: "#e5e7eb" },
  { id: 2, side: "gaeste" as const, label: "GÄSTE", fill: "#dc2626", stripe: "#f3f0e7" },
];
