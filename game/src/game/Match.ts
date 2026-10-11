import {
  AI_SOFT_REGEN,
  AI_START_GOLD_BONUS,
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
  BUY_COST,
  BANNER_ADVANCE_SPEED,
  BANNER_CATCHUP,
  BANNER_MIN_GAP,
  BANNER_POST_STANDOFF,
  BANNER_RETREAT_SPEED,
  CEMENT_BREAKTHROUGH,
  CEMENT_DOT_PER_SEC,
  CEMENT_SLOW_MUL,
  ET_REAL_SEC,
  FAN_STATS,
  FEVER_FROM_MIN,
  GOAL_P_TOR_BASE,
  GOAL_P_TOR_MAX,
  GOAL_P_TOR_MIN,
  GOAL_P_TOR_MOMENTUM,
  GOAL_ROLL_INTERVAL,
  HIT_CD,
  HIT_DAMAGE,
  HIT_DAMAGE_SCALE,
  HOOLIGAN_ORDER_BEER,
  MELEE_RANGE,
  NEUTRAL_POST_AUTO_LEVEL_CAP,
  NEUTRAL_POST_AUTO_LEVEL_SEC,
  NEUTRAL_POST_GAST_INDEX,
  NEUTRAL_POST_HEIM_INDEX,
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
  type AiDifficulty,
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
} from "./types";
import { clamp, expandMix, slotKey, teamLabel } from "./util";
import {
  BLOCK_COUNT,
  GAST_BLOCK,
  HEIM_BLOCK,
  NEUTRAL_BLOCK,
  blockCenterX,
  blockIdToGangX,
  blockTopY,
  blockWidthNorm,
  blockCrowdRect,
  boothCenter,
  boothRect,
  crowdHomePos,
  doorPos,
  gangHeight,
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
};

export type MatchResult = {
  winner: TeamId;
  reason: "score" | "et" | "pens" | "invade";
  score: [number, number];
  detail: string;
};

let nextId = 1;
function uid(): number {
  return nextId++;
}

function diffMul(d: AiDifficulty): number {
  if (d === "easy") return 0.55;
  if (d === "hard") return 1.1;
  return 0.85;
}

