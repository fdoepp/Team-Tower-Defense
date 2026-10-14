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

/**
 * Side slots stay ksc|vfb for game logic; clubs supply labels + kit colors.
 * playerTeam = which SIDE the human plays (left/heim = ksc, right/gast = vfb).
 */
export type SoloSettings = {
  difficulty: AiDifficulty;
  behavior: AiBehavior;
  playerTeam: TeamId;
  /** Club branding for the player's side */
  playerClub: string;
  /** Club branding for the AI side */
  aiClub: string;
  /** Optional derby preset id (for UI / rematch) */
  derbyId?: string;
};

/**
 * Start + Verlaufsprofil je Schwierigkeit (Mittel = "normal").
 * Zahlen sind relative Multiplikatoren / absolute Startwerte für die KI.
 */
export type DiffProfile = {
  /** AI start lineup (sum = MIX_TOTAL) */
  aiMix: FanMix;
  aiGoldBonus: number;
  aiStartMerch: number;
  aiStartBeer: number;
  aiStartSecurityBonus: number;
  /** Starting unit level for AI Ultras/Hools/Fans */
  aiUnitTech: number;
  regenMul: number;
  actionMul: number;
  /** Higher = faster AI decision ticks */
  tickMul: number;
  fanTarget: number;
  gangWant: number;
  sendChanceMul: number;
  /** Progression: minute gates + bonuses */
  midMinute: number;
  lateMinute: number;
  midGangBonus: number;
  lateGangBonus: number;
  midRegenBonus: number;
  lateRegenBonus: number;
  midActionBonus: number;
  lateActionBonus: number;
};

export function difficultyProfile(d: AiDifficulty): DiffProfile {
  if (d === "easy") {
    // Langsamer, weniger Start — erreicht trotzdem Lv5 / volle Plots
    return {
      aiMix: { normalos: 4, ultras: 2, hooligans: 2 },
      aiGoldBonus: 0,
      aiStartMerch: 0,
      aiStartBeer: 0,
      aiStartSecurityBonus: 0,
      aiUnitTech: 1,
      regenMul: 0.8,
      actionMul: 0.7,
      tickMul: 0.75,
      fanTarget: 12,
      gangWant: 1,
      sendChanceMul: 0.85,
      midMinute: 28,
      lateMinute: 52,
      midGangBonus: 0,
      lateGangBonus: 1,
      midRegenBonus: 0.12,
      lateRegenBonus: 0.22,
      midActionBonus: 0.08,
      lateActionBonus: 0.16,
    };
  }
  if (d === "hard") {
    return {
      aiMix: { normalos: 2, ultras: 3, hooligans: 3 },
      aiGoldBonus: 55,
      aiStartMerch: 30,
      aiStartBeer: 30,
      aiStartSecurityBonus: 18,
      aiUnitTech: 2,
      regenMul: 1.55,
      actionMul: 1.45,
      tickMul: 1.45,
      fanTarget: 20,
      gangWant: 3,
      sendChanceMul: 1.4,
      midMinute: 12,
      lateMinute: 28,
      midGangBonus: 1,
      lateGangBonus: 2,
      midRegenBonus: 0.25,
      lateRegenBonus: 0.4,
      midActionBonus: 0.2,
      lateActionBonus: 0.35,
    };
  }
  // Mittel: spürbar härter — früher Mid/Late, mehr Tempo & Start
  return {
    aiMix: { normalos: 3, ultras: 3, hooligans: 2 },
    aiGoldBonus: 35,
    aiStartMerch: 18,
    aiStartBeer: 18,
    aiStartSecurityBonus: 8,
    aiUnitTech: 1,
    regenMul: 1.25,
    actionMul: 1.2,
    tickMul: 1.2,
    fanTarget: 17,
    gangWant: 2,
    sendChanceMul: 1.2,
    midMinute: 16,
    lateMinute: 36,
    midGangBonus: 1,
    lateGangBonus: 2,
    midRegenBonus: 0.22,
    lateRegenBonus: 0.38,
    midActionBonus: 0.18,
    lateActionBonus: 0.3,
  };
}

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
  /** Unit level 1..UPGRADE_MAX — combat + visit payout scale with this */
  level: number;
  _after?: string;
  _homeSeat?: number | null;
  /** Free block wander target (not a fixed seat cell) */
  _wanderTx?: number;
  _wanderTy?: number;
  /** Seconds until next wander retarget */
  _wanderCd?: number;
  /** Real-time when this unit arrived at a Bier/Fanshop queue */
  _standArriveAt?: number;
  /** Seconds until next wait-anger smiley */
  _angerCd?: number;
};

