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
  /** Seconds left in Bier-trinken pose at stand */
  drinkT: number;
  /** Seconds left in Fanshop browse/buy pose */
  shopT: number;
  /** Seconds left in pyro throw wind-up / release */
  throwT: number;
  /** Ultra sent via Pyro-Kampf — ranged smoker, low HP */
  rangedPyro: boolean;
  /** Sent via Angriff / Pyro Wurf — keep pushing, don't auto-return to seat */
  onOffense: boolean;
  _after?: string;
  _homeSeat?: number | null;
};

/** Hold durations for readable person actions */
export const ANIM_DRINK_SEC = 0.9;
export const ANIM_SHOP_SEC = 0.75;
export const ANIM_THROW_SEC = 0.42;

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

/** Soft currencies at kickoff — enough for one early recruit / mood beat. */
export const START_CURRENCY: Currencies = {
  beer: 6,
  merch: 8,
  security: 8,
};

/** Buy costs — each type tied to its currency */
export const BUY_COST = {
  normalos: { beer: 0, merch: 0, security: 12, gold: 0 },
  ultras: { beer: 0, merch: 14, security: 0, gold: 0 },
  /** Parity with Fans (12) — Bierstand is already the pricey building. */
  hooligans: { beer: 12, merch: 0, security: 0, gold: 0 },
} as const;

export type UnitUiKind = FanKind | "ordner";
export type CostCurrency = "beer" | "merch" | "security" | "gold";

export const UNIT_FULL_LABEL: Record<UnitUiKind, string> = {
  normalos: "Fans",
  ultras: "Ultras",
  hooligans: "Hooligans",
  ordner: "Ordner",
};

export const CURRENCY_LABEL: Record<CostCurrency, string> = {
  beer: "Bier",
  merch: "Fanartikel",
  security: "Sicherheit",
  gold: "Gold",
};

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

/** Volle UI-Namen für Action Cards (Neubau / Upgrade). */
export const BUILDING_FULL_LABEL: Record<BuildingKind, string> = {
  bier: "Bierstand",
  fanshop: "Fanshop",
  ordner: "Ordnerposten",
};

export const UPGRADE_MAX = 5;
export const UPGRADE_COST = [0, 0, 40, 75, 120, 180] as const;

/** Central per-type unit levels (Fans / Ultras / Hooligans / Ordner). */
export const UNIT_UPGRADE_MAX = 5;
/** Gold cost to reach that level — index = target level (1 unused). */
export const UNIT_UPGRADE_COST = [0, 0, 35, 60, 100, 150] as const;

export function unitUpgradeCost(currentLevel: number): number | null {
  if (currentLevel >= UNIT_UPGRADE_MAX) return null;
  return UNIT_UPGRADE_COST[currentLevel + 1] ?? null;
}

/** Stat multiplier from central unit type level (+12% per level above 1). */
export function unitStatMul(level: number): number {
  const lv = Math.max(1, Math.min(UNIT_UPGRADE_MAX, level | 0));
  return 1 + (lv - 1) * 0.12;
}

export function productionRate(level: number): number {
  return 0.7 + level * 0.5;
}

export const MIX_MIN = { normalos: 1, ultras: 1, hooligans: 1 } as const;
export const MIX_MAX = { normalos: 5, ultras: 5, hooligans: 4 } as const;
export const MIX_TOTAL = 8;

export const REGULAR_REAL_SEC = 390;
export const ET_REAL_SEC = 70;
export const FEVER_FROM_MIN = 80;

export const MOOD_CD = {
  gesang: 10,
  pyro: 14,
} as const;

/** Hooligan → Gang (Nahkampf) — beer cost, no CD */
export const HOOLIGAN_ORDER_BEER = 6;
/** Ultra → Gang as ranged Pyro-Kampf — merch cost, no CD */
export const PYRO_FIGHT_MERCH = 6;

export const HIT_DAMAGE = 22;
/** Slower melee cadence — was 0.55; fights should read clearly. */
export const HIT_CD = 1.35;
/** Melee must be nearly overlapping */
export const MELEE_RANGE = 0.14;
/** Fernkämpfer (Bengalo) ≈ 5× Nahkampf */
export const RANGED_RANGE = MELEE_RANGE * 5;

export const ORDNER_POST_HP = 360;
export const ORDNER_POST_HP_PER_LEVEL = 90;
export const HIT_DAMAGE_SCALE = 0.7;
/** Pyro ranged damage scale (vs melee) */
export const RANGED_DAMAGE_SCALE = 0.85;
/** HP multiplier when Ultra enters Pyro-Kampf */
export const PYRO_FIGHT_HP_MUL = 0.45;

export const STEWARD_HIRE_GOLD = 22;

/** Live Kaufkosten für Action Cards — immer aus BUY_COST / STEWARD_HIRE_GOLD. */
export function unitBuyCost(kind: UnitUiKind): {
  amount: number;
  currency: CostCurrency;
} {
  if (kind === "ordner") return { amount: STEWARD_HIRE_GOLD, currency: "gold" };
  const c = BUY_COST[kind];
  if (c.security > 0) return { amount: c.security, currency: "security" };
  if (c.merch > 0) return { amount: c.merch, currency: "merch" };
  if (c.beer > 0) return { amount: c.beer, currency: "beer" };
  return { amount: c.gold, currency: "gold" };
}

export const UNIT_UI_KINDS: UnitUiKind[] = [
  "normalos",
  "ultras",
  "hooligans",
  "ordner",
];

export function defaultUnitLevels(): Record<UnitUiKind, number> {
  return { normalos: 1, ultras: 1, hooligans: 1, ordner: 1 };
}

export const STEWARD_CAP = 2;
/** Slightly slower grey reinforcements — 4 neutral Ordner already gate the mid. */
export const NEUTRAL_STEWARD_RESPAWN = 40;
export const BLOCK_STORM_COUNT = 3;
export const BLOCK_STORM_SEC = 5;
export const STAND_CONVERT_SEC = 11;
export const STAND_CONVERT_SEAT_MAJORITY = true;
export const STEWARD_GOLD_PER_SEC = 0.55;
export const ULTRA_BEER_INTERVAL = 24;
export const NORMALO_BEER_INTERVAL = 28;
export const HOOLIGAN_BEER_INTERVAL = 20;

/** Was 0.2 — Bier lagged Merch/Security and starved Hooligan tempo mid-game. */
export const PROD_BEER = 0.26;
export const PROD_SECURITY = 0.3;
export const PROD_MERCH = 0.34;
export const PROD_SHOP_MOOD = 0.018;

export type MoodAction = "gesang" | "pyro";

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
    maxHp: 300,
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