/** Easy sends/buys less often; hard a bit more. */
function aiActionMul(d: AiDifficulty): number {
  if (d === "easy") return 0.55;
  if (d === "hard") return 1.15;
  return 1;
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
  confetti: ConfettiBit[] = [];
  moodFx: MoodParticle[] = [];
  pyroShots: PyroProjectile[] = [];
  /** Last damage FX band per Ordnerpost slotKey: 0 ok · 1 orange · 2 red */
  private postFxBand = new Map<string, 0 | 1 | 2>();
  speed: SpeedMode = 0;
  toasts: { text: string; t: number }[] = [];
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
  aiGold = START_GOLD + AI_START_GOLD_BONUS;
  aiBuildRot = 0;
  /** soft AI combat resources (same start as player; regen still applies) */
  aiMerch = 0;
  aiBeer = 0;
  aiSecurity = START_SECURITY;
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
  /** Blocksturm hold timers */
  stormAccPlayer = 0;
  stormAccAi = 0;
  /** battle line gangX 0..1 (vorderster Ultra) */
  linePlayer = 0;
  lineAi = 1;

  constructor(cfg: MatchConfig) {
    this.cfg = cfg;
    this.playerTeam = cfg.settings.playerTeam;
    this.aiTeam = cfg.settings.playerTeam === "ksc" ? "vfb" : "ksc";
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
        });
      }
    }

    /**
     * CANONICAL neutral mid (all future Matchday versions):
     * - Ordnerposten on the outer plots (Heim-facing + Gast-facing)
     * - Two empty center plots for claim/build after the wall breaks
     * - Never seed Bier/Shop on grey/neutral — only Ordner make sense there
     * - Soft auto-level while contested (see tickNeutralPostAutoLevel)
     */
    for (const index of [NEUTRAL_POST_HEIM_INDEX, NEUTRAL_POST_GAST_INDEX]) {
      this.placeBuilding(NEUTRAL_BLOCK, index, "ordner", true, "neutral");
      const post = this.slots.find(
        (x) => x.blockId === NEUTRAL_BLOCK && x.index === index,
      );
      if (!post) continue;
      post.greyNeutral = false;
      post.owner = "neutral";
      post.level = 1;
      post.stewardCd = NEUTRAL_STEWARD_RESPAWN;
      post.autoLevelAcc = 0;
      const sp = this.stewardPostPos(post);
      const st = this.makeSteward("neutral", post);
      st.state = "gang";
      st.path = [];
      st.pathI = 0;
      this.setAfter(st, "");
      st.x = sp.x;
      st.y = sp.y;
      st.gangX = this.postGangX(post);
      st.patrolDir = index === NEUTRAL_POST_HEIM_INDEX ? 1 : -1;
      this.fans.push(st);
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

    this.toast(`${teamLabel(this.playerTeam)} vs ${teamLabel(this.aiTeam)}`);
    this.speed = 1;
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
      team === this.playerTeam ? this.unitTechLevel(kind) : 1;
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
      team === this.playerTeam ? this.unitTechLevel("ordner") : 1;
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
    this.postFxBand.delete(key);
    this.floatAtSlot(s, "Posten zerstört", false);
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

  toast(text: string, duration = 2.2): void {
    this.toasts.push({ text, t: duration });
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
    if (this.stormAccPlayer > 0) {
      return `BLOCKSTURM ${Math.ceil(BLOCK_STORM_SEC - this.stormAccPlayer)}s · ${pInv}/${BLOCK_STORM_COUNT} Angreifer`;
    }
    if (this.stormAccAi > 0) {
      return `GEGEN-STURM ${Math.ceil(BLOCK_STORM_SEC - this.stormAccAi)}s · ${aInv}/${BLOCK_STORM_COUNT}`;
    }
    if (pInv > 0)
      return `ANGRIFF im Gästeblock · ${pInv} Angreifer — Verteidigung!`;
    if (aInv > 0)
      return `VERTEIDIGUNG · ${aInv} Feind-Angreifer im Heimblock`;
    return null;
  }

  canBuy(kind: FanKind): boolean {
    const c = BUY_COST[kind];
    if (kind === "normalos") return this.currency.security >= c.security;
    if (kind === "ultras") return this.currency.merch >= c.merch;
    return this.currency.beer >= c.beer;
  }

  /** Name the missing currency for buy toasts */
  private missingBuyToast(kind: FanKind): string {
    const c = BUY_COST[kind];
    if (kind === "normalos") {
      const need = Math.ceil(c.security - this.currency.security);
      return `Zu wenig Sicherheit (−${Math.max(1, need)})`;
    }
    if (kind === "ultras") {
      const need = Math.ceil(c.merch - this.currency.merch);
      return `Zu wenig Fanartikel (−${Math.max(1, need)})`;
    }
    const need = Math.ceil(c.beer - this.currency.beer);
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

  /** Heim always; captured/contested blocks once you have any own fan there */
  canBuyInBlock(blockId: number): boolean {
    if (blockId === GAST_BLOCK) return false;
    if (blockId === HEIM_BLOCK) return true;
    if (this.blockOwner[blockId] === this.playerTeam) return true;
    // Any living own fan whose home/seat is in this block unlocks buying
    return this.fans.some(
      (f) =>
        f.hp > 0 &&
        !f.isSteward &&
        f.team === this.playerTeam &&
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

  /** Heim → eroberte Neutrals; always a slot (no hard seat cap). */
  buySlotForPlayer(): { blockId: number; seatIndex: number } | null {
    const order: number[] = [HEIM_BLOCK];
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
    return this.canBuy(kind) && this.buySlotForPlayer() != null;
  }

  /** HUD [+] — buy into next controlled block */
  tryBuyFanQuick(kind: FanKind): boolean {
    const slot = this.buySlotForPlayer();
    if (!slot) {
      this.toast("Kein kontrollierter Block");
      return false;
    }
    return this.tryBuyFan(kind, slot.blockId, slot.seatIndex);
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
   * - Angreifer (onOffense) mit Feind voraus pushen weiter
   * - Angreifer ohne Feind in Reichweite / nach Invasion ohne Ziel → Heimblock
   * - Verteidiger nach Entwarnung zurück in den Block
   */
  private tickRecallForDefense(dt: number): void {
    void dt;
    for (const team of [this.playerTeam, this.aiTeam] as TeamId[]) {
      const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
      const threatened = this.teamHomeThreatened(team);

      for (const f of this.fans) {
        if (f.hp <= 0 || f.team !== team) continue;
        if (f.kind !== "hooligans" && f.kind !== "ultras" && f.kind !== "normalos")
          continue;
        if (f.isSteward) continue;

        if (threatened && f.invading) {
          f.invading = false;
          f.onOffense = false;
          f.state = "gang";
          f.blockId = f.homeBlockId ?? home;
          f.path = [];
          f.pathI = 0;
          f.aggro = 100; // defender
          continue;
        }

        // Offense that still has a corridor/goal to clear keeps pushing
        if (f.onOffense && this.offenseShouldKeepPushing(f)) continue;

        // Push finished (or never had a target left) → Heimblock, don't linger
        if (f.onOffense) {
          this.returnFanToHomeBlock(f);
          continue;
        }

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

  /**
   * Offense keeps marching while there is still something to do on the gang:
   * hostile posts ahead, enemy combatants, or the enemy block not yet reached.
   */
  private offenseShouldKeepPushing(f: FanUnit): boolean {
    if (f.team !== this.playerTeam && f.team !== this.aiTeam) return false;
    const dir = f.team === this.playerTeam ? 1 : -1;
    const goal = f.team === this.playerTeam ? GAST_BLOCK : HEIM_BLOCK;

    for (const s of this.slots) {
      if (!this.isHostileOrdnerPost(s, f.team as TeamId)) continue;
      const gx = this.postGangX(s);
      if ((gx - f.gangX) * dir > -0.02) return true;
    }

    for (const o of this.fans) {
      if (!this.isHostileUnit(f, o)) continue;
      if (o.isSteward || o.state === "gang" || o.invading || o.state === "moving") {
        return true;
      }
      if (o.state === "block" && (o.blockId === goal || o.invading)) return true;
    }

    // Empty corridor — still walk the full gang to the enemy door
    if ((f.state === "gang" || f.state === "moving") && !f.invading) {
      const goalGx = blockIdToGangX(goal);
      const reached =
        dir > 0 ? f.gangX >= goalGx - 0.04 : f.gangX <= goalGx + 0.04;
      if (!reached) return true;
    }

    return false;
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
      if (d < bestUnitD) {
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

  /** Spieler-Einheiten einer Art, die im Block bereit zum Angriff sind. */
  attackReadyList(kind: "ultras" | "hooligans"): FanUnit[] {
    return this.fans.filter(
      (f) =>
        f.team === this.playerTeam &&
        f.kind === kind &&
        f.hp > 0 &&
        f.state === "block",
    );
  }

  attackReadyCount(kind: "ultras" | "hooligans"): number {
    return this.attackReadyList(kind).length;
  }

  hooliganOrderReady(count: number | "all" = 1): boolean {
    const ready = this.attackReadyCount("hooligans");
    const n = count === "all" ? ready : Math.max(0, Math.floor(count));
    if (n < 1 || ready < n) return false;
    return this.currency.beer >= HOOLIGAN_ORDER_BEER * n;
  }

  /**
   * Hooligans in den Gang schicken.
   * @param count 1 = eine Figur; "all" = alle bereiten (Kosten × Anzahl)
   */
  tryHooliganOrder(count: number | "all" = 1): boolean {
    const list = this.attackReadyList("hooligans");
    const n = count === "all" ? list.length : Math.max(0, Math.floor(count));
    if (n < 1 || list.length < n) {
      this.toast("Keine Hooligans im Block");
      return false;
    }
    const cost = HOOLIGAN_ORDER_BEER * n;
    const door = doorPos(this.homeBlockOf(list[0]));
    if (!this.spend("beer", cost, door, "BIER")) {
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
    return this.currency.merch >= PYRO_FIGHT_MERCH * n;
  }

  /**
   * Ultras mit Pyro in den Gang schicken.
   * @param count 1 = eine Figur; "all" = alle bereiten (Kosten × Anzahl)
   */
  tryPyroFight(count: number | "all" = 1): boolean {
    const list = this.attackReadyList("ultras");
    const n = count === "all" ? list.length : Math.max(0, Math.floor(count));
    if (n < 1 || list.length < n) {
      this.toast("Keine Ultras im Block");
      return false;
    }
    const cost = PYRO_FIGHT_MERCH * n;
    const door = doorPos(this.homeBlockOf(list[0]));
    if (!this.spend("merch", cost, door, "FANARTIKEL")) {
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
    const door = doorPos(f.blockId);
    const lane = gangLanePosForUnit(f.blockId, f.id);
    // Keep seatIndex reserved while alive on gang
    f._homeSeat = f.seatIndex;
    f.state = "moving";
    f.standKey = null;
    f.invading = false;
    f.onOffense = offense;
    f.aggro = offense ? 40 : 100;
    // Always leave via center aisle → tunnel door → gang (personal lane Y)
    const path: { x: number; y: number }[] = [];
    if (f.y < door.y - 0.015 && Math.abs(f.x - door.x) > 0.018) {
      path.push({ x: door.x, y: f.y });
    }
    path.push({ x: door.x, y: door.y });
    path.push({ x: lane.x, y: lane.y });
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
    if (!this.canBuyInBlock(blockId)) {
      this.toast("Block noch nicht unter Kontrolle");
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
    const fan = this.makeFan(kind, this.playerTeam, blockId, seat);
    const p = { x: fan.x, y: fan.y };
    if (c.beer > 0) this.spend("beer", c.beer, p, "BIER");
    if (c.merch > 0) this.spend("merch", c.merch, p, "FANARTIKEL");
    if (c.security > 0) this.spend("security", c.security, p, "SICHERHEIT");
    if (c.gold > 0) {
      this.gold -= c.gold;
      this.floatAt(p.x, p.y, `−${c.gold}€`, false);
    }
    this.fans.push(fan);
    this.seatMenu = null;
    this.floatAt(p.x, p.y + 0.02, `+${FAN_STATS[kind].label}`, true);
    this.toast(`${FAN_STATS[kind].label} gekauft`);
    return true;
  }

  /**
   * Heim-plots always; further plots only once the player front line
   * has reached their X (plotGangX) — never by “leftish block” alone.
   */
  inPlayerTerritory(blockId: number, index = 0): boolean {
    if (blockId === GAST_BLOCK) return false;
    if (blockId === HEIM_BLOCK) return true;
    const gx = plotGangX(blockId, index);
    return gx <= this.linePlayer + 0.04;
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
    if (!this.selectedSlot && !this.buildMenu) {
      this.toast("Slot wählen");
      return false;
    }
    const sel = this.buildMenu ?? this.selectedSlot!;
    if (!this.inPlayerTerritory(sel.blockId, sel.index)) {
      this.toast("Frontlinie noch nicht hier");
      return false;
    }
    if (sel.blockId === GAST_BLOCK) {
      this.toast("Gäste-Slots gesperrt");
      return false;
    }
    const s = this.slots.find(
      (x) => x.blockId === sel.blockId && x.index === sel.index,
    );
    if (!s || (s.building && !s.greyNeutral && s.owner && s.owner !== "neutral")) {
      this.toast("Slot belegt");
      return false;
    }
    const cost =
      s.greyNeutral || s.owner === "neutral"
        ? Math.floor(BUILD_COST[kind] * 0.7)
        : BUILD_COST[kind];
    if (this.gold < cost) {
      this.toast(`${cost}€ nötig`);
      return false;
    }
    this.gold -= cost;
    if (!s.building) s.building = kind;
    else if (s.greyNeutral || s.owner === "neutral") {
      /* keep existing type on claim unless empty */
    } else {
      s.building = kind;
    }
    if (!s.building) s.building = kind;
    s.greyNeutral = false;
    s.owner = this.playerTeam;
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
    this.toast(
      `${s.building === "bier" ? "Bierstand" : s.building === "ordner" ? "Ordnerposten" : "Fanshop"} ${cost < BUILD_COST[kind] ? "übernommen" : "gebaut"}`,
    );
    return true;
  }

  upgradeCost(s: BuildSlot): number | null {
    if (!s.building || s.level >= UPGRADE_MAX) return null;
    if (s.owner !== this.playerTeam || s.greyNeutral) return null;
    return UPGRADE_COST[s.level + 1] ?? null;
  }

  tryUpgrade(): boolean {
    const sel = this.buildMenu ?? this.selectedSlot;
    if (!sel) {
      this.toast("Bude wählen");
      return false;
    }
    const s = this.slots.find(
      (x) => x.blockId === sel.blockId && x.index === sel.index,
    );
    if (!s) return false;
    const cost = this.upgradeCost(s);
    if (cost == null) {
      this.toast("Max. Stufe");
      return false;
    }
    if (this.gold < cost) {
      this.toast(`${cost}€ nötig`);
      return false;
    }
    this.gold -= cost;
    s.level++;
    if (s.building === "ordner") {
      const prev = s.structHp;
      this.initOrdnerPostHp(s);
      if (prev > 0) s.structHp = Math.min(s.structMaxHp, prev + ORDNER_POST_HP_PER_LEVEL * 0.5);
    }
    this.buildMenu = null;
    this.floatAtSlot(s, `Lv${s.level}`, true);
    this.toast(`Upgrade → Lv${s.level}`);
    return true;
  }

  /** Lowest-level living player unit of this kind (or Ordner if kind omitted via steward flag) */
  lowestLevelUnit(
    kind: FanKind | "ordner",
    team: TeamId = this.playerTeam,
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
  unitTechLevel(kind: FanKind | "ordner"): number {
    return Math.max(1, Math.min(UPGRADE_MAX, this.unitTech[kind] || 1));
  }

  minUnitLevel(kind: FanKind | "ordner", team: TeamId = this.playerTeam): number {
    if (team === this.playerTeam) return this.unitTechLevel(kind);
    const u = this.lowestLevelUnit(kind, team);
    return u ? u.level || 1 : 1;
  }

  maxUnitLevel(kind: FanKind | "ordner", team: TeamId = this.playerTeam): number {
    if (team === this.playerTeam) return this.unitTechLevel(kind);
    let max = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.team !== team) continue;
      if (kind === "ordner") {
        if (!f.isSteward) continue;
      } else if (f.isSteward || f.kind !== kind) continue;
      max = Math.max(max, f.level || 1);
    }
    return max;
  }

  /** Sidebar label: "Lv3" — player uses Tech-Stufe */
  unitLevelLabel(kind: FanKind | "ordner", team: TeamId = this.playerTeam): string {
    if (team === this.playerTeam) return `Lv${this.unitTechLevel(kind)}`;
    const lo = this.minUnitLevel(kind, team);
    const hi = this.maxUnitLevel(kind, team);
    if (hi <= 0) return "Lv1";
    if (lo === hi) return `Lv${lo}`;
    return `Lv${lo}–${hi}`;
  }

  unitUpgradeCostFor(kind: FanKind | "ordner"): number | null {
    return unitUpgradeCost(this.unitTechLevel(kind));
  }

  canUpgradeUnit(kind: FanKind | "ordner"): boolean {
    const cost = this.unitUpgradeCostFor(kind);
    if (cost == null || this.gold < cost) return false;
    // Mindestens eine lebende Einheit dieses Typs nötig
    return this.lowestLevelUnit(kind, this.playerTeam) != null;
  }

  tryUpgradeUnit(kind: FanKind | "ordner"): boolean {
    const living = this.lowestLevelUnit(kind, this.playerTeam);
    if (!living) {
      this.toast(kind === "ordner" ? "Kein Ordner" : "Keine Einheit");
      return false;
    }
    const tech = this.unitTechLevel(kind);
    const cost = unitUpgradeCost(tech);
    if (cost == null) {
      this.toast("Max. Stufe");
      return false;
    }
    if (this.gold < cost) {
      this.toast(`${cost}€ nötig`);
      return false;
    }
    this.gold -= cost;
    const next = tech + 1;
    this.unitTech[kind] = next;
    let raised = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.team !== this.playerTeam) continue;
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
    if (this.result || this.speed === 0) {
      this.tickFloats(dt);
      this.tickToasts(dt);
      this.tickConfetti(dt);
      this.tickMoodFx(dt);
      if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - dt * 1.2);
      return;
    }
    const step = dt * this.speed;
    this.realElapsed += step;
    if (this.phase === "regular") {
      this.minute = (this.realElapsed / REGULAR_REAL_SEC) * 90;
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
      if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - step * 1.2);
      return;
    }

    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) {
      if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - step);
    }
    if (this.moodFloatCd.heim > 0)
      this.moodFloatCd.heim = Math.max(0, this.moodFloatCd.heim - step);
    if (this.moodFloatCd.gast > 0)
      this.moodFloatCd.gast = Math.max(0, this.moodFloatCd.gast - step);
    if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - step * 1.15);

    this.tickEconomy(step);
    this.tickSecurityBaseline(step);
    this.tickStewards(step);
    this.tickNeutralPostAutoLevel(step);
    this.tickFans(step);
    this.tickRecallForDefense(step);
    this.tickAutoDefend(step);
    this.updateBattleLines(step);
    this.tickCaptureConvert(step);
    this.tickOrdnerPostCombat(step);
    this.tickCombat(step);
    this.tickPyroShots(step);
    this.tickOrdnerPostDamageFx(step);
    this.tickNeutralCapture(step);
    this.tickFamilyFlight(step);
    this.tickJubelMomentum(step);
    this.tickBlockStorm(step);
    this.tickMatch(step);
    this.tickAi(step);
    this.tickFloats(step);
    this.tickToasts(step);
    this.tickConfetti(step);
    this.tickMoodFx(step);

    for (const f of this.fans) {
      if (f.armSwing > 0) f.armSwing = Math.max(0, f.armSwing - step * 2.2);
      if (f.attackCd > 0) f.attackCd = Math.max(0, f.attackCd - step);
      if (f.drinkT > 0) f.drinkT = Math.max(0, f.drinkT - step);
      if (f.shopT > 0) f.shopT = Math.max(0, f.shopT - step);
      if (f.throwT > 0) f.throwT = Math.max(0, f.throwT - step);
      if (f.cheerT > 0) {
        f.cheerT = Math.max(0, f.cheerT - step);
        // Keep emitting notes/smoke while cheering
        if (Math.random() < 0.35 * step * 8) {
          const isPyro = f.kind === "ultras";
          const color =
            f.team === "ksc" ? "#3b82f6" : f.team === "vfb" ? "#ef4444" : "#9ca3af";
          this.moodFx.push({
            kind: isPyro ? "smoke" : "note",
            x: f.x + (Math.random() - 0.5) * 0.03,
            y: f.y - 0.03,
            vx: (Math.random() - 0.5) * 0.04,
            vy: -0.05 - Math.random() * 0.04,
            color: isPyro ? color : Math.random() < 0.5 ? color : "#fde68a",
            t: 0,
            life: isPyro ? 1.2 : 0.9,
            size: isPyro ? 0.022 : 0.012,
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
   * Sicherheit bedroht: Gegner im Heimblock, nahe Heim-Tür/Gang, oder nahe
   * eigener Buden auf der Gang-Ebene.
   */
  playerSecurityThreatened(): boolean {
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward || f.team !== this.aiTeam) continue;
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
    this.aiGold += (1.1 + aiN * 0.22) * dt;

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
    for (const s of this.slots) {
      if (!s.building || s.greyNeutral) continue;
      const rate = productionRate(s.level || 1);
      if (s.building === "bier") {
        s.beer = clamp(s.beer + 0.85 * rate * dt, 0, s.capacity);
      } else if (s.building === "fanshop") {
        s.merch = clamp(s.merch + 0.85 * rate * dt, 0, s.capacity);
      }
      if (s.owner === this.playerTeam) {
        const p = this.standWorld(s);
        if (s.building === "bier") {
          this.gain("beer", PROD_BEER * rate * dt, undefined, "BIER");
        } else if (s.building === "ordner") {
          // Own posts only raise Sicherheit above the base floor while territory is safe
          if (!this.playerSecurityThreatened()) {
            this.gain("security", PROD_SECURITY * rate * dt, undefined, "SICHERHEIT");
          }
        } else if (s.building === "fanshop") {
          this.gain("merch", PROD_MERCH * rate * dt, undefined, "FANARTIKEL");
        }
        void p;
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
    if (s.building !== "ordner" || s.greyNeutral) return false;
    if (s.owner !== this.playerTeam) return false;
    return this.stewardCountAt(s) < STEWARD_CAP && this.gold >= STEWARD_HIRE_GOLD;
  }

  /** Hire at first owned Ordnerposten (sidebar quick action). */
  tryHireStewardQuick(): boolean {
    const s = this.slots.find(
      (x) =>
        x.building === "ordner" &&
        x.owner === this.playerTeam &&
        !x.greyNeutral &&
        this.stewardCountAt(x) < STEWARD_CAP,
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
    if (s.owner !== this.playerTeam || s.greyNeutral) {
      this.toast("Nicht dein Posten");
      return false;
    }
    if (this.stewardCountAt(s) >= STEWARD_CAP) {
      this.toast(`Max. ${STEWARD_CAP} Ordner`);
      return false;
    }
    if (this.gold < STEWARD_HIRE_GOLD) {
      this.toast(`${STEWARD_HIRE_GOLD}€ nötig`);
      return false;
    }
    this.gold -= STEWARD_HIRE_GOLD;
    const st = this.makeSteward(this.playerTeam, s);
    this.fans.push(st);
    this.floatAtSlot(s, `−${STEWARD_HIRE_GOLD}€ Ordner`, true);
    this.toast("Ordner angeheuert");
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
   * Nearest intact hostile Ordnerpost ahead (incl. neutral mid).
   * Enemy fans and the enemy Standarte may never pass this wall.
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

  /**
   * Pick among ALL own-team stands of a type (not just nearest).
   * Prefers shorter queues, then closer block — spreads traffic across every
   * Bier/Fanshop the team owns.
   */
  private pickOwnVisitStand(
    team: TeamId,
    fromBlock: number,
    building: "bier" | "fanshop",
  ): BuildSlot | null {
    let best: BuildSlot | null = null;
    let bestScore = Infinity;
    for (const s of this.slots) {
      if (s.building !== building || s.owner !== team || s.greyNeutral) continue;
      if (building === "bier" && s.beer < 1) continue;
      if (building === "fanshop" && s.merch < 1) continue;
      const queue = this.queueDepthAt(s);
      const dist = Math.abs(s.blockId - fromBlock);
      // Queue dominates so a far empty stand beats a packed neighbour.
      const score = queue * 10 + dist;
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }
    return best;
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
        this.finishStandVisit(f);
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

  /** Micro-target near this fan's spread-out home slot (celebration idle). */
  private retargetBlockWander(f: FanUnit): void {
    const home = crowdHomePos(f.blockId, f.seatIndex ?? 0);
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.random() * BLOCK_HOME_RADIUS;
    f._wanderTx = home.x + Math.cos(ang) * rad;
    f._wanderTy = home.y + Math.sin(ang) * rad * 0.75;
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

    const bier = beerReady
      ? this.pickOwnVisitStand(team, f.blockId, "bier")
      : null;
    const shop = shopReady
      ? this.pickOwnVisitStand(team, f.blockId, "fanshop")
      : null;

    let pick: "beer" | "shop" | null = null;
    if (bier && shop) {
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
    f._wanderTx = wait.x;
    f._wanderTy = wait.y;
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
    return {
      x: sp.x + Math.cos(ang) * r,
      y: sp.y + Math.sin(ang) * r * 0.72,
    };
  }

  /** Soft push so queued fans don't share one pixel in the wait radius. */
  private tickStandWaitSeparation(dt: number): void {
    const waiting = this.fans.filter(
      (f) => f.hp > 0 && !f.isSteward && f.state === "stand" && f.standKey,
    );
    const sep = STAND_WAIT_RADIUS * 0.35;
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
      const r = STAND_WAIT_RADIUS * (0.2 + Math.random() * 0.8);
      f._wanderTx = sp.x + Math.cos(ang) * r;
      f._wanderTy = sp.y + Math.sin(ang) * r * 0.72;
      f._wanderCd = 0.35 + Math.random() * 0.55;
    } else {
      f._wanderCd = (f._wanderCd ?? 0) - dt;
    }
    const tx = f._wanderTx!;
    const ty = f._wanderTy!;
    const speed = 0.07;
    const d = dist(f.x, f.y, tx, ty);
    if (d > 0.004) {
      const step = Math.min(1, (speed * dt) / d);
      f.x += (tx - f.x) * step;
      f.y += (ty - f.y) * step;
    }
    // Soft clamp into radius
    const dx = f.x - sp.x;
    const dy = f.y - sp.y;
    const rad = Math.hypot(dx, dy / 0.72);
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
      if (f.team === "neutral") {
        f.satisfiedUntil = 1e9;
        f.shopUntil = this.realElapsed + 20 + Math.random() * 10;
      } else {
        const beerIv = visitInterval(f.kind, "beer", lv);
        f.satisfiedUntil =
          beerIv == null ? 1e9 : this.realElapsed + beerIv;
      }
      const pay = visitGoldPayout("beer", lv);
      this.payVisitGold(stand, pay);
      this.consumeVisitStock(stand);
      this.floatAtSlot(stand, "−1 Fass", false);
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

    const home =
      f.team === this.playerTeam
        ? HEIM_BLOCK
        : f.team === this.aiTeam
          ? GAST_BLOCK
          : f.blockId;
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
          f.aggro = Math.max(f.aggro, 80);
          this.setAfter(f, "");
        }
        return;
      }
    }

    const speed = 0.22;
    const d = dist(f.x, f.y, t.x, t.y);
    if (d < 0.012) {
      f.x = t.x;
      f.y = t.y;
      f.pathI++;
      if (f.pathI >= f.path.length) this.finishPath(f);
      return;
    }
    const step = Math.min(1, (speed * dt) / d);
    f.x += (t.x - f.x) * step;
    f.y += (t.y - f.y) * step;
    if (Math.abs(f.y - laneY) < 0.08 || Math.abs(f.y - midY) < 0.08) {
      this.syncGangFromWorld(f);
    }
  }

  private finishPath(f: FanUnit): void {
    const after = this.getAfter(f);
    f.path = [];
    f.pathI = 0;
    if (after === "gang") {
      f.state = "gang";
      f.gangX = blockIdToGangX(f.blockId);
      f.y = this.gangLaneYSpread(f);
      f.x = gangXToWorld(f.gangX);
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
    if (o.team === "neutral" && !o.isSteward) return false;
    return true;
  }

  /**
   * Corridor blocker ahead, measured in gangX.
   * World MELEE/RANGED spans most of the short gang strip (~0.27 wide) and
   * made every unit look "stuck" fighting across half the corridor.
   */
  private blockerAhead(f: FanUnit, dirHint?: number): FanUnit | null {
    const dir =
      dirHint ??
      (f.team === this.playerTeam ? 1 : f.team === this.aiTeam ? -1 : 1);
    let best: FanUnit | null = null;
    // Short look-ahead so the rest of the gang stays walkable
    let bestD = f.rangedPyro ? 0.16 : 0.09;
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
      if (dx < -0.015 || dx > bestD) continue;
      if (Math.abs(o.y - f.y) > 0.14) continue;
      bestD = dx;
      best = o;
    }
    return best;
  }

  private syncGangFromWorld(f: FanUnit): void {
    const left = blockCenterX(0);
    const right = blockCenterX(BLOCK_COUNT - 1);
    f.gangX = clamp((f.x - left) / (right - left || 1), 0, 1);
    f.x = gangXToWorld(f.gangX);
  }

  /**
   * Spread this unit's gang Y evenly across the full strip between Bau rows
   * (among living teammates currently on the corridor).
   */
  private gangLaneYSpread(f: FanUnit): number {
    const y0 = gangY();
    const h = Math.max(0.02, gangHeight());
    const mates = this.fans
      .filter(
        (o) =>
          o.hp > 0 &&
          o.team === f.team &&
          !o.isSteward &&
          (o.state === "gang" ||
            o.state === "moving" ||
            o.invading ||
            o.onOffense) &&
          (o.kind === "ultras" || o.kind === "hooligans" || o.kind === "normalos"),
      )
      .sort((a, b) => a.id - b.id);
    const n = mates.length;
    const idx = Math.max(
      0,
      mates.findIndex((o) => o.id === f.id),
    );
    const u = n <= 1 ? 0.5 : idx / (n - 1);
    return y0 + h * (0.04 + u * 0.92);
  }

  private tickGangMove(f: FanUnit, dt: number): void {
    if (f.isSteward) return;
    const dir = f.team === this.playerTeam ? 1 : -1;
    // Brisk march so the full Heim→Gast corridor reads as movement
    const speed = 0.11 * FAN_STATS[f.kind].fight;
    const laneY = this.gangLaneYSpread(f);
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
      if (blocker) {
        const ogx =
          blocker.state === "gang" || blocker.invading || blocker.isSteward
            ? blocker.gangX
            : worldXToGangX(blocker.x);
        const gapGx = (ogx - f.gangX) * homeDir;
        if (gapGx < 0.05) {
          // Soft contact — still crawl home, never freeze on one X
          moveSpeed = speed * 0.7;
          f.aggro = Math.max(f.aggro, 80);
          f.y += (blocker.y - f.y) * Math.min(1, 8 * dt);
        }
      }
      f.gangX = clamp(f.gangX + homeDir * moveSpeed * dt, 0, 1);
      f.x = gangXToWorld(f.gangX);
      f.y = laneY + Math.sin(this.realElapsed * 3 + f.id) * 0.006;
      if (Math.abs(f.gangX - homeGx) < 0.1) {
        this.returnFanToHomeBlock(f);
      }
      return;
    }

    // Offense: always march toward the enemy block across the full gang.
    // Cement slows + DoTs but never hard-stops (gang stays permeable).
    const cementWall = this.cementWallAhead(f);
    const pressingCement =
      cementWall != null &&
      (f.kind === "hooligans" || f.kind === "ultras");
    let moveSpeed = speed * (pressingCement ? Math.max(0.55, CEMENT_SLOW_MUL) : 1);
    if (pressingCement) {
      f.hp = Math.max(0, f.hp - CEMENT_DOT_PER_SEC * dt);
    }

    const blocker = this.blockerAhead(f, dir);
    if (blocker) {
      const ogx =
        blocker.state === "gang" || blocker.invading || blocker.isSteward
          ? blocker.gangX
          : worldXToGangX(blocker.x);
      const gapGx = (ogx - f.gangX) * dir;
      if (gapGx < 0.05) {
        // Soft contact: slight slow, keep Y toward foe, keep advancing
        moveSpeed = Math.max(speed * 0.7, moveSpeed * 0.8);
        f.y += ((blocker.y + laneY) * 0.5 - f.y) * Math.min(1, 8 * dt);
        if (f.aggro < 80) f.aggro = 40;
      }
    }

    f.gangX = clamp(f.gangX + dir * moveSpeed * dt, 0, 1);
    f.x = gangXToWorld(f.gangX);
    f.y = laneY + Math.sin(this.realElapsed * 3 + f.id) * 0.006;

    const goalGx = blockIdToGangX(goalBlock);
    const reached =
      f.team === this.playerTeam
        ? f.gangX >= goalGx - 0.02
        : f.gangX <= goalGx + 0.02;
    if (reached) {
      const door = doorPos(goalBlock);
      f.blockId = goalBlock;
      f.path = [
        gangLanePosForUnit(goalBlock, f.id),
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

  /** Stand conversion: battle-line zone + seat majority required */
  private tickCaptureConvert(dt: number): void {
    for (const s of this.slots) {
      if (!s.building) continue;
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
        if (s.building === "bier" && s.beer < 20) s.beer = 35;
        if (s.building === "fanshop" && s.merch < 20) s.merch = 35;
        this.floatAtSlot(s, "Übernommen!", true);
        this.toast(
          dominant === this.playerTeam
            ? `Bude übernommen`
            : `KI übernimmt Bude`,
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

  private attackOf(f: FanUnit): number {
    const mul = unitLevelMul(f.level || 1);
    if (f.isSteward) return STEWARD_STATS.attack * mul;
    return FAN_STATS[f.kind].attack * mul;
  }

  private defenseOf(f: FanUnit): number {
    const mul = unitLevelMul(f.level || 1);
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
    void dt;
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
      const tx =
        target.kind === "unit"
          ? target.unit.x
          : this.ordnerPostGangPos(target.post).x;
      const ty =
        target.kind === "unit"
          ? target.unit.y
          : this.ordnerPostGangPos(target.post).y;
      const d = dist(inv.x, inv.y, tx, ty);
      const hold = inv.rangedPyro ? RANGED_RANGE * 0.45 : MELEE_RANGE * 0.85;
      if (d > hold) {
        const step = Math.min(1, 0.4);
        inv.x += (tx - inv.x) * step;
        inv.y += (ty - inv.y) * step;
      }
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
    const pHeim = this.blockPower(this.playerTeam);
    const pGast = this.blockPower(this.aiTeam);
    const rel = (pHeim - pGast) / (pHeim + pGast + MOMENTUM_EPS);
    const targetMom = clamp(rel, -1, 1);
    const approach = 1 - Math.exp(-MOMENTUM_APPROACH * dt);
    this.momentum = clamp(
      this.momentum + (targetMom - this.momentum) * approach,
      -1,
      1,
    );

    // Roll the Torwahrscheinlichkeit football toward the gaining side
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
    if (pN >= BLOCK_STORM_COUNT) {
      this.stormAccPlayer += dt;
      if (this.stormAccPlayer >= BLOCK_STORM_SEC) {
        this.blockOwner[GAST_BLOCK] = this.playerTeam;
        this.finish(
          this.playerTeam,
          "invade",
          "Blocksturm! Gästeblock übernommen",
        );
        return;
      }
    } else {
      this.stormAccPlayer = 0;
    }

    const aN = this.countBlockInvaders(this.aiTeam, HEIM_BLOCK);
    if (aN >= BLOCK_STORM_COUNT) {
      this.stormAccAi += dt;
      if (this.stormAccAi >= BLOCK_STORM_SEC) {
        this.blockOwner[HEIM_BLOCK] = this.aiTeam;
        this.finish(this.aiTeam, "invade", "Blocksturm! Heimblock übernommen");
        return;
      }
    } else {
      this.stormAccAi = 0;
    }
  }

  private tickMatch(dt: number): void {
    const fever = this.minute >= FEVER_FROM_MIN || this.phase === "et" ? 1.5 : 1;
    this.chanceAcc += dt;
    if (this.chanceAcc < GOAL_ROLL_INTERVAL / fever) return;
    this.chanceAcc = 0;
    const ch = this.goalChance();
    if (Math.random() > ch.pTor) return;
    this.scoreGoal(Math.random() < ch.pHeim ? this.playerTeam : this.aiTeam);
  }

  /** Public HUD: next-goal probability from momentum */
  goalChance(): { pTor: number; pHeim: number; pGast: number; momentum: number } {
    const M = this.momentum;
    const pTor = clamp(
      GOAL_P_TOR_BASE + GOAL_P_TOR_MOMENTUM * Math.abs(M),
      GOAL_P_TOR_MIN,
      GOAL_P_TOR_MAX,
    );
    const pHeim = clamp(0.5 + 0.5 * M, 0.05, 0.95);
    return { pTor, pHeim, pGast: 1 - pHeim, momentum: M };
  }

  private scoreGoal(team: TeamId): void {
    if (team === "ksc") this.scoreKsc++;
    else this.scoreVfb++;
    // No direct mood/momentum bump — celebration leaves the block (Bierrunde)
    this.lastGoalTeam = team;
    this.scorePulse = 1;
    this.spawnGoalConfetti(team);
    this.startGoalCelebration(team);
    this.toast(`TOR ${teamLabel(team)}! ${this.scoreKsc}:${this.scoreVfb}`);
  }

  /**
   * Tor-Jubel im eigenen Block:
   * Fans → Konfetti weiß/Vereinsfarbe 50/50 · Ultras → Rauch + Pyro in der Hand ·
   * Hooligans → Bierkrug 50% / Feuerwerksrakete 50%.
   */
  private startGoalCelebration(team: TeamId): void {
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const white = "#f8fafc";
    const club = team === "ksc" ? "#1d4ed8" : "#b91c1c";
    let fanI = 0;
    let ultraI = 0;
    let hoolI = 0;
    let n = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward || f.team !== team) continue;
      if (f.blockId !== home) continue;
      if (f.state !== "block" && f.state !== "stand") continue;
      f.cheerT = 6.4; // doppelte Jubel-Länge
      n++;
      if (f.kind === "normalos") {
        const col = fanI++ % 2 === 0 ? white : club;
        this.burstFanConfetti(f, col);
      } else if (f.kind === "ultras") {
        const col = ultraI++ % 2 === 0 ? white : club;
        // Raise pyro prop in hand while smoke show plays
        f.throwT = Math.max(f.throwT, 2.4);
        f.armSwing = 0.85;
        this.burstUltraSmoke(f, col);
      } else if (f.kind === "hooligans") {
        if (hoolI++ % 2 === 0) this.burstBeerMug(f);
        else this.burstFireworkRocket(f, club);
      }
    }
    this.floatAt(blockCenterX(home), blockTopY(home) + 0.08, "TOR-JUBEL!", true);
    this.toast(n > 0 ? "Kurve feiert!" : "TOR!", 7);
  }

  private burstFanConfetti(f: FanUnit, color: string): void {
    for (let i = 0; i < 10; i++) {
      this.confetti.push({
        x: f.x + (Math.random() - 0.5) * 0.04,
        y: f.y - 0.02 - Math.random() * 0.03,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -0.02 + Math.random() * 0.1,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 10,
        color,
        t: 0,
        life: 1.2 + Math.random() * 0.7,
      });
    }
  }

  private burstUltraSmoke(f: FanUnit, color: string): void {
    for (let i = 0; i < 5; i++) {
      this.moodFx.push({
        kind: "smoke",
        x: f.x + (Math.random() - 0.5) * 0.03,
        y: f.y - 0.02,
        vx: (Math.random() - 0.5) * 0.04,
        vy: -0.06 - Math.random() * 0.05,
        color,
        t: 0,
        life: 1.4 + Math.random() * 0.6,
        size: 0.028 + Math.random() * 0.02,
      });
    }
  }

  private burstBeerMug(f: FanUnit): void {
    f.throwT = Math.max(f.throwT, 0.55);
    f.armSwing = 0.9;
    this.moodFx.push({
      kind: "mug",
      x: f.x,
      y: f.y - 0.02,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -0.14 - Math.random() * 0.08,
      color: "#b45309",
      t: 0,
      life: 1.1,
      size: 0.018,
    });
  }

  private burstFireworkRocket(f: FanUnit, club: string): void {
    f.throwT = Math.max(f.throwT, 0.65);
    f.armSwing = 1;
    this.moodFx.push({
      kind: "rocket",
      x: f.x,
      y: f.y - 0.02,
      vx: (Math.random() - 0.5) * 0.06,
      vy: -0.28 - Math.random() * 0.12,
      color: club,
      t: 0,
      life: 1.35,
      size: 0.016,
    });
    // Spark trail
    for (let i = 0; i < 4; i++) {
      this.moodFx.push({
        kind: "spark",
        x: f.x + (Math.random() - 0.5) * 0.02,
        y: f.y - 0.01,
        vx: (Math.random() - 0.5) * 0.05,
        vy: -0.1 - Math.random() * 0.08,
        color: Math.random() < 0.5 ? "#fde68a" : club,
        t: 0,
        life: 0.7 + Math.random() * 0.4,
        size: 0.008,
      });
    }
  }

  private spawnGoalConfetti(team: TeamId): void {
    const blockId = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const cx = blockCenterX(blockId);
    const top = blockTopY(blockId);
    const white = "#f8fafc";
    const club = team === "ksc" ? "#1d4ed8" : "#b91c1c";
    for (let i = 0; i < 36; i++) {
      this.confetti.push({
        x: cx + (Math.random() - 0.5) * blockWidthNorm(blockId) * 0.85,
        y: top + 0.02 + Math.random() * 0.04,
        vx: (Math.random() - 0.5) * 0.18,
        vy: 0.04 + Math.random() * 0.12,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 8,
        color: i % 2 === 0 ? white : club,
        t: 0,
        life: 1.4 + Math.random() * 0.8,
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

  private tickAi(dt: number): void {
    this.aiAcc += dt;
    const diff = this.cfg.settings.difficulty;
    const trailing = this.aiTrailingCrowd();
    const regen =
      AI_SOFT_REGEN *
      (diff === "easy" ? 0.7 : diff === "hard" ? 1.25 : 1) *
      (trailing ? 1.25 : 1);
    // Soft regen of AI send/buy resources
    this.aiMerch = Math.min(120, this.aiMerch + dt * regen);
    this.aiBeer = Math.min(120, this.aiBeer + dt * regen);
    this.aiSecurity = Math.min(120, this.aiSecurity + dt * regen * 0.85);

    const interval = (trailing ? 5.2 : 7) / diffMul(diff);

    if (this.aiAcc < interval) return;
    this.aiAcc = 0;
    this.aiTryBuild();
    this.aiTryHireSteward();
    this.aiTryBuyFans();
    this.aiTryUpgradeUnits();
    const act = aiActionMul(diff) * (trailing ? 1.35 : 1);
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
    let want = diff === "hard" ? 3 : diff === "easy" ? 1 : 2;
    if (trailing) want += 1;
    if (
      hools.length &&
      onGang < want &&
      this.aiBeer >= HOOLIGAN_ORDER_BEER &&
      Math.random() < (trailing ? 0.62 : 0.45) * act
    ) {
      this.aiBeer -= HOOLIGAN_ORDER_BEER;
      hools[0].rangedPyro = false;
      this.sendToGang(hools[0]);
    } else if (
      ultras.length &&
      onGang < want &&
      this.aiMerch >= PYRO_FIGHT_MERCH &&
      Math.random() < (trailing ? 0.5 : 0.35) * act
    ) {
      this.aiMerch -= PYRO_FIGHT_MERCH;
      const u = ultras[0];
      u.rangedPyro = true;
      this.applyUnitLevelStats(u);
      this.sendToGang(u);
    }
  }

  private aiTryUpgradeUnits(): void {
    if (this.aiGold < 22) return;
    const trailing = this.aiTrailingCrowd();
    if (Math.random() > (trailing ? 0.55 : 0.4)) return;
    // When behind on Kurve, prioritize combat upgrades over Fans
    const kinds: (FanKind | "ordner")[] = trailing
      ? ["hooligans", "ultras", "ordner", "normalos"]
      : ["hooligans", "ultras", "normalos", "ordner"];
    for (const kind of kinds) {
      const u = this.lowestLevelUnit(kind, this.aiTeam);
      if (!u) continue;
      const cost = unitUpgradeCost(u.level || 1);
      if (cost == null || this.aiGold < cost) continue;
      this.aiGold -= cost;
      u.level = (u.level || 1) + 1;
      this.applyUnitLevelStats(u);
      return;
    }
  }

  /** Mirror player fan buys into Gästebox with AI wallets */
  private aiTryBuyFans(): void {
    const diff = this.cfg.settings.difficulty;
    const act = aiActionMul(diff);
    const trailing = this.aiTrailingCrowd();
    if (Math.random() > (trailing ? 0.7 : 0.55) * act) return;
    const own = this.countTeamFans(this.aiTeam);
    const target =
      diff === "easy" ? 10 : diff === "hard" ? 16 : 13;
    if (own.normalos + own.ultras + own.hooligans >= target) return;

    const seat = this.freeSeat(GAST_BLOCK);
    if (seat == null) return;
    const options: FanKind[] = [];
    if (this.aiSecurity >= BUY_COST.normalos.security) options.push("normalos");
    if (this.aiMerch >= BUY_COST.ultras.merch) options.push("ultras");
    if (this.aiBeer >= BUY_COST.hooligans.beer) options.push("hooligans");
    if (!options.length) return;
    // Prefer short counts; when trailing, bias hard toward Ultras/Hools
    options.sort((a, b) => {
      if (trailing) {
        const rank = (k: FanKind) =>
          k === "hooligans" ? 0 : k === "ultras" ? 1 : 2;
        const d = rank(a) - rank(b);
        if (d !== 0) return d;
      }
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
    // Only plots the AI front line has already claimed (by X) — never left early
    const candidates = this.slots
      .filter(
        (x) =>
          this.inAiTerritory(x.blockId, x.index) &&
          (!x.building ||
            ((x.owner === "neutral" || x.greyNeutral) && !!x.building)),
      )
      .sort((a, b) => plotGangX(b.blockId, b.index) - plotGangX(a.blockId, a.index));
    const empty = candidates.find((x) => !x.building);
    const claimable = candidates.find(
      (x) => x.building && (x.owner === "neutral" || x.greyNeutral),
    );
    const s = empty ?? claimable;
    if (!s) {
      // upgrade own
      const up = this.slots.find(
        (x) =>
          x.owner === this.aiTeam &&
          x.building &&
          !x.greyNeutral &&
          x.level < UPGRADE_MAX,
      );
      if (up && this.aiGold >= (UPGRADE_COST[up.level + 1] ?? 999)) {
        this.aiGold -= UPGRADE_COST[up.level + 1]!;
        up.level++;
      }
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
    if (s.building === "ordner") s.stewardCd = 9999; // AI hires manually
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
    };
    this.speed = 0;
    this.toast(detail);
  }
}