export type BuildSlot = {
  blockId: number;
  index: number;
  building: BuildingKind | null;
  greyNeutral: boolean;
  /** Bierstand shelf stock (visitors buy from this; refills while they wait). */
  beer: number;
  /** Fanshop shelf stock (same rules as beer). */
  merch: number;
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
  /** Contested-time accumulator for neutral mid post auto-level */
  autoLevelAcc: number;
  /** Seconds this plot has been behind a colored Standarte (capture clock) */
  bannerHoldAcc: number;
  /** Seconds a non-Ordner building has spent in enemy Standarte territory */
  enemyZoneAcc: number;
  /** Beers stolen from this stand toward Leer-trinken takeover */
  beerStealAcc: number;
};

export type Currencies = {
  beer: number;
  merch: number;
  security: number;
};

export const START_GOLD = 90;
/** Starting Sicherheit; intact neutral mid Ordnerposten can regen back up to this cap. */
export const START_SECURITY = 50;

/* ─── Blitz (60s reaction mode) ─── */
/** Real-time length of a Blitz match (maps to 0–90′). */
export const BLITZ_REAL_SEC = 60;
export const BLITZ_START_GOLD = 220;
export const BLITZ_START_BEER = 48;
export const BLITZ_START_MERCH = 48;
export const BLITZ_START_SECURITY = 72;
export const BLITZ_UNIT_LEVEL = 3;
export const BLITZ_BUILDING_LEVEL = 3;
/** Momentum nudge per home-block tap (player sign). */
export const BLITZ_CLICK_MOOD = 0.042;
/** Resource burst per building tap. */
export const BLITZ_CLICK_RES = 5;
/** Combat buff duration after enemy-zone tap. */
export const BLITZ_COMBAT_BUFF_SEC = 1.75;
export const BLITZ_COMBAT_BUFF_MUL = 1.4;
/** Soft minimum seconds between effective taps. */
export const BLITZ_CLICK_GAP = 0.045;
/** Extra starting combat fans beyond setup mix (each side). */
export const BLITZ_EXTRA_ULTRAS = 2;
export const BLITZ_EXTRA_HOOLS = 2;
export const BLITZ_STORM_COUNT = 3;
export const BLITZ_STORM_SEC = 3.2;
/** Without own Ordnerposten, Sicherheit cannot exceed this. */
export const SECURITY_BASE_CAP = 50;
/** Regen toward SECURITY_BASE_CAP from intact neutral mid Ordnerposten when safe. */
export const SECURITY_BASE_REGEN = 0.55;

/** Buy costs — each type tied to its currency (early costs aligned) */
export const BUY_COST = {
  normalos: { beer: 0, merch: 0, security: 12, gold: 0 },
  ultras: { beer: 0, merch: 12, security: 0, gold: 0 },
  hooligans: { beer: 12, merch: 0, security: 0, gold: 0 },
} as const;

export const BUILD_COST: Record<BuildingKind, number> = {
  bier: 55,
  ordner: 40,
  fanshop: 35,
};

export const BUILD_LABEL: Record<BuildingKind, string> = {
  bier: "Bier",
  ordner: "Ordner",
  fanshop: "Shop",
};

/**
 * Unit tech may only rise to Lv N if the matching building is already ≥ N.
 * Normalos/Ordner → Ordnerposten · Ultras → Fanshop · Hooligans → Bier.
 */
export function buildingForUnitKind(
  kind: FanKind | "ordner",
): BuildingKind {
  if (kind === "ultras") return "fanshop";
  if (kind === "hooligans") return "bier";
  return "ordner";
}

export const UPGRADE_MAX = 5;
/** Building upgrade gold to reach level index (Lv2..Lv5) */
export const UPGRADE_COST = [0, 0, 40, 75, 120, 180] as const;
/**
 * Unit upgrade gold to reach level index (Lv2..Lv5).
 * Lv4–5 teurer: bremst Max-Snowball, damit KI-Tech mithalten kann.
 */
