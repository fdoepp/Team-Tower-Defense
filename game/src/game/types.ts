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
  seatIndex: number | null;
  standKey: string | null;
  hp: number;
  maxHp: number;
  thirst: number;
  /** realElapsed until thirst rises again after a beer */
  satisfiedUntil: number;
  aggro: number;
  lean: number;
  gangX: number;
  x: number;
  y: number;
  /** waypoints for door/lane pathing */
  path: { x: number; y: number }[];
  pathI: number;
  /** 0..1 swing animation for ultras in combat */
  armSwing: number;
  /** seconds until next discrete hit */
  attackCd: number;
  /** currently invading enemy block */
  invading: boolean;
  /** Ordner from a steward stand — patrols/blocks the gang */
  isSteward: boolean;
  /** slotKey of the ordner stand that spawned this steward */
  homeStandKey: string | null;
  /** path completion mode */
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
  /** 1..UPGRADE_MAX — higher = more production / more stewards */
  level: number;
  /** cooldown until next steward spawn */
  stewardCd: number;
};

/** Currencies for buying fans (capped 0..100) */
export type Currencies = {
  beer: number;
  ordner: number;
  shop: number;
};

export const BUY_COST = {
  ultras: { beer: 40, ordner: 0, shop: 0 },
  normalos: { beer: 0, ordner: 0, shop: 35 },
  familie: { beer: 0, ordner: 30, shop: 0 },
} as const;

export const BUILD_COST: Record<BuildingKind, number> = {
  bier: 50,
  ordner: 45,
  fanshop: 45,
};

export const BUILD_LABEL: Record<BuildingKind, string> = {
  bier: "Bier",
  ordner: "Ordner",
  fanshop: "Shop",
};

/** Max booth upgrade level */
export const UPGRADE_MAX = 5;

/** Gold cost to reach level N (index = level). Level 1 = built. */
export const UPGRADE_COST = [0, 0, 55, 95, 150, 220] as const;

/** Production multiplier by level */
export function productionRate(level: number): number {
  return 0.55 + level * 0.45;
}

export const MIX_MIN = { normalos: 2, ultras: 1, familie: 1 } as const;
export const MIX_MAX = { normalos: 6, ultras: 5, familie: 4 } as const;
export const MIX_TOTAL = 10;

export const REGULAR_REAL_SEC = 390;
export const ET_REAL_SEC = 70;
export const FEVER_FROM_MIN = 80;

export const MOOD_CD = {
  gesang: 12,
  pyro: 16,
  klatschen: 10,
} as const;

export const ULTRA_ORDER_CD = 14;

export const HIT_DAMAGE = 28;
export const HIT_CD = 0.55;
export const INVADE_WIN_COUNT = 3;

export type MoodAction = "gesang" | "pyro" | "klatschen";

export const FAN_STATS: Record<
  FanKind,
  {
    maxHp: number;
    fight: number;
    drink: number;
    mood: number;
    color: string;
    label: string;
  }
> = {
  ultras: {
    maxHp: 100,
    fight: 1.45,
    drink: 0.7,
    mood: 1.1,
    color: "#1f6feb",
    label: "Ultra",
  },
  normalos: {
    maxHp: 80,
    fight: 0.7,
    drink: 1.35,
    mood: 1.25,
    color: "#3ecf6a",
    label: "Normal",
  },
  familie: {
    maxHp: 70,
    fight: 0.35,
    drink: 0.85,
    mood: 0.9,
    color: "#e6b422",
    label: "Familie",
  },
};

export const BLOCK_META = [
  { id: 0, side: "heim" as const, label: "HEIM", fill: "#1f6feb", stripe: "#f3f0e7" },
  { id: 1, side: "neutral" as const, label: "NEUTRAL", fill: "#9ca3af", stripe: "#e5e7eb" },
  { id: 2, side: "neutral" as const, label: "NEUTRAL", fill: "#6b7280", stripe: "#d1d5db" },
  { id: 3, side: "gaeste" as const, label: "GÄSTE", fill: "#dc2626", stripe: "#f3f0e7" },
];
