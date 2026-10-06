export type TeamId = "ksc" | "vfb";
export type FanKind = "normalos" | "ultras" | "familie";
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

export type BuildKind = "bierstand";
export type SendKind = "ultras" | "normalos" | "familie" | "mix";
export type CurvaAction = "pyro" | "chor";

export type SetupConfig = {
  mix: FanMix;
  /** Start with one free bierstand on nearest lane slot */
  startBier: boolean;
};

export type MatchPhase = "regular" | "et" | "pens" | "ended";
export type SpeedMode = 0 | 1 | 2; // 0 = pause

export type FanUnit = {
  id: number;
  kind: FanKind;
  hp: number;
  maxHp: number;
  thirst: number;
  aggro: number;
  /** 0 = in own curva, 1 = neutral, 2 = fighting on lane tracked separately */
  zone: "curva" | "neutral";
};

export type LaneBlock = {
  id: number;
  team: TeamId;
  /** composition counts */
  ultras: number;
  normalos: number;
  familie: number;
  /** 0 = player goal line (left), 1 = enemy (right) — player advances +x */
  x: number;
  hp: number;
  maxHp: number;
  thirst: number;
  aggro: number;
};

export type BierStand = {
  id: number;
  /** lane slot index 0..4 */
  slot: number;
  owner: TeamId | "neutral";
  beer: number;
  capacity: number;
};

export const MIX_MIN = { normalos: 2, ultras: 1, familie: 1 } as const;
export const MIX_MAX = { normalos: 6, ultras: 5, familie: 4 } as const;
export const MIX_TOTAL = 10;

/** Slower: ~6.5 real minutes for 90' */
export const REGULAR_REAL_SEC = 390;
export const ET_REAL_SEC = 70;
export const FEVER_FROM_MIN = 80;

export const LANE_SLOTS = 5; // buildable bierstand positions along lane

export const COSTS = {
  sendUltras: 40,
  sendNormalos: 30,
  sendFamilie: 35,
  sendMix: 45,
  bierstand: 55,
  pyro: 25,
  chor: 40,
} as const;

export const FAN_STATS: Record<
  FanKind,
  { maxHp: number; fight: number; drink: number; mood: number; income: number; color: string; label: string }
> = {
  ultras: {
    maxHp: 100,
    fight: 1.4,
    drink: 0.7,
    mood: 0.9,
    income: 0.5,
    color: "#1f6feb",
    label: "Ultra",
  },
  normalos: {
    maxHp: 80,
    fight: 0.7,
    drink: 1.4,
    mood: 1.3,
    income: 0.8,
    color: "#6bcb77",
    label: "Normal",
  },
  familie: {
    maxHp: 70,
    fight: 0.45,
    drink: 0.8,
    mood: 0.7,
    income: 1.6,
    color: "#d4a017",
    label: "Familie",
  },
};