export const UNIT_UPGRADE_COST = [0, 0, 24, 48, 95, 155] as const;
/** +% HP / Atk / Def / Jubel per level above 1 */
export const UNIT_LEVEL_STAT = 0.12;

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
export const HOOLIGAN_ORDER_BEER = 6;
/** Ultra → Gang as ranged Pyro-Kampf — merch cost, no CD */
export const PYRO_FIGHT_MERCH = 6;

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

/** Gebäude-HP eines Ordnerpostens auf Stufe `level`. */
export function ordnerPostMaxHp(level: number): number {
  const lv = Math.max(1, Math.min(UPGRADE_MAX, Math.floor(level) || 1));
  return ORDNER_POST_HP + (lv - 1) * ORDNER_POST_HP_PER_LEVEL;
}
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
 * Past this gangX beyond the cement edge, cement slow/DoT no longer applies.
 * Movement is never hard-capped — the gang stays fully permeable.
 */
export const CEMENT_BREAKTHROUGH = 0.35;
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
/** Empty/Fanshop Bauplatz is claimed after this many seconds behind a Standarte */
export const BANNER_PLOT_CAPTURE_SEC = 20;
/** Non-Ordner buildings break after this many seconds in enemy Standarte zone */
export const ENEMY_ZONE_BUILDING_BREAK_SEC = 30;
/** Fremde Bierstände: Übernahme nach so vielen geklauten Bieren (ohne Zahlung) */
export const BEER_STEAL_CAPTURE = 50;

export const STEWARD_HIRE_GOLD = 22;
export const STEWARD_CAP = 2;
/** Max living grey/neutral Ordner on the field at once */
export const NEUTRAL_STEWARD_CAP = 4;
export const NEUTRAL_STEWARD_RESPAWN = 32;
/**
 * CANONICAL neutral mid layout:
 * one Level-3 Ordnerpost mid-gang + empty grey Bau plots; no grey Bier/Shop seed.
 * Grey AI builds/levels when unbothered; produce Ordner up to NEUTRAL_STEWARD_CAP.
 */
export const NEUTRAL_POST_AUTO_LEVEL_CAP = 3;
/** Real seconds between auto-levels on grey Ordnerposts */
export const NEUTRAL_POST_AUTO_LEVEL_SEC = 60;
/** Kickoff Ordner count at the central L3 post */
export const NEUTRAL_MID_START_STEWARDS = 3;
/** Grey builds/upgrades only while unbothered this long between actions */
export const GREY_AI_BUILD_SEC = 28;
/** How close colored fighters must be to count as “bothering” grey */
export const GREY_BOTHER_RADIUS_GX = 0.14;
/** Single mid-gang Ordnerpost index in the neutral block */
export const NEUTRAL_MID_GANG_INDEX = 4;
/** @deprecated use NEUTRAL_MID_GANG_INDEX — dual outer posts removed */
export const NEUTRAL_POST_HEIM_INDEX = NEUTRAL_MID_GANG_INDEX;
/** @deprecated use NEUTRAL_MID_GANG_INDEX */
export const NEUTRAL_POST_GAST_INDEX = NEUTRAL_MID_GANG_INDEX;

/** Live-ticker channel under the momentum bar */
export type TickerChannel = "match" | "combat" | "crowd" | "build";
export type TickerItem = {
  text: string;
  channel: TickerChannel;
  t: number;
};
export const BLOCK_STORM_COUNT = 4;
/** Banner must stay visible this long while the block stays occupied → win */
export const BLOCK_STORM_SEC = 5;
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

/** Slightly higher so midgame SENDEN stays reachable after buys */
export const PROD_BEER = 0.34;
export const PROD_SECURITY = 0.3;
export const PROD_MERCH = 0.4;

/**
 * Block power → Momentum (people only, own home block).
 * Fans weigh most (Stimmung), Ultras/Hools less while seated.
 */
export const MOMENTUM_WEIGHT: Record<FanKind, number> = {
  normalos: 1.0,
  ultras: 0.55,
  hooligans: 0.35,
};
/**
 * Softener in (pH−pG)/(pH+pG+ε). Slightly tighter than before so a clear
 * Kurve-dominance can push the bar fully into the enemy half for a Tor.
 */
