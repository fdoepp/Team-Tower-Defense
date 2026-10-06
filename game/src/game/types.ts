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

export type FanUnit = {
  id: number;
  kind: FanKind;
  team: TeamId | "neutral";
  /** 0 Heim, 1-3 Neutral, 4 Gäste */
  blockId: number;
  state: FanState;
  /** stand slot key `${blockId}:${slotIndex}` when at stand */
  standKey: string | null;
  hp: number;
  maxHp: number;
  thirst: number;
  aggro: number;
  /** leaning toward a side while neutral: -1 gaeste .. +1 heim */
  lean: number;
  /** 0..1 along gang when in gang/moving */
  gangX: number;
  x: number;
  y: number;
};

export type BuildSlot = {
  blockId: number;
  /** 0,1 = above gang; 2,3 = below gang */
  index: number;
  hasBier: boolean;
  /** grey inactive building in front of neutrals at start */
  greyNeutral: boolean;
  beer: number;
  capacity: number;
  /** who claimed the stand */
  owner: TeamId | "neutral" | null;
};

export const RECRUIT = {
  normalosBeer: 28,
  familieSecurity: 32,
  ultrasFight: 24,
} as const;

export type MoodAction = "gesang" | "pyro" | "klatschen";

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
    fight: 0.45,
    drink: 0.85,
    mood: 0.9,
    color: "#e6b422",
    label: "Familie",
  },
};

export const BLOCK_META = [
  { id: 0, side: "heim" as const, label: "Heim", fill: "#1f6feb", stripe: "#f3f0e7" },
  { id: 1, side: "neutral" as const, label: "N1", fill: "#9ca3af", stripe: "#e5e7eb" },
  { id: 2, side: "neutral" as const, label: "N2", fill: "#6b7280", stripe: "#d1d5db" },
  { id: 3, side: "neutral" as const, label: "N3", fill: "#4b5563", stripe: "#9ca3af" },
  { id: 4, side: "gaeste" as const, label: "Gäste", fill: "#dc2626", stripe: "#f3f0e7" },
];
