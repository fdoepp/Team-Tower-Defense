export type TeamId = "ksc" | "vfb";
/** Fan (normalos) = Gesang/Sicherheit · Ultra = Pyro/Fanartikel · Hooligan = Nahkampf/Bier */
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

/** Buy costs — each type tied to its currency */
export const BUY_COST = {
  normalos: { beer: 0, merch: 0, security: 10, gold: 0 },
  ultras: { beer: 0, merch: 14, security: 0, gold: 0 },
  hooligans: { beer: 14, merch: 0, security: 0, gold: 0 },
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
export const UPGRADE_COST = [0, 0, 40, 75, 120, 180] as const;

export function productionRate(level: number): number {
  return 0.7 + level * 0.5;
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

export const ORDNER_POST_HP = 280;
export const ORDNER_POST_HP_PER_LEVEL = 90;
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

export const STEWARD_HIRE_GOLD = 22;
export const STEWARD_CAP = 2;
export const NEUTRAL_STEWARD_RESPAWN = 32;
export const BLOCK_STORM_COUNT = 4;
export const BLOCK_STORM_SEC = 7;
export const STAND_CONVERT_SEC = 11;
export const STAND_CONVERT_SEAT_MAJORITY = true;
export const STEWARD_GOLD_PER_SEC = 0.55;
export const ULTRA_BEER_INTERVAL = 24;
export const NORMALO_BEER_INTERVAL = 28;
export const HOOLIGAN_BEER_INTERVAL = 20;

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
    jubel: 1.25,
    color: "#16a34a",
    label: "Fan",
  },
  ultras: {
    maxHp: 140,
    attack: 0.9,
    defense: 0.7,
    fight: 1.1,
    drink: 0.6,
    jubel: 0.85,
    color: "#1f6feb",
    label: "Ultra",
  },
  hooligans: {
    maxHp: 240,
    attack: 1.35,
    defense: 1.05,
    fight: 1.45,
    drink: 1.1,
    jubel: 0.55,
    color: "#b45309",
    label: "Hooligan",
  },
};

export const STEWARD_STATS = {
  maxHpBase: 280,
  maxHpPerLevel: 35,
  attack: 0.85,
  defense: 1.25,
  vsUltraMul: 1.2,
  patrolSpeed: 0.12,
  chaseSpeed: 0.2,
};

export const BLOCK_META = [
  { id: 0, side: "heim" as const, label: "HEIM", fill: "#1f6feb", stripe: "#f3f0e7" },
  { id: 1, side: "neutral" as const, label: "NEUTRAL", fill: "#9ca3af", stripe: "#e5e7eb" },
  { id: 2, side: "gaeste" as const, label: "GÄSTE", fill: "#dc2626", stripe: "#f3f0e7" },
];
