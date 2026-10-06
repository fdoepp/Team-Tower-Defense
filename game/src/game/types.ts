export type TeamId = "ksc" | "vfb";
export type FanKind = "ultras" | "normalos" | "familie";
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
  /** Seat stays reserved while Ultra is on gang (alive) */
  seatIndex: number | null;
  standKey: string | null;
  hp: number;
  maxHp: number;
  thirst: number;
  /** realElapsed until thirst rises again after one beer */
  satisfiedUntil: number;
  /** shop hunger for familie — time until next fanshop visit */
  shopUntil: number;
  aggro: number;
  /** neutral capture lean -1..1 */
  lean: number;
  /** capture progress 0..1 for neutrals */
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
  _after?: string;
  _homeSeat?: number | null;
};

export type BuildSlot = {
  blockId: number;
  index: number;
  building: BuildingKind | null;
  greyNeutral: boolean;
  /** Fass — NPC beer stock at bierstand */
  beer: number;
  capacity: number;
  owner: TeamId | "neutral" | null;
  level: number;
  stewardCd: number;
  /** seconds of foreign battle-line dominance toward conversion */
  convertAcc: number;
  /** visual production flash 0..1 */
  prodFlash: number;
};

/** Currencies — uncapped (display as integers) */
export type Currencies = {
  beer: number;
  merch: number;
  security: number;
};

export const START_GOLD = 75;

export const BUY_COST = {
  ultras: { beer: 35, merch: 0, gold: 0 },
  normalos: { beer: 0, merch: 30, gold: 0 },
  familie: { beer: 0, merch: 0, gold: 40 },
} as const;

export const BUILD_COST: Record<BuildingKind, number> = {
  bier: 50,
  ordner: 50,
  fanshop: 50,
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

/** Startmix wählbar, Summe 8; Block-Cap = SEATS_PER_BLOCK (12) */
export const MIX_MIN = { normalos: 1, ultras: 1, familie: 1 } as const;
export const MIX_MAX = { normalos: 5, ultras: 5, familie: 4 } as const;
export const MIX_TOTAL = 8;

export const REGULAR_REAL_SEC = 390;
export const ET_REAL_SEC = 70;
export const FEVER_FROM_MIN = 80;

export const MOOD_CD = {
  gesang: 12,
  pyro: 16,
} as const;

export const ULTRA_ORDER_CD = 14;
export const ULTRA_ORDER_BEER = 5;

/** Combat */
export const HIT_DAMAGE = 22;
export const HIT_CD = 0.6;
export const BLOCK_STORM_COUNT = 3;
export const BLOCK_STORM_SEC = 5;
/** Medium stand conversion under battle-line dominance */
export const STAND_CONVERT_SEC = 10;
export const STEWARD_GOLD_PER_SEC = 0.55;
export const SECURITY_FAMILY_GATE = 25;
/** Familie shop visit: gold gained per purchase */
export const FAMILY_SHOP_GOLD = 10;
export const FAMILY_SHOP_INTERVAL = 30;
export const ULTRA_BEER_INTERVAL = 18;
export const NORMALO_BEER_INTERVAL = 28;

export type MoodAction = "gesang" | "pyro";

export const FAN_STATS: Record<
  FanKind,
  {
    maxHp: number;
    /** attack multiplier */
    attack: number;
    /** defense multiplier (damage reduction factor ~1/def) */
    defense: number;
    /** legacy fight ≈ attack for movement pacing */
    fight: number;
    drink: number;
    /** Jubel weight while in block (gang = 0) */
    jubel: number;
    color: string;
    label: string;
  }
> = {
  ultras: {
    maxHp: 110,
    attack: 1.45,
    defense: 0.9,
    fight: 1.45,
    drink: 0.9,
    jubel: 0.85,
    color: "#1f6feb",
    label: "Ultra",
  },
  normalos: {
    maxHp: 75,
    attack: 0.55,
    defense: 0.55,
    fight: 0.7,
    drink: 1.2,
    jubel: 1.0,
    color: "#3ecf6a",
    label: "Normal",
  },
  familie: {
    maxHp: 55,
    attack: 0.25,
    defense: 0.4,
    fight: 0.35,
    drink: 0.5,
    jubel: 0.7,
    color: "#e6b422",
    label: "Familie",
  },
};

/** Steward (Ordner) combat profile — Def > Atk */
export const STEWARD_STATS = {
  maxHpBase: 100,
  maxHpPerLevel: 14,
  attack: 0.7,
  defense: 1.5,
};

export const BLOCK_META = [
  { id: 0, side: "heim" as const, label: "HEIM", fill: "#1f6feb", stripe: "#f3f0e7" },
  { id: 1, side: "neutral" as const, label: "NEUTRAL", fill: "#9ca3af", stripe: "#e5e7eb" },
  { id: 2, side: "neutral" as const, label: "NEUTRAL", fill: "#6b7280", stripe: "#d1d5db" },
  { id: 3, side: "gaeste" as const, label: "GÄSTE", fill: "#dc2626", stripe: "#f3f0e7" },
];
