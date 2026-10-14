import {
  AI_SOFT_REGEN,
  BLOCK_META,
  BLOCK_HOME_PULL,
  BLOCK_HOME_RADIUS,
  BLOCK_SEPARATION_PUSH,
  BLOCK_SEPARATION_RADIUS,
  BLOCK_STORM_COUNT,
  BLOCK_STORM_SEC,
  BLOCK_WANDER_ARRIVE,
  BLOCK_WANDER_RETARGET_MAX,
  BLOCK_WANDER_RETARGET_MIN,
  BLOCK_WANDER_SPEED,
  BUILD_COST,
  BUILD_LABEL,
  buildingForUnitKind,
  BUY_COST,
  BANNER_ADVANCE_SPEED,
  BANNER_CATCHUP,
  BANNER_MIN_GAP,
  BANNER_PLOT_CAPTURE_SEC,
  BANNER_POST_STANDOFF,
  BANNER_RETREAT_SPEED,
  BEER_STEAL_CAPTURE,
  BLITZ_BUILDING_LEVEL,
  BLITZ_CLICK_GAP,
  BLITZ_CLICK_GOLD_BUILD,
  BLITZ_CLICK_GOLD_ENEMY,
  BLITZ_CLICK_GOLD_HOME,
  BLITZ_CLICK_MOOD,
  BLITZ_CLICK_RES,
  BLITZ_COMBAT_BUFF_MUL,
  BLITZ_COMBAT_BUFF_SEC,
  BLITZ_COMBAT_FAN_CAP,
  BLITZ_EXTRA_HOOLS,
  BLITZ_EXTRA_ULTRAS,
  BLITZ_GOAL_LOCK_SEC,
  BLITZ_GOAL_MOMENTUM_EDGE,
  BLITZ_REAL_SEC,
  BLITZ_START_BEER,
  BLITZ_START_GOLD,
  BLITZ_START_MERCH,
  BLITZ_START_SECURITY,
  BLITZ_STORM_COUNT,
  BLITZ_STORM_SEC,
  BLITZ_UNIT_LEVEL,
  ENEMY_ZONE_BUILDING_BREAK_SEC,
  GREY_AI_BUILD_SEC,
  GREY_BOTHER_RADIUS_GX,
  CEMENT_BREAKTHROUGH,
  CEMENT_DOT_PER_SEC,
  CEMENT_SLOW_MUL,
  ET_REAL_SEC,
  FAN_STATS,
  GOAL_LOCK_SEC,
  GOAL_MOMENTUM_EDGE,
  GOAL_P_TOR_BASE,
  GOAL_P_TOR_MAX,
  GOAL_P_TOR_MIN,
  GOAL_P_TOR_MOMENTUM,
  HIT_CD,
  HIT_DAMAGE,
  HIT_DAMAGE_SCALE,
  HOOLIGAN_ORDER_BEER,
  MELEE_RANGE,
  NEUTRAL_POST_AUTO_LEVEL_CAP,
  NEUTRAL_POST_AUTO_LEVEL_SEC,
  NEUTRAL_MID_GANG_INDEX,
  NEUTRAL_MID_START_STEWARDS,
  NEUTRAL_STEWARD_RESPAWN,
  ORDNER_POST_HP_PER_LEVEL,
  ordnerPostMaxHp,
  stewardHealPerSec,
  stewardPostRadius,
  MOMENTUM_APPROACH,
  MOMENTUM_EPS,
  MOMENTUM_KILL_POST,
  MOMENTUM_KILL_UNIT,
  MOMENTUM_WEIGHT,
  MOOD_FROM_POWER,
  PROD_BEER,
  PROD_MERCH,
  PROD_SECURITY,
  PYRO_FIGHT_HP_MUL,
  PYRO_FIGHT_MERCH,
  RANGED_DAMAGE_SCALE,
  RANGED_RANGE,
  REGULAR_REAL_SEC,
  STAND_CONVERT_SEC,
  STAND_CONVERT_SEAT_MAJORITY,
  SECURITY_BASE_CAP,
  SECURITY_BASE_REGEN,
  START_GOLD,
  START_SECURITY,
  STEWARD_CAP,
  NEUTRAL_STEWARD_CAP,
  STEWARD_GOLD_PER_SEC,
  STEWARD_HIRE_GOLD,
  STEWARD_STATS,
  ULTRA_VS_POST_MUL,
  UPGRADE_COST,
  UPGRADE_MAX,
  ANIM_DRINK_SEC,
  ANIM_SHOP_SEC,
  ANIM_THROW_SEC,
  productionRate,
  unitLevelMul,
  unitUpgradeCost,
  canVisit,
  visitGoldPayout,
  visitInterval,
  difficultyProfile,
  type AiDifficulty,
  type DiffProfile,
  type BuildSlot,
  type BuildingKind,
  type Currencies,
  type FanKind,
  type FanUnit,
  type MatchPhase,
  type SetupConfig,
  type SoloSettings,
  type SpeedMode,
  type TeamId,
  type TickerChannel,
  type TickerItem,
} from "./types";
import {
  applyClubCssVars,
  cheerPalette,
  clubFxColor,
  getClub,
  setSideBranding,
} from "./clubs";
import { clamp, expandMix, slotKey, teamLabel } from "./util";
import { sfx, startAmbience, playClubChant, setClubSoundIdentity } from "./sound";
import {
  CHOREO_COOLDOWN,
  CHOREO_DURATION,
  CHOREO_LABEL,
  CHOREO_MOMENTUM,
  HIGHLIGHT_DUR,
  HIGHLIGHT_SLOW,
  choreoTierFromUltras,
  personalityMods,
  type ChoreoState,
  type ChoreoTier,
  type HalfBoostId,
  type HighlightState,
} from "./feelPack";
import {
  BLOCK_COUNT,
  GAST_BLOCK,
  HEIM_BLOCK,
  NEUTRAL_BLOCK,
  blockCenterX,
  blockIdToGangX,
  blockTopY,
  blockCrowdRect,
  boothCenter,
  boothRect,
  crowdHomePos,
  doorPos,
  gangHeight,
  gangLaneDepthForUnit,
  gangLanePosForUnit,
  gangLaneYForUnit,
  gangMidY,
  gangY,
  gangXToWorld,
  plotGangX,
  slotIndicesForBlock,
  STAND_WAIT_BAND,
  STAND_WAIT_RADIUS,
  syncTribuneLayout,
  worldXToGangX,
} from "./layout";

export type MatchConfig = {
  settings: SoloSettings;
  playerSetup: SetupConfig;
  aiSetup: SetupConfig;
  /** Guided first-match onboarding tips */
  guided?: boolean;
  /** Live PvP: both sides human-controlled */
  pvp?: boolean;
  /** Team this client controls. Live PvP: always ksc (own side left); guest snaps are mirrored. */
  localTeam?: TeamId;
  /** Host runs sim; guest only applies mirrored snapshots */
  pvpAuthority?: boolean;
  /** 60s reaction Blitz — fat Lvl3 start, tap zones, no half/ET */
  blitz?: boolean;
};

export type MatchResult = {
  winner: TeamId;
  reason: "score" | "et" | "pens" | "invade";
  score: [number, number];
  detail: string;
  minute: number;
  difficulty: AiDifficulty;
};

export type UiFlashTone = "goal" | "danger" | "halftime" | "storm" | "ok";

export type UiFlash = {
  text: string;
  tone: UiFlashTone;
  /** seconds remaining */
  t: number;
};

let nextId = 1;
function uid(): number {
  return nextId++;
}

function diffMul(d: AiDifficulty): number {
  return difficultyProfile(d).tickMul;
}

/** Easy sends/buys less often; hard a bit more. */
function aiActionMul(d: AiDifficulty): number {
  return difficultyProfile(d).actionMul;
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export type FloatFx = {
  x: number;
  y: number;
  text: string;
  good: boolean;
  t: number;
  vy: number;
};

export type ConfettiBit = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  color: string;
  t: number;
  life: number;
  /** Keep celebration confetti inside this block's platform */
  blockId?: number;
};

export type PyroProjectile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  attackerId: number;
  targetFanId: number | null;
  targetSlotKey: string | null;
  team: TeamId;
  t: number;
  life: number;
};

export type MoodParticle = {
  kind:
    | "note"
    | "smoke"
    | "spark"
    | "flare"
    | "mug"
    | "rocket"
    | "waitAnger"
    | "waitAngerHot"
    | "moodPlus"
    | "moodMinus"
    | "flame"
    | "rubble";
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  t: number;
  life: number;
  size: number;
};

/** Matches Ordnerpost HP-bar colors in render (green → orange → red). */
const POST_FX_ORANGE = 0.45;
const POST_FX_RED = 0.2;

export class Match {
  readonly cfg: MatchConfig;
  readonly playerTeam: TeamId;
  readonly aiTeam: TeamId;
  /** Live PvP: shared board, both humans */
  readonly pvp: boolean;
  /** 60s reaction Blitz mode */
  readonly blitz: boolean;
  /** Team the local UI / remote cmd controls */
  readonly localTeam: TeamId;
  /** Host authority (sim); guest is snap viewer */
  readonly pvpAuthority: boolean;
  /** Player combat buff timer (Ultras/Hools/Ordner) */
  blitzCombatBuffT = 0;
  private blitzClickCd = 0;
  private blitzAiClickAcc = 0;
  /** Temporary override while applying a PvP command for a side */
  private cmdTeam: TeamId | null = null;
  fans: FanUnit[] = [];
  slots: BuildSlot[] = [];
  phase: MatchPhase = "regular";
  minute = 0;
  realElapsed = 0;
  etElapsed = 0;
  scoreKsc = 0;
  scoreVfb = 0;
  gold = START_GOLD;
  momentum = 0;
  moodHeim = 1;
  moodGaeste = 1;
  /** Football overlay spin on Torwahrscheinlichkeit bar (radians) */
  torBallAngle = 0;
  private prevTorPHeim = 0.5;
  /** Temporary defense call-out along gang (own Ordner rush here) */
  private defenseCallGx: Partial<Record<TeamId, number>> = {};
  private defenseCallT: Partial<Record<TeamId, number>> = {};
  /** UI: scoreboard punch after goal (0..1) */
  scorePulse = 0;
  /** last team that scored — for crest flash */
  lastGoalTeam: TeamId | null = null;
  /** Big DOM flash (goal / danger / half) — consumed by main overlay */
  uiFlash: UiFlash | null = null;
  /** Ever trailed on the scoreboard (for Comeback badge) */
  wasBehind = false;
  /** Guided onboarding milestone keys completed */
  guidedDone = new Set<string>();
  confetti: ConfettiBit[] = [];
  moodFx: MoodParticle[] = [];
  pyroShots: PyroProjectile[] = [];
  /** Last damage FX band per Ordnerpost slotKey: 0 ok · 1 orange · 2 red */
  private postFxBand = new Map<string, 0 | 1 | 2>();
  speed: SpeedMode = 0;
  toasts: { text: string; t: number }[] = [];
  /** Live ticker under momentum (match / combat / crowd / build) */
  tickerQueue: TickerItem[] = [];
  private tipCd = 0;
  private tipSeen = new Set<string>();
  result: MatchResult | null = null;
  cd = { hooliganOrder: 0, pyroFight: 0 };
  selectedSlot: { blockId: number; index: number } | null = null;
  selectedSeat: { blockId: number; seatIndex: number } | null = null;
  seatMenu: { blockId: number; seatIndex: number } | null = null;
  buildMenu: { blockId: number; index: number } | null = null;
  chanceAcc = 0;
  aiAcc = 0;
  defectAcc = 0;
  buildPulse = 0;
  /** Cooldown before next mood +/− float (heim / gäste) */
  moodFloatCd = { heim: 0, gast: 0 };
  captureAcc: Record<string, number> = {};
  aiGold = START_GOLD;
  aiBuildRot = 0;
  /** Grey economy cadence while unbothered */
  greyBuildAcc = 0;
  /** soft AI combat resources (difficulty sets start; regen still applies) */
  aiMerch = 0;
  aiBeer = 0;
  aiSecurity = START_SECURITY;
  /**
   * AI Personen-Tech pro Kind (spiegel zum Spieler-`unitTech`).
   * Kickoff aus `diffProf.aiUnitTech`; steigt über `aiTryUpgradeUnits`.
   */
  aiTech: Record<FanKind | "ordner", number> = {
    normalos: 1,
    ultras: 1,
    hooligans: 1,
    ordner: 1,
  };
  /** @deprecated Prefer aiTech — max over kinds, kept for probes/HUD */
  get aiUnitTech(): number {
    return Math.max(
      this.aiTech.normalos,
      this.aiTech.ultras,
      this.aiTech.hooligans,
      this.aiTech.ordner,
    );
  }
  private diffProf!: DiffProfile;
  /** Penalty: whose kick is next (alternating) */
  pensNext: TeamId = "ksc";
  pensKicksKsc = 0;
  pensKicksVfb = 0;
  width = 960;
  height = 440;
  pensRound = 0;
  pens: { ksc: boolean | null; vfb: boolean | null }[] = [];
  pensTimer = 0;
  currency: Currencies = { beer: 0, merch: 0, security: START_SECURITY };
  blockOwner: (TeamId | "neutral" | null)[] = [null, null, null, null];
  floats: FloatFx[] = [];
  /**
   * Personen-Chrome-Stufe pro Kind (Sidebar „Lvl.N“).
   * UP erhöht die Tech-Stufe und zieht alle lebenden Einheiten nach.
   */
  unitTech: Record<FanKind | "ordner", number> = {
    normalos: 1,
    ultras: 1,
    hooligans: 1,
    ordner: 1,
  };
  /** Blocksturm hold timers (legacy mirrors of stormBanner.holdT) */
  stormAccPlayer = 0;
  stormAccAi = 0;
  /**
   * Occupation banner: invaders hold up „Hier regiert der …“;
   * win only after BLOCK_STORM_SEC with block still occupied.
   */
  stormBanner: {
    team: TeamId;
    blockId: number;
    holdT: number;
  } | null = null;
  /** Throttle continuous Blocksturm spectacle FX */
  private stormFxCd = 0;
  /** Post-goal lock so Bierrunde can swing momentum the other way */
  private goalLockT = 0;
  /** Team currently celebrating a Tor in-block (no stand trips yet) */
  private goalPartyTeam: TeamId | null = null;
  /** Remaining celebration time before Glücksbiergang */
  private goalPartyT = 0;
  /** battle line gangX 0..1 (vorderster Ultra) */
  linePlayer = 0;
  lineAi = 1;

  /** Active Kurven-Choreo (player or AI) */
  choreo: ChoreoState | null = null;
  private choreoCdPlayer = 0;
  private choreoCdAi = 0;
  /** Halbzeit: wartend auf Boost-Wahl */
  halfTimePending = false;
  private halfTimeFired = false;
  halfBoost: HalfBoostId | null = null;
  /** Cinematic highlight (Tor / Blocksturm) */
  highlight: HighlightState | null = null;
  /**
   * Biere, die Heim-/Spieler-Figuren getrunken haben (eigene + fremde Stände,
   * inkl. kostenloses Leer-Trinken unter Banner-Kontrolle).
   */
  beersDrunkPlayer = 0;
  /** Biere der Gäste-/AI-Seite (PvP KPI + Fairness) */
  beersDrunkAi = 0;

