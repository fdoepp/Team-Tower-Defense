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
  /** Block whose seat this fan reserves while away (gang/invade) */
  homeBlockId: number;
  /** Ordner patrol direction on gang (−1 / +1) */
  patrolDir: number;
  /** cheer FX timer after Gesang/Pyro */
  cheerT: number;
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
  /** which team is currently converting this stand */
  convertBy: TeamId | null;
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
  /** Günstiger Nachkauf — Einstieg erleichtern */
  ultras: { beer: 22, merch: 0, gold: 0 },
  normalos: { beer: 0, merch: 12, gold: 0 },
  familie: { beer: 0, merch: 0, gold: 18 },
} as const;

/** Differentiated building costs — Bier feeds Ultra loop, Shop feeds Gesang */
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

/** Startmix wählbar, Summe 8; Block-Cap = SEATS_PER_BLOCK (12) */
export const MIX_MIN = { normalos: 1, ultras: 1, familie: 1 } as const;
export const MIX_MAX = { normalos: 5, ultras: 5, familie: 4 } as const;
export const MIX_TOTAL = 8;

export const REGULAR_REAL_SEC = 390;
export const ET_REAL_SEC = 70;
export const FEVER_FROM_MIN = 80;

export const MOOD_CD = {
  /** Gesang oft / stark — Gegenpol zum Ultra-Rush */
  gesang: 10,
  /** Pyro seltener — teilt Bier-Pool mit Ultra-Befehl */
  pyro: 18,
} as const;

/** Ultra→Gang: kein CD — nur Bier-Kosten (Mehrfach-Send möglich) */
export const ULTRA_ORDER_CD = 0;
export const ULTRA_ORDER_BEER = 6;

/** Combat — nur Nahkampf (Einheiten müssen direkt nebeneinander stehen) */
export const HIT_DAMAGE = 22;
export const HIT_CD = 0.55;
/** Max distance (norm coords) to deal damage — adjacent only */
export const MELEE_RANGE = 0.07;
/** Slightly lower hit so higher HP fights last longer in the Gang */
export const HIT_DAMAGE_SCALE = 0.72;
/** Player/AI Ordner manuell anheuern */
export const STEWARD_HIRE_GOLD = 22;
/** Max Ordner pro Posten (Spieler/KI/Neutral) */
export const STEWARD_CAP = 2;
/** Neutraler Ordner: lange Pause nach Tod, bevor er wiederkommt */
export const NEUTRAL_STEWARD_RESPAWN = 32;
export const BLOCK_STORM_COUNT = 3;
export const BLOCK_STORM_SEC = 5;
/** Stand convert only with seat majority — longer timer */
export const STAND_CONVERT_SEC = 11;
/** Convert requires strict seat majority in the booth's block */
export const STAND_CONVERT_SEAT_MAJORITY = true;
export const STEWARD_GOLD_PER_SEC = 0.55;
export const SECURITY_FAMILY_GATE = 25;
/** Familie shop visit: gold gained per purchase */
export const FAMILY_SHOP_GOLD = 14;
export const FAMILY_SHOP_INTERVAL = 26;
export const ULTRA_BEER_INTERVAL = 22;
export const NORMALO_BEER_INTERVAL = 26;

/** Economy production multipliers (currency /s at level rate) */
export const PROD_BEER = 0.2;
export const PROD_SECURITY = 0.3;
export const PROD_MERCH = 0.34;
export const PROD_SHOP_MOOD = 0.018;

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
    maxHp: 260,
    attack: 1.25,
    defense: 0.95,
    fight: 1.4,
    drink: 0.9,
    jubel: 0.75,
    color: "#1f6feb",
    label: "Ultra",
  },
  normalos: {
    maxHp: 160,
    attack: 0.55,
    defense: 0.65,
    fight: 0.7,
    drink: 1.2,
    jubel: 1.2,
    color: "#3ecf6a",
    label: "Normal",
  },
  familie: {
    maxHp: 110,
    attack: 0.25,
    defense: 0.5,
    fight: 0.35,
    drink: 0.5,
    jubel: 0.9,
    color: "#e6b422",
    label: "Familie",
  },
};

/** Steward (Ordner) — durable anti-rush; long Gang brawls */
export const STEWARD_STATS = {
  maxHpBase: 280,
  maxHpPerLevel: 35,
  attack: 0.85,
  defense: 1.25,
  /** bonus multiplier when fighting Ultras */
  vsUltraMul: 1.25,
  /** slow patrol along own gang band */
  patrolSpeed: 0.04,
  /** rush toward infiltrating Ultra */
  chaseSpeed: 0.16,
};

export const BLOCK_META = [
  { id: 0, side: "heim" as const, label: "HEIM", fill: "#1f6feb", stripe: "#f3f0e7" },
  { id: 1, side: "neutral" as const, label: "NEUTRAL", fill: "#9ca3af", stripe: "#e5e7eb" },
  { id: 2, side: "neutral" as const, label: "NEUTRAL", fill: "#6b7280", stripe: "#d1d5db" },
  { id: 3, side: "gaeste" as const, label: "GÄSTE", fill: "#dc2626", stripe: "#f3f0e7" },
];
