export type TeamId = "ksc" | "vfb";
export type TowerKind = "chor" | "bier" | "gitter" | "pyro" | "schmaeh";
export type FanMix = { normalos: number; ultras: number; familie: number };
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
  startTower: TowerKind;
};

export type GameMode = "solo-versus" | "solo-coop";

export type MatchPhase = "regular" | "et" | "pens" | "ended";

export type EnemyKind = "runner" | "grunt" | "tank" | "swarm" | "boss";

export type TowerDef = {
  kind: TowerKind;
  name: string;
  cost: number;
  range: number;
  dps: number;
  slow: number;
  mood: number;
  beerGen: number;
  aggro: number;
  color: string;
};

export const TOWERS: Record<TowerKind, TowerDef> = {
  chor: {
    kind: "chor",
    name: "Chor",
    cost: 60,
    range: 0,
    dps: 0,
    slow: 0,
    mood: 14,
    beerGen: 0,
    aggro: 2,
    color: "#5b8cff",
  },
  bier: {
    kind: "bier",
    name: "Bierstand",
    cost: 50,
    range: 0,
    dps: 0,
    slow: 0,
    mood: 4,
    beerGen: 3.2,
    aggro: 0,
    color: "#d4a017",
  },
  gitter: {
    kind: "gitter",
    name: "Gitter",
    cost: 55,
    range: 90,
    dps: 10,
    slow: 0.35,
    mood: 1,
    beerGen: 0,
    aggro: 0,
    color: "#8fa39a",
  },
  pyro: {
    kind: "pyro",
    name: "Pyro",
    cost: 80,
    range: 70,
    dps: 6,
    slow: 0,
    mood: 18,
    beerGen: 0,
    aggro: 8,
    color: "#e85d4c",
  },
  schmaeh: {
    kind: "schmaeh",
    name: "Schmäh",
    cost: 65,
    range: 0,
    dps: 0,
    slow: 0,
    mood: 10,
    beerGen: 0,
    aggro: 12,
    color: "#c084fc",
  },
};

export const MIX_MIN = { normalos: 2, ultras: 1, familie: 1 } as const;
export const MIX_MAX = { normalos: 6, ultras: 5, familie: 4 } as const;
export const MIX_TOTAL = 10;

/** Real seconds for 90' — prototype pace (~2.5 min regulär). */
export const REGULAR_REAL_SEC = 150;
export const ET_REAL_SEC = 40;
export const FEVER_FROM_MIN = 80;