  constructor(cfg: MatchConfig) {
    this.cfg = cfg;
    this.pvp = !!cfg.pvp;
    this.blitz = !!cfg.blitz;
    // PvP: each client treats own side as Heim/ksc (left). Guest applies mirrored snaps.
    if (this.pvp) {
      this.playerTeam = "ksc";
      this.aiTeam = "vfb";
      this.localTeam = "ksc";
      this.pvpAuthority = cfg.pvpAuthority !== false;
    } else {
      this.playerTeam = cfg.settings.playerTeam;
      this.aiTeam = cfg.settings.playerTeam === "ksc" ? "vfb" : "ksc";
      this.localTeam = cfg.localTeam ?? cfg.settings.playerTeam;
      this.pvpAuthority = true;
    }
    // Map club kits onto side slots (player side + AI side)
    const playerClub = cfg.settings.playerClub || "ksc";
    const aiClub = cfg.settings.aiClub || "vfb";
    if (this.pvp) {
      // Shared orientation: cfg.playerClub = Heim, cfg.aiClub = Gast
      setSideBranding(playerClub, aiClub);
    } else if (this.playerTeam === "ksc") {
      setSideBranding(playerClub, aiClub);
    } else {
      setSideBranding(aiClub, playerClub);
    }
    try {
      applyClubCssVars();
    } catch {
      /* non-DOM (tests) */
    }
    // Validate clubs exist early
    getClub(playerClub);
    getClub(aiClub);
    try {
      setClubSoundIdentity(playerClub, aiClub);
    } catch {
      /* non-DOM */
    }
    this.diffProf = difficultyProfile(cfg.settings.difficulty);
    if (this.pvp) {
      // Fair start — both humans, no AI difficulty bonuses
      this.aiGold = START_GOLD;
      this.aiMerch = 0;
      this.aiBeer = 0;
      this.aiSecurity = START_SECURITY;
      this.aiTech = { normalos: 1, ultras: 1, hooligans: 1, ordner: 1 };
    } else {
      this.aiGold = START_GOLD + this.diffProf.aiGoldBonus;
      this.aiMerch = this.diffProf.aiStartMerch;
      this.aiBeer = this.diffProf.aiStartBeer;
      this.aiSecurity = START_SECURITY + this.diffProf.aiStartSecurityBonus;
      {
        const t = Math.max(1, Math.min(UPGRADE_MAX, this.diffProf.aiUnitTech));
        this.aiTech = { normalos: t, ultras: t, hooligans: t, ordner: t };
      }
    }
    this.blockOwner = [this.playerTeam, "neutral", this.aiTeam];

    for (const b of BLOCK_META) {
      for (const i of slotIndicesForBlock(b.id)) {
        const isNeutral = b.id === NEUTRAL_BLOCK;
        this.slots.push({
          blockId: b.id,
          index: i,
          building: null,
          greyNeutral: false,
          beer: 0,
          merch: 0,
          capacity: 100,
          owner: isNeutral ? "neutral" : null,
          level: 1,
          stewardCd: 2 + Math.random() * 3,
          convertAcc: 0,
          convertBy: null,
          prodFlash: 0,
          structHp: 0,
          structMaxHp: 0,
          autoLevelAcc: 0,
          bannerHoldAcc: 0,
          enemyZoneAcc: 0,
          beerStealAcc: 0,
        });
      }
    }

    /**
     * CANONICAL neutral mid:
     * - One Level-3 Ordnerpost exactly mid-gang with starting Ordner
     * - Empty grey Bau plots (far/near); grey AI builds when unbothered
     * - Never seed Bier/Shop on grey — only Ordner on the mid slot
     */
    this.placeBuilding(NEUTRAL_BLOCK, NEUTRAL_MID_GANG_INDEX, "ordner", true, "neutral");
    const midPost = this.slots.find(
      (x) => x.blockId === NEUTRAL_BLOCK && x.index === NEUTRAL_MID_GANG_INDEX,
    );
    if (midPost) {
      midPost.greyNeutral = false;
      midPost.owner = "neutral";
      midPost.level = 3;
      this.initOrdnerPostHp(midPost);
      midPost.stewardCd = NEUTRAL_STEWARD_RESPAWN;
      midPost.autoLevelAcc = 0;
      const nStart = Math.min(NEUTRAL_MID_START_STEWARDS, NEUTRAL_STEWARD_CAP);
      for (let i = 0; i < nStart; i++) {
        const st = this.makeSteward("neutral", midPost);
        st.state = "gang";
        st.path = [];
        st.pathI = 0;
        this.setAfter(st, "");
        const sp = this.stewardPostPos(midPost);
        st.x = sp.x + (i - (nStart - 1) / 2) * 0.018;
        st.y = sp.y;
        st.gangX = this.postGangX(midPost) + (i - (nStart - 1) / 2) * 0.012;
        st.patrolDir = i % 2 === 0 ? 1 : -1;
        this.fans.push(st);
      }
    }

    const homeKinds = expandMix(cfg.playerSetup.mix);
    homeKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.playerTeam, HEIM_BLOCK, i));
    });
    const awayKinds = expandMix(cfg.aiSetup.mix);
    awayKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.aiTeam, GAST_BLOCK, i));
    });
    // Neutralblock: ~20 Fans (nur Normalos) — shoppen an beliebigen Ständen
    for (let i = 0; i < 20; i++) {
      this.fans.push(this.makeFan("normalos", "neutral", NEUTRAL_BLOCK, i));
    }

    // Standarten start at cemented floors (grey mid buffer stays open)
    this.linePlayer = this.buildFrontierGx(this.playerTeam);
    this.lineAi = this.buildFrontierGx(this.aiTeam);

    if (this.blitz) {
      this.seedBlitzStart();
      this.toast("Blitz · 60s · Tribüne = Stimmung · Stände tippen!", 4.5);
      this.flash("Blitz! Upgrade · Senden · Tippen", "ok", 2.4);
    } else {
      this.toast(
        this.pvp
          ? `Live-PvP · Du steuerst ${teamLabel(this.localTeam)}`
          : `${teamLabel(this.playerTeam)} vs ${teamLabel(this.aiTeam)}`,
      );
    }
    this.speed = 1;
  }

  private stormNeed(): number {
    return this.blitz ? BLITZ_STORM_COUNT : BLOCK_STORM_COUNT;
  }

  private stormHoldSec(): number {
    return this.blitz ? BLITZ_STORM_SEC : BLOCK_STORM_SEC;
  }

  blitzSecondsLeft(): number {
    if (!this.blitz) return 0;
    return Math.max(0, BLITZ_REAL_SEC - this.realElapsed);
  }

  /** Fat Lvl3 start — buildings + tech + extras; menus optional. */
  private seedBlitzStart(): void {
    const lv = BLITZ_UNIT_LEVEL;
    this.gold = BLITZ_START_GOLD;
    this.aiGold = BLITZ_START_GOLD;
    this.currency.beer = BLITZ_START_BEER;
    this.currency.merch = BLITZ_START_MERCH;
    this.currency.security = BLITZ_START_SECURITY;
    this.aiBeer = BLITZ_START_BEER;
    this.aiMerch = BLITZ_START_MERCH;
    this.aiSecurity = BLITZ_START_SECURITY;
    this.unitTech = {
      normalos: lv,
      ultras: lv,
      hooligans: lv,
      ordner: lv,
    };
    this.aiTech = {
      normalos: lv,
      ultras: lv,
      hooligans: lv,
      ordner: lv,
    };

    /**
     * All 6 colored Bau slots pre-filled — upgrade/send only, no build phase.
     * Heim: Bier Bier Ordner (far) / Fanshop Fanshop Ordner (near) — Ordner face mid.
     * Gast: mirrored so Ordner face mid (indices 0+3).
     */
    const heimPlan: Array<{ index: number; kind: BuildingKind }> = [
      { index: 0, kind: "bier" },
      { index: 1, kind: "bier" },
      { index: 2, kind: "ordner" },
      { index: 3, kind: "fanshop" },
      { index: 4, kind: "fanshop" },
      { index: 5, kind: "ordner" },
    ];
    const gastPlan: Array<{ index: number; kind: BuildingKind }> = [
      { index: 0, kind: "ordner" },
      { index: 1, kind: "bier" },
      { index: 2, kind: "bier" },
      { index: 3, kind: "ordner" },
      { index: 4, kind: "fanshop" },
      { index: 5, kind: "fanshop" },
    ];
    for (const side of [
      { block: HEIM_BLOCK, owner: this.playerTeam, plan: heimPlan },
      { block: GAST_BLOCK, owner: this.aiTeam, plan: gastPlan },
    ] as const) {
      for (const p of side.plan) {
        this.placeBuilding(side.block, p.index, p.kind, true, side.owner);
        const s = this.slots.find(
          (x) => x.blockId === side.block && x.index === p.index,
        );
        if (!s) continue;
        s.level = BLITZ_BUILDING_LEVEL;
        s.owner = side.owner;
        s.greyNeutral = false;
        if (p.kind === "bier") s.beer = 80;
        if (p.kind === "fanshop") s.merch = 80;
        if (p.kind === "ordner") this.initOrdnerPostHp(s);
      }
    }

    for (const f of this.fans) {
      if (f.team !== this.playerTeam && f.team !== this.aiTeam) continue;
      f.level = lv;
      this.applyUnitLevelStats(f);
    }

    let seat = 40;
    for (let i = 0; i < BLITZ_EXTRA_ULTRAS; i++) {
      this.fans.push(
        this.makeFan("ultras", this.playerTeam, HEIM_BLOCK, seat++),
      );
      this.fans.push(this.makeFan("ultras", this.aiTeam, GAST_BLOCK, seat++));
    }
    for (let i = 0; i < BLITZ_EXTRA_HOOLS; i++) {
      this.fans.push(
        this.makeFan("hooligans", this.playerTeam, HEIM_BLOCK, seat++),
      );
      this.fans.push(
        this.makeFan("hooligans", this.aiTeam, GAST_BLOCK, seat++),
      );
    }
    // One free Ordner at each home Ordnerpost (2 posts × side)
    for (const side of [
      { block: HEIM_BLOCK, team: this.playerTeam },
      { block: GAST_BLOCK, team: this.aiTeam },
    ] as const) {
      const posts = this.slots.filter(
        (x) =>
          x.blockId === side.block &&
          x.building === "ordner" &&
          x.owner === side.team,
      );
      for (const post of posts) {
        this.fans.push(this.makeSteward(side.team, post));
      }
    }

    this.linePlayer = this.buildFrontierGx(this.playerTeam);
    this.lineAi = this.buildFrontierGx(this.aiTeam);
  }

  /** Living combat fans (no Ordner) — used for Blitz population cap. */
  countCombatFans(team: TeamId): number {
    let n = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward || f.team !== team) continue;
      n++;
    }
    return n;
  }

  blitzFanCapReached(team: TeamId): boolean {
    return this.blitz && this.countCombatFans(team) >= BLITZ_COMBAT_FAN_CAP;
  }

  /**
   * Blitz tap: home = mood, building = resource, enemy = combat buff.
   * Returns false if on cooldown / invalid.
   */
  tryBlitzTap(
    target: { kind: "home" } | { kind: "enemy" } | {
      kind: "building";
      blockId: number;
      index: number;
    },
    at?: { x: number; y: number },
  ): boolean {
    if (!this.blitz || this.phase === "ended" || this.result) return false;
    if (this.blitzClickCd > 0) return false;
    this.blitzClickCd = BLITZ_CLICK_GAP;
    const nx = at?.x ?? 0.5;
    const ny = at?.y ?? 0.55;
    const sign = this.playerTeam === "ksc" ? 1 : -1;

    if (target.kind === "home") {
      const edge = BLITZ_GOAL_MOMENTUM_EDGE;
      const nearEdge = Math.abs(this.momentum) > edge * 0.72;
      const moodAmt = BLITZ_CLICK_MOOD * (nearEdge ? 0.3 : 1);
      this.momentum = clamp(this.momentum + moodAmt * sign, -1, 1);
      this.moodHeim = Math.min(1.35, this.moodHeim + 0.02);
      this.addTeamGold(this.playerTeam, BLITZ_CLICK_GOLD_HOME);
      this.floatAt(nx, ny, `+Stimmung · +${BLITZ_CLICK_GOLD_HOME}€`, true);
      return true;
    }

    if (target.kind === "enemy") {
      this.blitzCombatBuffT = BLITZ_COMBAT_BUFF_SEC;
      this.addTeamGold(this.playerTeam, BLITZ_CLICK_GOLD_ENEMY);
      this.floatAt(nx, ny, `Kampf! · +${BLITZ_CLICK_GOLD_ENEMY}€`, true);
      return true;
    }

    const s = this.slots.find(
      (x) => x.blockId === target.blockId && x.index === target.index,
    );
    if (!s?.building || s.owner !== this.playerTeam) return false;
    this.addTeamGold(this.playerTeam, BLITZ_CLICK_GOLD_BUILD);
    if (s.building === "bier") {
      this.addTeamCur(this.playerTeam, "beer", BLITZ_CLICK_RES);
      this.floatAtSlot(
        s,
        `+${BLITZ_CLICK_RES} Bier · +${BLITZ_CLICK_GOLD_BUILD}€`,
        true,
      );
    } else if (s.building === "fanshop") {
      this.addTeamCur(this.playerTeam, "merch", BLITZ_CLICK_RES);
      this.floatAtSlot(
        s,
        `+${BLITZ_CLICK_RES} Shop · +${BLITZ_CLICK_GOLD_BUILD}€`,
        true,
      );
    } else {
      this.addTeamCur(this.playerTeam, "security", BLITZ_CLICK_RES);
      this.floatAtSlot(
        s,
        `+${BLITZ_CLICK_RES} Sich. · +${BLITZ_CLICK_GOLD_BUILD}€`,
        true,
      );
    }
    s.prodFlash = 0.35;
    return true;
  }

  private tickBlitzAiClicks(dt: number): void {
    if (!this.blitz || this.pvp) return;
    this.blitzAiClickAcc += dt;
    // Slower than a human spamming taps — mostly economy, little mood spam
    if (this.blitzAiClickAcc < 0.55) return;
    this.blitzAiClickAcc = 0;
    const roll = Math.random();
    const sign = this.aiTeam === "ksc" ? 1 : -1;
    if (roll < 0.22) {
      const edge = BLITZ_GOAL_MOMENTUM_EDGE;
      const nearEdge = Math.abs(this.momentum) > edge * 0.72;
      const moodAmt = BLITZ_CLICK_MOOD * 0.55 * (nearEdge ? 0.25 : 1);
      this.momentum = clamp(this.momentum + moodAmt * sign, -1, 1);
    } else if (roll < 0.78) {
      this.aiGold += BLITZ_CLICK_GOLD_BUILD;
      const kind = roll < 0.5 ? "beer" : roll < 0.65 ? "merch" : "security";
      if (kind === "beer") this.aiBeer += BLITZ_CLICK_RES;
      else if (kind === "merch") this.aiMerch += BLITZ_CLICK_RES;
      else this.aiSecurity += BLITZ_CLICK_RES;
    } else {
      this.moodGaeste = Math.min(1.25, this.moodGaeste + 0.015);
    }
  }

  /** Team currently receiving UI / PvP commands */
  actingTeam(): TeamId {
    return this.cmdTeam ?? this.localTeam;
  }

  /** Run a player command as a specific side (host applies guest inputs). */
  runForTeam<T>(team: TeamId, fn: () => T): T {
    const prev = this.cmdTeam;
    this.cmdTeam = team;
    try {
      return fn();
    } finally {
      this.cmdTeam = prev;
    }
  }

  private teamIsPlayerSide(team: TeamId): boolean {
    return team === this.playerTeam;
  }

  private getTeamGold(team: TeamId): number {
    return this.teamIsPlayerSide(team) ? this.gold : this.aiGold;
  }

  private addTeamGold(team: TeamId, delta: number): void {
    if (this.teamIsPlayerSide(team)) this.gold += delta;
    else this.aiGold += delta;
  }

  private getTeamCur(team: TeamId, key: keyof Currencies): number {
    if (this.teamIsPlayerSide(team)) return this.currency[key];
    if (key === "beer") return this.aiBeer;
    if (key === "merch") return this.aiMerch;
    return this.aiSecurity;
  }

  private addTeamCur(team: TeamId, key: keyof Currencies, delta: number): void {
    if (this.teamIsPlayerSide(team)) {
      this.currency[key] = Math.max(0, this.currency[key] + delta);
      return;
    }
    if (key === "beer") this.aiBeer = Math.max(0, this.aiBeer + delta);
    else if (key === "merch") this.aiMerch = Math.max(0, this.aiMerch + delta);
    else this.aiSecurity = Math.max(0, this.aiSecurity + delta);
  }

  private spendTeam(
    team: TeamId,
    key: keyof Currencies,
    amount: number,
    at?: { x: number; y: number },
    label?: string,
  ): boolean {
    if (this.getTeamCur(team, key) < amount) return false;
    this.addTeamCur(team, key, -amount);
    if (at) {
      const tag = label ?? key.toUpperCase();
      this.floatAt(at.x, at.y, `−${Math.round(amount)} ${tag}`, false);
    }
    return true;
  }

  private makeFan(
    kind: FanKind,
    team: TeamId | "neutral",
    blockId: number,
    seatIndex: number,
  ): FanUnit {
    const seat = Math.max(0, seatIndex | 0);
    // Roughly spread home slot; then micro-drift + cheer bob in place
    const p = crowdHomePos(blockId, seat);
    const level =
      team === this.playerTeam
        ? this.unitTechLevel(kind, this.playerTeam)
        : team === this.aiTeam
          ? this.aiUnitTechLevel(kind)
          : 1;
    const beerIv = visitInterval(kind, "beer", level);
    const shopIv = visitInterval(kind, "shop", level);
    const maxHp = this.baseMaxHp(kind, level, false);
    // Grey Fans: leave every 20–30s to shop at any Bier/Fanshop
    const neutralTrip =
      team === "neutral" ? 20 + Math.random() * 10 : null;
    return {
      id: uid(),
      kind,
      team,
      blockId,
      state: "block",
      seatIndex: seat,
      standKey: null,
      hp: maxHp,
      maxHp,
      thirst: 25 + Math.random() * 25,
      satisfiedUntil:
        neutralTrip != null
          ? 1e9
          : beerIv == null
            ? 1e9
            : this.realElapsed + beerIv * (0.35 + Math.random() * 0.55),
      shopUntil:
        neutralTrip != null
          ? this.realElapsed + neutralTrip
          : shopIv == null
            ? 1e9
            : this.realElapsed + shopIv * (0.35 + Math.random() * 0.55),
      aggro: kind === "hooligans" ? 40 : kind === "ultras" ? 30 : 10,
      lean: 0,
      captureProg: 0,
      gangX: blockIdToGangX(blockId),
      x: p.x,
      y: p.y,
      path: [],
      pathI: 0,
      armSwing: 0,
      attackCd: 0,
      invading: false,
      isSteward: false,
      homeStandKey: null,
      homeBlockId: blockId,
      patrolDir: Math.random() < 0.5 ? 1 : -1,
      cheerT: 0,
      drinkT: 0,
      shopT: 0,
      throwT: 0,
      rangedPyro: false,
      onOffense: false,
      level,
      _wanderTx: undefined,
      _wanderTy: undefined,
      _wanderCd: 0.2 + Math.random() * 1.2,
      _standArriveAt: undefined,
      _angerCd: 0,
    };
  }

  private makeSteward(team: TeamId | "neutral", stand: BuildSlot): FanUnit {
    const sp = this.stewardPostPos(stand);
    const gx = this.postGangX(stand);
    const level =
      team === this.playerTeam
        ? this.unitTechLevel("ordner", this.playerTeam)
        : team === this.aiTeam
          ? this.aiUnitTechLevel("ordner")
          : 1;
    const hp = this.stewardMaxHp(level);
    // Spawn already on gang — tickFans skips stewards, so a "moving" path
    // would never finish and they'd never patrol.
    return {
      id: uid(),
      kind: "normalos",
      team,
      blockId: stand.blockId,
      state: "gang",
      seatIndex: null,
      standKey: null,
      hp,
      maxHp: hp,
      thirst: 0,
      satisfiedUntil: 1e9,
      shopUntil: 1e9,
      aggro: 80,
      lean: 0,
      captureProg: 0,
      gangX: gx,
      x: sp.x,
      y: sp.y,
      path: [],
      pathI: 0,
      armSwing: 0,
      attackCd: 0,
      invading: false,
      isSteward: true,
      homeStandKey: slotKey(stand.blockId, stand.index),
      homeBlockId: stand.blockId,
      patrolDir: Math.random() < 0.5 ? 1 : -1,
      cheerT: 0,
      drinkT: 0,
      shopT: 0,
      throwT: 0,
      rangedPyro: false,
      onOffense: false,
      level,
    };
  }

  private stewardMaxHp(level: number): number {
    const lv = Math.max(1, Math.min(UPGRADE_MAX, Math.floor(level) || 1));
    return STEWARD_STATS.maxHpBase + (lv - 1) * STEWARD_STATS.maxHpPerLevel;
  }

  private baseMaxHp(kind: FanKind, level: number, rangedPyro: boolean): number {
    let hp = FAN_STATS[kind].maxHp * unitLevelMul(level);
    if (rangedPyro) hp *= PYRO_FIGHT_HP_MUL;
    return Math.max(40, Math.floor(hp));
  }

  private applyUnitLevelStats(f: FanUnit): void {
    const lv = Math.max(1, Math.min(UPGRADE_MAX, f.level || 1));
    f.level = lv;
    if (f.isSteward) {
      const next = this.stewardMaxHp(lv);
      const ratio = f.maxHp > 0 ? f.hp / f.maxHp : 1;
      f.maxHp = next;
      f.hp = Math.max(1, Math.min(next, Math.round(next * ratio)));
      return;
    }
    const next = this.baseMaxHp(f.kind, lv, f.rangedPyro);
    const ratio = f.maxHp > 0 ? f.hp / f.maxHp : 1;
    f.maxHp = next;
    f.hp = Math.max(1, Math.min(next, Math.round(next * ratio)));
  }

  /** Ordner stand in front of their post (gang side) */
  private stewardPostPos(stand: BuildSlot): { x: number; y: number } {
    const c = boothCenter(stand.blockId, stand.index);
    return { x: c.x, y: gangMidY() + (c.y < gangMidY() ? -0.02 : 0.02) };
  }

  private placeBuilding(
    blockId: number,
    index: number,
    kind: BuildingKind,
    free: boolean,
    owner: TeamId | "neutral",
  ): void {
    const s = this.slots.find((x) => x.blockId === blockId && x.index === index);
    if (!s || s.building) return;
    const cost = BUILD_COST[kind];
    if (!free && this.gold < cost) return;
    if (!free) this.gold -= cost;
    s.building = kind;
    s.greyNeutral = false;
    s.owner = owner;
    s.level = 1;
    s.stewardCd = kind === "ordner" ? (owner === "neutral" ? NEUTRAL_STEWARD_RESPAWN : 9999) : 8;
    s.convertAcc = 0;
    s.convertBy = null;
    s.prodFlash = 0;
    s.autoLevelAcc = 0;
    s.bannerHoldAcc = 0;
    s.enemyZoneAcc = 0;
    s.beerStealAcc = 0;
    if (kind === "bier") s.beer = 40;
    if (kind === "fanshop") s.merch = 40;
    if (kind === "ordner") this.initOrdnerPostHp(s);
  }

  private initOrdnerPostHp(s: BuildSlot): void {
    s.structMaxHp = ordnerPostMaxHp(s.level || 1);
    s.structHp = s.structMaxHp;
    this.postFxBand.set(slotKey(s.blockId, s.index), 0);
  }

  private ordnerPostGangPos(s: BuildSlot): { x: number; y: number } {
    const c = boothCenter(s.blockId, s.index);
    return { x: c.x, y: gangMidY() };
  }

  /** Gang-X of an Ordnerpost plot (left/right mid posts differ). */
  private postGangX(s: BuildSlot): number {
    return plotGangX(s.blockId, s.index);
  }

  /**
   * Truly grey/neutral buildings only — NOT blue/red posts that were claimed
   * or built on formerly neutral mid plots.
   */
  private isGreyBuilding(s: BuildSlot): boolean {
    if (s.owner === this.playerTeam || s.owner === this.aiTeam) return false;
    return !!(s.owner === "neutral" || s.greyNeutral);
  }

  /** Active attack order or block invasion — not shopping / walking home. */
  private isActiveAttacker(f: FanUnit): boolean {
    return !!(f.onOffense || f.invading);
  }

  /**
   * Intact Ordnerpost that blocks this team's advance / Standarte.
   * Includes grey mid AND enemy-colored posts on any plot (incl. former
   * neutral mid) — those must be destroyed before units can push past.
   */
  private isHostileOrdnerPost(s: BuildSlot, team: TeamId): boolean {
    if (s.building !== "ordner" || s.structHp <= 0) return false;
    if (s.owner === team) return false;
    return s.owner === "neutral" || s.owner !== team;
  }

  private destroyOrdnerPost(s: BuildSlot): void {
    const key = slotKey(s.blockId, s.index);
    const pos = this.standWorld(s);
    this.burstPostRubble(pos.x, pos.y);
    for (const f of this.fans) {
      if (f.isSteward && f.homeStandKey === key) f.hp = 0;
    }
    s.building = null;
    s.structHp = 0;
    s.structMaxHp = 0;
    s.stewardCd = 0;
    s.autoLevelAcc = 0;
    s.bannerHoldAcc = 0;
    s.enemyZoneAcc = 0;
    s.beerStealAcc = 0;
    this.postFxBand.delete(key);
    this.floatAtSlot(s, "Posten zerstört", false);
  }

  /** Razed non-Ordner building (enemy-zone decay) */
  private destroyNonOrdnerBuilding(s: BuildSlot): void {
    if (!s.building || s.building === "ordner") return;
    const pos = this.standWorld(s);
    this.burstPostRubble(pos.x, pos.y);
    s.building = null;
    s.beer = 0;
    s.merch = 0;
    s.level = 1;
    s.owner = s.blockId === NEUTRAL_BLOCK ? "neutral" : null;
    s.greyNeutral = false;
    s.convertAcc = 0;
    s.convertBy = null;
    s.bannerHoldAcc = 0;
    s.enemyZoneAcc = 0;
    s.beerStealAcc = 0;
    s.prodFlash = 0;
    this.floatAtSlot(s, "Gebäude kaputt", false);
  }

  private damageOrdnerPost(
    s: BuildSlot,
    dmg: number,
    at: FanUnit,
  ): void {
    if (s.structHp <= 0) return;
    const key = slotKey(s.blockId, s.index);
    const prevBand = this.postDamageBand(s);
    s.structHp = Math.max(0, s.structHp - dmg);
    s.prodFlash = 1;
    if (Math.random() < 0.28) sfx("hit");
    if (s.owner === this.playerTeam || s.owner === this.aiTeam) {
      this.alertTeamDefense(s.owner as TeamId, this.postGangX(s));
    }
    if (s.structHp <= 0) {
      this.destroyOrdnerPost(s);
      const killer =
        at.team === this.playerTeam || at.team === this.aiTeam
          ? (at.team as TeamId)
          : (this.fans.find((f) => f.id === at.id)?.team as TeamId | undefined);
      if (killer === this.playerTeam || killer === this.aiTeam) {
        this.applyKillMomentum(killer, MOMENTUM_KILL_POST);
      }
      return;
    }
    const nextBand = this.postDamageBand(s);
    if ((nextBand === 1 || nextBand === 2) && nextBand > prevBand) {
      this.burstPostDamageTransition(s, nextBand);
      this.postFxBand.set(key, nextBand);
    }
    if (Math.random() < 0.35) {
      const p = this.ordnerPostGangPos(s);
      this.floatAt(p.x, p.y, `−${Math.round(dmg)}`, false);
    }
    void at;
  }

  /** 0 healthy · 1 orange (<45%) · 2 red (<20%) — mirrors HP-bar colors. */
  private postDamageBand(s: BuildSlot): 0 | 1 | 2 {
    if (s.building !== "ordner" || s.structMaxHp <= 0 || s.structHp <= 0) return 0;
    const pct = s.structHp / s.structMaxHp;
    if (pct <= POST_FX_RED) return 2;
    if (pct <= POST_FX_ORANGE) return 1;
    return 0;
  }

  private burstPostDamageTransition(s: BuildSlot, band: 1 | 2): void {
    const p = this.standWorld(s);
    if (band === 1) {
      // Crossing into orange: dense smoke plume
      for (let i = 0; i < 14; i++) {
        this.moodFx.push({
          kind: "smoke",
          x: p.x + (Math.random() - 0.5) * 0.04,
          y: p.y - 0.01 + (Math.random() - 0.5) * 0.02,
          vx: (Math.random() - 0.5) * 0.06,
          vy: -0.05 - Math.random() * 0.06,
          color: Math.random() < 0.5 ? "#94a3b8" : "#64748b",
          t: 0,
          life: 1.1 + Math.random() * 0.5,
          size: 0.022 + Math.random() * 0.02,
        });
      }
      return;
    }
    // Crossing into red: smoke + fire tongues
    for (let i = 0; i < 10; i++) {
      this.moodFx.push({
        kind: "smoke",
        x: p.x + (Math.random() - 0.5) * 0.045,
        y: p.y - 0.01,
        vx: (Math.random() - 0.5) * 0.07,
        vy: -0.06 - Math.random() * 0.07,
        color: "#57534e",
        t: 0,
        life: 1.2 + Math.random() * 0.5,
        size: 0.024 + Math.random() * 0.022,
      });
    }
    for (let i = 0; i < 16; i++) {
      this.moodFx.push({
        kind: "flame",
        x: p.x + (Math.random() - 0.5) * 0.035,
        y: p.y + 0.005 + (Math.random() - 0.5) * 0.015,
        vx: (Math.random() - 0.5) * 0.04,
        vy: -0.08 - Math.random() * 0.1,
        color: Math.random() < 0.45 ? "#f97316" : Math.random() < 0.5 ? "#ef4444" : "#fde68a",
        t: 0,
        life: 0.55 + Math.random() * 0.45,
        size: 0.014 + Math.random() * 0.016,
      });
    }
  }

  /** Short large rubble / debris cloud when a post collapses → empty plot. */
  private burstPostRubble(x: number, y: number): void {
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.04 + Math.random() * 0.14;
      this.moodFx.push({
        kind: "rubble",
        x: x + (Math.random() - 0.5) * 0.03,
        y: y + (Math.random() - 0.5) * 0.02,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.55 - 0.06 - Math.random() * 0.08,
        color:
          Math.random() < 0.35
            ? "#78716c"
            : Math.random() < 0.5
              ? "#a8a29e"
              : "#57534e",
        t: 0,
        life: 0.7 + Math.random() * 0.55,
        size: 0.01 + Math.random() * 0.018,
      });
    }
    for (let i = 0; i < 18; i++) {
      this.moodFx.push({
        kind: "smoke",
        x: x + (Math.random() - 0.5) * 0.05,
        y: y + (Math.random() - 0.5) * 0.03,
        vx: (Math.random() - 0.5) * 0.1,
        vy: -0.04 - Math.random() * 0.08,
        color: Math.random() < 0.5 ? "#d6d3d1" : "#a8a29e",
        t: 0,
        life: 0.9 + Math.random() * 0.6,
        size: 0.03 + Math.random() * 0.035,
      });
    }
    for (let i = 0; i < 10; i++) {
      this.moodFx.push({
        kind: "flame",
        x: x + (Math.random() - 0.5) * 0.04,
        y: y,
        vx: (Math.random() - 0.5) * 0.05,
        vy: -0.1 - Math.random() * 0.08,
        color: Math.random() < 0.5 ? "#fb923c" : "#facc15",
        t: 0,
        life: 0.45 + Math.random() * 0.35,
        size: 0.012 + Math.random() * 0.014,
      });
    }
  }

  /** Ongoing smoke (orange) / fire (red) while Ordnerpost is damaged. */
  private tickOrdnerPostDamageFx(dt: number): void {
    for (const s of this.slots) {
      if (s.building !== "ordner" || s.structMaxHp <= 0 || s.structHp <= 0) continue;
      const band = this.postDamageBand(s);
      const key = slotKey(s.blockId, s.index);
      this.postFxBand.set(key, band);
      if (band === 0) continue;
      const p = this.standWorld(s);
      // Orange: steady smoke; red: denser smoke + flames
      const smokeRate = band === 2 ? 7 : 4;
      if (Math.random() < smokeRate * dt) {
        this.moodFx.push({
          kind: "smoke",
          x: p.x + (Math.random() - 0.5) * 0.03,
          y: p.y - 0.005,
          vx: (Math.random() - 0.5) * 0.035,
          vy: -0.045 - Math.random() * 0.04,
          color: band === 2 ? "#57534e" : "#94a3b8",
          t: 0,
          life: 0.9 + Math.random() * 0.5,
          size: 0.018 + Math.random() * 0.016,
        });
      }
      if (band === 2 && Math.random() < 9 * dt) {
        this.moodFx.push({
          kind: "flame",
          x: p.x + (Math.random() - 0.5) * 0.028,
          y: p.y + 0.008,
          vx: (Math.random() - 0.5) * 0.03,
          vy: -0.07 - Math.random() * 0.09,
          color:
            Math.random() < 0.4
              ? "#f97316"
              : Math.random() < 0.5
                ? "#ef4444"
                : "#fde68a",
          t: 0,
          life: 0.4 + Math.random() * 0.35,
          size: 0.012 + Math.random() * 0.014,
        });
      }
    }
  }

  /** Nur echte Bedrohung im/am Heimblock — nicht die Kampf-Frontlinie weit draußen */
  teamHomeThreatened(team: TeamId): boolean {
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    if (this.enemyUltraInBlock(home, team)) return true;
    return this.enemyOnGangNearHome(team);
  }

  toast(text: string, duration = 2.2, channel?: TickerChannel): void {
    // Mid-screen DOM toast disabled — only the LIVE ticker under momentum
    this.pushTicker(text, channel ?? this.classifyTicker(text), Math.max(3.2, duration));
    void duration;
  }

  /** Push a prominent Live-Ticker line under the momentum bar */
  pushTicker(text: string, channel: TickerChannel, duration = 4.2): void {
    const clean = text.trim();
    if (!clean) return;
    // Replace duplicate head; keep queue short
    if (this.tickerQueue[0]?.text === clean) {
      this.tickerQueue[0]!.t = Math.max(this.tickerQueue[0]!.t, duration);
      this.tickerQueue[0]!.channel = channel;
      return;
    }
    this.tickerQueue.unshift({ text: clean, channel, t: duration });
    if (this.tickerQueue.length > 4) this.tickerQueue.length = 4;
  }

  activeTicker(): TickerItem | null {
    return this.tickerQueue[0] ?? null;
  }

  private classifyTicker(text: string): TickerChannel {
    const t = text.toLowerCase();
    if (
      /bier|fass|€|gold|bau|bude|fanshop|ordnerpost|upgrade|ausverkauft|fanartikel|sicherheit|übernommen|gebaut|nachschub|slot|plot/.test(
        t,
      )
    )
      return "build";
    if (
      /kampf|angriff|verteid|blocksturm|gegen-sturm|besiegt|pyro|hooligan|ultra →|nahkampf|feind|sturm|invade/.test(
        t,
      )
    )
      return "combat";
    if (
      /momentum|kurve|stimmung|normalo|fan |gekauft|personen|bierrunde|jubel/.test(
        t,
      )
    )
      return "crowd";
    return "match";
  }

  floatAt(x: number, y: number, text: string, good: boolean): void {
    this.floats.push({ x, y, text, good, t: 1.6, vy: 0.05 });
  }

  floatAtSlot(s: BuildSlot, text: string, good: boolean): void {
    const p = this.standWorld(s);
    this.floatAt(p.x, p.y - 0.02, text, good);
  }

  private spend(
    key: keyof Currencies,
    amount: number,
    at?: { x: number; y: number },
    label?: string,
  ): boolean {
    if (this.currency[key] < amount) return false;
    this.currency[key] = Math.max(0, this.currency[key] - amount);
    if (at) {
      const tag = label ?? key.toUpperCase();
      this.floatAt(at.x, at.y, `−${Math.round(amount)} ${tag}`, false);
    }
    return true;
  }

  private gain(
    key: keyof Currencies,
    amount: number,
    at?: { x: number; y: number },
    label?: string,
  ): void {
    this.currency[key] = Math.max(0, this.currency[key] + amount);
    if (at) {
      const tag = label ?? key.toUpperCase();
      this.floatAt(at.x, at.y, `+${Math.round(amount)} ${tag}`, true);
    }
  }

  setSpeed(s: SpeedMode): void {
    this.speed = s;
  }

  currencyPct(key: keyof Currencies): number {
    return Math.floor(this.currency[key]);
  }

  /** Ultras + Hooligans counting toward Blocksturm / invade pressure */
  private countBlockInvaders(team: TeamId, blockId: number): number {
    return this.fans.filter(
      (f) =>
        f.hp > 0 &&
        !f.isSteward &&
        f.team === team &&
        (f.kind === "ultras" || f.kind === "hooligans") &&
        f.blockId === blockId &&
        (f.invading || f.state === "block"),
    ).length;
  }

  /** Short status for combat banner */
  combatStatus(): string | null {
    const pInv = this.countBlockInvaders(this.playerTeam, GAST_BLOCK);
    const aInv = this.countBlockInvaders(this.aiTeam, HEIM_BLOCK);
    if (this.stormBanner?.team === this.playerTeam) {
      return `Hier regiert der ${teamLabel(this.playerTeam)}! ${Math.ceil(this.stormHoldSec() - this.stormBanner.holdT)}s · ${pInv}/${this.stormNeed()}`;
    }
    if (this.stormBanner?.team === this.aiTeam) {
      return `Hier regiert der ${teamLabel(this.aiTeam)}! ${Math.ceil(this.stormHoldSec() - this.stormBanner.holdT)}s · ${aInv}/${this.stormNeed()}`;
    }
    if (pInv > 0)
      return `ANGRIFF im Gästeblock · ${pInv} Angreifer — Verteidigung!`;
    if (aInv > 0)
      return `VERTEIDIGUNG · ${aInv} Feind-Angreifer im Heimblock`;
    return null;
  }

  /** Active Live-Ticker line (under momentum bar) */
  activeTip(): TickerItem | null {
    return this.activeTicker();
  }

  /**
   * Contextual Live-Ticker hints when something shifts.
   * Channels: match (white) · combat (red) · crowd (blue) · build (orange).
   */
  private tickTips(dt: number): void {
    for (const t of this.tickerQueue) t.t -= dt;
    this.tickerQueue = this.tickerQueue.filter((t) => t.t > 0);
    this.tipCd = Math.max(0, this.tipCd - dt);

    // Combat banner also feeds the red ticker channel
    const combat = this.combatStatus();
    if (combat) {
      this.pushTicker(combat, "combat", 2.4);
    }

    if (this.tipCd > 0) return;

    type Cand = { key: string; text: string; channel: TickerChannel; prio: number };
    const cands: Cand[] = [];
    // Skip economy-nag tips in the opening minutes (Anpfiff clutter)
    const economyTips = this.minute >= 3;
    const beer = this.currency.beer;
    if (economyTips && beer < 8) {
      cands.push({
        key: "beer-low",
        text: beer < 3 ? "Bier ist leer — Hooligans warten" : "Bier ist knapp",
        channel: "build",
        prio: beer < 3 ? 90 : 70,
      });
    }
    const merch = this.currency.merch;
    if (economyTips && merch < 6) {
      cands.push({
        key: "merch-low",
        text: "Fanartikel werden knapp",
        channel: "build",
        prio: 55,
      });
    }
    const M = this.momentum;
    // Torchance-Güte: Abstand zum Threshold
    const goalEdge = this.blitz ? BLITZ_GOAL_MOMENTUM_EDGE : GOAL_MOMENTUM_EDGE;
    const edgeFrac = Math.abs(M) / goalEdge;
    const ourSide = M > 0;
    if (edgeFrac >= 0.92 && this.goalLockT <= 0) {
      cands.push({
        key: ourSide ? "tor-imminent-us" : "tor-imminent-them",
        text: ourSide
          ? "Tor steht bevor — Kurve drückt voll durch!"
          : "Gegner-Tor droht — Stimmung kippt!",
        channel: "match",
        prio: 88,
      });
    } else if (edgeFrac >= 0.7) {
      cands.push({
        key: ourSide ? "tor-hot-us" : "tor-hot-them",
        text: ourSide
          ? "Sehr gute Torchance — Ball fast im Torraum"
          : "Gefährliche Torchance für den Gegner",
        channel: "match",
        prio: 78,
      });
    } else if (edgeFrac >= 0.45) {
      cands.push({
        key: ourSide ? "tor-ok-us" : "tor-ok-them",
        text: ourSide
          ? "Torchance wächst — Kurve zieht an"
          : "Gegnerische Kurve kommt gefährlich nah",
        channel: "crowd",
        prio: 62,
      });
    } else if (Math.abs(M) > 0.28) {
      cands.push({
        key: ourSide ? "mom-up" : "mom-down",
        text: ourSide ? "Momentum auf unserer Seite" : "Das Momentum kippt",
        channel: "crowd",
        prio: 50 + Math.round(Math.abs(M) * 15),
      });
    }
    const home = HEIM_BLOCK;
    const threatened = this.slots.some(
      (s) =>
        s.building === "ordner" &&
        s.owner === this.playerTeam &&
        s.structMaxHp > 0 &&
        s.structHp > 0 &&
        s.structHp / s.structMaxHp < 0.4,
    );
    if (threatened) {
      cands.push({
        key: "ordner-dmg",
        text: "Ordnerpost unter Druck",
        channel: "combat",
        prio: 85,
      });
    }
    if (this.countBlockInvaders(this.aiTeam, home) > 0) {
      cands.push({
        key: "home-invade",
        text: "Feind im Heimblock — verteidigen!",
        channel: "combat",
        prio: 95,
      });
      if (!this.uiFlash || this.uiFlash.tone !== "danger") {
        this.flash("Heimblock unter Druck!", "danger", 1.8);
      }
    }
    const emptyBier = this.slots.some(
      (s) =>
        s.building === "bier" &&
        s.owner === this.playerTeam &&
        s.beer < 1,
    );
    if (emptyBier) {
      cands.push({
        key: "shelf-empty",
        text: "Bierstand ausverkauft — Nachschub!",
        channel: "build",
        prio: 65,
      });
    }
    if (
      this.minute > 70 &&
      this.minute < 85 &&
      Math.abs(this.scoreKsc - this.scoreVfb) <= 1
    ) {
      cands.push({
        key: "late-game",
        text: "Schlussphase — jede Aktion zählt",
        channel: "match",
        prio: 40,
      });
    }

    cands.sort((a, b) => b.prio - a.prio);
    for (const c of cands) {
      if (this.tipSeen.has(c.key)) continue;
      this.tipSeen.add(c.key);
      this.pushTicker(c.text, c.channel, 4.8);
      this.tipCd = 7.5;
      if (this.tipSeen.size > 6) {
        const first = this.tipSeen.values().next().value;
        if (first) this.tipSeen.delete(first);
      }
      return;
    }
    if (cands.length && this.tipCd <= 0) {
      this.tipSeen.clear();
      this.tipCd = 4;
    }
  }

  canBuy(kind: FanKind): boolean {
    const team = this.actingTeam();
    const c = BUY_COST[kind];
    if (kind === "normalos") return this.getTeamCur(team, "security") >= c.security;
    if (kind === "ultras") return this.getTeamCur(team, "merch") >= c.merch;
    return this.getTeamCur(team, "beer") >= c.beer;
  }

  /** Name the missing currency for buy toasts */
  private missingBuyToast(kind: FanKind): string {
    const team = this.actingTeam();
    const c = BUY_COST[kind];
    if (kind === "normalos") {
      const need = Math.ceil(c.security - this.getTeamCur(team, "security"));
      return `Zu wenig Sicherheit (−${Math.max(1, need)})`;
    }
    if (kind === "ultras") {
      const need = Math.ceil(c.merch - this.getTeamCur(team, "merch"));
      return `Zu wenig Fanartikel (−${Math.max(1, need)})`;
    }
    const need = Math.ceil(c.beer - this.getTeamCur(team, "beer"));
    return `Zu wenig Bier (−${Math.max(1, need)})`;
  }

  /** Fans currently contributing Jubel (in block seats only — not gang) */
  countInBlock(team: TeamId, blockId: number, kind?: FanKind): number {
    return this.fans.filter(
      (f) =>
        f.team === team &&
        f.blockId === blockId &&
        f.hp > 0 &&
        f.state === "block" &&
        !f.isSteward &&
        (kind ? f.kind === kind : true),
    ).length;
  }

  private homeBlockOf(f: FanUnit): number {
    if (f.homeBlockId != null) return f.homeBlockId;
    if (f.team === this.playerTeam) return HEIM_BLOCK;
    if (f.team === this.aiTeam) return GAST_BLOCK;
    return f.blockId;
  }

  /** Own home always; captured/contested blocks once you have any own fan there */
  canBuyInBlock(blockId: number): boolean {
    const team = this.actingTeam();
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const enemy = team === this.playerTeam ? GAST_BLOCK : HEIM_BLOCK;
    if (blockId === enemy) return false;
    if (blockId === home) return true;
    if (this.blockOwner[blockId] === team) return true;
    return this.fans.some(
      (f) =>
        f.hp > 0 &&
        !f.isSteward &&
        f.team === team &&
        (f.homeBlockId === blockId ||
          (f.state === "block" && f.blockId === blockId && f.seatIndex != null)),
    );
  }

  /** Living fan counts for HUD (excl. dead) */
  countTeamFans(team: TeamId): {
    ultras: number;
    normalos: number;
    hooligans: number;
    ordner: number;
  } {
    let ultras = 0,
      normalos = 0,
      hooligans = 0,
      ordner = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.team !== team) continue;
      if (f.isSteward) {
        ordner++;
        continue;
      }
      if (f.kind === "ultras") ultras++;
      else if (f.kind === "normalos") normalos++;
      else if (f.kind === "hooligans") hooligans++;
    }
    return { ultras, normalos, hooligans, ordner };
  }

  /** Seat reserved while fan lives (Ultra on gang keeps Heim-Platz) */
  seatOccupied(blockId: number, seatIndex: number): FanUnit | null {
    return (
      this.fans.find((f) => {
        if (f.hp <= 0 || f.isSteward || f.seatIndex !== seatIndex) return false;
        // Away from home (gang / invade / pathing): reserve home seat only
        if (f.invading || f.state === "gang" || f.state === "moving" || f.state === "stand") {
          return this.homeBlockOf(f) === blockId;
        }
        return f.state === "block" && f.blockId === blockId;
      }) ?? null
    );
  }

  /** Next free seat index in a block (unbounded — blocks are not capped). */
  freeSeat(blockId: number): number {
    let i = 0;
    while (this.seatOccupied(blockId, i)) i++;
    return i;
  }

  /** Fans in controllable blocks (HUD). No capacity limit. */
  countFreeBuySeats(): number {
    let n = 0;
    for (let blockId = 0; blockId < BLOCK_COUNT; blockId++) {
      if (blockId === GAST_BLOCK || !this.canBuyInBlock(blockId)) continue;
      n += this.blockFanCount(blockId);
    }
    return n;
  }

  /** Own home → eroberte Neutrals; always a slot (no hard seat cap). */
  buySlotForPlayer(): { blockId: number; seatIndex: number } | null {
    const team = this.actingTeam();
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const order: number[] = [home];
    for (let b = 0; b < BLOCK_COUNT; b++) {
      if (b !== HEIM_BLOCK && b !== GAST_BLOCK) order.push(b);
    }
    for (const blockId of order) {
      if (!this.canBuyInBlock(blockId)) continue;
      return { blockId, seatIndex: this.freeSeat(blockId) };
    }
    return null;
  }

  canQuickBuy(kind: FanKind): boolean {
    if (this.blitzFanCapReached(this.actingTeam())) return false;
    return this.canBuy(kind) && this.buySlotForPlayer() != null;
  }

  /** HUD [+] — buy into next controlled block */
  tryBuyFanQuick(kind: FanKind): boolean {
    const slot = this.buySlotForPlayer();
    if (!slot) {
      this.toast("Kein kontrollierter Block");
      return false;
    }
    const ok = this.tryBuyFan(kind, slot.blockId, slot.seatIndex);
    if (ok) this.markGuided("fans");
    return ok;
  }

  blockFanCount(blockId: number): number {
    return this.fans.filter(
      (f) => f.hp > 0 && !f.isSteward && f.blockId === blockId && f.seatIndex != null,
    ).length;
  }

  private spawnPyroShot(
    a: FanUnit,
    tx: number,
    ty: number,
    damage: number,
    targetFanId: number | null,
    targetSlotKey: string | null,
  ): void {
    const dx = tx - a.x;
    const dy = ty - a.y;
    const len = Math.hypot(dx, dy) || 1;
    a.throwT = ANIM_THROW_SEC;
    a.armSwing = 1;
    this.pyroShots.push({
      x: a.x,
      y: a.y,
      vx: (dx / len) * 0.62,
      vy: (dy / len) * 0.62,
      damage,
      attackerId: a.id,
      targetFanId,
      targetSlotKey,
      team: a.team as TeamId,
      t: 0,
      life: 0.55,
    });
  }

  private tickPyroShots(dt: number): void {
    for (const p of this.pyroShots) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.t < 0.08) continue;
      if (p.targetSlotKey) {
        const s = this.slots.find(
          (x) => slotKey(x.blockId, x.index) === p.targetSlotKey,
        );
        if (s && s.structHp > 0) {
          const pos = this.ordnerPostGangPos(s);
          if (dist(p.x, p.y, pos.x, pos.y) < 0.045) {
            this.damageOrdnerPost(s, p.damage, { id: p.attackerId } as FanUnit);
            p.life = 0;
            this.moodFx.push({
              kind: "smoke",
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 0.05,
              vy: -0.04,
              color: "#94a3b8",
              t: 0,
              life: 0.9,
              size: 0.03,
            });
          }
        } else {
          p.life = 0;
        }
        continue;
      }
      const target = this.fans.find((f) => f.id === p.targetFanId);
      if (target && target.hp > 0) {
        if (dist(p.x, p.y, target.x, target.y) < 0.05) {
          const atk = this.fans.find((f) => f.id === p.attackerId);
          if (atk) this.applyHit(atk, target);
          else target.hp -= p.damage;
          this.moodFx.push({
            kind: "smoke",
            x: p.x,
            y: p.y,
            vx: 0,
            vy: -0.03,
            color: "#64748b",
            t: 0,
            life: 0.7,
            size: 0.025,
          });
          p.life = 0;
        }
      } else if (p.t > p.life) {
        p.life = 0;
      }
    }
    this.pyroShots = this.pyroShots.filter((p) => p.t < p.life);
  }

  /**
   * Rückkehr / Verteidigung:
   * - Angreifer (onOffense) bleiben immer im Angriff — kein Abwanderung wegen
   *   Durst, leerem Gang oder „Ziel erledigt“
   * - Nur Nicht-Angreifer auf dem Gang gehen nach Entwarnung heim
   */
  private tickRecallForDefense(dt: number): void {
    void dt;
    for (const team of [this.playerTeam, this.aiTeam] as TeamId[]) {
      const threatened = this.teamHomeThreatened(team);

      for (const f of this.fans) {
        if (f.hp <= 0 || f.team !== team) continue;
        if (f.kind !== "hooligans" && f.kind !== "ultras" && f.kind !== "normalos")
          continue;
        if (f.isSteward) continue;

        // Ordered attackers never auto-return (thirst / empty corridor / etc.)
        if (f.onOffense) continue;

        // Nicht bedroht → vom Gang / aus der Invasion zurück in den Block
        if (
          !threatened &&
          (f.state === "gang" || (f.invading && f.state === "block"))
        ) {
          this.returnFanToHomeBlock(f);
        }
      }
    }
  }

  /** Path a fan back into their home block seat (clears gang linger). */
  private returnFanToHomeBlock(f: FanUnit): void {
    if (f.hp <= 0 || f.isSteward) return;
    if (f.state === "moving" && this.getAfter(f) === "home") return;
    const home = this.homeBlockOf(f);
    const seat = f.seatIndex ?? f._homeSeat ?? this.freeSeat(home);
    if (seat == null) return;
    f.invading = false;
    f.onOffense = false;
    f.aggro = 10;
    f._homeSeat = seat;
    // Drop any leftover stand queue so they don't look "still shopping"
    f.standKey = null;
    f.drinkT = 0;
    f.shopT = 0;
    f._standArriveAt = undefined;
    const end = crowdHomePos(home, seat);
    this.startPath(f, this.pathViaDoors(f, home, end), "home");
  }

  private enemyOnGangNearHome(team: TeamId): boolean {
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const homeGx = blockIdToGangX(home);
    const reach = 0.18;
    return this.fans.some((o) => {
      if (o.hp <= 0 || o.team === team || o.team === "neutral") return false;
      if (!(o.kind === "ultras" || o.kind === "hooligans")) return false;
      if (o.state !== "gang" && !o.invading && o.state !== "moving") return false;
      return Math.abs(o.gangX - homeGx) < reach;
    });
  }

  private ordnerPostDamageFrom(a: FanUnit): number {
    const rangedMul = a.rangedPyro ? RANGED_DAMAGE_SCALE : 1;
    const ultraMul = a.kind === "ultras" ? ULTRA_VS_POST_MUL : 1;
    return (
      HIT_DAMAGE *
      HIT_DAMAGE_SCALE *
      rangedMul *
      ultraMul *
      this.attackOf(a) *
      this.neighborBonus(a) *
      1.15
    );
  }

  private tickOrdnerPostCombat(dt: number): void {
    // Post damage is handled in tickCombat (nearest unit-or-building target).
    void dt;
  }

  /**
   * Prefer a foe on a similar Y-band (skirmish pocket) over the absolute
   * nearest clump — keeps 4v6 fights as distributed 1v1 / 2v2 instead of
   * one stacked melee blob.
   */
  private skirmishScore(ax: number, ay: number, bx: number, by: number): number {
    const dx = ax - bx;
    const dy = ay - by;
    // Heavy Y weight so units stick to their lane band when choosing targets
    return Math.hypot(dx, dy * 2.6);
  }

  /** Nearest hostile unit or Ordnerpost for offense targeting. */
  private nearestHostileEngage(
    a: FanUnit,
  ):
    | { kind: "unit"; unit: FanUnit; dist: number }
    | { kind: "post"; post: BuildSlot; dist: number }
    | null {
    const reach = a.rangedPyro ? RANGED_RANGE : MELEE_RANGE;
    let bestUnit: FanUnit | null = null;
    let bestUnitD = Number.POSITIVE_INFINITY;
    let bestUnitScore = Number.POSITIVE_INFINITY;
    for (const b of this.fans) {
      if (!this.isHostileUnit(a, b)) continue;
      const sameBlockFight =
        a.blockId === b.blockId &&
        (a.state === "block" || a.invading) &&
        (b.state === "block" || b.invading || b.isSteward);
      const midY = gangMidY();
      const aOnCorridor =
        a.state === "gang" ||
        a.isSteward ||
        a.state === "stand" ||
        a.invading ||
        (a.state === "moving" && Math.abs(a.y - midY) < 0.12);
      const bOnCorridor =
        b.state === "gang" ||
        b.isSteward ||
        b.state === "stand" ||
        (b.state === "moving" && Math.abs(b.y - midY) < 0.12);
      if (!sameBlockFight && !(aOnCorridor && bOnCorridor)) continue;
      const d = dist(a.x, a.y, b.x, b.y);
      const score = this.skirmishScore(a.x, a.y, b.x, b.y);
      if (score < bestUnitScore || (score === bestUnitScore && d < bestUnitD)) {
        bestUnitScore = score;
        bestUnitD = d;
        bestUnit = b;
      }
    }

    let bestPost: BuildSlot | null = null;
    let bestPostD = Number.POSITIVE_INFINITY;
    if (
      a.team !== "neutral" &&
      (a.kind === "ultras" || a.kind === "hooligans" || a.isSteward) &&
      (a.state === "gang" || a.invading || a.state === "moving")
    ) {
      for (const s of this.slots) {
        if (!this.isHostileOrdnerPost(s, a.team as TeamId)) continue;
        // Grey-only rule: passive shoppers must not chip grey posts.
        // Blue/red posts (also on former mid plots) stay valid combat targets.
        if (this.isGreyBuilding(s) && !this.isActiveAttacker(a)) {
          continue;
        }
        const pos = this.ordnerPostGangPos(s);
        const d = dist(a.x, a.y, pos.x, pos.y);
        // Prefer posts ahead / nearby; ignore far behind
        const dir = a.team === this.playerTeam ? 1 : -1;
        const ahead = (pos.x - a.x) * dir;
        if (ahead < -reach * 0.35) continue;
        if (d < bestPostD) {
          bestPostD = d;
          bestPost = s;
        }
      }
    }

    if (bestUnit && bestUnitD <= (bestPost ? bestPostD : Infinity)) {
      return { kind: "unit", unit: bestUnit, dist: bestUnitD };
    }
    if (bestPost) return { kind: "post", post: bestPost, dist: bestPostD };
    if (bestUnit) return { kind: "unit", unit: bestUnit, dist: bestUnitD };
    return null;
  }

  /**
   * Spieler-Einheiten einer Art, die bereit zum Angriff sind —
   * im Block oder am Stand (Bier/Fanshop-Warteschlange).
   */
  attackReadyList(kind: "ultras" | "hooligans"): FanUnit[] {
    const team = this.actingTeam();
    return this.fans.filter(
      (f) =>
        f.team === team &&
        f.kind === kind &&
        f.hp > 0 &&
        (f.state === "block" || f.state === "stand"),
    );
  }

  attackReadyCount(kind: "ultras" | "hooligans"): number {
    return this.attackReadyList(kind).length;
  }

  hooliganOrderReady(count: number | "all" = 1): boolean {
    const ready = this.attackReadyCount("hooligans");
    const n = count === "all" ? ready : Math.max(0, Math.floor(count));
    if (n < 1 || ready < n) return false;
    return this.getTeamCur(this.actingTeam(), "beer") >= HOOLIGAN_ORDER_BEER * n;
  }

  /**
   * Hooligans in den Gang schicken.
   * @param count 1 = eine Figur; "all" = alle bereiten (Kosten × Anzahl)
   */
  tryHooliganOrder(count: number | "all" = 1): boolean {
    const team = this.actingTeam();
    const list = this.attackReadyList("hooligans");
    const n = count === "all" ? list.length : Math.max(0, Math.floor(count));
    if (n < 1 || list.length < n) {
      this.toast("Keine Hooligans bereit");
      return false;
    }
    const cost = HOOLIGAN_ORDER_BEER * n;
    const door = doorPos(this.homeBlockOf(list[0]!));
    if (!this.spendTeam(team, "beer", cost, door, "BIER")) {
      this.toast(`Kampf braucht ${cost} Bier`);
      return false;
    }
    for (let i = 0; i < n; i++) {
      list[i].rangedPyro = false;
      this.sendToGang(list[i]);
    }
    this.cd.hooliganOrder = 0;
    this.toast(
      n === 1 ? "Hooligan → Angriff (Nahkampf)" : `${n} Hooligans → Nahkampf`,
    );
    return true;
  }

  pyroFightReady(count: number | "all" = 1): boolean {
    const ready = this.attackReadyCount("ultras");
    const n = count === "all" ? ready : Math.max(0, Math.floor(count));
    if (n < 1 || ready < n) return false;
    return this.getTeamCur(this.actingTeam(), "merch") >= PYRO_FIGHT_MERCH * n;
  }

  /**
   * Ultras mit Pyro in den Gang schicken.
   * @param count 1 = eine Figur; "all" = alle bereiten (Kosten × Anzahl)
   */
  tryPyroFight(count: number | "all" = 1): boolean {
    const team = this.actingTeam();
    const list = this.attackReadyList("ultras");
    const n = count === "all" ? list.length : Math.max(0, Math.floor(count));
    if (n < 1 || list.length < n) {
      this.toast("Keine Ultras bereit");
      return false;
    }
    const cost = PYRO_FIGHT_MERCH * n;
    const door = doorPos(this.homeBlockOf(list[0]!));
    if (!this.spendTeam(team, "merch", cost, door, "FANARTIKEL")) {
      this.toast(`Pyro-Kampf braucht ${cost} Fanartikel`);
      return false;
    }
    for (let i = 0; i < n; i++) {
      const u = list[i];
      u.rangedPyro = true;
      this.applyUnitLevelStats(u);
      this.sendToGang(u);
    }
    this.cd.pyroFight = 0;
    this.toast(n === 1 ? "Ultra → Pyro Wurf" : `${n} Ultras → Pyro Wurf`);
    return true;
  }

  private sendToGang(f: FanUnit): void {
    this.leaveSeatToGang(f, true);
  }

  /** Exit block/stand onto the gang for defense — not an offensive push. */
  private sendToDefend(f: FanUnit): void {
    this.leaveSeatToGang(f, false);
  }

  private leaveSeatToGang(f: FanUnit, offense: boolean): void {
    if (f.team === this.localTeam || (this.pvpAuthority && this.pvp)) {
      sfx("send");
      if (offense && f.team === this.localTeam) this.markGuided("send");
    }
    // Keep seatIndex reserved while alive on gang
    f._homeSeat = f.seatIndex;
    f.standKey = null;
    f.invading = false;
    f.onOffense = offense;
    f.aggro = offense ? 40 : 100;
    this.retargetGangWander(f);

    // Already at a stand / on the gang floor — peel straight into the fight strip
    const onGangFloor =
      f.state === "stand" ||
      (f.y >= gangY() - 0.02 && f.y <= gangY() + gangHeight() + 0.02);
    if (onGangFloor) {
      f.state = "gang";
      this.syncGangFromWorld(f);
      f.y = this.gangFreeAimY(f);
      f.path = [];
      f.pathI = 0;
      this.setAfter(f, "gang");
      return;
    }

    // Two exits under the block (left/right of door) — early horizontal spread
    const door = doorPos(f.blockId);
    const crowd = blockCrowdRect(f.blockId);
    const side = (typeof f.id === "number" ? f.id : 0) % 2 === 0 ? -1 : 1;
    const exitX = clamp(
      door.x + side * Math.max(0.028, crowd.width * 0.2),
      crowd.left + 0.01,
      crowd.left + crowd.width - 0.01,
    );
    const exit = { x: exitX, y: door.y };
    f.state = "moving";
    const path: { x: number; y: number }[] = [];
    if (Math.abs(f.x - exit.x) > 0.012) {
      path.push({ x: exit.x, y: f.y });
    }
    path.push({ x: exit.x, y: exit.y });
    path.push({ x: exit.x, y: this.gangFreeAimY(f) });
    f.path = path;
    f.pathI = 0;
    this.setAfter(f, "gang");
  }

  /** Mark a gang X so own Ordner rush to help (gang only). */
  private alertTeamDefense(team: TeamId, gx: number): void {
    if (team !== this.playerTeam && team !== this.aiTeam) return;
    this.defenseCallGx[team] = gx;
    this.defenseCallT[team] = 5;
  }

  private setAfter(f: FanUnit, mode: string): void {
    f._after = mode;
  }

  private getAfter(f: FanUnit): string | undefined {
    return f._after;
  }

  tryBuyFan(kind: FanKind, blockId: number, seatIndex: number): boolean {
    const team = this.actingTeam();
    if (!this.canBuyInBlock(blockId)) {
      this.toast("Block noch nicht unter Kontrolle");
      return false;
    }
    if (this.blitzFanCapReached(team)) {
      this.toast(`Max. ${BLITZ_COMBAT_FAN_CAP} Personen — warte auf Ausfälle`);
      return false;
    }
    // Blocks are uncapped; if a specific seat is taken, pick the next free index.
    let seat = seatIndex;
    if (this.seatOccupied(blockId, seat)) {
      seat = this.freeSeat(blockId);
    }
    if (!this.canBuy(kind)) {
      this.toast(this.missingBuyToast(kind));
      return false;
    }
    const c = BUY_COST[kind];
    const fan = this.makeFan(kind, team, blockId, seat);
    const p = { x: fan.x, y: fan.y };
    if (c.beer > 0) this.spendTeam(team, "beer", c.beer, p, "BIER");
    if (c.merch > 0) this.spendTeam(team, "merch", c.merch, p, "FANARTIKEL");
    if (c.security > 0) this.spendTeam(team, "security", c.security, p, "SICHERHEIT");
    if (c.gold > 0) {
      this.addTeamGold(team, -c.gold);
      this.floatAt(p.x, p.y, `−${c.gold}€`, false);
    }
    this.fans.push(fan);
    this.seatMenu = null;
    this.floatAt(p.x, p.y + 0.02, `+${FAN_STATS[kind].label}`, true);
    this.toast(`${FAN_STATS[kind].label} gekauft`);
    sfx("buy");
    return true;
  }

  /**
   * Own-side plots always; further plots only once the front line
   * has reached their X (plotGangX) — never by “leftish block” alone.
   */
  inPlayerTerritory(blockId: number, index = 0): boolean {
    const team = this.actingTeam();
    if (team === this.playerTeam) {
      if (blockId === GAST_BLOCK) return false;
      if (blockId === HEIM_BLOCK) return true;
      const gx = plotGangX(blockId, index);
      return gx <= this.linePlayer + 0.04;
    }
    if (blockId === HEIM_BLOCK) return false;
    if (blockId === GAST_BLOCK) return true;
    const gx = plotGangX(blockId, index);
    return gx >= this.lineAi - 0.04;
  }

  /**
   * Gäste-plots always for AI; center/left only after AI front line
   * has pushed that far — prevents early builds on the left.
   */
  inAiTerritory(blockId: number, index = 0): boolean {
    if (blockId === HEIM_BLOCK) return false;
    if (blockId === GAST_BLOCK) return true;
    const gx = plotGangX(blockId, index);
    return gx >= this.lineAi - 0.04;
  }

  tryBuild(kind: BuildingKind): boolean {
    const team = this.actingTeam();
    if (!this.selectedSlot && !this.buildMenu) {
      this.toast("Slot wählen");
      return false;
    }
    const sel = this.buildMenu ?? this.selectedSlot!;
    if (!this.inPlayerTerritory(sel.blockId, sel.index)) {
      this.toast("Frontlinie noch nicht hier");
      return false;
    }
    const enemyHome = team === this.playerTeam ? GAST_BLOCK : HEIM_BLOCK;
    if (sel.blockId === enemyHome) {
      this.toast("Gegner-Slots gesperrt");
      return false;
    }
    const s = this.slots.find(
      (x) => x.blockId === sel.blockId && x.index === sel.index,
    );
    if (!s || (s.building && !s.greyNeutral && s.owner && s.owner !== "neutral")) {
      this.toast("Slot belegt");
      return false;
    }
    // Ordnerposts must be destroyed in combat — never soft-claimed
    if (s.building === "ordner" && s.owner !== team) {
      this.toast("Ordnerposten muss bekämpft werden");
      return false;
    }
    const cost =
      s.greyNeutral || s.owner === "neutral"
        ? Math.floor(BUILD_COST[kind] * 0.7)
        : BUILD_COST[kind];
    if (this.getTeamGold(team) < cost) {
      this.toast(`${cost}€ nötig`);
      return false;
    }
    this.addTeamGold(team, -cost);
    if (!s.building) s.building = kind;
    else if (s.greyNeutral || s.owner === "neutral") {
      /* keep existing type on claim unless empty */
    } else {
      s.building = kind;
    }
    if (!s.building) s.building = kind;
    s.greyNeutral = false;
    s.owner = team;
    if (!s.level) s.level = 1;
    if (s.building === "bier" && s.beer < 20) s.beer = 40;
    if (s.building === "fanshop" && s.merch < 20) s.merch = 40;
    if (s.building === "ordner") {
      s.stewardCd = 9999; // manual hire only
      if (s.structHp <= 0) this.initOrdnerPostHp(s);
    }
    this.buildMenu = null;
    const p = this.standWorld(s);
    this.floatAt(p.x, p.y, `−${cost}€`, false);
    sfx("build");
    this.toast(
      `${s.building === "bier" ? "Bierstand" : s.building === "ordner" ? "Ordnerposten" : "Fanshop"} ${cost < BUILD_COST[kind] ? "übernommen" : "gebaut"}`,
    );
    this.markGuided("build");
    return true;
  }

  upgradeCost(s: BuildSlot): number | null {
    if (!s.building || s.level >= UPGRADE_MAX) return null;
    if (s.owner !== this.actingTeam() || s.greyNeutral) return null;
    return UPGRADE_COST[s.level + 1] ?? null;
  }

  tryUpgrade(): boolean {
    const team = this.actingTeam();
    const sel = this.buildMenu ?? this.selectedSlot;
    if (!sel) {
      this.toast("Bude wählen");
      return false;
    }
    const s = this.slots.find(
      (x) => x.blockId === sel.blockId && x.index === sel.index,
    );
    if (!s?.building) return false;
    const cost = this.upgradeCost(s);
    if (cost == null) {
      this.toast("Max. Stufe");
      return false;
    }
    if (this.getTeamGold(team) < cost) {
      this.toast(`${cost}€ nötig`);
      return false;
    }
    this.addTeamGold(team, -cost);
    const kind = s.building;
    const nextLv = Math.min(UPGRADE_MAX, (s.level || 1) + 1);
    // Blitz: one upgrade pays once and levels every owned stand of that kind
    const targets = this.blitz
      ? this.slots.filter(
          (x) =>
            x.building === kind &&
            x.owner === team &&
            !x.greyNeutral &&
            (kind !== "ordner" || (x.structHp ?? 1) > 0),
        )
      : [s];
    for (const slot of targets) {
      slot.level = nextLv;
      if (kind === "ordner") {
        const prev = slot.structHp;
        this.initOrdnerPostHp(slot);
        if (prev > 0) {
          slot.structHp = Math.min(
            slot.structMaxHp,
            prev + ORDNER_POST_HP_PER_LEVEL * 0.5,
          );
        }
      }
      this.floatAtSlot(slot, `Lv${slot.level}`, true);
    }
    this.buildMenu = null;
    const label =
      kind === "bier" ? "Bierstände" : kind === "fanshop" ? "Fanshops" : "Ordnerposten";
    this.toast(
      this.blitz && targets.length > 1
        ? `Alle ${label} → Lv${nextLv}`
        : `Upgrade → Lv${nextLv}`,
    );
    return true;
  }

  /** Lowest-level living unit of this kind for a side */
  lowestLevelUnit(
    kind: FanKind | "ordner",
    team: TeamId = this.actingTeam(),
  ): FanUnit | null {
    let best: FanUnit | null = null;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.team !== team) continue;
      if (kind === "ordner") {
        if (!f.isSteward) continue;
      } else {
        if (f.isSteward || f.kind !== kind) continue;
      }
      if (!best || (f.level || 1) < (best.level || 1)) best = f;
    }
    return best;
  }

  /** Chrome / Sidebar Personen-Stufe (Tech), nicht Min der lebenden Units */
  unitTechLevel(
    kind: FanKind | "ordner",
    team: TeamId = this.actingTeam(),
  ): number {
    if (team === this.playerTeam) {
      return Math.max(1, Math.min(UPGRADE_MAX, this.unitTech[kind] || 1));
    }
    return Math.max(1, Math.min(UPGRADE_MAX, this.aiTech[kind] || 1));
  }

  /** AI Tech-Stufe pro Kind (Kickoff + Upgrades). */
  aiUnitTechLevel(kind: FanKind | "ordner"): number {
    return Math.max(1, Math.min(UPGRADE_MAX, this.aiTech[kind] || 1));
  }

  /** Alle Schwierigkeiten dürfen bis Lv5 — Easy nur langsamer. */
  private aiTechSoftCap(): number {
    return UPGRADE_MAX;
  }

  /** Highest owned building level of a kind for a team (0 if none). */
  maxOwnedBuildingLevel(kind: BuildingKind, team: TeamId): number {
    let max = 0;
    for (const s of this.slots) {
      if (
        s.building === kind &&
        s.owner === team &&
        !s.greyNeutral &&
        (s.structHp == null || s.structHp > 0 || kind !== "ordner")
      ) {
        max = Math.max(max, s.level || 1);
      }
    }
    return max;
  }

  /** Unit tech next level requires matching building ≥ that level. */
  unitUpgradeBuildingCap(
    kind: FanKind | "ordner",
    team: TeamId = this.actingTeam(),
  ): number {
    return this.maxOwnedBuildingLevel(buildingForUnitKind(kind), team);
  }

  minUnitLevel(kind: FanKind | "ordner", team: TeamId = this.actingTeam()): number {
    return this.unitTechLevel(kind, team);
  }

  maxUnitLevel(kind: FanKind | "ordner", team: TeamId = this.actingTeam()): number {
    return this.unitTechLevel(kind, team);
  }

  /** Sidebar label: "Lv3" — tech level for that side */
  unitLevelLabel(kind: FanKind | "ordner", team: TeamId = this.actingTeam()): string {
    return `Lv${this.unitTechLevel(kind, team)}`;
  }

  unitUpgradeCostFor(kind: FanKind | "ordner"): number | null {
    return unitUpgradeCost(this.unitTechLevel(kind));
  }

  canUpgradeUnit(kind: FanKind | "ordner"): boolean {
    const team = this.actingTeam();
    const cost = this.unitUpgradeCostFor(kind);
    if (cost == null || this.getTeamGold(team) < cost) return false;
    if (this.lowestLevelUnit(kind, team) == null) return false;
    const tech = this.unitTechLevel(kind, team);
    const next = tech + 1;
    return this.unitUpgradeBuildingCap(kind, team) >= next;
  }

  tryUpgradeUnit(kind: FanKind | "ordner"): boolean {
    const team = this.actingTeam();
    const living = this.lowestLevelUnit(kind, team);
    if (!living) {
      this.toast(kind === "ordner" ? "Kein Ordner" : "Keine Einheit");
      return false;
    }
    const tech = this.unitTechLevel(kind, team);
    const cost = unitUpgradeCost(tech);
    if (cost == null) {
      this.toast("Max. Stufe");
      return false;
    }
    const next = tech + 1;
    const bKind = buildingForUnitKind(kind);
    const bLv = this.unitUpgradeBuildingCap(kind, team);
    if (bLv < next) {
      this.toast(`${BUILD_LABEL[bKind]} erst Lv${next}`);
      return false;
    }
    if (this.getTeamGold(team) < cost) {
      this.toast(`${cost}€ nötig`);
      return false;
    }
    this.addTeamGold(team, -cost);
    if (this.teamIsPlayerSide(team)) this.unitTech[kind] = next;
    else this.aiTech[kind] = next;
    let raised = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.team !== team) continue;
      if (kind === "ordner") {
        if (!f.isSteward) continue;
      } else if (f.isSteward || f.kind !== kind) continue;
      if ((f.level || 1) < next) {
        f.level = next;
        this.applyUnitLevelStats(f);
        raised++;
      }
    }
    const label =
      kind === "ordner" ? "Ordner" : FAN_STATS[kind].label;
    this.floatAt(living.x, living.y, `${label} Lv${next}`, true);
    this.toast(
      raised > 1
        ? `${label} → Lv${next} (×${raised})`
        : `${label} → Lv${next}`,
    );
    return true;
  }

  update(dt: number): void {
    syncTribuneLayout(this.width, this.height);
    // Guest PvP: board state comes from host snapshots
    if (this.pvp && !this.pvpAuthority) {
      this.tickFloats(dt);
      this.tickToasts(dt);
      this.tickConfetti(dt);
      this.tickMoodFx(dt);
      if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - dt * 0.28);
      return;
    }
    if (this.result) {
      this.tickFloats(dt);
      this.tickToasts(dt);
      this.tickConfetti(dt);
      this.tickMoodFx(dt);
      if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - dt * 0.28);
      if (this.highlight) this.tickHighlight(dt);
      return;
    }
    // Halbzeit-Pause: sim frozen until player picks a 2nd-half boost
    // PvP: auto-grant a fair gold bump to both sides (no dual-UI freeze)
    if (this.halfTimePending) {
      if (this.pvp) {
        this.gold += 30;
        this.aiGold += 30;
        this.halfTimePending = false;
        this.halfBoost = "gold";
        this.toast("Halbzeit — beide +30€", 3);
      } else {
        this.tickFloats(dt);
        this.tickToasts(dt);
        this.tickConfetti(dt);
        this.tickMoodFx(dt);
        if (this.choreo) this.tickChoreo(dt);
        return;
      }
    }
    if (this.speed === 0) {
      this.tickFloats(dt);
      this.tickToasts(dt);
      this.tickConfetti(dt);
      this.tickMoodFx(dt);
      if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - dt * 0.28);
      if (this.highlight) this.tickHighlight(dt);
      return;
    }
    // Blitz: never slow the sim for Tor/Sturm replays — feels laggy in 60s
    const slow = this.highlight && !this.blitz ? HIGHLIGHT_SLOW : 1;
    const step = dt * this.speed * slow;
    this.realElapsed += step;
    if (this.blitzClickCd > 0) {
      this.blitzClickCd = Math.max(0, this.blitzClickCd - step);
    }
    if (this.blitzCombatBuffT > 0) {
      this.blitzCombatBuffT = Math.max(0, this.blitzCombatBuffT - step);
    }
    if (this.phase === "regular") {
      if (this.blitz) {
        this.minute = (this.realElapsed / BLITZ_REAL_SEC) * 90;
        this.tickBlitzAiClicks(step);
        if (this.realElapsed >= BLITZ_REAL_SEC) {
          this.endByScore();
          return;
        }
      } else {
        this.minute = (this.realElapsed / REGULAR_REAL_SEC) * 90;
        if (!this.halfTimeFired && this.minute >= 45) {
          this.halfTimeFired = true;
          this.halfTimePending = true;
          sfx("whistle");
          this.toast("Halbzeit — wähle deinen Boost für die 2. Hälfte!", 5);
          this.flash("Halbzeit! Boost wählen →", "halftime", 3.5);
          return;
        }
        if (this.realElapsed >= REGULAR_REAL_SEC) {
          if (this.scoreKsc === this.scoreVfb) {
            this.phase = "et";
            this.etElapsed = 0;
            this.toast("Verlängerung!");
          } else {
            this.endByScore();
            return;
          }
        }
      }
    } else if (this.phase === "et") {
      this.etElapsed += step;
      this.minute = 90 + (this.etElapsed / ET_REAL_SEC) * 30;
      if (this.etElapsed >= ET_REAL_SEC) {
        if (this.scoreKsc === this.scoreVfb) {
          this.phase = "pens";
          this.pensTimer = 0;
          this.toast("Elfmeter!");
        } else {
          this.endByScore();
          return;
        }
      }
    } else if (this.phase === "pens") {
      this.tickPens(step);
      this.tickFloats(step);
      this.tickToasts(step);
      this.tickConfetti(step);
      if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - step * 0.28);
      return;
    }

    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) {
      if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - step);
    }
    if (this.moodFloatCd.heim > 0)
      this.moodFloatCd.heim = Math.max(0, this.moodFloatCd.heim - step);
    if (this.moodFloatCd.gast > 0)
      this.moodFloatCd.gast = Math.max(0, this.moodFloatCd.gast - step);
    // Slower decay so Torjubel scoreboard flash stays readable longer
    if (this.scorePulse > 0)
      this.scorePulse = Math.max(0, this.scorePulse - step * 0.28);

    this.tickEconomy(step);
    this.tickSecurityBaseline(step);
    this.tickStewards(step);
    this.tickNeutralPostAutoLevel(step);
    this.tickFans(step);
    this.tickRecallForDefense(step);
    this.tickAutoDefend(step);
    this.updateBattleLines(step);
    this.tickBannerTerritory(step);
    this.tickCaptureConvert(step);
    this.tickGreyEconomy(step);
    this.tickOrdnerPostCombat(step);
    this.tickCombat(step);
    this.tickPyroShots(step);
    this.tickOrdnerPostDamageFx(step);
    this.tickNeutralCapture(step);
    this.tickFamilyFlight(step);
    this.tickJubelMomentum(step);
    this.tickBlockStorm(step);
    this.tickMatch(step);
    this.tickGoalParty(step);
    this.tickChoreo(step);
    if (!this.pvp) this.tickAi(step);
    this.tickFloats(step);
    this.tickToasts(step);
    this.tickTips(step);
    if (this.uiFlash) {
      this.uiFlash.t -= step;
      if (this.uiFlash.t <= 0) this.uiFlash = null;
    }
    {
      const pf = this.playerTeam === "ksc" ? this.scoreKsc : this.scoreVfb;
      const pa = this.playerTeam === "ksc" ? this.scoreVfb : this.scoreKsc;
      if (pa > pf) this.wasBehind = true;
    }
    this.tickConfetti(step);
    this.tickMoodFx(step);
    // Highlight timer runs in real time (not slowed) so the cinematic ends cleanly
    if (this.highlight) this.tickHighlight(dt);

    for (const f of this.fans) {
      if (f.armSwing > 0) f.armSwing = Math.max(0, f.armSwing - step * 2.2);
      if (f.attackCd > 0) f.attackCd = Math.max(0, f.attackCd - step);
      if (f.drinkT > 0) f.drinkT = Math.max(0, f.drinkT - step);
      if (f.shopT > 0) f.shopT = Math.max(0, f.shopT - step);
      if (f.throwT > 0) f.throwT = Math.max(0, f.throwT - step);
      if (f.cheerT > 0) {
        const prevCheer = f.cheerT;
        f.cheerT = Math.max(0, f.cheerT - step);
        // Keep arms lively + denser FX for the whole Torjubel window
        if (f.armSwing < 0.55) f.armSwing = 0.7 + Math.random() * 0.25;
        // Mid-celebration re-bursts (schema: Fans confetti · Ultra smoke · Hool props)
        // FX accent: secondary on light kits (DE schwarz), else primary (KSC blue / white trim via bursts)
        const club =
          f.team === "ksc" || f.team === "vfb"
            ? clubFxColor(f.team)
            : "#9ca3af";
        if (
          (prevCheer > 8.5 && f.cheerT <= 8.5) ||
          (prevCheer > 5.5 && f.cheerT <= 5.5) ||
          (prevCheer > 2.8 && f.cheerT <= 2.8)
        ) {
          if (f.kind === "normalos") {
            // Schal ersetzt durch Konfetti in Vereins-/Flaggenfarben
            const [cA, cB] =
              f.team === "ksc" || f.team === "vfb"
                ? cheerPalette(f.team)
                : [club, "#fde68a"];
            this.burstFanConfetti(f, cA);
            this.burstFanConfetti(f, cB);
          } else if (f.kind === "ultras") {
            f.throwT = Math.max(f.throwT, 2.4);
            this.burstUltraSmoke(f, club);
          } else if (f.kind === "hooligans") {
            if (f.id % 2 === 0) this.burstBeerMug(f);
            else this.burstFireworkRocket(f, club);
          }
        }
        // Sparse in-block sparkle / notes (no full-pitch confetti rain)
        if (Math.random() < 0.22 * step * 6) {
          const isPyro = f.kind === "ultras";
          const isHool = f.kind === "hooligans";
          const color =
            f.team === "ksc" || f.team === "vfb"
              ? clubFxColor(f.team)
              : "#9ca3af";
          const [cA, cB] =
            f.team === "ksc" || f.team === "vfb"
              ? cheerPalette(f.team)
              : [color, "#fde68a"];
          // Normalos: Konfetti statt Schal + Noten; Ultras: Smoke; Hools: Sparks
          if (f.kind === "normalos" && Math.random() < 0.45) {
            this.burstFanConfetti(f, Math.random() < 0.5 ? cA : cB);
          }
          this.moodFx.push({
            kind: isPyro ? "smoke" : isHool ? "spark" : "note",
            x: f.x + (Math.random() - 0.5) * 0.03,
            y: f.y - 0.03,
            vx: (Math.random() - 0.5) * 0.04,
            vy: -0.05 - Math.random() * 0.04,
            color: isPyro
              ? color
              : Math.random() < 0.5
                ? cA
                : cB,
            t: 0,
            life: isPyro ? 1.1 : 0.85,
            size: isPyro ? 0.022 : isHool ? 0.009 : 0.012,
          });
        }
      }
    }
    for (const s of this.slots) {
      if (s.prodFlash > 0) s.prodFlash = Math.max(0, s.prodFlash - step * 1.2);
    }
    this.fans = this.fans.filter((f) => f.hp > 0);
  }

  private tickToasts(dt: number): void {
    for (const t of this.toasts) t.t -= dt;
    this.toasts = this.toasts.filter((t) => t.t > 0);
  }

  private tickFloats(dt: number): void {
    for (const f of this.floats) {
      f.t -= dt;
      f.y -= f.vy * dt;
    }
    this.floats = this.floats.filter((f) => f.t > 0);
  }

  /** Intact neutral mid Ordnerposten still standing (Sicherheit baseline). */
  greyMidPostAlive(): boolean {
    return this.slots.some(
      (s) =>
        s.blockId === NEUTRAL_BLOCK &&
        s.building === "ordner" &&
        s.owner === "neutral" &&
        s.structHp > 0,
    );
  }

  /** Player-owned Ordnerposten (not grey) that still have structure HP. */
  ownOrdnerPostCount(): number {
    return this.slots.filter(
      (s) =>
        s.building === "ordner" &&
        s.owner === this.playerTeam &&
        !s.greyNeutral &&
        s.structHp > 0,
    ).length;
  }

  /**
   * Sicherheit bedroht: nur echte Angreifer (Angriffsauftrag / Invasion)
   * im Heimblock oder nahe Heim-Tür/Buden — nicht KI-Einkäufer auf dem Gang.
   */
  playerSecurityThreatened(): boolean {
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward || f.team !== this.aiTeam) continue;
      // Shoppers / wanderers must not freeze Ordnerpost Sicherheit
      if (!this.isActiveAttacker(f)) continue;
      if (f.blockId === HEIM_BLOCK && (f.state === "block" || f.invading)) {
        return true;
      }
      if (f.state === "gang" || f.state === "moving") {
        const homeGx = blockIdToGangX(HEIM_BLOCK);
        if (f.gangX <= homeGx + 0.22) return true;
        for (const s of this.slots) {
          if (s.owner !== this.playerTeam || !s.building || s.greyNeutral) continue;
          const p = this.standWorld(s);
          const dx = f.x - p.x;
          const dy = f.y - p.y;
          if (dx * dx + dy * dy < 0.045) return true;
        }
      }
    }
    return false;
  }

  /**
   * Base Sicherheit: start 50; intact neutral mid posts regen toward 50 when safe.
   * Above 50 only via own Ordnerposten while not threatened.
   */
  private tickSecurityBaseline(dt: number): void {
    const threatened = this.playerSecurityThreatened();
    const ownPosts = this.ownOrdnerPostCount();
    const greyOk = this.greyMidPostAlive();

    if (!threatened && greyOk && this.currency.security < SECURITY_BASE_CAP) {
      this.currency.security = Math.min(
        SECURITY_BASE_CAP,
        this.currency.security + SECURITY_BASE_REGEN * dt,
      );
    }

    // Without own posts, decay excess back to the base cap
    if (ownPosts <= 0 && this.currency.security > SECURITY_BASE_CAP) {
      this.currency.security = Math.max(
        SECURITY_BASE_CAP,
        this.currency.security - SECURITY_BASE_REGEN * dt,
      );
    }
  }

  private tickEconomy(dt: number): void {
    // Passive gold (low); Hooligan bonus only while in own safe block
    const nrm = this.countInBlock(this.playerTeam, HEIM_BLOCK, "normalos");
    this.gold += (1.0 + nrm * 0.2) * dt;
    const aiN = this.countInBlock(this.aiTeam, GAST_BLOCK, "normalos");
    const aiGoldMul = this.pvp
      ? 1
      : this.cfg.settings.difficulty === "hard"
        ? 1.4
        : this.cfg.settings.difficulty === "easy"
          ? 0.95
          : 1.25;
    const aiBase = this.pvp ? 1.0 + aiN * 0.2 : 1.15 + aiN * 0.24;
    this.aiGold += aiBase * aiGoldMul * dt;

    // Steward upkeep €/s per person
    const stewards = this.fans.filter(
      (f) => f.hp > 0 && f.isSteward && f.team === this.playerTeam,
    );
    if (stewards.length) {
      this.gold = Math.max(0, this.gold - stewards.length * STEWARD_GOLD_PER_SEC * dt);
    }
    const aiStewards = this.fans.filter(
      (f) => f.hp > 0 && f.isSteward && f.team === this.aiTeam,
    ).length;
    this.aiGold = Math.max(0, this.aiGold - aiStewards * STEWARD_GOLD_PER_SEC * dt);

    this.buildPulse += dt;
    // Cache once per economy tick — used for gain + float (must stay in sync)
    const secThreatened = this.playerSecurityThreatened();
    for (const s of this.slots) {
      if (!s.building || s.greyNeutral) continue;
      // Razed Ordnerposten must not keep minting Sicherheit
      if (s.building === "ordner" && s.structHp <= 0) continue;
      const rate = productionRate(s.level || 1);
      if (s.building === "bier") {
        s.beer = clamp(s.beer + 0.85 * rate * dt, 0, s.capacity);
      } else if (s.building === "fanshop") {
        s.merch = clamp(s.merch + 0.85 * rate * dt, 0, s.capacity);
      }
      if (s.owner === this.playerTeam) {
        if (s.building === "bier") {
          this.gain("beer", PROD_BEER * rate * dt, undefined, "BIER");
        } else if (s.building === "ordner") {
          // Own posts only raise Sicherheit above the base floor while territory is safe
          if (!secThreatened) {
            this.gain("security", PROD_SECURITY * rate * dt, undefined, "SICHERHEIT");
          }
        } else if (s.building === "fanshop") {
          this.gain("merch", PROD_MERCH * rate * dt, undefined, "FANARTIKEL");
        }
      } else if (s.owner === this.aiTeam) {
        this.aiGold += 0.12 * rate * dt;
        // Mirror player production into AI send/buy wallets
        if (s.building === "bier") {
          this.aiBeer = Math.min(120, this.aiBeer + PROD_BEER * rate * dt);
        } else if (s.building === "ordner") {
          this.aiSecurity = Math.min(
            120,
            this.aiSecurity + PROD_SECURITY * rate * dt,
          );
        } else if (s.building === "fanshop") {
          this.aiMerch = Math.min(120, this.aiMerch + PROD_MERCH * rate * dt);
        }
      }
    }

    if (this.buildPulse >= 2.5) {
      this.buildPulse = 0;
      for (const s of this.slots) {
        if (!s.building || s.greyNeutral) continue;
        if (s.owner !== this.playerTeam && s.owner !== this.aiTeam) continue;
        if (s.building === "ordner" && s.structHp <= 0) continue;
        // Player Sicherheit float only when the wallet actually gains
        if (
          s.owner === this.playerTeam &&
          s.building === "ordner" &&
          secThreatened
        ) {
          continue;
        }
        const n = Math.max(1, Math.round(productionRate(s.level || 1)));
        s.prodFlash = 1;
        if (s.owner === this.playerTeam) {
          if (s.building === "bier") this.floatAtSlot(s, `+${n} Bier`, true);
          else if (s.building === "ordner")
            this.floatAtSlot(s, `+${n} Sicherheit`, true);
          else if (s.building === "fanshop") {
            this.floatAtSlot(s, `+${n} Fanartikel`, true);
          }
        } else {
          // AI stands also show production so both sides are readable
          if (s.building === "bier") this.floatAtSlot(s, `+${n} Bier`, false);
          else if (s.building === "ordner")
            this.floatAtSlot(s, `+${n} Sicherheit`, false);
          else this.floatAtSlot(s, `+${n} Shop`, false);
        }
      }
    }
  }

  /** Count living Ordner tied to a post */
  stewardCountAt(s: BuildSlot): number {
    const key = slotKey(s.blockId, s.index);
    return this.fans.filter(
      (f) => f.hp > 0 && f.isSteward && f.homeStandKey === key,
    ).length;
  }

  canHireSteward(s: BuildSlot): boolean {
    const team = this.actingTeam();
    if (s.building !== "ordner" || s.greyNeutral) return false;
    if (s.owner !== team) return false;
    const underCap = this.blitz || this.stewardCountAt(s) < STEWARD_CAP;
    return underCap && this.getTeamGold(team) >= STEWARD_HIRE_GOLD;
  }

  /** Hire at first owned Ordnerposten (sidebar quick action). */
  tryHireStewardQuick(): boolean {
    const team = this.actingTeam();
    const s = this.slots.find(
      (x) =>
        x.building === "ordner" &&
        x.owner === team &&
        !x.greyNeutral &&
        (this.blitz || this.stewardCountAt(x) < STEWARD_CAP),
    );
    if (!s) {
      this.toast("Ordnerposten bauen / Platz frei?");
      return false;
    }
    this.selectedSlot = { blockId: s.blockId, index: s.index };
    this.buildMenu = { blockId: s.blockId, index: s.index };
    return this.tryHireSteward();
  }

  /** Player: click Ordnerposten → Ordner für Gold anheuern */
  tryHireSteward(): boolean {
    const team = this.actingTeam();
    const sel = this.buildMenu ?? this.selectedSlot;
    if (!sel) {
      this.toast("Ordnerposten wählen");
      return false;
    }
    const s = this.slots.find(
      (x) => x.blockId === sel.blockId && x.index === sel.index,
    );
    if (!s || s.building !== "ordner") {
      this.toast("Kein Ordnerposten");
      return false;
    }
    if (s.owner !== team || s.greyNeutral) {
      this.toast("Nicht dein Posten");
      return false;
    }
    if (!this.blitz && this.stewardCountAt(s) >= STEWARD_CAP) {
      this.toast(`Max. ${STEWARD_CAP} Ordner`);
      return false;
    }
    if (this.getTeamGold(team) < STEWARD_HIRE_GOLD) {
      this.toast(`${STEWARD_HIRE_GOLD}€ nötig`);
      return false;
    }
    this.addTeamGold(team, -STEWARD_HIRE_GOLD);
    const st = this.makeSteward(team, s);
    this.fans.push(st);
    this.floatAtSlot(s, `−${STEWARD_HIRE_GOLD}€ Ordner`, true);
    this.toast(this.blitz ? "Ordner (+unbegrenzt)" : "Ordner angeheuert");
    return true;
  }

  /**
   * Neutral mid Ordnerposts slowly level over time (cap soft).
   */
  private tickNeutralPostAutoLevel(dt: number): void {
    for (const s of this.slots) {
      if (
        s.building !== "ordner" ||
        s.owner !== "neutral" ||
        s.structHp <= 0
      ) {
        continue;
      }
      if (s.level >= NEUTRAL_POST_AUTO_LEVEL_CAP) continue;
      s.autoLevelAcc += dt;
      if (s.autoLevelAcc < NEUTRAL_POST_AUTO_LEVEL_SEC) continue;
      s.autoLevelAcc = 0;
      s.level++;
      const prev = s.structHp;
      this.initOrdnerPostHp(s);
      if (prev > 0) {
        s.structHp = Math.min(
          s.structMaxHp,
          prev + ORDNER_POST_HP_PER_LEVEL * 0.5,
        );
      }
      this.floatAtSlot(s, `Lv${s.level}`, true);
      this.toast(`Neutraler Ordnerpost → Lv${s.level}`);
    }
  }

  private tickStewards(dt: number): void {
    // Neutral posts: keep producing Ordner up to NEUTRAL_STEWARD_CAP total
    for (const s of this.slots) {
      if (s.building !== "ordner" || s.owner !== "neutral") continue;
      if (s.structHp <= 0) continue;
      const key = slotKey(s.blockId, s.index);
      const aliveAtPost = this.fans.filter(
        (f) => f.hp > 0 && f.isSteward && f.homeStandKey === key,
      ).length;
      const neutralAlive = this.fans.filter(
        (f) => f.hp > 0 && f.isSteward && f.team === "neutral",
      ).length;
      if (neutralAlive >= NEUTRAL_STEWARD_CAP) continue;
      s.stewardCd -= dt;
      // One surviving grey post may fill the full total of 4
      if (aliveAtPost >= NEUTRAL_STEWARD_CAP) continue;
      if (s.stewardCd > 0) continue;
      s.stewardCd = NEUTRAL_STEWARD_RESPAWN;
      this.fans.push(this.makeSteward("neutral", s));
      this.toast("Neutraler Ordner");
    }

    for (const team of [this.playerTeam, this.aiTeam] as TeamId[]) {
      const tLeft = (this.defenseCallT[team] ?? 0) - dt;
      this.defenseCallT[team] = Math.max(0, tLeft);
      if (tLeft <= 0) delete this.defenseCallGx[team];
    }

    for (const f of this.fans) {
      if (!f.isSteward || f.hp <= 0 || f.state === "moving") continue;
      const stand = this.slots.find(
        (s) => slotKey(s.blockId, s.index) === f.homeStandKey,
      );
      if (!stand) continue;

      const postGx = this.stewardPostGangX(f);
      const band = this.stewardPatrolBand(f);
      // Team Ordner: help across own territory; neutrals stay near post
      const chaseBand =
        f.team === "neutral"
          ? {
              min: clamp(postGx - STEWARD_STATS.chaseRadius, 0.02, 0.98),
              max: clamp(postGx + STEWARD_STATS.chaseRadius, 0.02, 0.98),
            }
          : {
              min: clamp(band.min - 0.06, 0.02, 0.98),
              max: clamp(band.max + 0.06, 0.02, 0.98),
            };
      const threat = this.stewardThreat(f, chaseBand);
      const helpGx =
        f.team === this.playerTeam || f.team === this.aiTeam
          ? this.defenseCallGx[f.team as TeamId]
          : undefined;
      const midY = gangMidY();
      // Always on gang lane — never stuck on the booth sprite
      f.y = midY + Math.sin(this.realElapsed * 2.2 + f.id) * 0.006;

      if (threat) {
        const speed = STEWARD_STATS.chaseSpeed;
        const dx = threat.x - f.x;
        const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
        f.x += step;
        this.syncGangFromWorld(f);
        f.gangX = clamp(f.gangX, chaseBand.min, chaseBand.max);
        f.x = gangXToWorld(f.gangX);
        f.aggro = 100;
      } else if (helpGx != null) {
        const speed = STEWARD_STATS.chaseSpeed;
        const dir = Math.sign(helpGx - f.gangX) || 0;
        f.gangX = clamp(
          f.gangX + dir * speed * dt,
          chaseBand.min,
          chaseBand.max,
        );
        f.x = gangXToWorld(f.gangX);
        f.aggro = 100;
      } else {
        if (!f.patrolDir) f.patrolDir = 1;
        f.gangX += f.patrolDir * STEWARD_STATS.patrolSpeed * dt;
        if (f.gangX >= band.max) {
          f.gangX = band.max;
          f.patrolDir = -1;
        } else if (f.gangX <= band.min) {
          f.gangX = band.min;
          f.patrolDir = 1;
        }
        f.x = gangXToWorld(f.gangX);
      }

      // Slow heal while inside the tight post radius
      const postLv = stand.level || 1;
      if (
        Math.abs(f.gangX - postGx) <= stewardPostRadius(postLv) + 0.01 &&
        f.hp < f.maxHp
      ) {
        f.hp = Math.min(f.maxHp, f.hp + stewardHealPerSec(postLv) * dt);
      }

      f.state = "gang";
      f.blockId = stand.blockId;
    }
  }

  private stewardPostGangX(f: FanUnit): number {
    if (!f.homeStandKey) return f.gangX;
    const [b, i] = f.homeStandKey.split(":").map(Number);
    const stand = this.slots.find((s) => s.blockId === b && s.index === i);
    return stand ? this.postGangX(stand) : blockIdToGangX(b);
  }

  /**
   * Team Ordner patrol the whole own cemented/build frontier on the gang.
   * Neutral Ordner stay in a tight bubble around their post.
   */
  private stewardPatrolBand(f: FanUnit): { min: number; max: number } {
    const postGx = this.stewardPostGangX(f);
    if (f.team === "neutral") {
      const stand = this.slots.find(
        (s) => slotKey(s.blockId, s.index) === f.homeStandKey,
      );
      const r = stewardPostRadius(stand?.level || 1);
      return {
        min: clamp(postGx - r, 0.02, 0.98),
        max: clamp(postGx + r, 0.02, 0.98),
      };
    }
    const homeGx =
      f.team === this.playerTeam
        ? blockIdToGangX(HEIM_BLOCK)
        : blockIdToGangX(GAST_BLOCK);
    const frontier = this.buildFrontierGx(f.team as TeamId);
    if (f.team === this.playerTeam) {
      return {
        min: clamp(Math.min(homeGx, postGx) - 0.03, 0.02, 0.98),
        max: clamp(Math.max(frontier, postGx) + 0.03, 0.02, 0.98),
      };
    }
    return {
      min: clamp(Math.min(frontier, postGx) - 0.03, 0.02, 0.98),
      max: clamp(Math.max(homeGx, postGx) + 0.03, 0.02, 0.98),
    };
  }

  private teamHasCement(team: TeamId): boolean {
    for (const s of this.slots) {
      if (s.building === "ordner" && s.structHp > 0 && s.owner === team)
        return true;
    }
    return this.fans.some(
      (f) => f.hp > 0 && f.isSteward && f.team === team,
    );
  }

  /**
   * Furthest intact Ordnerpost owned by this team (hard Standarte / build floor).
   * Roaming Ordner do not move this — only built posts.
   */
  postEdgeGx(team: TeamId): number {
    const dir = team === this.playerTeam ? 1 : -1;
    let edge =
      team === this.playerTeam
        ? blockIdToGangX(HEIM_BLOCK)
        : blockIdToGangX(GAST_BLOCK);
    for (const s of this.slots) {
      if (s.building !== "ordner" || s.structHp <= 0) continue;
      if (s.owner !== team) continue;
      const gx = this.postGangX(s);
      edge = dir > 0 ? Math.max(edge, gx) : Math.min(edge, gx);
    }
    return edge;
  }

  /**
   * Nearest intact hostile Ordnerpost ahead.
   * Walls for: grey mid, AND blue/red posts on formerly neutral mid plots.
   * Units + Standarte never pass until that post is destroyed.
   */
  hostilePostWallGx(team: TeamId): number | null {
    const dir = team === this.playerTeam ? 1 : -1;
    let wall: number | null = null;
    for (const s of this.slots) {
      if (!this.isHostileOrdnerPost(s, team)) continue;
      const gx = this.postGangX(s);
      if (wall == null) wall = gx;
      else wall = dir > 0 ? Math.min(wall, gx) : Math.max(wall, gx);
    }
    return wall;
  }

  /** Furthest cemented gang X held by living Ordner + intact Ordnerposten */
  cementEdgeGx(team: TeamId): number {
    const dir = team === this.playerTeam ? 1 : -1;
    let edge = this.postEdgeGx(team);
    if (!this.teamHasCement(team)) return edge;

    for (const f of this.fans) {
      if (f.hp <= 0 || !f.isSteward || f.team !== team) continue;
      edge = dir > 0 ? Math.max(edge, f.gangX) : Math.min(edge, f.gangX);
    }
    return edge;
  }

  /** Soft gate: enemy is slowed / damaged until Ordner + Post destroyed */
  private cementWallAhead(f: FanUnit): number | null {
    if (f.team !== this.playerTeam && f.team !== this.aiTeam) return null;
    const foe = f.team === this.playerTeam ? this.aiTeam : this.playerTeam;
    if (!this.teamHasCement(foe)) return null;
    const dir = f.team === this.playerTeam ? 1 : -1;
    const wall = this.cementEdgeGx(foe);
    const dx = (wall - f.gangX) * dir;
    // Already past breakthrough zone — no longer gated by cement alone
    if (dx < -CEMENT_BREAKTHROUGH) return null;
    return wall;
  }

  /**
   * Permanent build / possession floor from own Ordnerposten + owned blocks.
   * Does not jump with roaming Ordner — Standarten stay anchored to posts.
   */
  buildFrontierGx(team: TeamId): number {
    const post = this.postEdgeGx(team);
    if (team === this.playerTeam) {
      let edge = Math.max(blockIdToGangX(HEIM_BLOCK) + 0.08, post + 0.04);
      for (let b = 0; b < BLOCK_COUNT; b++) {
        if (b === GAST_BLOCK) continue;
        if (this.blockOwner[b] === this.playerTeam) {
          edge = Math.max(edge, blockIdToGangX(b) + 0.12);
        }
      }
      return clamp(edge, 0.08, 0.92);
    }
    let edge = Math.min(blockIdToGangX(GAST_BLOCK) - 0.08, post - 0.04);
    for (let b = 0; b < BLOCK_COUNT; b++) {
      if (b === HEIM_BLOCK) continue;
      if (this.blockOwner[b] === this.aiTeam) {
        edge = Math.min(edge, blockIdToGangX(b) - 0.12);
      }
    }
    return clamp(edge, 0.08, 0.92);
  }

  /** Living attacker depth along the gang (uses world X while pathing) */
  private attackerDepthGx(f: FanUnit): number {
    if (f.state === "gang" || f.invading) return f.gangX;
    return worldXToGangX(f.x);
  }

  /** Slow Standarte crawl: advance with mild catch-up, retreat deliberately slow */
  private approachBanner(
    cur: number,
    target: number,
    dt: number,
    advanceDir: 1 | -1,
  ): number {
    const delta = target - cur;
    if (Math.abs(delta) < 1e-5) return target;
    const advancing = delta * advanceDir > 0;
    const speed = advancing
      ? BANNER_ADVANCE_SPEED + Math.abs(delta) * BANNER_CATCHUP
      : BANNER_RETREAT_SPEED;
    const step = Math.sign(delta) * Math.min(Math.abs(delta), speed * dt);
    return cur + step;
  }

  /** Nearest hostile Ultra in/near this steward's band */
  private stewardThreat(
    f: FanUnit,
    band: { min: number; max: number },
  ): FanUnit | null {
    let best: FanUnit | null = null;
    let bestD = 99;
    for (const o of this.fans) {
      if (o.hp <= 0 || o === f || o.isSteward) continue;
      if (o.kind !== "ultras" && o.kind !== "hooligans") continue;
      if (o.team === f.team) continue;
      if (o.team === "neutral") continue;
      // Neutral Ordner: only chase active attackers — never shoppers
      if (f.team === "neutral" && !this.isActiveAttacker(o)) continue;
      const onGang =
        o.state === "gang" ||
        o.invading ||
        (o.state === "block" && o.blockId === NEUTRAL_BLOCK);
      if (!onGang && o.state !== "moving") continue;
      const gx = o.state === "gang" || o.invading ? o.gangX : blockIdToGangX(o.blockId);
      // React a bit outside band too when Ultra crosses into zone
      if (gx < band.min - 0.1 || gx > band.max + 0.1) continue;
      const d = dist(f.x, f.y, o.x, o.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  /** Visit counts so traffic rotates across every open stand (not only nearest). */
  private standVisitCount = new Map<string, number>();

  /**
   * Pick among ALL own-team stands of a type (not just nearest).
   * Prefers short queues + least-visited, then random among the best pool.
   */
  private pickOwnVisitStand(
    team: TeamId,
    fromBlock: number,
    building: "bier" | "fanshop",
  ): BuildSlot | null {
    type Cand = { s: BuildSlot; score: number };
    const cands: Cand[] = [];
    for (const s of this.slots) {
      if (s.building !== building || s.owner !== team || s.greyNeutral) continue;
      if (building === "bier" && s.beer < 1) continue;
      if (building === "fanshop" && s.merch < 1) continue;
      const key = slotKey(s.blockId, s.index);
      const queue = this.queueDepthAt(s);
      const visits = this.standVisitCount.get(key) ?? 0;
      const dist = Math.abs(s.blockId - fromBlock);
      // Queue + visit rotation dominate; distance is only a weak tie-break.
      const score = queue * 12 + visits * 4 + dist * 0.35;
      cands.push({ s, score });
    }
    if (!cands.length) return null;
    cands.sort((a, b) => a.score - b.score);
    const best = cands[0]!.score;
    const pool = cands.filter((c) => c.score <= best + 4);
    const pick = pool[Math.floor(Math.random() * pool.length)]!.s;
    const key = slotKey(pick.blockId, pick.index);
    this.standVisitCount.set(key, (this.standVisitCount.get(key) ?? 0) + 1);
    return pick;
  }

  /**
   * Fremder Bierstand hinter der eigenen Standarte — Fans stillen dort Durst
   * ohne zu zahlen (Leer-trinken → Übernahme).
   */
  private pickHostileBeerBehindBanner(
    team: TeamId,
    fromBlock: number,
  ): BuildSlot | null {
    type Cand = { s: BuildSlot; score: number };
    const cands: Cand[] = [];
    for (const s of this.slots) {
      if (s.building !== "bier" || s.beer < 1) continue;
      if (!s.owner || s.owner === team) continue;
      const gx = plotGangX(s.blockId, s.index);
      if (this.bannerHolderAt(gx) !== team) continue;
      const key = slotKey(s.blockId, s.index);
      const queue = this.queueDepthAt(s);
      const visits = this.standVisitCount.get(key) ?? 0;
      const dist = Math.abs(s.blockId - fromBlock);
      cands.push({ s, score: queue * 10 + visits * 3 + dist * 0.4 });
    }
    if (!cands.length) return null;
    cands.sort((a, b) => a.score - b.score);
    const best = cands[0]!.score;
    const pool = cands.filter((c) => c.score <= best + 4);
    const pick = pool[Math.floor(Math.random() * pool.length)]!.s;
    const key = slotKey(pick.blockId, pick.index);
    this.standVisitCount.set(key, (this.standVisitCount.get(key) ?? 0) + 1);
    return pick;
  }

  /** Any team Bier/Fanshop with stock — for grey Fans shopping trips. */
  private anyOpenShopStands(): BuildSlot[] {
    return this.slots.filter((s) => {
      if (s.greyNeutral) return false;
      if (s.owner !== this.playerTeam && s.owner !== this.aiTeam) return false;
      if (s.building === "bier") return s.beer >= 1;
      if (s.building === "fanshop") return s.merch >= 1;
      return false;
    });
  }

  private queueDepthAt(stand: BuildSlot): number {
    const key = slotKey(stand.blockId, stand.index);
    let n = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward) continue;
      if (f.standKey !== key) continue;
      if (f.state === "stand" || f.state === "moving") n++;
    }
    return n;
  }

  /** Service time long enough that queue anger (5–10s+) can show. */
  private standServiceSec(stand: BuildSlot): number {
    const q = this.queueDepthAt(stand);
    return Math.max(ANIM_DRINK_SEC, 4.5 + q * 2.2 + Math.random() * 1.5);
  }

  private tickFans(dt: number): void {
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward) continue;

      // No attack order + sitting in the wrong tribune → walk home
      // (fixes greys stranded after shopping at blue/red stands).
      if (
        f.state === "block" &&
        !f.invading &&
        !f.onOffense &&
        f.blockId !== this.homeBlockOf(f)
      ) {
        this.returnFanToHomeBlock(f);
      }

      if (f.state === "block") {
        this.tickBlockWander(f, dt);
        if (!f.onOffense) this.maybeStartStandVisit(f);
      } else if (f.state === "moving") {
        this.followPath(f, dt);
      } else if (f.state === "stand") {
        // Wait freely in stand radius while buying, then go home
        if (f.drinkT > 0 || f.shopT > 0) {
          this.tickStandWaitWander(f, dt);
          this.tickWaitAnger(f, dt);
          continue;
        }
        // No attack order from a stand visit — always peel home after service
        if (!f.onOffense) {
          this.finishStandVisit(f);
        } else {
          this.leaveSeatToGang(f, true);
        }
      } else if (f.state === "gang") {
        this.tickGangMove(f, dt);
      }
    }
    this.tickBlockSeparation(dt);
    this.tickStandWaitSeparation(dt);
  }

  /** Orange (5–10s) / red (>10s) Nervsmilies — one per second while queued. */
  private tickWaitAnger(f: FanUnit, dt: number): void {
    const arrive = f._standArriveAt;
    if (arrive == null) return;
    const waited = this.realElapsed - arrive;
    if (waited < 5) return;
    f._angerCd = (f._angerCd ?? 0) - dt;
    if ((f._angerCd ?? 0) > 0) return;
    f._angerCd = 1;
    const hot = waited > 10;
    this.moodFx.push({
      kind: hot ? "waitAngerHot" : "waitAnger",
      x: f.x + (Math.random() - 0.5) * 0.012,
      y: f.y - 0.03,
      vx: (Math.random() - 0.5) * 0.02,
      vy: -0.055 - Math.random() * 0.02,
      color: hot ? "#ef4444" : "#f97316",
      t: 0,
      life: 0.85,
      size: 0.02,
    });
  }

  /** Micro-target near home, often across a wide slice of the terrace. */
  private retargetBlockWander(f: FanUnit): void {
    const home = crowdHomePos(f.blockId, f.seatIndex ?? 0);
    const rect = blockCrowdRect(f.blockId);
    const ang = Math.random() * Math.PI * 2;
    // Mix: local bob around home + occasional stroll across the stand
    const wide = Math.random() < 0.55;
    const rad = wide
      ? (0.25 + Math.random() * 0.75) *
        Math.min(rect.width, rect.height) *
        0.42
      : Math.random() * BLOCK_HOME_RADIUS;
    let tx = home.x + Math.cos(ang) * rad;
    let ty = home.y + Math.sin(ang) * rad * 0.95;
    const pad = 0.01;
    tx = clamp(tx, rect.left + pad, rect.left + rect.width - pad);
    ty = clamp(ty, rect.top + pad, rect.top + rect.height - pad);
    f._wanderTx = tx;
    f._wanderTy = ty;
    f._wanderCd =
      BLOCK_WANDER_RETARGET_MIN +
      Math.random() * (BLOCK_WANDER_RETARGET_MAX - BLOCK_WANDER_RETARGET_MIN);
  }

  /**
   * Stand idle: stay roughly spread (home slots), tiny drift, cheer bob.
   * seatIndex is buy/return id + home slot — not a click target.
   */
  private tickBlockWander(f: FanUnit, dt: number): void {
    const home = crowdHomePos(f.blockId, f.seatIndex ?? 0);
    // Soft spring keeps the crowd roughly distributed
    f.x += (home.x - f.x) * Math.min(1, BLOCK_HOME_PULL * dt);
    f.y += (home.y - f.y) * Math.min(1, BLOCK_HOME_PULL * dt);

    if (f._wanderTx == null || f._wanderTy == null || (f._wanderCd ?? 0) <= 0) {
      this.retargetBlockWander(f);
    } else {
      f._wanderCd = (f._wanderCd ?? 0) - dt;
    }
    const tx = f._wanderTx!;
    const ty = f._wanderTy!;
    const dx = tx - f.x;
    const dy = ty - f.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= BLOCK_WANDER_ARRIVE || (f._wanderCd ?? 0) <= 0) {
      this.retargetBlockWander(f);
    } else {
      const step = Math.min(dist, BLOCK_WANDER_SPEED * dt);
      f.x += (dx / dist) * step;
      f.y += (dy / dist) * step;
    }
    // Pulse arms so cheer/fight poses stay lively while bobbing
    f.armSwing = 0.35 + 0.25 * Math.sin(this.realElapsed * 7.2 + f.id * 0.9);

    const r = blockCrowdRect(f.blockId);
    const pad = 0.008;
    f.x = clamp(f.x, r.left + pad, r.left + r.width - pad);
    f.y = clamp(f.y, r.top + pad, r.top + r.height - pad);
  }

  /** Soft separation so free wanderers don't fully occupy one pixel. */
  private tickBlockSeparation(dt: number): void {
    const living = this.fans.filter(
      (f) => f.hp > 0 && !f.isSteward && f.state === "block",
    );
    const r2 = BLOCK_SEPARATION_RADIUS * BLOCK_SEPARATION_RADIUS;
    for (let i = 0; i < living.length; i++) {
      const a = living[i]!;
      for (let j = i + 1; j < living.length; j++) {
        const b = living[j]!;
        if (a.blockId !== b.blockId) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1e-8 || d2 > r2) continue;
        const d = Math.sqrt(d2);
        const push =
          ((BLOCK_SEPARATION_RADIUS - d) / BLOCK_SEPARATION_RADIUS) *
          BLOCK_SEPARATION_PUSH *
          dt;
        const nx = dx / d;
        const ny = dy / d;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }

  /**
   * Pick Bier or Fanshop when timers are due.
   * Fans → Fanshop only · Hools → Bier only · Ultras → both (beer-first).
   * Grey Fans → any team's Bier or Fanshop every 20–30s.
   */
  private maybeStartStandVisit(f: FanUnit): void {
    // During Torjubel stay in the block — Glücksbiergang starts after the party
    if (f.cheerT > 0) return;
    if (this.goalPartyT > 0 && f.team === this.goalPartyTeam) return;
    if (f.team === "neutral") {
      this.maybeStartNeutralShopTrip(f);
      return;
    }
    if (f.team !== this.playerTeam && f.team !== this.aiTeam) return;
    const team = f.team as TeamId;
    const wantsBeer = canVisit(f.kind, "beer");
    const wantsShop = canVisit(f.kind, "shop");
    const beerReady =
      wantsBeer && this.realElapsed >= (f.satisfiedUntil || 0);
    const shopReady = wantsShop && this.realElapsed >= (f.shopUntil || 0);
    if (!beerReady && !shopReady) return;

    // Prefer fremde Bierstände hinter eigener Standarte (Leer-trinken)
    const hostileBeer = beerReady
      ? this.pickHostileBeerBehindBanner(team, f.blockId)
      : null;
    const bier = beerReady
      ? hostileBeer ?? this.pickOwnVisitStand(team, f.blockId, "bier")
      : null;
    const shop = shopReady
      ? this.pickOwnVisitStand(team, f.blockId, "fanshop")
      : null;

    let pick: "beer" | "shop" | null = null;
    if (hostileBeer) pick = "beer";
    else if (bier && shop) {
      // Ultras only reach here with both — prefer beer slightly
      pick = "beer";
    } else if (bier) pick = "beer";
    else if (shop) pick = "shop";

    if (!pick) {
      // No stand available — retry soon instead of locking forever
      if (beerReady) f.satisfiedUntil = this.realElapsed + 6;
      if (shopReady) f.shopUntil = this.realElapsed + 6;
      return;
    }

    const stand = pick === "beer" ? bier! : shop!;
    const wait = this.standWaitPos(stand, f.id);
    this.startPath(
      f,
      this.pathViaDoors(f, stand.blockId, wait),
      pick === "beer" ? "stand" : "shop",
    );
    f.standKey = slotKey(stand.blockId, stand.index);
    f._wanderTx = wait.x;
    f._wanderTy = wait.y;
  }

  /** Grey starter Fans leave the block every 20–30s to buy at any shop. */
  private maybeStartNeutralShopTrip(f: FanUnit): void {
    if (this.realElapsed < (f.shopUntil || 0)) return;
    // Cap concurrent grey shoppers so the mid tribune never empties at once
    let busy = 0;
    for (const o of this.fans) {
      if (o.hp <= 0 || o.team !== "neutral" || o.isSteward) continue;
      if (o.state === "stand" || o.state === "moving") busy++;
    }
    if (busy >= 6) {
      f.shopUntil = this.realElapsed + 2 + Math.random() * 4;
      return;
    }
    const stands = this.anyOpenShopStands();
    if (!stands.length) {
      f.shopUntil = this.realElapsed + 4 + Math.random() * 4;
      return;
    }
    const stand = stands[Math.floor(Math.random() * stands.length)]!;
    const wait = this.standWaitPos(stand, f.id);
    const after = stand.building === "bier" ? "stand" : "shop";
    this.startPath(f, this.pathViaDoors(f, stand.blockId, wait), after);
    f.standKey = slotKey(stand.blockId, stand.index);
    // Wait wander targets are set on arrive (finishPath), not as gang depth
  }

  /**
   * Wait points start at the building outer edge and fan through the next
   * STAND_WAIT_BAND (~5% Freifläche) — never inside the booth footprint.
   */
  private standWaitPos(
    stand: BuildSlot,
    unitId: number,
  ): { x: number; y: number } {
    const sp = this.standWorld(stand);
    const rect = boothRect(stand.blockId, stand.index);
    const edge = Math.max(rect.w, rect.h) * 0.55;
    // Golden-angle slots so waiters fan out around the building
    const slot = unitId % 17;
    const ang = slot * 2.399963229728653 + stand.blockId * 0.37 + stand.index;
    const ring = 0.12 + ((slot * 5) % 7) / 7 * 0.88;
    const r = edge + STAND_WAIT_BAND * ring;
    // Full ellipse — was *0.72 on Y which collapsed waiters into a vertical line
    return {
      x: sp.x + Math.cos(ang) * r,
      y: sp.y + Math.sin(ang) * r,
    };
  }

  /** Soft push so queued fans don't share one pixel in the wait radius. */
  private tickStandWaitSeparation(dt: number): void {
    const waiting = this.fans.filter(
      (f) => f.hp > 0 && !f.isSteward && f.state === "stand" && f.standKey,
    );
    const sep = STAND_WAIT_RADIUS * 0.45;
    const r2 = sep * sep;
    for (let i = 0; i < waiting.length; i++) {
      const a = waiting[i]!;
      for (let j = i + 1; j < waiting.length; j++) {
        const b = waiting[j]!;
        if (a.standKey !== b.standKey) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1e-8 || d2 > r2) continue;
        const d = Math.sqrt(d2);
        const push = ((sep - d) / sep) * 0.045 * dt;
        const nx = dx / d;
        const ny = dy / d;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }

  /** Idle mill inside stand wait radius until drink/shop timer ends. */
  private tickStandWaitWander(f: FanUnit, dt: number): void {
    const stand = this.slots.find(
      (s) => slotKey(s.blockId, s.index) === f.standKey,
    );
    if (!stand) return;
    const sp = this.standWorld(stand);
    if (f._wanderTx == null || f._wanderTy == null || (f._wanderCd ?? 0) <= 0) {
      const ang = Math.random() * Math.PI * 2;
      const r = STAND_WAIT_RADIUS * (0.35 + Math.random() * 0.65);
      f._wanderTx = sp.x + Math.cos(ang) * r;
      f._wanderTy = sp.y + Math.sin(ang) * r;
      f._wanderCd = 0.45 + Math.random() * 0.7;
    } else {
      f._wanderCd = (f._wanderCd ?? 0) - dt;
    }
    const tx = f._wanderTx!;
    const ty = f._wanderTy!;
    const speed = 0.085;
    const d = dist(f.x, f.y, tx, ty);
    if (d > 0.004) {
      const step = Math.min(1, (speed * dt) / d);
      f.x += (tx - f.x) * step;
      f.y += (ty - f.y) * step;
    }
    // Soft clamp into circular wait area (no Y squish)
    const dx = f.x - sp.x;
    const dy = f.y - sp.y;
    const rad = Math.hypot(dx, dy);
    if (rad > STAND_WAIT_RADIUS) {
      const s = STAND_WAIT_RADIUS / rad;
      f.x = sp.x + dx * s;
      f.y = sp.y + dy * s;
    }
  }

  private payVisitGold(stand: BuildSlot, amount: number): void {
    if (amount <= 0) return;
    if (stand.owner === this.playerTeam) {
      this.gold += amount;
      this.floatAtSlot(stand, `+${amount}€`, true);
    } else if (stand.owner === this.aiTeam) {
      this.aiGold += amount;
      this.floatAtSlot(stand, `+${amount}€`, false);
    }
  }

  /** Owner loses 1 Bier / Fanartikel from wallet when a visit completes. */
  private consumeVisitStock(stand: BuildSlot): void {
    const p = this.standWorld(stand);
    if (stand.building === "bier") {
      if (stand.owner === this.playerTeam) {
        if (this.currency.beer >= 1) {
          this.spend("beer", 1, p, "BIER");
        } else {
          this.floatAt(p.x, p.y - 0.01, "−1 BIER", false);
        }
      } else if (stand.owner === this.aiTeam) {
        this.aiBeer = Math.max(0, this.aiBeer - 1);
        this.floatAt(p.x, p.y - 0.01, "−1 BIER", false);
      }
    } else if (stand.building === "fanshop") {
      if (stand.owner === this.playerTeam) {
        if (this.currency.merch >= 1) {
          this.spend("merch", 1, p, "FANARTIKEL");
        } else {
          this.floatAt(p.x, p.y - 0.01, "−1 FANARTIKEL", false);
        }
      } else if (stand.owner === this.aiTeam) {
        this.aiMerch = Math.max(0, this.aiMerch - 1);
        this.floatAt(p.x, p.y - 0.01, "−1 FANARTIKEL", false);
      }
    }
  }

  private finishStandVisit(f: FanUnit): void {
    const stand = this.slots.find(
      (s) => slotKey(s.blockId, s.index) === f.standKey,
    );
    const lv = f.level || 1;
    f._standArriveAt = undefined;
    f._angerCd = 0;
    // Full wait already elapsed — shelf may have refilled while queuing.
    if (stand?.building === "bier" && stand.beer >= 1) {
      stand.beer -= 1;
      f.thirst = 5;
      // Highscore / PvP-KPI: getrunkene Biere pro Seite
      if (f.team === this.playerTeam) this.beersDrunkPlayer += 1;
      else if (f.team === this.aiTeam) this.beersDrunkAi += 1;
      if (f.team === "neutral") {
        f.satisfiedUntil = 1e9;
        f.shopUntil = this.realElapsed + 20 + Math.random() * 10;
      } else {
        const beerIv = visitInterval(f.kind, "beer", lv);
        f.satisfiedUntil =
          beerIv == null ? 1e9 : this.realElapsed + beerIv;
      }
      const stealing =
        f.team !== "neutral" &&
        !!stand.owner &&
        stand.owner !== f.team &&
        this.bannerHolderAt(plotGangX(stand.blockId, stand.index)) === f.team;
      if (stealing) {
        // Durst stillen, Bier verbrauchen, nicht zahlen
        stand.beerStealAcc = (stand.beerStealAcc || 0) + 1;
        this.floatAtSlot(
          stand,
          `Leer ${stand.beerStealAcc}/${BEER_STEAL_CAPTURE}`,
          true,
        );
        if (stand.beerStealAcc >= BEER_STEAL_CAPTURE) {
          const thief = f.team as TeamId;
          stand.owner = thief;
          stand.greyNeutral = false;
          stand.beerStealAcc = 0;
          stand.convertAcc = 0;
          stand.convertBy = null;
          if (stand.beer < 20) stand.beer = 35;
          this.floatAtSlot(stand, "Leer getrunken!", true);
          this.toast(
            thief === this.playerTeam
              ? "Bierstand leer getrunken — übernommen"
              : "KI trinkt Bierstand leer",
            2.4,
            "build",
          );
        }
      } else {
        const pay = visitGoldPayout("beer", lv);
        this.payVisitGold(stand, pay);
        this.consumeVisitStock(stand);
        this.floatAtSlot(stand, "−1 Fass", false);
        stand.beerStealAcc = 0;
      }
    } else if (stand?.building === "fanshop" && stand.merch >= 1) {
      stand.merch -= 1;
      if (f.team === "neutral") {
        f.shopUntil = this.realElapsed + 20 + Math.random() * 10;
      } else {
        const shopIv = visitInterval(f.kind, "shop", lv);
        f.shopUntil = shopIv == null ? 1e9 : this.realElapsed + shopIv;
      }
      const pay = visitGoldPayout("shop", lv);
      this.payVisitGold(stand, pay);
      this.consumeVisitStock(stand);
      this.floatAtSlot(stand, "−1 Fanartikel", false);
    } else {
      // Still empty after waiting — leave without purchase, short backoff
      if (stand) this.floatAtSlot(stand, "Ausverkauft", false);
      if (f.team === "neutral") {
        f.shopUntil = this.realElapsed + 8 + Math.random() * 4;
      } else {
        if (canVisit(f.kind, "beer")) f.satisfiedUntil = this.realElapsed + 8;
        if (canVisit(f.kind, "shop")) f.shopUntil = this.realElapsed + 8;
      }
    }

    // Always the true home tribune — never the stand's blockId (neutrals
    // temporarily set blockId to the shop block on arrive; using that as
    // "home" stranded greys in blue/red and emptied the mid stand).
    const home = this.homeBlockOf(f);
    const seat =
      f.seatIndex != null && !this.seatOccupied(home, f.seatIndex)
        ? f.seatIndex
        : f._homeSeat != null && this.seatOccupied(home, f._homeSeat) === f
          ? f._homeSeat
          : this.freeSeat(home);
    const end =
      seat != null ? crowdHomePos(home, seat) : doorPos(home);
    this.startPath(f, this.pathViaDoors(f, home, end), "home");
    f._homeSeat = seat;
    f.standKey = null;
  }

  private standWorld(s: BuildSlot): { x: number; y: number } {
    return boothCenter(s.blockId, s.index);
  }

  private startPath(
    f: FanUnit,
    path: { x: number; y: number }[],
    after: string,
  ): void {
    f.state = "moving";
    f.path = path;
    f.pathI = 0;
    // Clear stand-wait absolutes so corridor sync cannot treat them as depth
    f._wanderTx = undefined;
    f._wanderTy = undefined;
    f._wanderCd = 0;
    this.setAfter(f, after);
  }

  /**
   * Leave/enter stands only via the center exit tunnel (Ausgangstor):
   * horizontal to block center → straight down through the door → gang.
   * Never cut diagonally across the terrace.
   */
  private pathViaDoors(
    f: FanUnit,
    toBlock: number,
    end: { x: number; y: number },
  ): { x: number; y: number }[] {
    const fromBlock = f.blockId;
    const fromDoor = doorPos(fromBlock);
    const toDoor = doorPos(toBlock);
    const laneY = gangLaneYForUnit(f.id);
    const path: { x: number; y: number }[] = [];

    // Leave current stand via center aisle → tunnel
    if (f.y < fromDoor.y - 0.015) {
      if (Math.abs(f.x - fromDoor.x) > 0.018) {
        path.push({ x: fromDoor.x, y: f.y });
      }
      path.push({ x: fromDoor.x, y: fromDoor.y });
    }

    if (fromBlock !== toBlock) {
      path.push(gangLanePosForUnit(fromBlock, f.id));
      path.push(gangLanePosForUnit(toBlock, f.id));
    } else if (end.y >= fromDoor.y - 0.01) {
      // Same block, gang-level target (Bier/Shop): personal lane Y
      path.push({ x: fromDoor.x, y: laneY });
    }

    // Enter destination stand up through its center door
    if (end.y < toDoor.y - 0.015) {
      const last = path[path.length - 1];
      if (!last || Math.hypot(last.x - toDoor.x, last.y - toDoor.y) > 0.02) {
        path.push({ x: toDoor.x, y: toDoor.y });
      }
      if (Math.abs(end.x - toDoor.x) > 0.018) {
        path.push({ x: toDoor.x, y: end.y });
      }
    }

    path.push(end);
    return path;
  }

  private followPath(f: FanUnit, dt: number): void {
    if (f.pathI >= f.path.length) {
      this.finishPath(f);
      return;
    }
    const t = f.path[f.pathI];
    const laneY = gangLaneYForUnit(f.id);
    const midY = gangMidY();
    const after = this.getAfter(f);

    // Dropping onto the fight strip: once Y is in the gang band, enter gang AI
    // (don't require an exact lane waypoint — wider band made that stall).
    if (
      after === "gang" &&
      f.y >= gangY() - 0.01 &&
      f.y <= gangY() + gangHeight() + 0.01
    ) {
      this.syncGangFromWorld(f);
      f.y = laneY;
      this.finishPath(f);
      return;
    }

    const onGangCorridor =
      Math.abs(f.y - midY) < 0.14 ||
      Math.abs(f.y - laneY) < 0.12 ||
      Math.abs(t.y - midY) < 0.14 ||
      Math.abs(t.y - laneY) < 0.12;

    // Only interrupt for a CLOSE corridor foe (gangX). World MELEE_RANGE spans
    // ~half the gang, so using it here froze units mid-corridor.
    // Home paths ignore distant fights — always finish the seat return.
    if (
      onGangCorridor &&
      f.team !== "neutral" &&
      after !== "home" &&
      Math.abs(f.y - midY) < 0.16
    ) {
      const moveDir =
        Math.sign(t.x - f.x) || (f.team === this.playerTeam ? 1 : -1);
      const blocker = this.blockerAhead(f, moveDir);
      if (blocker) {
        f.state = "gang";
        f.path = [];
        f.pathI = 0;
        f.y = laneY;
        this.syncGangFromWorld(f);
        if (f.onOffense || after === "gang" || after === "invade") {
          f.onOffense = true;
          if (f.aggro < 80) f.aggro = 40;
          this.setAfter(f, "");
        } else {
          // Was en route to a stand / idle path — abort shop, walk home on gang
          f.standKey = null;
          f.drinkT = 0;
          f.shopT = 0;
          f._standArriveAt = undefined;
          f.aggro = Math.max(f.aggro, 80);
          this.setAfter(f, "");
        }
        return;
      }
    }

    const speed = 0.22;
    const d = dist(f.x, f.y, t.x, t.y);
    // Slightly generous arrive so door/lane waypoints are not missed when
    // many units share the aisle (personal depth used to fight the snap).
    if (d < 0.02) {
      f.x = t.x;
      f.y = t.y;
      f.pathI++;
      if (f.pathI >= f.path.length) this.finishPath(f);
      return;
    }
    const step = Math.min(1, (speed * dt) / d);
    f.x += (t.x - f.x) * step;
    f.y += (t.y - f.y) * step;
    // While pathing, only *read* gangX — never rewrite world X. syncGangFromWorld
    // clamps at gangX 0/1 and snaps X to door±depth, freezing units forever
    // short of the center-door waypoint (empty tribunes / "lost" greys).
    if (Math.abs(f.y - laneY) < 0.08 || Math.abs(f.y - midY) < 0.08) {
      this.captureGangXFromWorld(f);
    }

    // Active attackers cannot path past an intact hostile Ordnerpost
    // (grey mid or blue/red posts on former neutral ground).
    if (
      this.isActiveAttacker(f) &&
      onGangCorridor &&
      (f.team === this.playerTeam || f.team === this.aiTeam)
    ) {
      const postWall = this.hostilePostWallGx(f.team as TeamId);
      if (postWall != null) {
        const dir = f.team === this.playerTeam ? 1 : -1;
        const limit = postWall - dir * 0.012;
        this.captureGangXFromWorld(f);
        const past =
          dir > 0 ? f.gangX > limit + 1e-4 : f.gangX < limit - 1e-4;
        if (past) {
          f.gangX = limit;
          f.x = gangXToWorld(limit) + gangLaneDepthForUnit(f.id);
          // Hold at the wall — don't eat waypoints beyond it
          if ((dir > 0 && t.x > f.x + 0.01) || (dir < 0 && t.x < f.x - 0.01)) {
            return;
          }
        }
      }
    }
  }

  private finishPath(f: FanUnit): void {
    const after = this.getAfter(f);
    f.path = [];
    f.pathI = 0;
    if (after === "gang") {
      f.state = "gang";
      this.retargetGangWander(f);
      this.syncGangFromWorld(f);
      f.y = this.gangFreeAimY(f);
      f.x = this.gangWorldX(f);
      // seat stays reserved
    } else if (after === "steward") {
      f.state = "gang";
      f.isSteward = true;
      if (f.homeStandKey) {
        const [b, i] = f.homeStandKey.split(":").map(Number);
        const stand = this.slots.find((s) => s.blockId === b && s.index === i);
        if (stand) {
          const p = this.stewardPostPos(stand);
          f.x = p.x;
          f.y = p.y;
          f.blockId = stand.blockId;
          f.gangX = this.postGangX(stand);
        }
      }
    } else if (after === "stand") {
      f.state = "stand";
      f._standArriveAt = this.realElapsed;
      f._angerCd = 0;
      f.armSwing = 0.85;
      if (f.standKey) {
        const [b] = f.standKey.split(":").map(Number);
        f.blockId = b;
        const stand = this.slots.find(
          (s) => slotKey(s.blockId, s.index) === f.standKey,
        );
        if (stand) {
          f.drinkT = this.standServiceSec(stand);
          const w = this.standWaitPos(stand, f.id);
          f.x = w.x;
          f.y = w.y;
          f._wanderTx = w.x;
          f._wanderTy = w.y;
          f._wanderCd = 0.2;
        } else {
          f.drinkT = ANIM_DRINK_SEC;
        }
      } else {
        f.drinkT = ANIM_DRINK_SEC;
      }
    } else if (after === "shop") {
      f.state = "stand";
      f._standArriveAt = this.realElapsed;
      f._angerCd = 0;
      f.armSwing = 0.55;
      if (f.standKey) {
        const [b] = f.standKey.split(":").map(Number);
        f.blockId = b;
        const stand = this.slots.find(
          (s) => slotKey(s.blockId, s.index) === f.standKey,
        );
        if (stand) {
          f.shopT = this.standServiceSec(stand);
          const w = this.standWaitPos(stand, f.id);
          f.x = w.x;
          f.y = w.y;
          f._wanderTx = w.x;
          f._wanderTy = w.y;
          f._wanderCd = 0.2;
        } else {
          f.shopT = ANIM_SHOP_SEC;
        }
      } else {
        f.shopT = ANIM_SHOP_SEC;
      }
    } else if (after === "home") {
      f.state = "block";
      f.invading = false;
      f.onOffense = false;
      const home = this.homeBlockOf(f);
      f.blockId = home;
      const seat = f.seatIndex ?? f._homeSeat ?? this.freeSeat(home);
      f.seatIndex = seat;
      // Re-enter at spread home slot, then micro-drift + cheer
      const p = crowdHomePos(home, seat);
      f.x = p.x;
      f.y = p.y;
      f._wanderCd = 0;
      this.retargetBlockWander(f);
    } else if (after === "invade") {
      f.state = "block";
      f.invading = true;
      // Still on the attack order until they sit / recall
      f.onOffense = true;
      // Fight at door/front — no seat claim while defenders remain
      const door = doorPos(f.blockId);
      f.x = door.x;
      f.y = door.y + 0.04;
      this.toast(
        f.team === this.playerTeam
          ? "Ultra im Gästeblock — Kampf!"
          : "Ultra im Heimblock — Kampf!",
      );
    } else {
      f.state = "block";
    }
    this.setAfter(f, "");
  }

  private isHostileUnit(f: FanUnit, o: FanUnit): boolean {
    if (o === f || o.hp <= 0) return false;
    if (o.team === f.team) return false;
    // Grey Fans never fight (only Ordner defend)
    if (o.team === "neutral" && !o.isSteward) return false;
    if (f.team === "neutral" && !f.isSteward) return false;
    // Neutral Ordner only engage units on an active attack / invasion
    if (f.isSteward && f.team === "neutral") {
      return this.isActiveAttacker(o);
    }
    // Team units only treat grey Ordner as foes when attacking
    if (o.isSteward && o.team === "neutral") {
      return this.isActiveAttacker(f);
    }
    return true;
  }

  /**
   * Corridor blocker ahead, measured in gangX.
   * Prefers the foe in the same Y-band (skirmish pocket) so a 4v6 does not
   * all lock onto one mid-lane target.
   */
  private blockerAhead(f: FanUnit, dirHint?: number): FanUnit | null {
    const dir =
      dirHint ??
      (f.team === this.playerTeam ? 1 : f.team === this.aiTeam ? -1 : 1);
    let best: FanUnit | null = null;
    // Short look-ahead so the rest of the gang stays walkable
    const maxLook = f.rangedPyro ? 0.16 : 0.09;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const o of this.fans) {
      if (!this.isHostileUnit(f, o)) continue;
      const onLane =
        o.state === "gang" ||
        o.isSteward ||
        o.state === "stand" ||
        o.state === "moving" ||
        (o.state === "block" &&
          Math.abs(blockIdToGangX(o.blockId) - f.gangX) < 0.12);
      if (!onLane) continue;
      const ogx =
        o.state === "gang" || o.invading || o.isSteward
          ? o.gangX
          : worldXToGangX(o.x);
      const dx = (ogx - f.gangX) * dir;
      if (dx < -0.015 || dx > maxLook) continue;
      const dy = Math.abs(o.y - f.y);
      if (dy > 0.18) continue;
      // Prefer close X, then same Y-band — never just the nearest X foe
      const score = dx * 1.15 + dy * 2.4;
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    return best;
  }

  /**
   * Soft Y-separation from nearby allies while fighting — opens readable
   * skirmish pockets instead of one packed scrum.
   */
  private applySkirmishSeparation(f: FanUnit, dt: number): void {
    const onGang =
      f.state === "gang" ||
      f.state === "stand" ||
      (f.state === "moving" && Math.abs(f.y - gangMidY()) < gangHeight());
    let y0: number;
    let y1: number;
    if (onGang) {
      y0 = gangY() + 0.012;
      y1 = gangY() + gangHeight() - 0.012;
    } else {
      const r = blockCrowdRect(f.blockId);
      y0 = r.top + 0.01;
      y1 = r.top + r.height - 0.01;
    }
    let pushY = 0;
    for (const o of this.fans) {
      if (o === f || o.hp <= 0 || o.isSteward) continue;
      // Separate from allies always; light push vs overlapping hostiles too
      const ally = o.team === f.team;
      if (
        o.state !== "gang" &&
        !o.invading &&
        o.state !== "moving" &&
        o.state !== "stand" &&
        !(o.state === "block" && (f.invading || f.state === "block"))
      )
        continue;
      const dx = f.x - o.x;
      const dy = f.y - o.y;
      const d = Math.hypot(dx, dy);
      const minD = ally ? 0.07 : 0.045;
      if (d < 1e-4 || d > minD) continue;
      // Prefer pushing on Y so X contact (the fight) stays; stronger when stacked
      const falloff = (minD - d) / minD;
      const ny = Math.abs(dy) < 0.006 ? (f.id < o.id ? -1 : 1) : dy / d;
      pushY += ny * falloff * (ally ? 0.085 : 0.035);
    }
    if (Math.abs(pushY) < 1e-5) return;
    f.y = clamp(f.y + pushY * Math.min(1, 12 * dt), y0, y1);
  }

  /** Update gangX from world X without moving the unit (safe while pathing). */
  private captureGangXFromWorld(f: FanUnit): void {
    const left = blockCenterX(0);
    const right = blockCenterX(BLOCK_COUNT - 1);
    const depth = gangLaneDepthForUnit(f.id);
    f.gangX = clamp((f.x - depth - left) / (right - left || 1), 0, 1);
  }

  private syncGangFromWorld(f: FanUnit): void {
    const left = blockCenterX(0);
    const right = blockCenterX(BLOCK_COUNT - 1);
    // Strip personal depth (+ gang edge lean only — not stand-wait absolute X)
    const edge = f.state === "gang" ? (f._wanderTx ?? 0) : 0;
    const depth = gangLaneDepthForUnit(f.id) + edge;
    f.gangX = clamp((f.x - depth - left) / (right - left || 1), 0, 1);
    f.x = this.gangWorldX(f);
  }

  /**
   * World X = battle-line + personal depth + live wander toward pitch edges.
   * `_wanderTx` on gang units stores an extra depth offset (not a world X).
   */
  private gangWorldX(f: FanUnit): number {
    // `_wanderTx` is dual-use: absolute wait-wander X while state==="stand",
    // and a small edge-lean offset while state==="gang". Never apply the
    // stand absolute as a gang depth — that freezes pathing on the corridor.
    const edge = f.state === "gang" ? (f._wanderTx ?? 0) : 0;
    return gangXToWorld(f.gangX) + gangLaneDepthForUnit(f.id) + edge;
  }

  /** Pick a new Y across the full Bau-row corridor + X lean toward an outer edge. */
  private retargetGangWander(f: FanUnit): void {
    const y0 = gangY();
    const y1 = y0 + gangHeight();
    const pad = 0.01;
    f._wanderTy = y0 + pad + Math.random() * Math.max(0.02, y1 - y0 - pad * 2);
    // Lean toward left/right outer pitch edge (extra depth on top of lane depth)
    const towardEdge = Math.random() < 0.5 ? -1 : 1;
    f._wanderTx = towardEdge * (0.03 + Math.random() * 0.09);
    f._wanderCd = 1.1 + Math.random() * 2.2;
  }

  /**
   * Free personal Y in the fight corridor between upper/lower Bau rows.
   * Units continuously retarget so they move back and forth across all lines.
   */
  private gangFreeAimY(f: FanUnit): number {
    if (f._wanderTy == null || (f._wanderCd ?? 0) <= 0) {
      this.retargetGangWander(f);
    }
    const y0 = gangY() + 0.008;
    const y1 = gangY() + gangHeight() - 0.008;
    return clamp(f._wanderTy ?? gangLaneYForUnit(f.id), y0, y1);
  }

  private tickGangMove(f: FanUnit, dt: number): void {
    if (f.isSteward) return;
    const dir = f.team === this.playerTeam ? 1 : -1;
    // Brisk march so the full Heim→Gast corridor reads as movement
    const speed = 0.11 * FAN_STATS[f.kind].fight;
    if ((f._wanderCd ?? 0) > 0) f._wanderCd = (f._wanderCd ?? 0) - dt;
    const laneY = this.gangFreeAimY(f);
    const goalBlock = f.team === this.playerTeam ? GAST_BLOCK : HEIM_BLOCK;
    const team = f.team as TeamId;
    const homeGx = blockIdToGangX(
      team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK,
    );

    // Non-offense: walk home along the gang (full length), then enter block.
    if (!f.onOffense) {
      const homeDir = -dir;
      const blocker = this.blockerAhead(f, homeDir);
      let moveSpeed = speed;
      let inContact = false;
      if (blocker) {
        const ogx =
          blocker.state === "gang" || blocker.invading || blocker.isSteward
            ? blocker.gangX
            : worldXToGangX(blocker.x);
        const gapGx = (ogx - f.gangX) * homeDir;
        if (gapGx < 0.05) {
          // Soft contact — still crawl home; hold personal lane (no Y pile-in)
          moveSpeed = speed * 0.7;
          f.aggro = Math.max(f.aggro, 80);
          inContact = true;
        }
      }
      f.gangX = clamp(f.gangX + homeDir * moveSpeed * dt, 0, 1);
      f.x = this.gangWorldX(f);
      // Roam full Bau-corridor height; edge lean via gangWorldX/_wanderTx
      let aimY = laneY;
      if (inContact && blocker && Math.abs(blocker.y - laneY) < 0.12) {
        aimY = laneY * 0.45 + blocker.y * 0.55;
      }
      f.y += (aimY - f.y) * Math.min(1, 3.2 * dt);
      f.y = clamp(f.y, gangY() + 0.008, gangY() + gangHeight() - 0.008);
      if (inContact) this.applySkirmishSeparation(f, dt);
      if (Math.abs(f.gangX - homeGx) < 0.1) {
        this.returnFanToHomeBlock(f);
      }
      return;
    }

    // Offense: march toward the enemy. Intact Ordnerposts hard-stop advance;
    // cement only slows + DoTs. Must destroy the post before pushing past.
    const cementWall = this.cementWallAhead(f);
    const pressingCement =
      cementWall != null &&
      (f.kind === "hooligans" || f.kind === "ultras");
    let moveSpeed = speed * (pressingCement ? Math.max(0.55, CEMENT_SLOW_MUL) : 1);
    if (pressingCement) {
      f.hp = Math.max(0, f.hp - CEMENT_DOT_PER_SEC * dt);
    }

    const blocker = this.blockerAhead(f, dir);
    let inContact = false;
    if (blocker) {
      const ogx =
        blocker.state === "gang" || blocker.invading || blocker.isSteward
          ? blocker.gangX
          : worldXToGangX(blocker.x);
      const gapGx = (ogx - f.gangX) * dir;
      if (gapGx < 0.05) {
        // Soft contact: slight slow, keep personal lane — don't collapse onto foe Y
        moveSpeed = Math.max(speed * 0.7, moveSpeed * 0.8);
        inContact = true;
        if (f.aggro < 80) f.aggro = 40;
      }
    }

    f.gangX = clamp(f.gangX + dir * moveSpeed * dt, 0, 1);
    // Hard wall: never pass intact hostile Ordnerposts — grey mid OR
    // blue/red posts on formerly neutral plots. Destroy first, then push.
    if (team === this.playerTeam || team === this.aiTeam) {
      const postWall = this.hostilePostWallGx(team);
      if (postWall != null) {
        const limit = postWall - dir * 0.012;
        f.gangX =
          dir > 0 ? Math.min(f.gangX, limit) : Math.max(f.gangX, limit);
      }
    }
    f.x = this.gangWorldX(f);
    let aimY = laneY;
    if (inContact && blocker && Math.abs(blocker.y - laneY) < 0.12) {
      aimY = laneY * 0.4 + blocker.y * 0.6;
    }
    f.y += (aimY - f.y) * Math.min(1, 3.2 * dt);
    f.y = clamp(f.y, gangY() + 0.008, gangY() + gangHeight() - 0.008);
    if (inContact) this.applySkirmishSeparation(f, dt);

    // Cannot enter the far block while a hostile Ordnerpost still blocks the way
    if (team === this.playerTeam || team === this.aiTeam) {
      const postWall = this.hostilePostWallGx(team);
      if (postWall != null) {
        const pastWall =
          dir > 0
            ? f.gangX >= postWall - 0.01
            : f.gangX <= postWall + 0.01;
        if (pastWall) return;
      }
    }

    const goalGx = blockIdToGangX(goalBlock);
    const reached =
      f.team === this.playerTeam
        ? f.gangX >= goalGx - 0.02
        : f.gangX <= goalGx + 0.02;
    if (reached) {
      const door = doorPos(goalBlock);
      f.blockId = goalBlock;
      // Free approach to door, then tight aisle into the block
      f.path = [
        { x: door.x, y: f.y },
        { x: door.x, y: door.y },
        { x: door.x, y: door.y + 0.05 },
      ];
      f.pathI = 0;
      f.state = "moving";
      f._homeSeat = f.seatIndex;
      this.setAfter(f, "invade");
    }
  }

  /**
   * Standarten / Fortschrittsbalken:
   * - Floor = own Ordnerposten + owned blocks (buildFrontier)
   * - Soft target = furthest living attacker depth
   * - Hard cap = intact enemy/neutral Ordnerpost (never overrun)
   * - Lerp: advance moderate, retreat slow — no snap-back, grey gap OK
   */
  private updateBattleLines(dt: number): void {
    const frontKinds = (team: TeamId) =>
      this.fans.filter(
        (f) =>
          f.hp > 0 &&
          f.team === team &&
          !f.isSteward &&
          (f.kind === "hooligans" || f.kind === "ultras") &&
          (f.state === "gang" || f.invading || f.state === "moving"),
      );
    const pFront = frontKinds(this.playerTeam);
    const aFront = frontKinds(this.aiTeam);

    const pFloor = this.buildFrontierGx(this.playerTeam);
    const aFloor = this.buildFrontierGx(this.aiTeam);

    let pTarget = pFloor;
    let aTarget = aFloor;
    if (pFront.length) {
      pTarget = Math.max(
        pTarget,
        ...pFront.map((f) => this.attackerDepthGx(f)),
      );
    }
    if (aFront.length) {
      aTarget = Math.min(
        aTarget,
        ...aFront.map((f) => this.attackerDepthGx(f)),
      );
    }

    // Intact Ordnerposten hard-cap the opposing Standarte (and build rights)
    const pWall = this.hostilePostWallGx(this.playerTeam);
    const aWall = this.hostilePostWallGx(this.aiTeam);
    if (pWall != null) {
      pTarget = Math.min(pTarget, pWall - BANNER_POST_STANDOFF);
    }
    if (aWall != null) {
      aTarget = Math.max(aTarget, aWall + BANNER_POST_STANDOFF);
    }

    // Never claim behind own floor; keep a usable grey buffer between sides
    pTarget = Math.max(pTarget, pFloor);
    aTarget = Math.min(aTarget, aFloor);
    if (pTarget > aTarget - BANNER_MIN_GAP) {
      const mid = (pTarget + aTarget) / 2;
      pTarget = Math.min(pTarget, mid - BANNER_MIN_GAP * 0.5);
      aTarget = Math.max(aTarget, mid + BANNER_MIN_GAP * 0.5);
    }

    pTarget = clamp(pTarget, 0.05, 0.95);
    aTarget = clamp(aTarget, 0.05, 0.95);

    this.linePlayer = this.approachBanner(this.linePlayer, pTarget, dt, 1);
    this.lineAi = this.approachBanner(this.lineAi, aTarget, dt, -1);

    // Floor first, then Ordnerpost hard-caps (posts always win), then grey gap
    this.linePlayer = Math.max(this.linePlayer, pFloor);
    this.lineAi = Math.min(this.lineAi, aFloor);
    if (pWall != null) {
      this.linePlayer = Math.min(this.linePlayer, pWall - BANNER_POST_STANDOFF);
    }
    if (aWall != null) {
      this.lineAi = Math.max(this.lineAi, aWall + BANNER_POST_STANDOFF);
    }
    if (this.linePlayer > this.lineAi - BANNER_MIN_GAP) {
      const overflow = this.linePlayer - (this.lineAi - BANNER_MIN_GAP);
      this.linePlayer -= overflow * 0.5;
      this.lineAi += overflow * 0.5;
      // Re-assert post walls after gap split
      if (pWall != null) {
        this.linePlayer = Math.min(this.linePlayer, pWall - BANNER_POST_STANDOFF);
      }
      if (aWall != null) {
        this.lineAi = Math.max(this.lineAi, aWall + BANNER_POST_STANDOFF);
      }
    }
    this.linePlayer = clamp(this.linePlayer, 0.05, 0.95);
    this.lineAi = clamp(this.lineAi, 0.05, 0.95);
  }

  /** Seated fans in a block belonging to a team (for convert majority gate) */
  private seatCountInBlock(blockId: number, team: TeamId | "neutral"): number {
    let n = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward) continue;
      if (f.blockId !== blockId || f.state !== "block" || f.seatIndex == null) continue;
      if (f.team === team) n++;
    }
    return n;
  }

  private totalSeatsInBlock(blockId: number): number {
    let n = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward) continue;
      if (f.blockId !== blockId || f.state !== "block" || f.seatIndex == null) continue;
      n++;
    }
    return n;
  }

  /** True when team holds strict seat majority in the booth's block */
  private hasSeatMajority(blockId: number, team: TeamId): boolean {
    const total = this.totalSeatsInBlock(blockId);
    if (total <= 0) return false;
    return this.seatCountInBlock(blockId, team) > total / 2;
  }

  /**
   * Which colored Standarte currently covers this plot.
   * Behind Heim-Standarte ⇒ player; behind Gäste-Standarte ⇒ AI;
   * grey buffer between the two ⇒ nobody.
   */
  private bannerHolderAt(gx: number): TeamId | null {
    const behindPlayer = gx < this.linePlayer;
    const behindAi = gx > this.lineAi;
    if (behindPlayer && !behindAi) return this.playerTeam;
    if (behindAi && !behindPlayer) return this.aiTeam;
    return null;
  }

  /**
   * Standarte territory clocks:
   * - Zeitübernahme nur Leerplätze + Fanshops (nie Bier, nie Ordner)
   * - Bier → Leer-trinken (50 geklaute Biere), siehe finishStandVisit
   * - Non-Ordner in Feindgebiet → break after ENEMY_ZONE_BUILDING_BREAK_SEC
   */
  private tickBannerTerritory(dt: number): void {
    for (const s of this.slots) {
      const gx = plotGangX(s.blockId, s.index);
      const holder = this.bannerHolderAt(gx);

      // --- 20s: empty plots + fanshops only ---
      const emptyClaim =
        !s.building &&
        holder != null &&
        (s.owner == null ||
          s.owner === "neutral" ||
          s.greyNeutral ||
          s.owner !== holder);
      const fanshopClaim =
        s.building === "fanshop" &&
        holder != null &&
        (s.owner == null ||
          s.owner === "neutral" ||
          s.greyNeutral ||
          s.owner !== holder);

      if (holder && (emptyClaim || fanshopClaim)) {
        s.bannerHoldAcc += dt;
        if (s.bannerHoldAcc >= BANNER_PLOT_CAPTURE_SEC) {
          s.owner = holder;
          s.greyNeutral = false;
          s.bannerHoldAcc = 0;
          s.convertAcc = 0;
          s.convertBy = null;
          s.beerStealAcc = 0;
          this.floatAtSlot(s, emptyClaim ? "Bauplatz" : "Fanshop", true);
          this.toast(
            holder === this.playerTeam
              ? emptyClaim
                ? "Bauplatz eingenommen"
                : "Fanshop übernommen"
              : emptyClaim
                ? "KI nimmt Bauplatz"
                : "KI übernimmt Fanshop",
            2.2,
            "build",
          );
        }
      } else {
        s.bannerHoldAcc = Math.max(0, s.bannerHoldAcc - dt * 0.8);
      }

      // Bier-Steal-Fortschritt verfällt, wenn Standarte weg ist
      if (s.building === "bier" && s.beerStealAcc > 0) {
        if (!holder || s.owner === holder) {
          s.beerStealAcc = Math.max(0, s.beerStealAcc - dt * 0.35);
        }
      }

      // --- 30s enemy-zone break (non-Ordner only) ---
      if (
        s.building &&
        s.building !== "ordner" &&
        holder &&
        s.owner &&
        s.owner !== "neutral" &&
        s.owner !== holder
      ) {
        s.enemyZoneAcc += dt;
        if (s.enemyZoneAcc >= ENEMY_ZONE_BUILDING_BREAK_SEC) {
          const was = s.building;
          this.destroyNonOrdnerBuilding(s);
          this.toast(
            was === "bier"
              ? "Bierstand im Feindgebiet zerstört"
              : "Fanshop im Feindgebiet zerstört",
            2.2,
            "build",
          );
        }
      } else {
        s.enemyZoneAcc = Math.max(0, s.enemyZoneAcc - dt * 0.9);
      }
    }
  }

  /** True when no colored pressure is contesting the grey mid. */
  private greyUnbothered(): boolean {
    const mid = this.slots.find(
      (s) => s.blockId === NEUTRAL_BLOCK && s.index === NEUTRAL_MID_GANG_INDEX,
    );
    if (mid?.building === "ordner" && mid.structHp > 0) {
      if (mid.structHp < mid.structMaxHp * 0.92) return false;
    }
    const midGx = plotGangX(NEUTRAL_BLOCK, NEUTRAL_MID_GANG_INDEX);
    if (this.linePlayer > midGx - 0.08) return false;
    if (this.lineAi < midGx + 0.08) return false;
    for (const f of this.fans) {
      if (f.hp <= 0) continue;
      if (f.team !== this.playerTeam && f.team !== this.aiTeam) continue;
      if (!(f.state === "gang" || f.invading || f.isSteward)) continue;
      if (Math.abs(f.gangX - midGx) < GREY_BOTHER_RADIUS_GX) return false;
    }
    return true;
  }

  /**
   * Grey party slowly develops empty mid plots + levels buildings when left alone.
   */
  private tickGreyEconomy(dt: number): void {
    if (!this.greyUnbothered()) {
      this.greyBuildAcc = Math.max(0, this.greyBuildAcc - dt * 0.5);
      return;
    }
    this.greyBuildAcc += dt;
    if (this.greyBuildAcc < GREY_AI_BUILD_SEC) return;
    this.greyBuildAcc = 0;

    // Prefer upgrading existing grey Bier/Shop
    const greyOwned = this.slots.filter(
      (s) =>
        s.blockId === NEUTRAL_BLOCK &&
        (s.owner === "neutral" || s.greyNeutral) &&
        !!s.building &&
        s.building !== "ordner" &&
        s.level < UPGRADE_MAX,
    );
    if (greyOwned.length) {
      const s = greyOwned.sort((a, b) => a.level - b.level)[0]!;
      s.level++;
      this.floatAtSlot(s, `Grau Lv${s.level}`, true);
      this.toast("Neutral baut aus", 2.0, "build");
      return;
    }

    // Place on empty mid plots still outside colored Standarten
    const empty = this.slots
      .filter(
        (s) =>
          s.blockId === NEUTRAL_BLOCK &&
          !s.building &&
          s.index !== NEUTRAL_MID_GANG_INDEX &&
          (s.owner === "neutral" || s.owner == null || s.greyNeutral) &&
          !this.inPlayerTerritory(s.blockId, s.index) &&
          !this.inAiTerritory(s.blockId, s.index),
      )
      .sort(
        (a, b) =>
          Math.abs(plotGangX(a.blockId, a.index) - 0.5) -
          Math.abs(plotGangX(b.blockId, b.index) - 0.5),
      );
    if (empty.length) {
      const kinds: BuildingKind[] = ["bier", "fanshop", "ordner"];
      const kind =
        kinds[Math.floor(this.realElapsed / GREY_AI_BUILD_SEC) % kinds.length]!;
      const s = empty[0]!;
      this.placeBuilding(s.blockId, s.index, kind, true, "neutral");
      s.greyNeutral = false;
      s.owner = "neutral";
      this.floatAtSlot(
        s,
        kind === "ordner"
          ? "Grau Ordner"
          : kind === "bier"
            ? "Grau Bier"
            : "Grau Shop",
        true,
      );
      this.toast("Neutral bebaut Bauplatz", 2.0, "build");
      return;
    }

    // No empty plots: nudge Ordner auto-level under cap
    for (const s of this.slots) {
      if (
        s.building === "ordner" &&
        s.owner === "neutral" &&
        s.structHp > 0 &&
        s.level < NEUTRAL_POST_AUTO_LEVEL_CAP
      ) {
        s.autoLevelAcc += GREY_AI_BUILD_SEC * 0.45;
      }
    }
  }

  /** Stand conversion: Fanshops only (Bier → Leer-trinken, Ordner → Kampf) */
  private tickCaptureConvert(dt: number): void {
    for (const s of this.slots) {
      if (!s.building) continue;
      // Ordnerposts must be fought; Bier via Leer-trinken — never soft time-convert
      if (s.building === "ordner" || s.building === "bier") continue;
      const mid = blockIdToGangX(s.blockId);
      let dominant: TeamId | null = null;
      // Booth is in a team's "colored zone" when their battle line has passed the booth's block
      if (this.linePlayer > mid + 0.02 && this.linePlayer >= this.lineAi - 0.02) {
        dominant = this.playerTeam;
      } else if (this.lineAi < mid - 0.02 && this.lineAi <= this.linePlayer + 0.02) {
        dominant = this.aiTeam;
      }
      // Gang pressure alone is not enough — need seat majority in that block
      if (
        dominant &&
        STAND_CONVERT_SEAT_MAJORITY &&
        !this.hasSeatMajority(s.blockId, dominant)
      ) {
        dominant = null;
      }
      if (!dominant || dominant === s.owner) {
        s.convertAcc = Math.max(0, s.convertAcc - dt * 0.7);
        if (s.convertAcc <= 0.05) s.convertBy = null;
        continue;
      }
      // Switching pressure resets progress toward the new team
      if (s.convertBy && s.convertBy !== dominant) {
        s.convertAcc = Math.max(0, s.convertAcc - dt * 1.2);
        if (s.convertAcc <= 0) s.convertBy = dominant;
      } else {
        s.convertBy = dominant;
        s.convertAcc += dt;
      }
      if (s.convertAcc >= STAND_CONVERT_SEC) {
        s.owner = dominant;
        s.greyNeutral = false;
        s.convertAcc = 0;
        s.convertBy = null;
        if (s.building === "fanshop" && s.merch < 20) s.merch = 35;
        this.floatAtSlot(s, "Übernommen!", true);
        this.toast(
          dominant === this.playerTeam
            ? `Fanshop übernommen`
            : `KI übernimmt Fanshop`,
        );
        if (dominant === this.aiTeam) this.aiGold += 10;
      }
    }
  }

  private neighborBonus(f: FanUnit): number {
    let n = 0;
    for (const o of this.fans) {
      if (o === f || o.hp <= 0 || o.team !== f.team) continue;
      if (dist(f.x, f.y, o.x, o.y) < 0.09) n++;
    }
    return 1 + Math.min(0.18, n * 0.06);
  }

  private blitzCombatMul(f: FanUnit): number {
    if (!this.blitz || this.blitzCombatBuffT <= 0) return 1;
    if (f.team !== this.playerTeam) return 1;
    if (f.isSteward || f.kind === "ultras" || f.kind === "hooligans") {
      return BLITZ_COMBAT_BUFF_MUL;
    }
    return 1;
  }

  private attackOf(f: FanUnit): number {
    const mul = unitLevelMul(f.level || 1) * this.blitzCombatMul(f);
    if (f.isSteward) return STEWARD_STATS.attack * mul;
    return FAN_STATS[f.kind].attack * mul;
  }

  private defenseOf(f: FanUnit): number {
    const mul = unitLevelMul(f.level || 1) * this.blitzCombatMul(f);
    if (f.isSteward) return STEWARD_STATS.defense * mul;
    return FAN_STATS[f.kind].defense * mul;
  }

  private enemyUltraInBlock(blockId: number, defenderTeam: TeamId): boolean {
    return this.fans.some(
      (f) =>
        f.hp > 0 &&
        (f.kind === "ultras" || f.kind === "hooligans") &&
        f.team !== defenderTeam &&
        f.team !== "neutral" &&
        f.blockId === blockId &&
        (f.state === "block" || f.invading || f.state === "moving"),
    );
  }

  /** Own ultras/hools leave seats to defend when enemy Ultra is in / approaching home */
  private tickAutoDefend(dt: number): void {
    for (const team of [this.playerTeam, this.aiTeam] as TeamId[]) {
      const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
      const underAttack = this.enemyUltraInBlock(home, team);
      // Also react when enemy front line enters home third
      const lineThreat =
        team === this.playerTeam
          ? this.lineAi < blockIdToGangX(HEIM_BLOCK) + 0.18
          : this.linePlayer > blockIdToGangX(GAST_BLOCK) - 0.18;
      if (!underAttack && !lineThreat) continue;

      const defenders = this.fans.filter(
        (f) =>
          f.hp > 0 &&
          f.team === team &&
          (f.kind === "ultras" || f.kind === "hooligans") &&
          f.state === "block" &&
          !f.invading &&
          !f.onOffense &&
          f.blockId === home,
      );
      // Send defenders out when threatened (no SENDEN needed)
      let sent = 0;
      for (const u of defenders) {
        if (sent >= 4) break;
        if (underAttack) {
          // Fight in block if invader is there; also step onto gang
          const inv = this.fans.find(
            (e) =>
              e.hp > 0 &&
              (e.kind === "ultras" || e.kind === "hooligans") &&
              e.team !== team &&
              e.blockId === home &&
              (e.invading || e.state === "block"),
          );
          if (inv) {
            u.x += (inv.x - u.x) * 0.15;
            u.y += (inv.y - u.y) * 0.15;
            u.aggro = 100;
          }
          this.sendToDefend(u);
          sent++;
        } else if (lineThreat) {
          this.sendToDefend(u);
          sent++;
        }
      }

      // Normalos in block under attack: move toward invader
      if (underAttack) {
        const inv = this.fans.find(
          (e) =>
            e.hp > 0 &&
            e.kind === "ultras" &&
            e.team !== team &&
            e.blockId === home &&
            (e.invading || e.state === "block"),
        );
        if (inv) {
          for (const n of this.fans) {
            if (
              n.hp <= 0 ||
              n.team !== team ||
              n.blockId !== home ||
              n.state !== "block" ||
              n.kind === "hooligans" ||
              n.isSteward
            )
              continue;
            n.x += (inv.x - n.x) * 0.08;
            n.y += (inv.y - n.y) * 0.08;
          }
        }
      }
    }

    // Invaders keep hunting nearest hostile unit / Ordnerpost (no idle standstill)
    for (const inv of this.fans) {
      if (!inv.invading || inv.hp <= 0) continue;
      if (inv.aggro < 40) inv.aggro = 40;
      inv.onOffense = true;
      const target = this.nearestHostileEngage(inv);
      if (!target) continue;
      const slotY = this.gangFreeAimY(inv);
      const tx =
        target.kind === "unit"
          ? target.unit.x
          : this.ordnerPostGangPos(target.post).x;
      const tyRaw =
        target.kind === "unit"
          ? target.unit.y
          : this.ordnerPostGangPos(target.post).y;
      // Blend personal lane into aim Y so several invaders don't stack on one foe
      const ty = tyRaw * 0.4 + slotY * 0.6;
      const d = dist(inv.x, inv.y, tx, ty);
      const hold = inv.rangedPyro ? RANGED_RANGE * 0.45 : MELEE_RANGE * 0.85;
      if (d > hold) {
        const step = Math.min(1, 0.4);
        inv.x += (tx - inv.x) * step;
        inv.y += (ty - inv.y) * step;
      }
      this.applySkirmishSeparation(inv, dt);
    }
  }

  private tickCombat(dt: number): void {
    void dt;
    for (const a of this.fans) {
      if (a.hp <= 0) continue;
      if (a.team === "neutral" && !a.isSteward) continue;

      const home =
        a.team === this.playerTeam
          ? HEIM_BLOCK
          : a.team === this.aiTeam
            ? GAST_BLOCK
            : -1;
      const blockInvaded =
        home >= 0 && this.enemyUltraInBlock(home, a.team as TeamId);

      let canAttack = false;
      if (a.isSteward) {
        canAttack = true;
      } else if (a.kind === "hooligans" || a.kind === "ultras") {
        canAttack =
          a.state === "gang" ||
          a.state === "moving" ||
          a.invading ||
          (a.state === "block" && (blockInvaded || a.blockId === home));
      } else if (a.kind === "normalos") {
        canAttack =
          a.team !== "neutral" &&
          (a.state === "moving" ||
            a.state === "gang" ||
            (a.state === "block" &&
              this.enemyUltraInBlock(a.blockId, a.team as TeamId)));
      }

      if (
        !canAttack &&
        a.state !== "gang" &&
        a.state !== "moving" &&
        !a.isSteward
      )
        continue;

      const reach = a.rangedPyro ? RANGED_RANGE : MELEE_RANGE;
      const target = this.nearestHostileEngage(a);
      if (!target || target.dist > reach * 1.08 || a.attackCd > 0) continue;

      a.armSwing = 1;
      a.attackCd = HIT_CD / Math.max(0.4, this.attackOf(a));
      // Keep melee pockets readable while trading blows
      if (a.state === "gang" || a.invading || a.state === "moving") {
        this.applySkirmishSeparation(a, 0.08);
      }

      if (target.kind === "post") {
        const pos = this.ordnerPostGangPos(target.post);
        const dmg = this.ordnerPostDamageFrom(a);
        const key = slotKey(target.post.blockId, target.post.index);
        if (
          a.rangedPyro &&
          (a.state === "gang" || a.state === "moving" || a.invading || a.isSteward)
        ) {
          this.spawnPyroShot(a, pos.x, pos.y, dmg, null, key);
        } else {
          this.damageOrdnerPost(target.post, dmg, a);
        }
        continue;
      }

      const best = target.unit;
      if (
        a.rangedPyro &&
        (a.state === "gang" || a.state === "moving" || a.invading || a.isSteward)
      ) {
        const dmg =
          (HIT_DAMAGE *
            HIT_DAMAGE_SCALE *
            RANGED_DAMAGE_SCALE *
            this.attackOf(a) *
            this.neighborBonus(a)) /
          Math.max(0.35, this.defenseOf(best));
        this.spawnPyroShot(a, best.x, best.y, dmg, best.id, null);
      } else {
        this.applyHit(a, best);
      }

      // Counter-hit only in melee reach
      if (best.hp > 0 && best.kind !== "hooligans") {
        const counterReach =
          best.isSteward || a.isSteward ? MELEE_RANGE * 1.15 : MELEE_RANGE;
        if (dist(a.x, a.y, best.x, best.y) <= counterReach) {
          const stewardFight = a.isSteward || best.isSteward;
          if (stewardFight || best.attackCd <= 0) {
            best.armSwing = 1;
            best.attackCd = HIT_CD / Math.max(0.4, this.attackOf(best));
            this.applyHit(best, a);
          }
        }
      }
    }
  }

  /** Small momentum bump for the killer's team (player +, AI −). */
  private applyKillMomentum(killerTeam: TeamId, amount: number): void {
    if (killerTeam === this.playerTeam) {
      this.momentum = clamp(this.momentum + amount, -1, 1);
    } else if (killerTeam === this.aiTeam) {
      this.momentum = clamp(this.momentum - amount, -1, 1);
    }
  }

  private applyHit(attacker: FanUnit, target: FanUnit): void {
    let atkMul = 1;
    let defMul = 1;
    // Ordner anti-rush: stewards hit Ultras harder / take less from them
    const meleeFoe =
      (target.kind === "ultras" || target.kind === "hooligans") && !target.isSteward;
    const meleeAtk =
      (attacker.kind === "ultras" || attacker.kind === "hooligans") &&
      !attacker.isSteward;
    if (attacker.isSteward && meleeFoe) atkMul = STEWARD_STATS.vsUltraMul;
    if (target.isSteward && meleeAtk) defMul = STEWARD_STATS.vsUltraMul;
    const rangedMul = attacker.rangedPyro ? RANGED_DAMAGE_SCALE : 1;
    if (target.kind === "normalos" && !target.isSteward) {
      const dmg =
        (HIT_DAMAGE * HIT_DAMAGE_SCALE * rangedMul * this.attackOf(attacker) * this.neighborBonus(attacker) * atkMul) /
        Math.max(0.35, this.defenseOf(target) * defMul);
      target.hp -= dmg * 0.55;
      this.reactToBeingAttacked(target, attacker);
      if (target.hp <= 0) {
        target.hp = 0;
        if (attacker.team === this.playerTeam || attacker.team === this.aiTeam) {
          this.applyKillMomentum(attacker.team as TeamId, MOMENTUM_KILL_UNIT);
        }
      }
      return;
    }
    const dmg =
      (HIT_DAMAGE * HIT_DAMAGE_SCALE * rangedMul * this.attackOf(attacker) * this.neighborBonus(attacker) * atkMul) /
      Math.max(0.35, (this.defenseOf(target) * defMul) / this.neighborBonus(target));
    target.hp -= dmg;
    this.reactToBeingAttacked(target, attacker);
    if (target.hp <= 0) {
      target.hp = 0;
      if (attacker.team === this.playerTeam || attacker.team === this.aiTeam) {
        this.applyKillMomentum(attacker.team as TeamId, MOMENTUM_KILL_UNIT);
      }
      if (target.isSteward) {
        this.onStewardDefeated(target);
        this.toast("Ordner besiegt");
      } else {
        this.toast(`${FAN_STATS[target.kind].label} besiegt`);
      }
    }
  }

  /**
   * Attacked units always step up to defend — no SENDEN required.
   * Offensive pushers keep pushing; everyone else leaves the seat to the gang.
   */
  private reactToBeingAttacked(target: FanUnit, attacker: FanUnit): void {
    if (target.hp <= 0) return;
    if (target.team !== this.playerTeam && target.team !== this.aiTeam) return;
    if (target.isSteward) {
      target.aggro = 100;
      this.alertTeamDefense(target.team as TeamId, target.gangX);
      return;
    }
    // Hitting an attacker must not cancel their push
    if (target.onOffense) {
      if (target.aggro < 80) target.aggro = 40;
      return;
    }
    target.aggro = 100;
    this.alertTeamDefense(
      target.team as TeamId,
      attacker.state === "gang" || attacker.invading
        ? attacker.gangX
        : worldXToGangX(attacker.x),
    );
    if (
      (target.state === "block" || target.state === "stand") &&
      (target.kind === "ultras" ||
        target.kind === "hooligans" ||
        target.kind === "normalos")
    ) {
      this.sendToDefend(target);
    }
  }

  /** Neutral Ordner: start slow respawn timer on their post */
  private onStewardDefeated(st: FanUnit): void {
    if (!st.homeStandKey) return;
    const stand = this.slots.find(
      (s) => slotKey(s.blockId, s.index) === st.homeStandKey,
    );
    if (!stand) return;
    if (stand.owner === "neutral") {
      // Don't instantly refill — wait full respawn even if another Ordner still alive
      stand.stewardCd = Math.max(stand.stewardCd, NEUTRAL_STEWARD_RESPAWN);
    }
  }

  /**
   * Grey fans stay permanently grey at their starting count —
   * no conversion, no refill, no capture rings.
   */
  private tickNeutralCapture(dt: number): void {
    void dt;
    for (const f of this.fans) {
      if (f.team !== "neutral" || f.isSteward) continue;
      f.lean = 0;
      f.captureProg = 0;
    }
  }

  /**
   * Fans never flee / Abwanderung — they stay for Stimmung.
   * Kept as a no-op hook so call sites remain stable.
   */
  private tickFamilyFlight(_dt: number): void {
    void _dt;
  }

  /**
   * Momentum = people in own home block only (kind weight × level).
   * No buildings, no goal bumps. Mood HUD tracks the same power.
   * Goal celebration sends people to Bier → they leave the block briefly.
   */
  private blockPower(team: TeamId): number {
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    let power = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward || f.team !== team) continue;
      // Only seated / returning-in-block counts — gang & stand visits drop out
      if (f.state !== "block" || f.blockId !== home) continue;
      power +=
        MOMENTUM_WEIGHT[f.kind] * unitLevelMul(f.level || 1);
    }
    return power;
  }

  private tickJubelMomentum(dt: number): void {
    if (this.goalLockT > 0) {
      this.goalLockT = Math.max(0, this.goalLockT - dt);
    }
    const pHeim = this.blockPower(this.playerTeam);
    const pGast = this.blockPower(this.aiTeam);
    const rel = (pHeim - pGast) / (pHeim + pGast + MOMENTUM_EPS);
    let targetMom = clamp(rel, -1, 1);
    // After a goal, scorers are at Bier — damp snap-back while lock lasts
    if (this.goalLockT > 0) {
      targetMom *= this.blitz ? 0.2 : 0.45;
    }
    const approachMul = this.blitz ? 0.65 : 1;
    const approach = 1 - Math.exp(-MOMENTUM_APPROACH * approachMul * dt);
    this.momentum = clamp(
      this.momentum + (targetMom - this.momentum) * approach,
      -1,
      1,
    );

    // Tor when the indicator is fully in the enemy area
    const edge = this.blitz ? BLITZ_GOAL_MOMENTUM_EDGE : GOAL_MOMENTUM_EDGE;
    if (this.goalLockT <= 0) {
      if (this.momentum >= edge) {
        this.scoreGoal(this.playerTeam);
      } else if (this.momentum <= -edge) {
        this.scoreGoal(this.aiTeam);
      }
    }

    // Football overlay follows the split
    const ch = this.goalChance();
    const dP = ch.pHeim - this.prevTorPHeim;
    this.torBallAngle += dP * 14 + this.momentum * dt * 1.8;
    this.prevTorPHeim = ch.pHeim;

    // Mood display mirrors block power (not shops / not goals)
    const targetHeim = clamp(0.35 + pHeim * MOOD_FROM_POWER, 0, 3);
    const targetGast = clamp(0.35 + pGast * MOOD_FROM_POWER, 0, 3);
    const moodApproach = 1 - Math.exp(-0.55 * dt);
    const prevHeim = this.moodHeim;
    const prevGast = this.moodGaeste;
    this.moodHeim = clamp(
      this.moodHeim + (targetHeim - this.moodHeim) * moodApproach,
      0,
      3,
    );
    this.moodGaeste = clamp(
      this.moodGaeste + (targetGast - this.moodGaeste) * moodApproach,
      0,
      3,
    );
    this.maybeMoodFloat(HEIM_BLOCK, this.moodHeim - prevHeim);
    this.maybeMoodFloat(GAST_BLOCK, this.moodGaeste - prevGast);
  }

  /** Freigestellte Mood +/− when Stimmung moves enough (throttled). */
  private maybeMoodFloat(blockId: number, delta: number): void {
    const key = blockId === HEIM_BLOCK ? "heim" : "gast";
    if (this.moodFloatCd[key] > 0) return;
    if (Math.abs(delta) < 0.012) return;
    this.moodFloatCd[key] = 1.8;
    const good = delta > 0;
    this.moodFx.push({
      kind: good ? "moodPlus" : "moodMinus",
      x: blockCenterX(blockId) + (Math.random() - 0.5) * 0.04,
      y: blockTopY(blockId) + 0.1,
      vx: (Math.random() - 0.5) * 0.02,
      vy: -0.04 - Math.random() * 0.02,
      color: good ? "#6bcb77" : "#f87171",
      t: 0,
      life: 1.0,
      size: 0.022,
    });
  }

  private tickBlockStorm(dt: number): void {
    const pN = this.countBlockInvaders(this.playerTeam, GAST_BLOCK);
    const aN = this.countBlockInvaders(this.aiTeam, HEIM_BLOCK);

    const need = this.stormNeed();
    // Player occupation of Gästeblock takes priority if both somehow qualify
    if (pN >= need) {
      this.advanceStormBanner(this.playerTeam, GAST_BLOCK, dt);
      this.stormAccPlayer = this.stormBanner?.holdT ?? 0;
      this.stormAccAi = 0;
      return;
    }
    if (aN >= need) {
      this.advanceStormBanner(this.aiTeam, HEIM_BLOCK, dt);
      this.stormAccAi = this.stormBanner?.holdT ?? 0;
      this.stormAccPlayer = 0;
      return;
    }

    // Occupation broken — banner down, timer reset
    if (this.stormBanner) {
      this.pushTicker("Blocksturm abgebrochen", "combat", 2.8);
    }
    this.stormBanner = null;
    this.stormAccPlayer = 0;
    this.stormAccAi = 0;
  }

  /**
   * Raise / hold the occupation banner. Win only after BLOCK_STORM_SEC
   * of continuous banner visibility while the block stays occupied.
   */
  private advanceStormBanner(
    team: TeamId,
    blockId: number,
    dt: number,
  ): void {
    if (
      !this.stormBanner ||
      this.stormBanner.team !== team ||
      this.stormBanner.blockId !== blockId
    ) {
      this.stormBanner = { team, blockId, holdT: 0 };
      this.stormFxCd = 0;
      sfx("storm");
      this.pushTicker(
        `Hier regiert der ${teamLabel(team)}!`,
        "combat",
        4.5,
      );
      this.burstStormSpectacle(team, blockId, true);
    }

    this.stormBanner.holdT += dt;
    this.pulseStormHolders(team, blockId);
    this.stormFxCd -= dt;
    if (this.stormFxCd <= 0) {
      this.stormFxCd = 0.22;
      this.burstStormSpectacle(team, blockId, false);
    }

    if (this.stormBanner.holdT >= this.stormHoldSec()) {
      // Re-check occupation at win moment
      const still =
        this.countBlockInvaders(team, blockId) >= this.stormNeed();
      if (!still) {
        this.stormBanner = null;
        return;
      }
      this.blockOwner[blockId] = team;
      const label = teamLabel(team);
      this.startHighlight("storm", team);
      playClubChant(team === this.playerTeam ? "player" : "ai", 1);
      this.flash(
        `Blocksturm! ${label}`,
        team === this.playerTeam ? "storm" : "danger",
        3.2,
      );
      if (team === this.playerTeam) this.markGuided("goal");
      this.finish(
        team,
        "invade",
        `Hier regiert der ${label}! Blocksturm gewonnen`,
      );
    }
  }

  /** Occupying fans hoist the banner — arms up, pyro props, cheer. */
  private pulseStormHolders(team: TeamId, blockId: number): void {
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward || f.team !== team) continue;
      if (f.blockId !== blockId) continue;
      if (!(f.invading || f.state === "block" || f.state === "stand")) continue;
      f.cheerT = Math.max(f.cheerT, 1.2);
      f.armSwing = Math.max(f.armSwing, 0.85);
      if (f.kind === "ultras" || f.kind === "hooligans") {
        f.throwT = Math.max(f.throwT, 0.9);
      }
    }
  }

  /**
   * Blocksturm FX scaled like Torjubel: Ultras → Rauch/Pyro, Hools → Bier/Raketen,
   * Fans → Konfetti. Banner always shows; FX amount follows units in the block.
   */
  private burstStormSpectacle(
    team: TeamId,
    blockId: number,
    opening: boolean,
  ): void {
    const club = clubFxColor(team);
    const white = "#f8fafc";
    const holders = this.fans.filter(
      (f) =>
        f.hp > 0 &&
        !f.isSteward &&
        f.team === team &&
        f.blockId === blockId &&
        (f.invading || f.state === "block" || f.state === "stand"),
    );
    const ultras = holders.filter((f) => f.kind === "ultras");
    const hools = holders.filter((f) => f.kind === "hooligans");
    const fans = holders.filter((f) => f.kind === "normalos");

    // Per-unit bursts (Torjubel schema), lighter on pulse ticks
    const take = <T>(arr: T[], n: number) =>
      arr.filter((_, i) => opening || i % Math.max(1, Math.ceil(arr.length / n)) === 0);

    for (const f of take(fans, opening ? fans.length : 2)) {
      this.burstFanConfetti(f, white);
      this.burstFanConfetti(f, club);
    }
    for (const f of take(ultras, opening ? ultras.length : 2)) {
      f.throwT = Math.max(f.throwT, opening ? 3.2 : 1.2);
      f.armSwing = 1;
      this.burstUltraSmoke(f, club);
      if (opening) this.burstUltraSmoke(f, white);
    }
    let hoolI = 0;
    for (const f of take(hools, opening ? hools.length : 2)) {
      if (hoolI++ % 2 === 0) this.burstBeerMug(f);
      else this.burstFireworkRocket(f, club);
    }

    // Small in-block rain only (never full-pitch)
    if (holders.length && (opening || ultras.length + hools.length > 0)) {
      const r = blockCrowdRect(blockId);
      const n = opening
        ? 6 + Math.min(8, ultras.length + hools.length)
        : 2 + Math.min(3, ultras.length + hools.length);
      for (let i = 0; i < n; i++) {
        this.confetti.push({
          x: r.left + Math.random() * r.width,
          y: r.top + Math.random() * r.height * 0.5,
          vx: (Math.random() - 0.5) * 0.12,
          vy: 0.02 + Math.random() * 0.08,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 8,
          color: i % 2 === 0 ? white : club,
          t: 0,
          life: 1.1 + Math.random() * 0.7,
          blockId,
        });
      }
    }
  }

  /** Goals are threshold-based in tickJubelMomentum — kept as tick hook. */
  private tickMatch(dt: number): void {
    void dt;
  }

  /**
   * HUD bar: stretch so GOAL_MOMENTUM_EDGE reads as fully in the enemy half.
   * Goals fire on that threshold (not random rolls).
   */
  goalChance(): { pTor: number; pHeim: number; pGast: number; momentum: number } {
    const M = this.momentum;
    const edge = this.blitz ? BLITZ_GOAL_MOMENTUM_EDGE : GOAL_MOMENTUM_EDGE;
    const visual = clamp(M / edge, -1, 1);
    const pHeim = clamp(0.5 + 0.5 * visual, 0.02, 0.98);
    const nearEdge = Math.abs(M) >= edge * 0.92;
    const pTor = nearEdge
      ? 1
      : clamp(
          GOAL_P_TOR_BASE + GOAL_P_TOR_MOMENTUM * Math.abs(M),
          GOAL_P_TOR_MIN,
          GOAL_P_TOR_MAX,
        );
    return { pTor, pHeim, pGast: 1 - pHeim, momentum: M };
  }

  private scoreGoal(team: TeamId): void {
    if (team === "ksc") this.scoreKsc++;
    else this.scoreVfb++;
    // Reset bar to mid — Glücksbiergang starts only after in-block party ends
    this.momentum = 0;
    this.goalLockT = this.blitz ? BLITZ_GOAL_LOCK_SEC : GOAL_LOCK_SEC;
    this.lastGoalTeam = team;
    this.scorePulse = this.blitz ? 1.1 : 2.6;
    this.spawnGoalConfetti(team);
    this.startGoalCelebration(team);
    this.goalPartyTeam = team;
    this.goalPartyT = this.blitz ? 2.2 : 11.5;
    sfx("goal");
    sfx("cheer");
    playClubChant(team === this.playerTeam ? "player" : "ai", 0.9);
    this.startHighlight("goal", team);
    const line = `TOR ${teamLabel(team)}! ${this.scoreKsc}:${this.scoreVfb}`;
    this.toast(line, this.blitz ? 2.5 : 10);
    this.uiFlash = {
      text: line,
      tone: team === this.playerTeam ? "goal" : "danger",
      t: this.blitz ? 1.1 : 2.8,
    };
    this.markGuided("goal");
  }

  private flash(text: string, tone: UiFlashTone, t = 2.4): void {
    this.uiFlash = { text, tone, t };
  }

  /** Count player-owned production buildings (for badges) */
  countPlayerBuildings(): number {
    const team = this.pvp ? this.localTeam : this.playerTeam;
    return this.slots.filter(
      (s) => s.owner === team && !!s.building && !s.greyNeutral,
    ).length;
  }

  markGuided(key: string): void {
    if (!this.cfg.guided) return;
    if (this.guidedDone.has(key)) return;
    this.guidedDone.add(key);
    const labels: Record<string, string> = {
      build: "✓ Gebäude gebaut",
      fans: "✓ Person geholt",
      send: "✓ In den Gang gesendet",
      goal: "✓ Tor / Sturm-Moment",
    };
    const text = labels[key];
    if (text) this.flash(text, "ok", 2.2);
  }

  private startHighlight(kind: HighlightState["kind"], team: TeamId): void {
    // Blitz: skip cinematic replay entirely (no slow-mo, no freeze)
    if (this.blitz) {
      this.highlight = null;
      return;
    }
    const dur = HIGHLIGHT_DUR[kind];
    this.highlight = { kind, team, t: dur, dur };
  }

  private tickHighlight(dt: number): void {
    if (!this.highlight) return;
    this.highlight.t -= dt;
    if (this.highlight.t <= 0) this.highlight = null;
  }

  /** Ultras in home block → choreo tier; both sides can fire. */
  private tickChoreo(dt: number): void {
    if (this.choreoCdPlayer > 0)
      this.choreoCdPlayer = Math.max(0, this.choreoCdPlayer - dt);
    if (this.choreoCdAi > 0)
      this.choreoCdAi = Math.max(0, this.choreoCdAi - dt);

    if (this.choreo) {
      this.choreo.t -= dt;
      const sign = this.choreo.team === this.playerTeam ? 1 : -1;
      const push = CHOREO_MOMENTUM[this.choreo.tier] * dt * 0.85;
      this.momentum = clamp(this.momentum + sign * push, -1, 1);
      // Keep ultras animated
      for (const f of this.fans) {
        if (
          f.hp > 0 &&
          f.team === this.choreo.team &&
          f.kind === "ultras" &&
          f.state === "block"
        ) {
          if (f.armSwing < 0.5) f.armSwing = 0.75 + Math.random() * 0.2;
        }
      }
      if (this.choreo.t <= 0) {
        const ended = this.choreo;
        this.choreo = null;
        if (ended.team === this.playerTeam)
          this.choreoCdPlayer = CHOREO_COOLDOWN[ended.tier];
        else this.choreoCdAi = CHOREO_COOLDOWN[ended.tier];
      }
      return;
    }

    this.tryStartChoreo(this.playerTeam, this.choreoCdPlayer === 0);
    if (!this.choreo) this.tryStartChoreo(this.aiTeam, this.choreoCdAi === 0);
  }

  private tryStartChoreo(team: TeamId, ready: boolean): void {
    if (!ready || this.choreo) return;
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const n = this.countInBlock(team, home, "ultras");
    const tier = choreoTierFromUltras(n);
    if (!tier) return;
    // AI: only fire when tier ≥ mittel, and randomly
    if (team === this.aiTeam) {
      if (tier === "klein") return;
      if (Math.random() > 0.35) return;
    }
    const dur = CHOREO_DURATION[tier];
    this.choreo = { team, tier, t: dur, dur };
    sfx("cheer");
    playClubChant(team === this.playerTeam ? "player" : "ai", 0.55);
    this.toast(`${CHOREO_LABEL[tier]}! (${n} Ultras)`, 3.2);
    this.pushTicker(`${CHOREO_LABEL[tier]} · ${n} Ultras`, "crowd", 3.5);
  }

  /** Current choreo tier available for the player (for HUD) */
  playerChoreoTier(): ChoreoTier | null {
    const n = this.countInBlock(this.playerTeam, HEIM_BLOCK, "ultras");
    return choreoTierFromUltras(n);
  }

  applyHalfBoost(id: HalfBoostId): void {
    if (!this.halfTimePending) return;
    this.halfBoost = id;
    this.halfTimePending = false;
    if (id === "gold") {
      this.gold += 45;
      this.toast("Sponsorenschub: +45€");
    } else if (id === "mood") {
      this.moodHeim = clamp(this.moodHeim + 0.35, 0.4, 2.2);
      this.toast("12. Mann: Kurve boosten!");
    } else if (id === "vorrat") {
      this.currency.beer += 18;
      this.currency.merch += 18;
      this.toast("Nachschub: +18 Bier & Fanartikel");
    } else if (id === "sicherheit") {
      this.currency.security += 25;
      this.toast("Ordner-Einsatz: +25 Sicherheit");
    } else if (id === "choreo") {
      this.choreoCdPlayer = 0;
      this.toast("Doppelhalter bereit — nächste Choreo freigegeben");
    }
    sfx("ui");
    playClubChant("player", 0.4);
  }

  /** Keep celebrating in-block; when the timer ends → Glücksbiergang. */
  private tickGoalParty(dt: number): void {
    if (this.goalPartyT <= 0 || !this.goalPartyTeam) return;
    this.goalPartyT = Math.max(0, this.goalPartyT - dt);
    if (this.goalPartyT > 0) return;
    const team = this.goalPartyTeam;
    this.goalPartyTeam = null;
    this.startGluecksBiergang(team);
  }

  /** After Torjubel: scorers leave for a celebratory Bierstand trip. */
  private startGluecksBiergang(team: TeamId): void {
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    let n = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward || f.team !== team) continue;
      if (f.blockId !== home) continue;
      if (f.state !== "block" && f.state !== "stand") continue;
      if (!canVisit(f.kind, "beer")) continue;
      f.cheerT = 0;
      f.satisfiedUntil = 0;
      const stand =
        this.pickOwnVisitStand(team, home, "bier") ??
        this.pickHostileBeerBehindBanner(team, home);
      if (!stand) continue;
      const wait = this.standWaitPos(stand, f.id);
      this.startPath(f, this.pathViaDoors(f, stand.blockId, wait), "stand");
      f.standKey = slotKey(stand.blockId, stand.index);
      f._wanderTx = wait.x;
      f._wanderTy = wait.y;
      n++;
    }
    if (n > 0) {
      sfx("beer");
      this.pushTicker("Glücksbiergang — die Kurve trinkt!", "crowd", 4.2);
      this.toast("Glücksbiergang!", 3.5, "crowd");
    }
  }

  /**
   * Tor-Jubel im eigenen Block (vereinbartes Schema, länger + intensiver):
   * Fans → Konfetti weiß/Vereinsfarbe 50/50 · Ultras → Rauch + Pyro in der Hand ·
   * Hooligans → Bierkrug 50% / Feuerwerksrakete 50%.
   */
  private startGoalCelebration(team: TeamId): void {
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const white = "#f8fafc";
    const club = clubFxColor(team);
    let fanI = 0;
    let ultraI = 0;
    let hoolI = 0;
    let n = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward || f.team !== team) continue;
      if (f.blockId !== home) continue;
      if (f.state !== "block" && f.state !== "stand") continue;
      f.cheerT = 11.5; // deutlich längerer Jubel
      n++;
      if (f.kind === "normalos") {
        const col = fanI++ % 2 === 0 ? white : club;
        this.burstFanConfetti(f, col);
        this.burstFanConfetti(f, col === white ? club : white);
      } else if (f.kind === "ultras") {
        const col = ultraI++ % 2 === 0 ? white : club;
        // Raise pyro prop in hand while smoke show plays
        f.throwT = Math.max(f.throwT, 4.2);
        f.armSwing = 1;
        this.burstUltraSmoke(f, col);
        this.burstUltraSmoke(f, col === white ? club : white);
      } else if (f.kind === "hooligans") {
        if (hoolI++ % 2 === 0) this.burstBeerMug(f);
        else this.burstFireworkRocket(f, club);
      }
    }
    this.floatAt(blockCenterX(home), blockTopY(home) + 0.06, "TOR-JUBEL!", true);
    this.floatAt(blockCenterX(home), blockTopY(home) + 0.11, "TOR!", true);
    this.toast(n > 0 ? "Kurve feiert!" : "TOR!", 10);
  }

  private burstFanConfetti(f: FanUnit, color: string): void {
    for (let i = 0; i < 10; i++) {
      this.confetti.push({
        x: f.x + (Math.random() - 0.5) * 0.04,
        y: f.y - 0.02 - Math.random() * 0.03,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.03 + Math.random() * 0.1,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 10,
        color,
        t: 0,
        life: 1.2 + Math.random() * 0.8,
        blockId: f.blockId,
      });
    }
  }

  private burstUltraSmoke(f: FanUnit, color: string): void {
    for (let i = 0; i < 8; i++) {
      this.moodFx.push({
        kind: "smoke",
        x: f.x + (Math.random() - 0.5) * 0.04,
        y: f.y - 0.02,
        vx: (Math.random() - 0.5) * 0.055,
        vy: -0.07 - Math.random() * 0.07,
        color,
        t: 0,
        life: 1.9 + Math.random() * 0.9,
        size: 0.034 + Math.random() * 0.028,
      });
    }
  }

  private burstBeerMug(f: FanUnit): void {
    f.throwT = Math.max(f.throwT, 0.85);
    f.armSwing = 1;
    this.moodFx.push({
      kind: "mug",
      x: f.x,
      y: f.y - 0.02,
      vx: (Math.random() - 0.5) * 0.14,
      vy: -0.16 - Math.random() * 0.1,
      color: "#b45309",
      t: 0,
      life: 1.45,
      size: 0.022,
    });
  }

  private burstFireworkRocket(f: FanUnit, club: string): void {
    f.throwT = Math.max(f.throwT, 0.95);
    f.armSwing = 1;
    this.moodFx.push({
      kind: "rocket",
      x: f.x,
      y: f.y - 0.02,
      vx: (Math.random() - 0.5) * 0.08,
      vy: -0.34 - Math.random() * 0.14,
      color: club,
      t: 0,
      life: 1.7,
      size: 0.02,
    });
    // Spark trail
    for (let i = 0; i < 7; i++) {
      this.moodFx.push({
        kind: "spark",
        x: f.x + (Math.random() - 0.5) * 0.025,
        y: f.y - 0.01,
        vx: (Math.random() - 0.5) * 0.07,
        vy: -0.12 - Math.random() * 0.1,
        color: Math.random() < 0.5 ? "#fde68a" : club,
        t: 0,
        life: 0.9 + Math.random() * 0.5,
        size: 0.01,
      });
    }
  }

  private spawnGoalConfetti(team: TeamId): void {
    const blockId = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const r = blockCrowdRect(blockId);
    const white = "#f8fafc";
    const club = clubFxColor(team);
    for (let i = 0; i < 22; i++) {
      this.confetti.push({
        x: r.left + Math.random() * r.width,
        y: r.top + Math.random() * r.height * 0.55,
        vx: (Math.random() - 0.5) * 0.12,
        vy: 0.02 + Math.random() * 0.1,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 8,
        color: i % 2 === 0 ? white : club,
        t: 0,
        life: 1.4 + Math.random() * 0.8,
        blockId,
      });
    }
  }

  private tickConfetti(dt: number): void {
    for (const c of this.confetti) {
      c.t += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 0.22 * dt;
      c.rot += c.vr * dt;
      if (c.blockId != null) {
        const r = blockCrowdRect(c.blockId);
        c.x = clamp(c.x, r.left, r.left + r.width);
        c.y = clamp(c.y, r.top, r.top + r.height);
        if (c.x <= r.left || c.x >= r.left + r.width) c.vx *= -0.4;
        if (c.y >= r.top + r.height) {
          c.vy *= -0.25;
          c.y = r.top + r.height;
        }
      }
    }
    this.confetti = this.confetti.filter((c) => c.t < c.life);
  }

  private tickMoodFx(dt: number): void {
    for (const p of this.moodFx) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "smoke") {
        p.vy -= 0.02 * dt;
        p.size += 0.012 * dt;
      } else if (p.kind === "flame") {
        p.vy -= 0.04 * dt;
        p.vx *= 1 - dt * 0.25;
        p.size *= 1 - dt * 0.35;
      } else if (p.kind === "rubble") {
        p.vy += 0.32 * dt;
        p.vx *= 1 - dt * 0.15;
      } else if (p.kind === "flare" || p.kind === "rocket") {
        p.vy -= 0.05 * dt;
        p.vx *= 1 - dt * 0.12;
      } else if (p.kind === "mug") {
        p.vy += 0.28 * dt; // arc down after throw
        p.vx *= 1 - dt * 0.08;
      }
    }
    this.moodFx = this.moodFx.filter((p) => p.t < p.life);
  }

  /** True when player block-power / momentum clearly ahead — AI should fight back */
  private aiTrailingCrowd(): boolean {
    const p = this.blockPower(this.playerTeam);
    const a = this.blockPower(this.aiTeam);
    return this.momentum > 0.18 || p > a + 1.2;
  }

  /** Minute-based course multiplier for Mittel/Schwer ramps. */
  private aiPhase(): {
    regenBonus: number;
    actionBonus: number;
    gangBonus: number;
  } {
    const p = this.diffProf;
    const m = this.minute;
    if (m >= p.lateMinute) {
      return {
        regenBonus: p.lateRegenBonus,
        actionBonus: p.lateActionBonus,
        gangBonus: p.lateGangBonus,
      };
    }
    if (m >= p.midMinute) {
      return {
        regenBonus: p.midRegenBonus,
        actionBonus: p.midActionBonus,
        gangBonus: p.midGangBonus,
      };
    }
    return { regenBonus: 0, actionBonus: 0, gangBonus: 0 };
  }

  private tickAi(dt: number): void {
    this.aiAcc += dt;
    const diff = this.cfg.settings.difficulty;
    const pers = personalityMods(this.cfg.settings.behavior);
    const trailing = this.aiTrailingCrowd();
    const phase = this.aiPhase();
    const regen =
      AI_SOFT_REGEN *
      (this.diffProf.regenMul + phase.regenBonus) *
      (trailing ? 1.25 : 1);
    // Soft regen of AI send/buy resources
    this.aiMerch = Math.min(120, this.aiMerch + dt * regen);
    this.aiBeer = Math.min(120, this.aiBeer + dt * regen);
    this.aiSecurity = Math.min(120, this.aiSecurity + dt * regen * 0.85);

    const interval =
      (trailing ? 5.2 : 7) / (diffMul(diff) * pers.tickMul);

    if (this.aiAcc < interval) return;
    this.aiAcc = 0;
    // Character: patient/beer build more often; aggro skips builds more
    // Aggressive plot fill + building upgrades (all diffs → volle Plots / Lv5)
    if (Math.random() < 0.72 * pers.buildMul) this.aiTryBuild();
    this.aiTryUpgradeBuildings();
    this.aiTryHireSteward();
    this.aiTryBuyFans();
    this.aiTryUpgradeUnits();
    const act =
      (aiActionMul(diff) + phase.actionBonus) *
      this.diffProf.sendChanceMul *
      pers.sendMul *
      (trailing ? 1.35 : 1);
    const hools = this.fans.filter(
      (f) =>
        f.team === this.aiTeam &&
        f.kind === "hooligans" &&
        f.hp > 0 &&
        f.state === "block" &&
        f.blockId === GAST_BLOCK,
    );
    const ultras = this.fans.filter(
      (f) =>
        f.team === this.aiTeam &&
        f.kind === "ultras" &&
        f.hp > 0 &&
        f.state === "block" &&
        f.blockId === GAST_BLOCK,
    );
    const onGang = this.fans.filter(
      (f) => f.team === this.aiTeam && f.state === "gang" && f.hp > 0 && !f.isSteward,
    ).length;
    let want = this.diffProf.gangWant + phase.gangBonus + pers.earlyWant;
    if (trailing) want += 1;
    want = Math.max(1, want);
    const hoolChance =
      (trailing ? 0.62 : 0.45) * act * pers.hoolBias;
    const ultraChance =
      (trailing ? 0.5 : 0.35) * act * pers.ultraBias;
    // beer character prefers hools; aggro/earlywin prefer ultras when both ready
    const preferHool =
      pers.hoolBias >= pers.ultraBias || this.cfg.settings.behavior === "beer";
    if (
      preferHool &&
      hools.length &&
      onGang < want &&
      this.aiBeer >= HOOLIGAN_ORDER_BEER &&
      Math.random() < hoolChance
    ) {
      this.aiBeer -= HOOLIGAN_ORDER_BEER;
      hools[0]!.rangedPyro = false;
      this.sendToGang(hools[0]!);
    } else if (
      ultras.length &&
      onGang < want &&
      this.aiMerch >= PYRO_FIGHT_MERCH &&
      Math.random() < ultraChance
    ) {
      this.aiMerch -= PYRO_FIGHT_MERCH;
      const u = ultras[0]!;
      u.rangedPyro = true;
      this.applyUnitLevelStats(u);
      this.sendToGang(u);
    } else if (
      !preferHool &&
      hools.length &&
      onGang < want &&
      this.aiBeer >= HOOLIGAN_ORDER_BEER &&
      Math.random() < hoolChance * 0.85
    ) {
      this.aiBeer -= HOOLIGAN_ORDER_BEER;
      hools[0]!.rangedPyro = false;
      this.sendToGang(hools[0]!);
    }
  }

  /**
   * KI-Unit-Upgrade: wie Spieler-Tech — Stufe fürs Kind + alle lebenden
   * Einheiten dieses Typs (vorher nur 1 Unit → KI blieb Lv1-lastig).
   */
  private aiTryUpgradeUnits(): void {
    if (this.aiGold < 22) return;
    const trailing = this.aiTrailingCrowd();
    const phaseBoost =
      this.minute >= this.diffProf.lateMinute
        ? 0.28
        : this.minute >= this.diffProf.midMinute
          ? 0.16
          : 0;
    const chance = (trailing ? 0.8 : 0.58) + phaseBoost;
    if (Math.random() > chance) return;
    // When behind on Kurve, prioritize combat upgrades over Fans
    const kinds: (FanKind | "ordner")[] = trailing
      ? ["hooligans", "ultras", "ordner", "normalos"]
      : ["ultras", "hooligans", "normalos", "ordner"];
    const softCap = this.aiTechSoftCap();
    for (const kind of kinds) {
      const living = this.lowestLevelUnit(kind, this.aiTeam);
      if (!living) continue;
      const tech = this.aiUnitTechLevel(kind);
      if (tech >= softCap || tech >= UPGRADE_MAX) continue;
      const next = tech + 1;
      // Same gate as player: matching building must already be ≥ Ziellevel
      if (this.unitUpgradeBuildingCap(kind, this.aiTeam) < next) continue;
      const cost = unitUpgradeCost(tech);
      if (cost == null || this.aiGold < cost) continue;
      this.aiGold -= cost;
      this.aiTech[kind] = next;
      for (const f of this.fans) {
        if (f.hp <= 0 || f.team !== this.aiTeam) continue;
        if (kind === "ordner") {
          if (!f.isSteward) continue;
        } else if (f.isSteward || f.kind !== kind) continue;
        if ((f.level || 1) < next) {
          f.level = next;
          this.applyUnitLevelStats(f);
        }
      }
      return;
    }
  }

  /** Push owned buildings toward Lv5 so unit tech can follow. */
  private aiTryUpgradeBuildings(): void {
    if (this.aiGold < 40) return;
    const phase =
      this.minute >= this.diffProf.lateMinute
        ? 0.85
        : this.minute >= this.diffProf.midMinute
          ? 0.7
          : 0.45;
    if (Math.random() > phase) return;
    const ups = this.slots
      .filter(
        (x) =>
          x.owner === this.aiTeam &&
          x.building &&
          !x.greyNeutral &&
          x.level < UPGRADE_MAX &&
          (x.building !== "ordner" || (x.structHp ?? 1) > 0),
      )
      .sort((a, b) => (a.level || 1) - (b.level || 1));
    for (const up of ups) {
      const cost = UPGRADE_COST[(up.level || 1) + 1] ?? 999;
      if (this.aiGold < cost) continue;
      this.aiGold -= cost;
      const kind = up.building!;
      const nextLv = Math.min(UPGRADE_MAX, (up.level || 1) + 1);
      const targets = this.blitz
        ? this.slots.filter(
            (x) =>
              x.building === kind &&
              x.owner === this.aiTeam &&
              !x.greyNeutral &&
              (kind !== "ordner" || (x.structHp ?? 1) > 0),
          )
        : [up];
      for (const slot of targets) {
        slot.level = nextLv;
        if (kind === "ordner") this.initOrdnerPostHp(slot);
      }
      return;
    }
  }

  /** Mirror player fan buys into Gästebox with AI wallets */
  private aiTryBuyFans(): void {
    const diff = this.cfg.settings.difficulty;
    const phase = this.aiPhase();
    const act = aiActionMul(diff) + phase.actionBonus;
    const trailing = this.aiTrailingCrowd();
    if (Math.random() > (trailing ? 0.7 : 0.55) * act) return;
    const own = this.countTeamFans(this.aiTeam);
    const combat = own.normalos + own.ultras + own.hooligans;
    if (this.blitz && combat >= BLITZ_COMBAT_FAN_CAP) return;
    const target = Math.min(
      this.blitz ? BLITZ_COMBAT_FAN_CAP : 999,
      this.diffProf.fanTarget +
        (this.minute >= this.diffProf.lateMinute
          ? 2
          : this.minute >= this.diffProf.midMinute
            ? 1
            : 0),
    );
    if (combat >= target) return;

    const seat = this.freeSeat(GAST_BLOCK);
    if (seat == null) return;
    const options: FanKind[] = [];
    if (this.aiSecurity >= BUY_COST.normalos.security) options.push("normalos");
    if (this.aiMerch >= BUY_COST.ultras.merch) options.push("ultras");
    if (this.aiBeer >= BUY_COST.hooligans.beer) options.push("hooligans");
    if (!options.length) return;
    const pers = personalityMods(this.cfg.settings.behavior);
    // Prefer short counts; personality + trailing bias Ultras/Hools/Fans
    options.sort((a, b) => {
      const rank = (k: FanKind) => {
        if (k === "hooligans") return -pers.hoolBias;
        if (k === "ultras") return -pers.ultraBias;
        return -pers.fanBias;
      };
      if (trailing) {
        const combat = (k: FanKind) =>
          k === "hooligans" ? 0 : k === "ultras" ? 1 : 2;
        const d = combat(a) - combat(b);
        if (d !== 0) return d;
      }
      const rd = rank(a) - rank(b);
      if (rd !== 0) return rd;
      return own[a] - own[b];
    });
    const kind = options[0];
    const c = BUY_COST[kind];
    if (kind === "normalos") this.aiSecurity -= c.security;
    else if (kind === "ultras") this.aiMerch -= c.merch;
    else this.aiBeer -= c.beer;
    this.fans.push(this.makeFan(kind, this.aiTeam, GAST_BLOCK, seat));
  }

  /** AI: spend gold to hire Ordner at own posts (same rules as player) */
  private aiTryHireSteward(): void {
    const posts = this.slots.filter(
      (s) =>
        s.building === "ordner" &&
        s.owner === this.aiTeam &&
        !s.greyNeutral,
    );
    for (const s of posts) {
      if (this.stewardCountAt(s) >= STEWARD_CAP) continue;
      if (this.aiGold < STEWARD_HIRE_GOLD) return;
      this.aiGold -= STEWARD_HIRE_GOLD;
      this.fans.push(this.makeSteward(this.aiTeam, s));
      this.floatAtSlot(s, "KI Ordner", false);
      return;
    }
  }

  private aiTryBuild(): void {
    const kinds: BuildingKind[] = ["bier", "ordner", "fanshop"];
    const kind = kinds[this.aiBuildRot % kinds.length];
    this.aiBuildRot++;
    // Only plots the AI front line has already claimed (by X) — never left early.
    // Ordnerposts are never soft-claimed (must be destroyed first).
    const candidates = this.slots
      .filter(
        (x) =>
          this.inAiTerritory(x.blockId, x.index) &&
          (!x.building ||
            (x.building !== "ordner" &&
              (x.owner === "neutral" || x.greyNeutral) &&
              !!x.building)),
      )
      .sort((a, b) => plotGangX(b.blockId, b.index) - plotGangX(a.blockId, a.index));
    const empty = candidates.find((x) => !x.building);
    const claimable = candidates.find(
      (x) =>
        x.building &&
        x.building !== "ordner" &&
        (x.owner === "neutral" || x.greyNeutral),
    );
    const s = empty ?? claimable;
    if (!s) {
      // No empty plot in reach — push existing buildings toward Lv5
      this.aiTryUpgradeBuildings();
      return;
    }
    const claim = !!(s.building && (s.owner === "neutral" || s.greyNeutral));
    const cost = claim
      ? Math.floor(BUILD_COST[kind] * 0.65)
      : BUILD_COST[kind];
    if (this.aiGold < cost) return;
    this.aiGold -= cost;
    if (!s.building) s.building = kind;
    s.owner = this.aiTeam;
    s.greyNeutral = false;
    if (!s.level) s.level = 1;
    if (s.building === "bier" && s.beer < 20) s.beer = 40;
    if (s.building === "fanshop" && s.merch < 20) s.merch = 40;
    if (s.building === "ordner") {
      s.stewardCd = 9999; // AI hires manually
      this.initOrdnerPostHp(s);
    }
    this.floatAtSlot(s, claim ? "KI Claim" : "KI baut", false);
  }

  private tickPens(dt: number): void {
    this.pensTimer += dt;
    if (this.pensTimer < 1.6) return;
    this.pensTimer = 0;

    const shooter = this.pensNext;
    const momBias = shooter === "ksc" ? this.momentum : -this.momentum;
    const scored = Math.random() < 0.72 + momBias * 0.1;
    if (scored) this.scoreGoal(shooter);
    if (shooter === "ksc") this.pensKicksKsc++;
    else this.pensKicksVfb++;

    // Keep paired record for UI: complete a pair when both have kicked once this round
    const pairIdx = Math.min(this.pensKicksKsc, this.pensKicksVfb) - 1;
    if (pairIdx >= 0) {
      while (this.pens.length <= pairIdx) {
        this.pens.push({ ksc: null, vfb: null });
      }
    }
    const open = this.pens.find((p) => p[shooter] === null);
    if (open) open[shooter] = scored;
    else this.pens.push(shooter === "ksc" ? { ksc: scored, vfb: null } : { ksc: null, vfb: scored });

    this.pensRound = this.pensKicksKsc + this.pensKicksVfb;
    this.toast(
      `Elfmeter ${teamLabel(shooter)}: ${scored ? "Tor!" : "gehalten"} · ${this.scoreKsc}:${this.scoreVfb}`,
    );

    this.pensNext = shooter === "ksc" ? "vfb" : "ksc";

    // Decide only when both sides have taken the same number of kicks
    if (this.pensKicksKsc !== this.pensKicksVfb) return;
    if (this.pensKicksKsc < 5) return;
    // After 5 each (or sudden-death pairs): first lead wins — never coin-flip
    if (this.scoreKsc !== this.scoreVfb) this.endByScore();
  }

  private endByScore(): void {
    if (this.scoreKsc === this.scoreVfb) {
      // Never coin-flip: stay in pens / toast and wait for next kick
      if (this.phase === "pens") {
        this.toast("Sudden Death — weiter!");
        return;
      }
      this.phase = "pens";
      this.pensTimer = 0;
      this.pensNext = "ksc";
      this.toast("Elfmeter!");
      return;
    }
    const winner = this.scoreKsc > this.scoreVfb ? "ksc" : "vfb";
    const reason =
      this.phase === "pens" ? "pens" : this.phase === "et" ? "et" : "score";
    this.finish(
      winner,
      reason,
      this.phase === "pens"
        ? `Entscheidung nach Elfmeter ${this.scoreKsc}:${this.scoreVfb}`
        : `Endstand ${this.scoreKsc}:${this.scoreVfb}`,
    );
  }

  private finish(
    winner: TeamId,
    reason: MatchResult["reason"],
    detail: string,
  ): void {
    this.phase = "ended";
    this.result = {
      winner,
      reason,
      score: [this.scoreKsc, this.scoreVfb],
      detail,
      minute: this.minute,
      difficulty: this.cfg.settings.difficulty,
    };
    this.speed = 0;
    if (reason === "invade") sfx("storm");
    sfx(winner === this.playerTeam ? "victory" : "defeat");
    startAmbience("menu");
    this.toast(detail);
  }
}