export const MOMENTUM_EPS = 1.8;
/** How fast momentum tracks relative block power (1/s scale via exp) */
export const MOMENTUM_APPROACH = 0.55;
/**
 * |momentum| to score. Bar HUD stretches so this reads as fully enemy-side.
 * ~starting Heim roster alone vs empty Gast ≈ this edge.
 */
/** Momentum-Schwelle für Tor (etwas niedriger → Tore auch bei knapper Kurve) */
export const GOAL_MOMENTUM_EDGE = 0.7;
/** Seconds after a goal before another can fall (Bierrunde window) */
export const GOAL_LOCK_SEC = 10;
/** Mood HUD tracks the same power (display scale 0…3) */
export const MOOD_FROM_POWER = 0.09;

/** Seconds between pitch goal rolls (before fever) */
export const GOAL_ROLL_INTERVAL = 22;
/** Base p(goal) on a roll; scales with |momentum| (softened vs 0.35) */
export const GOAL_P_TOR_BASE = 0.12;
export const GOAL_P_TOR_MOMENTUM = 0.22;
export const GOAL_P_TOR_MIN = 0.08;
export const GOAL_P_TOR_MAX = 0.55;

/** AI start gold bonus over START_GOLD (0 = same wallet as player) */
export const AI_START_GOLD_BONUS = 0;
/** Soft AI beer/merch regen per second */
export const AI_SOFT_REGEN = 0.48;
/** Tiny momentum nudge when a team scores a combat kill (unit) */
export const MOMENTUM_KILL_UNIT = 0.035;
/** Tiny momentum nudge when a team destroys an Ordnerpost */
export const MOMENTUM_KILL_POST = 0.05;

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
  /** Patrol / heal radius around own post (gangX), Lv1 */
  postRadius: 0.11,
  /** Extra heal/patrol radius per Ordnerposten-Stufe über 1 */
  postRadiusPerLevel: 0.02,
  chaseRadius: 0.2,
  /** HP/s Heilung im Radius, Lv1 */
  healPerSec: 10,
  /** Extra Heal/s pro Ordnerposten-Stufe über 1 */
  healPerSecPerLevel: 2,
};

/** Heil-/Patrouillenradius (gangX) eines Ordnerpostens. */
export function stewardPostRadius(level: number): number {
  const lv = Math.max(1, Math.min(UPGRADE_MAX, Math.floor(level) || 1));
  return STEWARD_STATS.postRadius + (lv - 1) * STEWARD_STATS.postRadiusPerLevel;
}

/** Heilrate (HP/s) im Posten-Radius. */
export function stewardHealPerSec(level: number): number {
  const lv = Math.max(1, Math.min(UPGRADE_MAX, Math.floor(level) || 1));
  return STEWARD_STATS.healPerSec + (lv - 1) * STEWARD_STATS.healPerSecPerLevel;
}

/**
 * Block crowd: roughly spread home slots + tiny drift, while they
 * bob/cheer in place (not a marching clump).
 */
export const BLOCK_WANDER_SPEED = 0.038;
export const BLOCK_WANDER_RETARGET_MIN = 1.6;
export const BLOCK_WANDER_RETARGET_MAX = 3.4;
export const BLOCK_WANDER_ARRIVE = 0.012;
/** Max offset from each fan's home slot while idling — fill the terrace */
export const BLOCK_HOME_RADIUS = 0.07;
/** Soft spring toward home (weaker = freer milling across the block) */
export const BLOCK_HOME_PULL = 0.45;
/** Soft push-apart so crowded stands don't fully stack */
export const BLOCK_SEPARATION_RADIUS = 0.048;
export const BLOCK_SEPARATION_PUSH = 0.08;

export const BLOCK_META = [
  { id: 0, side: "heim" as const, label: "HEIM", fill: "#1f6feb", stripe: "#f3f0e7" },
  { id: 1, side: "neutral" as const, label: "NEUTRAL", fill: "#9ca3af", stripe: "#e5e7eb" },
  { id: 2, side: "gaeste" as const, label: "GÄSTE", fill: "#dc2626", stripe: "#f3f0e7" },
];

export const ANIM_DRINK_SEC = 0.9;
export const ANIM_SHOP_SEC = 0.75;
export const ANIM_THROW_SEC = 0.42;
