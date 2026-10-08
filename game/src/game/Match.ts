import {
  AI_SOFT_REGEN,
  AI_START_GOLD_BONUS,
  BLOCK_META,
  BLOCK_STORM_COUNT,
  BLOCK_STORM_SEC,
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
  NEUTRAL_STEWARD_RESPAWN,
  ORDNER_POST_HP,
  ORDNER_POST_HP_PER_LEVEL,
  MOMENTUM_APPROACH,
  MOMENTUM_EPS,
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
  boothCenter,
  doorPos,
  gangLanePos,
  gangMidY,
  gangXToWorld,
  plotGangX,
  seatPos,
  slotIndicesForBlock,
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
  kind: "note" | "smoke" | "spark" | "flare";
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  t: number;
  life: number;
  size: number;
};

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
  /** UI: scoreboard punch after goal (0..1) */
  scorePulse = 0;
  /** last team that scored — for crest flash */
  lastGoalTeam: TeamId | null = null;
  confetti: ConfettiBit[] = [];
  moodFx: MoodParticle[] = [];
  pyroShots: PyroProjectile[] = [];
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
  captureAcc: Record<string, number> = {};
  aiGold = START_GOLD + AI_START_GOLD_BONUS;
  aiBuildRot = 0;
  /** soft AI combat resources (not shared with player wallet) */
  aiMerch = 40;
  aiBeer = 40;
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
          capacity: 100,
          owner: isNeutral ? "neutral" : null,
          level: 1,
          stewardCd: 2 + Math.random() * 3,
          convertAcc: 0,
          convertBy: null,
          prodFlash: 0,
          structHp: 0,
          structMaxHp: 0,
        });
      }
    }

    // Neutralzone: grauer Bier-Claim + Ordnerposten mit 2 Ordnern
    this.placeBuilding(NEUTRAL_BLOCK, 0, "bier", true, "neutral");
    const s0 = this.slots.find((x) => x.blockId === NEUTRAL_BLOCK && x.index === 0);
    if (s0) {
      s0.greyNeutral = true;
      s0.beer = 25;
    }
    this.placeBuilding(NEUTRAL_BLOCK, 1, "ordner", true, "neutral");
    const bufferPost = this.slots.find(
      (x) => x.blockId === NEUTRAL_BLOCK && x.index === 1,
    );
    if (bufferPost) {
      bufferPost.greyNeutral = false;
      bufferPost.owner = "neutral";
      bufferPost.level = 1;
      bufferPost.stewardCd = NEUTRAL_STEWARD_RESPAWN;
      const post = this.stewardPostPos(bufferPost);
      for (let i = 0; i < 2; i++) {
        const st = this.makeSteward("neutral", bufferPost);
        st.state = "gang";
        st.path = [];
        st.pathI = 0;
        this.setAfter(st, "");
        const spread = (i - 0.5) * 0.04;
        st.x = post.x + spread;
        st.y = post.y;
        st.gangX = blockIdToGangX(NEUTRAL_BLOCK) + spread * 0.5;
        st.patrolDir = i === 0 ? 1 : -1;
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
    // Neutralblock: ¾ der Plätze besetzt (9/12), gemischt
    for (let i = 0; i < 9; i++) {
      const kind: FanKind =
        i % 3 === 0 ? "normalos" : i % 3 === 1 ? "hooligans" : "ultras";
      this.fans.push(this.makeFan(kind, "neutral", NEUTRAL_BLOCK, i));
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
    const p = seatPos(blockId, seat);
    const level = 1;
    const beerIv = visitInterval(kind, "beer", level);
    const shopIv = visitInterval(kind, "shop", level);
    const maxHp = this.baseMaxHp(kind, level, false);
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
        beerIv == null
          ? 1e9
          : this.realElapsed + beerIv * (0.35 + Math.random() * 0.55),
      shopUntil:
        shopIv == null
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
    };
  }

  private makeSteward(team: TeamId | "neutral", stand: BuildSlot): FanUnit {
    const sp = this.stewardPostPos(stand);
    const gx = blockIdToGangX(stand.blockId);
    const level = 1;
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
    if (kind === "bier") s.beer = 40;
    if (kind === "ordner") this.initOrdnerPostHp(s);
  }

  private initOrdnerPostHp(s: BuildSlot): void {
    const lv = s.level || 1;
    s.structMaxHp = ORDNER_POST_HP + (lv - 1) * ORDNER_POST_HP_PER_LEVEL;
    s.structHp = s.structMaxHp;
  }

  private ordnerPostGangPos(s: BuildSlot): { x: number; y: number } {
    const c = boothCenter(s.blockId, s.index);
    return { x: c.x, y: gangMidY() };
  }

  private isHostileOrdnerPost(s: BuildSlot, team: TeamId): boolean {
    if (s.building !== "ordner" || s.structHp <= 0) return false;
    if (s.owner === team) return false;
    return s.owner === "neutral" || s.owner !== team;
  }

  /** Intact Ordnerposten between unit and goal block */
  private blockingOrdnerPosts(f: FanUnit, goalBlock: number): BuildSlot[] {
    const dir = f.team === this.playerTeam ? 1 : -1;
    const goalGx = blockIdToGangX(goalBlock);
    const out: BuildSlot[] = [];
    for (const s of this.slots) {
      if (!this.isHostileOrdnerPost(s, f.team as TeamId)) continue;
      const gx = blockIdToGangX(s.blockId);
      const between =
        dir > 0
          ? gx >= f.gangX - 0.03 && gx <= goalGx + 0.02
          : gx <= f.gangX + 0.03 && gx >= goalGx - 0.02;
      if (between) out.push(s);
    }
    out.sort((a, b) => {
      const ga = blockIdToGangX(a.blockId);
      const gb = blockIdToGangX(b.blockId);
      return dir > 0 ? ga - gb : gb - ga;
    });
    return out;
  }

  private nearestHostileOrdnerPost(f: FanUnit): BuildSlot | null {
    const dir = f.team === this.playerTeam ? 1 : -1;
    let best: BuildSlot | null = null;
    let bestDx = 99;
    for (const s of this.slots) {
      if (!this.isHostileOrdnerPost(s, f.team as TeamId)) continue;
      const gx = blockIdToGangX(s.blockId);
      const dx = (gx - f.gangX) * dir;
      if (dx < -0.02 || dx > bestDx) continue;
      bestDx = dx;
      best = s;
    }
    return best;
  }

  private destroyOrdnerPost(s: BuildSlot): void {
    const key = slotKey(s.blockId, s.index);
    for (const f of this.fans) {
      if (f.isSteward && f.homeStandKey === key) f.hp = 0;
    }
    s.building = null;
    s.structHp = 0;
    s.structMaxHp = 0;
    s.stewardCd = 0;
    this.floatAtSlot(s, "Posten zerstört", false);
  }

  private damageOrdnerPost(
    s: BuildSlot,
    dmg: number,
    at: FanUnit,
  ): void {
    if (s.structHp <= 0) return;
    s.structHp = Math.max(0, s.structHp - dmg);
    s.prodFlash = 1;
    if (s.structHp <= 0) this.destroyOrdnerPost(s);
    else if (Math.random() < 0.35) {
      const p = this.ordnerPostGangPos(s);
      this.floatAt(p.x, p.y, `−${Math.round(dmg)}`, false);
    }
    void at;
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

  /** Short status for combat banner */
  combatStatus(): string | null {
    const pInv = this.fans.filter(
      (f) =>
        f.hp > 0 &&
        f.team === this.playerTeam &&
        f.kind === "ultras" &&
        f.blockId === GAST_BLOCK &&
        (f.invading || f.state === "block"),
    ).length;
    const aInv = this.fans.filter(
      (f) =>
        f.hp > 0 &&
        f.team === this.aiTeam &&
        f.kind === "ultras" &&
        f.blockId === HEIM_BLOCK &&
        (f.invading || f.state === "block"),
    ).length;
    if (this.stormAccPlayer > 0) {
      return `BLOCKSTURM ${Math.ceil(BLOCK_STORM_SEC - this.stormAccPlayer)}s · ${pInv}/${BLOCK_STORM_COUNT} Ultras`;
    }
    if (this.stormAccAi > 0) {
      return `GEGEN-STURM ${Math.ceil(BLOCK_STORM_SEC - this.stormAccAi)}s · ${aInv}/${BLOCK_STORM_COUNT}`;
    }
    if (pInv > 0) return `ANGRIFF im Gästeblock · ${pInv} Ultra${pInv > 1 ? "s" : ""} — Verteidigung!`;
    if (aInv > 0) return `VERTEIDIGUNG · ${aInv} Feind-Ultra${aInv > 1 ? "s" : ""} im Heimblock`;
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
   * Nur Invasion abbrechen, wenn der eigene Block wirklich angegriffen wird.
   * Angreifer (Angriff/Pyro Wurf, onOffense) pushen weiter —
   * sie werden NICHT zurück auf den Sitz geschickt.
   */
  private tickRecallForDefense(dt: number): void {
    void dt;
    for (const team of [this.playerTeam, this.aiTeam] as TeamId[]) {
      const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
      const homeGx = blockIdToGangX(home);
      const threatened = this.teamHomeThreatened(team);

      for (const f of this.fans) {
        if (f.hp <= 0 || f.team !== team) continue;
        if (f.kind !== "hooligans" && f.kind !== "ultras") continue;

        // Offensive orders keep pushing
        if (f.onOffense) continue;

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

        // Nur Verteidiger (aggro≥80) nahe Heim → zurück auf Sitz nach Entwarnung
        if (
          !threatened &&
          f.state === "gang" &&
          !f.invading &&
          f.aggro >= 80 &&
          Math.abs(f.gangX - homeGx) < 0.2
        ) {
          const seat = f.seatIndex ?? f._homeSeat ?? this.freeSeat(home);
          if (seat != null) {
            const end = seatPos(home, seat);
            this.startPath(f, this.pathViaDoors(f.blockId, home, end), "home");
            f._homeSeat = seat;
            f.aggro = 10;
            f.onOffense = false;
          }
        }
      }
    }
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
    void dt;
    for (const a of this.fans) {
      if (a.hp <= 0 || a.kind !== "ultras" && a.kind !== "hooligans") continue;
      if (a.state !== "gang" && !a.invading) continue;
      const post = this.nearestHostileOrdnerPost(a);
      if (!post || a.attackCd > 0) continue;
      const pos = this.ordnerPostGangPos(post);
      const d = dist(a.x, a.y, pos.x, pos.y);
      const reach = a.rangedPyro ? RANGED_RANGE : MELEE_RANGE;
      if (d > reach) continue;
      a.armSwing = 1;
      a.attackCd = HIT_CD / Math.max(0.4, this.attackOf(a));
      const dmg = this.ordnerPostDamageFrom(a);
      const key = slotKey(post.blockId, post.index);
      if (a.rangedPyro) {
        this.spawnPyroShot(a, pos.x, pos.y, dmg, null, key);
      } else {
        this.damageOrdnerPost(post, dmg, a);
      }
    }
  }

  hooliganOrderReady(): boolean {
    return (
      this.currency.beer >= HOOLIGAN_ORDER_BEER &&
      this.fans.some(
        (f) =>
          f.team === this.playerTeam &&
          f.kind === "hooligans" &&
          f.hp > 0 &&
          f.state === "block",
      )
    );
  }

  tryHooliganOrder(): boolean {
    const list = this.fans.filter(
      (f) =>
        f.team === this.playerTeam &&
        f.kind === "hooligans" &&
        f.hp > 0 &&
        f.state === "block",
    );
    if (!list.length) {
      this.toast("Keine Hooligans im Block");
      return false;
    }
    const door = doorPos(this.homeBlockOf(list[0]));
    if (!this.spend("beer", HOOLIGAN_ORDER_BEER, door, "BIER")) {
      this.toast(`Kampf braucht ${HOOLIGAN_ORDER_BEER} Bier`);
      return false;
    }
    list[0].rangedPyro = false;
    this.sendToGang(list[0]);
    this.cd.hooliganOrder = 0;
    this.toast("Hooligan → Angriff (Nahkampf)");
    return true;
  }

  pyroFightReady(): boolean {
    return (
      this.currency.merch >= PYRO_FIGHT_MERCH &&
      this.fans.some(
        (f) =>
          f.team === this.playerTeam &&
          f.kind === "ultras" &&
          f.hp > 0 &&
          f.state === "block",
      )
    );
  }

  tryPyroFight(): boolean {
    const list = this.fans.filter(
      (f) =>
        f.team === this.playerTeam &&
        f.kind === "ultras" &&
        f.hp > 0 &&
        f.state === "block",
    );
    if (!list.length) {
      this.toast("Keine Ultras im Block");
      return false;
    }
    const door = doorPos(this.homeBlockOf(list[0]));
    if (!this.spend("merch", PYRO_FIGHT_MERCH, door, "FANARTIKEL")) {
      this.toast(`Pyro-Kampf braucht ${PYRO_FIGHT_MERCH} Fanartikel`);
      return false;
    }
    const u = list[0];
    u.rangedPyro = true;
    this.applyUnitLevelStats(u);
    this.sendToGang(u);
    this.cd.pyroFight = 0;
    this.toast("Ultra → Pyro Wurf");
    return true;
  }

  private sendToGang(f: FanUnit): void {
    const door = doorPos(f.blockId);
    const lane = gangLanePos(f.blockId);
    // Keep seatIndex reserved while alive on gang
    f._homeSeat = f.seatIndex;
    f.state = "moving";
    f.standKey = null;
    f.invading = false;
    f.onOffense = true;
    f.aggro = 40; // offense — keep pushing, don't auto-sit
    f.path = [
      { x: door.x, y: door.y },
      { x: lane.x, y: lane.y },
    ];
    f.pathI = 0;
    this.setAfter(f, "gang");
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
    const p = seatPos(blockId, seat);
    if (c.beer > 0) this.spend("beer", c.beer, p, "BIER");
    if (c.merch > 0) this.spend("merch", c.merch, p, "FANARTIKEL");
    if (c.security > 0) this.spend("security", c.security, p, "SICHERHEIT");
    if (c.gold > 0) {
      this.gold -= c.gold;
      this.floatAt(p.x, p.y, `−${c.gold}€`, false);
    }
    this.fans.push(this.makeFan(kind, this.playerTeam, blockId, seat));
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

  minUnitLevel(kind: FanKind | "ordner", team: TeamId = this.playerTeam): number {
    const u = this.lowestLevelUnit(kind, team);
    return u ? u.level || 1 : 1;
  }

  maxUnitLevel(kind: FanKind | "ordner", team: TeamId = this.playerTeam): number {
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

  /** Sidebar label: "Lv3" or "Lv1–3" when the squad is mixed */
  unitLevelLabel(kind: FanKind | "ordner", team: TeamId = this.playerTeam): string {
    const lo = this.minUnitLevel(kind, team);
    const hi = this.maxUnitLevel(kind, team);
    if (hi <= 0) return "Lv1";
    if (lo === hi) return `Lv${lo}`;
    return `Lv${lo}–${hi}`;
  }

  unitUpgradeCostFor(kind: FanKind | "ordner"): number | null {
    const u = this.lowestLevelUnit(kind, this.playerTeam);
    if (!u) return null;
    return unitUpgradeCost(u.level || 1);
  }

  canUpgradeUnit(kind: FanKind | "ordner"): boolean {
    const cost = this.unitUpgradeCostFor(kind);
    return cost != null && this.gold >= cost;
  }

  tryUpgradeUnit(kind: FanKind | "ordner"): boolean {
    const u = this.lowestLevelUnit(kind, this.playerTeam);
    if (!u) {
      this.toast(kind === "ordner" ? "Kein Ordner" : "Keine Einheit");
      return false;
    }
    const cost = unitUpgradeCost(u.level || 1);
    if (cost == null) {
      this.toast("Max. Stufe");
      return false;
    }
    if (this.gold < cost) {
      this.toast(`${cost}€ nötig`);
      return false;
    }
    this.gold -= cost;
    u.level = (u.level || 1) + 1;
    this.applyUnitLevelStats(u);
    const label =
      kind === "ordner" ? "Ordner" : FAN_STATS[kind].label;
    this.floatAt(u.x, u.y, `${label} Lv${u.level}`, true);
    this.toast(`${label} → Lv${u.level}`);
    return true;
  }

  update(dt: number): void {
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
    if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - step * 1.15);

    this.tickEconomy(step);
    this.tickSecurityBaseline(step);
    this.tickStewards(step);
    this.tickFans(step);
    this.tickRecallForDefense(step);
    this.tickAutoDefend(step);
    this.updateBattleLines(step);
    this.tickCaptureConvert(step);
    this.tickOrdnerPostCombat(step);
    this.tickCombat(step);
    this.tickPyroShots(step);
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

  /** Intact grey neutral Ordnerposten still standing. */
  greyMidPostAlive(): boolean {
    return this.slots.some(
      (s) =>
        s.greyNeutral &&
        s.building === "ordner" &&
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
   * Base Sicherheit: start 50; grey mid-post regens toward 50 when safe.
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

  /** Grey Ordner only make sense while the booth sits between both battle lines */
  private isContestedGangZone(blockId: number): boolean {
    const mid = blockIdToGangX(blockId);
    // Contested = Heim front has not clearly passed AND Gast front has not clearly passed
    return this.linePlayer < mid + 0.04 && this.lineAi > mid - 0.04;
  }

  private tickStewards(dt: number): void {
    // Neutral posts: slow respawn ONLY while still in contested (grey) territory
    for (const s of this.slots) {
      if (s.building !== "ordner" || s.owner !== "neutral" || s.greyNeutral) continue;
      if (!this.isContestedGangZone(s.blockId)) {
        // Freeze timer while deep in blue/red land — no grey reinforcements
        continue;
      }
      const key = slotKey(s.blockId, s.index);
      const aliveAtPost = this.fans.filter(
        (f) => f.hp > 0 && f.isSteward && f.homeStandKey === key,
      ).length;
      const neutralAlive = this.fans.filter(
        (f) => f.hp > 0 && f.isSteward && f.team === "neutral",
      ).length;
      if (neutralAlive >= STEWARD_CAP) continue;
      s.stewardCd -= dt;
      if (aliveAtPost >= STEWARD_CAP) continue;
      if (s.stewardCd > 0) continue;
      s.stewardCd = NEUTRAL_STEWARD_RESPAWN;
      this.fans.push(this.makeSteward("neutral", s));
      this.toast("Neutraler Ordner kehrt zurück");
    }

    for (const f of this.fans) {
      if (!f.isSteward || f.hp <= 0 || f.state === "moving") continue;
      const stand = this.slots.find(
        (s) => slotKey(s.blockId, s.index) === f.homeStandKey,
      );
      if (!stand) continue;

      const postGx = this.stewardPostGangX(f);
      const band = this.stewardPatrolBand(f);
      const chaseBand = {
        min: clamp(postGx - STEWARD_STATS.chaseRadius, 0.02, 0.98),
        max: clamp(postGx + STEWARD_STATS.chaseRadius, 0.02, 0.98),
      };
      const threat = this.stewardThreat(f, chaseBand);
      const midY = gangMidY();
      // Always on gang lane — never stuck on the booth sprite
      f.y = midY + Math.sin(this.realElapsed * 2.2 + f.id) * 0.006;

      if (threat) {
        const speed = STEWARD_STATS.chaseSpeed;
        const dx = threat.x - f.x;
        const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
        f.x += step;
        this.syncGangFromWorld(f);
        // Never chase beyond post neighborhood
        f.gangX = clamp(f.gangX, chaseBand.min, chaseBand.max);
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

      // Slow heal while inside the tight post radius (patrol bubble)
      if (
        Math.abs(f.gangX - postGx) <= STEWARD_STATS.postRadius + 0.01 &&
        f.hp < f.maxHp
      ) {
        f.hp = Math.min(f.maxHp, f.hp + STEWARD_STATS.healPerSec * dt);
      }

      f.state = "gang";
      f.blockId = stand.blockId;
    }
  }

  private stewardPostGangX(f: FanUnit): number {
    if (!f.homeStandKey) return f.gangX;
    const [b] = f.homeStandKey.split(":").map(Number);
    return blockIdToGangX(b);
  }

  /** Always patrol in a tight bubble around the home Ordnerposten */
  private stewardPatrolBand(f: FanUnit): { min: number; max: number } {
    const postGx = this.stewardPostGangX(f);
    const r = STEWARD_STATS.postRadius;
    return {
      min: clamp(postGx - r, 0.02, 0.98),
      max: clamp(postGx + r, 0.02, 0.98),
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
      const gx = blockIdToGangX(s.blockId);
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
      const gx = blockIdToGangX(s.blockId);
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

  private nearestBierStand(
    team: TeamId | "neutral",
    fromBlock: number,
  ): BuildSlot | null {
    let best: BuildSlot | null = null;
    let bestD = 99;
    for (const s of this.slots) {
      if (s.building !== "bier" || s.beer < 1) continue;
      if (s.owner !== team && !(s.owner === "neutral" && team === "neutral")) {
        if (s.owner !== team) continue;
      }
      const d = Math.abs(s.blockId - fromBlock);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    // also allow own-team stands only
    if (!best) {
      for (const s of this.slots) {
        if (s.building !== "bier" || s.beer < 1 || s.owner !== team) continue;
        const d = Math.abs(s.blockId - fromBlock);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
    }
    return best;
  }

  private nearestFanshop(team: TeamId, fromBlock: number): BuildSlot | null {
    let best: BuildSlot | null = null;
    let bestD = 99;
    for (const s of this.slots) {
      if (s.building !== "fanshop" || s.owner !== team || s.greyNeutral) continue;
      const d = Math.abs(s.blockId - fromBlock);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  private tickFans(dt: number): void {
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward) continue;

      if (f.state === "block") {
        // Soft idle motion inside the stand (not frozen on a grid cell)
        if (f.seatIndex != null) {
          const home = seatPos(f.blockId, f.seatIndex);
          const ang = this.realElapsed * 0.85 + f.id * 0.37;
          const rad = 0.014;
          const tx = home.x + Math.cos(ang) * rad;
          const ty = home.y + Math.sin(ang * 1.25) * rad * 0.65;
          f.x += (tx - f.x) * Math.min(1, 2.8 * dt);
          f.y += (ty - f.y) * Math.min(1, 2.8 * dt);
        }
        // Team fans visit Bier + Fanshop on separate timers (gold into till)
        if (f.team !== "neutral" && !f.onOffense) {
          this.maybeStartStandVisit(f);
        }
      } else if (f.state === "moving") {
        this.followPath(f, dt);
      } else if (f.state === "stand") {
        // Hold drink / shop pose before resolving the visit
        if (f.drinkT > 0 || f.shopT > 0) continue;
        this.finishStandVisit(f);
      } else if (f.state === "gang") {
        this.tickGangMove(f, dt);
      }
    }
  }

  /**
   * Pick Bier or Fanshop when timers are due.
   * Fans → Fanshop only · Hools → Bier only · Ultras → both (beer-first).
   */
  private maybeStartStandVisit(f: FanUnit): void {
    if (f.team !== this.playerTeam && f.team !== this.aiTeam) return;
    const team = f.team as TeamId;
    const wantsBeer = canVisit(f.kind, "beer");
    const wantsShop = canVisit(f.kind, "shop");
    const beerReady =
      wantsBeer && this.realElapsed >= (f.satisfiedUntil || 0);
    const shopReady = wantsShop && this.realElapsed >= (f.shopUntil || 0);
    if (!beerReady && !shopReady) return;

    const bier = beerReady ? this.nearestBierStand(team, f.blockId) : null;
    const shop = shopReady ? this.nearestFanshop(team, f.blockId) : null;

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
    const sp = this.standWorld(stand);
    this.startPath(
      f,
      this.pathViaDoors(f.blockId, stand.blockId, sp),
      pick === "beer" ? "stand" : "shop",
    );
    f.standKey = slotKey(stand.blockId, stand.index);
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

  private finishStandVisit(f: FanUnit): void {
    const stand = this.slots.find(
      (s) => slotKey(s.blockId, s.index) === f.standKey,
    );
    const lv = f.level || 1;
    if (stand?.building === "bier" && stand.beer >= 1) {
      stand.beer -= 1;
      f.thirst = 5;
      const beerIv = visitInterval(f.kind, "beer", lv);
      f.satisfiedUntil =
        beerIv == null ? 1e9 : this.realElapsed + beerIv;
      const pay = visitGoldPayout("beer", lv);
      this.payVisitGold(stand, pay);
      this.floatAtSlot(stand, "−1 Fass", false);
    } else if (stand?.building === "fanshop") {
      const shopIv = visitInterval(f.kind, "shop", lv);
      f.shopUntil = shopIv == null ? 1e9 : this.realElapsed + shopIv;
      const pay = visitGoldPayout("shop", lv);
      this.payVisitGold(stand, pay);
    } else {
      // Visit failed (empty bier / missing stand) — short backoff
      if (canVisit(f.kind, "beer")) f.satisfiedUntil = this.realElapsed + 8;
      if (canVisit(f.kind, "shop")) f.shopUntil = this.realElapsed + 8;
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
    const end = seat != null ? seatPos(home, seat) : doorPos(home);
    this.startPath(f, this.pathViaDoors(f.blockId, home, end), "home");
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

  private pathViaDoors(
    fromBlock: number,
    toBlock: number,
    end: { x: number; y: number },
  ): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    if (fromBlock !== toBlock) {
      path.push(doorPos(fromBlock));
      path.push(gangLanePos(fromBlock));
      path.push(gangLanePos(toBlock));
      path.push(doorPos(toBlock));
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
    const midY = gangMidY();
    const onGangCorridor = Math.abs(f.y - midY) < 0.09 || Math.abs(t.y - midY) < 0.09;

    // Cannot walk past hostile units (to beer stand / home / invade)
    if (onGangCorridor && f.team !== "neutral") {
      const moveDir = Math.sign(t.x - f.x) || (f.team === this.playerTeam ? 1 : -1);
      const blocker =
        this.blockerAhead(f, moveDir) ??
        (Math.abs(t.x - f.x) < 0.04 ? this.foeInWay(f) : null);
      if (blocker) {
        // Offense units: leave path-follow and enter gang combat so they
        // keep pushing / shooting instead of freezing mid-route.
        if (f.onOffense && Math.abs(f.y - midY) < 0.1) {
          f.state = "gang";
          f.path = [];
          f.pathI = 0;
          this.setAfter(f, "");
          f.y = midY;
          this.syncGangFromWorld(f);
          if (f.aggro < 80) f.aggro = 40;
          return;
        }
        const gap = (blocker.x - f.x) * moveDir;
        const reach = f.rangedPyro ? RANGED_RANGE * 0.7 : MELEE_RANGE * 0.35;
        if (gap > reach) {
          const step = Math.min(gap - reach, 0.14 * dt);
          f.x += moveDir * step;
        }
        f.y += (midY - f.y) * Math.min(1, 8 * dt);
        this.syncGangFromWorld(f);
        // Don't promote attackers to "defender" mid-path — keeps Angriff pushing
        if (!f.onOffense) f.aggro = 100;
        else if (f.aggro < 80) f.aggro = 40;
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
    if (Math.abs(f.y - midY) < 0.06) {
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
      f.y = gangMidY();
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
          f.gangX = blockIdToGangX(stand.blockId);
        }
      }
    } else if (after === "stand") {
      f.state = "stand";
      f.drinkT = ANIM_DRINK_SEC;
      f.armSwing = 0.85;
      if (f.standKey) {
        const [b] = f.standKey.split(":").map(Number);
        f.blockId = b;
      }
    } else if (after === "shop") {
      f.state = "stand";
      f.shopT = ANIM_SHOP_SEC;
      f.armSwing = 0.55;
      if (f.standKey) {
        const [b] = f.standKey.split(":").map(Number);
        f.blockId = b;
      }
    } else if (after === "home") {
      f.state = "block";
      f.invading = false;
      f.onOffense = false;
      const home = this.homeBlockOf(f);
      f.blockId = home;
      const seat = f.seatIndex ?? f._homeSeat ?? this.freeSeat(home);
      f.seatIndex = seat;
      if (seat != null) {
        const p = seatPos(home, seat);
        f.x = p.x;
        f.y = p.y;
      }
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

  /** Enemy in front on gang / path — cannot walk past without fighting */
  private blockerAhead(f: FanUnit, dirHint?: number): FanUnit | null {
    const dir =
      dirHint ??
      (f.team === this.playerTeam ? 1 : f.team === this.aiTeam ? -1 : 1);
    let best: FanUnit | null = null;
    // Keep detection modest so attackers don't "see" the whole gang from home
    let bestD = f.rangedPyro ? RANGED_RANGE * 0.95 : MELEE_RANGE * 2.2;
    for (const o of this.fans) {
      if (!this.isHostileUnit(f, o)) continue;
      const onLane =
        o.state === "gang" ||
        o.isSteward ||
        o.state === "stand" ||
        o.state === "moving" ||
        (o.state === "block" && Math.abs(blockIdToGangX(o.blockId) - f.gangX) < 0.12);
      if (!onLane) continue;
      const dx = (o.x - f.x) * dir;
      if (dx < -0.02 || dx > bestD) continue;
      if (Math.abs(o.y - f.y) > 0.14) continue;
      bestD = dx;
      best = o;
    }
    return best;
  }

  /** Closest foe near current position (any direction) — used when heading to beer */
  private foeInWay(f: FanUnit): FanUnit | null {
    let best: FanUnit | null = null;
    let bestD = MELEE_RANGE * 1.8;
    for (const o of this.fans) {
      if (!this.isHostileUnit(f, o)) continue;
      const onLane =
        o.state === "gang" ||
        o.isSteward ||
        o.state === "moving" ||
        o.state === "stand";
      if (!onLane && !(o.state === "block" && Math.abs(o.y - f.y) < 0.08)) continue;
      const d = dist(f.x, f.y, o.x, o.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  private syncGangFromWorld(f: FanUnit): void {
    const left = blockCenterX(0);
    const right = blockCenterX(BLOCK_COUNT - 1);
    f.gangX = clamp((f.x - left) / (right - left || 1), 0, 1);
    f.x = gangXToWorld(f.gangX);
  }

  private tickGangMove(f: FanUnit, dt: number): void {
    if (f.isSteward) return;
    const dir = f.team === this.playerTeam ? 1 : -1;
    const speed = 0.065 * FAN_STATS[f.kind].fight;
    const midY = gangMidY();
    const goalBlock = f.team === this.playerTeam ? GAST_BLOCK : HEIM_BLOCK;

    // Angreifer (onOffense) pushen immer vorwärts. Nur echte Heim-Verteidiger
    // laufen zurück, wenn Feinde am Heimblock sind.
    const team = f.team as TeamId;
    const homeGx = blockIdToGangX(
      team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK,
    );
    const defendHome =
      !f.onOffense &&
      f.aggro >= 80 &&
      this.teamHomeThreatened(team) &&
      (dir > 0 ? f.gangX > homeGx + 0.12 : f.gangX < homeGx - 0.12);
    const moveDir = defendHome ? -dir : dir;

    const ordPosts = defendHome ? [] : this.blockingOrdnerPosts(f, goalBlock);
    const cementWall = defendHome ? null : this.cementWallAhead(f);
    const pressingCement =
      cementWall != null &&
      (f.kind === "hooligans" || f.kind === "ultras") &&
      !defendHome;
    const cementSlow = pressingCement ? CEMENT_SLOW_MUL : 1;
    const moveSpeed = speed * cementSlow;
    if (pressingCement) {
      f.hp = Math.max(0, f.hp - CEMENT_DOT_PER_SEC * dt);
    }
    const blocker = this.blockerAhead(f, moveDir);
    const gapToBlocker = blocker ? (blocker.x - f.x) * moveDir : 999;
    // Offense always marches; only halt in true contact range (melee / short pyro hold)
    const haltGap = f.rangedPyro ? RANGED_RANGE * 0.32 : MELEE_RANGE * 0.55;
    const inHalt = blocker != null && gapToBlocker <= haltGap;

    if (inHalt && blocker && !f.onOffense) {
      if (f.rangedPyro) {
        const desired = blocker.x - moveDir * (RANGED_RANGE * 0.4);
        f.x += (desired - f.x) * Math.min(1, 5 * dt);
        f.y += (midY - f.y) * Math.min(1, 8 * dt);
      } else {
        const targetGap = MELEE_RANGE * 0.2;
        if (gapToBlocker > targetGap) {
          f.x += moveDir * Math.min(gapToBlocker - targetGap, moveSpeed * 2.4 * dt);
        } else {
          f.x += moveDir * moveSpeed * 0.4 * dt;
        }
        f.y += (blocker.y - f.y) * Math.min(1, 10 * dt);
      }
      this.syncGangFromWorld(f);
    } else if (inHalt && blocker && f.onOffense) {
      // Stick to the front Ordner / foe — fight until cleared, no walk-past
      const targetGap = f.rangedPyro ? RANGED_RANGE * 0.35 : MELEE_RANGE * 0.22;
      if (gapToBlocker > targetGap) {
        f.x += moveDir * Math.min(gapToBlocker - targetGap, moveSpeed * 1.4 * dt);
      } else {
        f.x += (blocker.x - moveDir * targetGap - f.x) * Math.min(1, 6 * dt);
      }
      f.y += (blocker.y - f.y) * Math.min(1, 8 * dt);
      this.syncGangFromWorld(f);
      if (f.aggro < 80) f.aggro = 40;
    } else {
      f.gangX = clamp(f.gangX + moveDir * moveSpeed * dt, 0, 1);
      f.x = gangXToWorld(f.gangX);
      f.y = midY + Math.sin(this.realElapsed * 3 + f.id) * 0.008;
    }

    // Cement: soft damage/slow gate — creep up to breakthrough, not a hard wall
    if (pressingCement && cementWall != null) {
      const hardCap = cementWall + dir * CEMENT_BREAKTHROUGH;
      if (dir > 0) f.gangX = Math.min(f.gangX, hardCap);
      else f.gangX = Math.max(f.gangX, hardCap);
      f.x = gangXToWorld(f.gangX);
    }
    if (ordPosts.length && (f.kind === "hooligans" || f.kind === "ultras")) {
      const capGx = blockIdToGangX(ordPosts[0].blockId) - dir * 0.028;
      if (dir > 0) f.gangX = Math.min(f.gangX, capGx);
      else f.gangX = Math.max(f.gangX, capGx);
      f.x = gangXToWorld(f.gangX);
    }

    if (defendHome) return;

    const goalGx = blockIdToGangX(goalBlock);
    const foe = team === this.playerTeam ? this.aiTeam : this.playerTeam;
    const foeCement = this.cementEdgeGx(foe);
    const pastCement =
      dir > 0 ? foeCement < f.gangX - 0.01 : foeCement > f.gangX + 0.01;
    const canInvade =
      !inHalt && ordPosts.length === 0 && (cementWall == null || pastCement);
    const reached =
      f.team === this.playerTeam
        ? f.gangX >= goalGx - 0.02
        : f.gangX <= goalGx + 0.02;
    if (reached && canInvade) {
      const door = doorPos(goalBlock);
      f.blockId = goalBlock;
      f.path = [
        { x: gangLanePos(goalBlock).x, y: gangLanePos(goalBlock).y },
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

  /** Own ultras leave seats to defend when enemy Ultra is in / approaching home */
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
          f.kind === "ultras" &&
          f.state === "block" &&
          !f.invading &&
          f.blockId === home,
      );
      // Send up to 2 ultras out when threatened
      let sent = 0;
      for (const u of defenders) {
        if (sent >= 2) break;
        if (underAttack) {
          // Stay in block and fight — they'll engage via combat; nudge toward invader
          const inv = this.fans.find(
            (e) =>
              e.hp > 0 &&
              e.kind === "ultras" &&
              e.team !== team &&
              e.blockId === home &&
              (e.invading || e.state === "block"),
          );
          if (inv) {
            u.x += (inv.x - u.x) * 0.15;
            u.y += (inv.y - u.y) * 0.15;
            u.aggro = 100;
          }
        } else if (lineThreat) {
          this.sendToGang(u);
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

    // Invading ultras hunt nearest living defender in block (no idle standing)
    for (const inv of this.fans) {
      if (!inv.invading || inv.hp <= 0) continue;
      const foes = this.fans.filter(
        (d) =>
          d.hp > 0 &&
          d.team !== inv.team &&
          d.team !== "neutral" &&
          d.blockId === inv.blockId &&
          d.state === "block" &&
          !d.invading &&
          d.kind !== "hooligans",
      );
      if (!foes.length) continue;
      foes.sort((a, b) => dist(inv.x, inv.y, a.x, a.y) - dist(inv.x, inv.y, b.x, b.y));
      const t = foes[0];
      // Close to melee range before fighting
      const d = dist(inv.x, inv.y, t.x, t.y);
      if (d > MELEE_RANGE * 0.85) {
        const step = Math.min(1, 0.35);
        inv.x += (t.x - inv.x) * step;
        inv.y += (t.y - inv.y) * step;
      }
    }
  }

  private tickCombat(dt: number): void {
    void dt;
    for (const a of this.fans) {
      if (a.hp <= 0) continue;
      if (a.team === "neutral" && !a.isSteward) continue;

      const home = a.team === this.playerTeam ? HEIM_BLOCK : a.team === this.aiTeam ? GAST_BLOCK : -1;
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

      let best: FanUnit | null = null;
      const reach = a.rangedPyro ? RANGED_RANGE : MELEE_RANGE;
      let bestD = reach;

      for (const b of this.fans) {
        if (b.hp <= 0 || b === a) continue;
        const hostile =
          b.team !== a.team && (b.team !== "neutral" || b.isSteward);
        if (!hostile) continue;

        const sameBlockFight =
          a.blockId === b.blockId &&
          (a.state === "block" || a.invading) &&
          (b.state === "block" || b.invading) &&
          a.kind !== "normalos" &&
          b.kind !== "normalos";

        const midY = gangMidY();
        const aOnCorridor =
          a.state === "gang" ||
          a.isSteward ||
          a.state === "stand" ||
          (a.state === "moving" && Math.abs(a.y - midY) < 0.1);
        const bOnCorridor =
          b.state === "gang" ||
          b.isSteward ||
          b.state === "stand" ||
          (b.state === "moving" && Math.abs(b.y - midY) < 0.1);
        const sameLane =
          sameBlockFight || (aOnCorridor && bOnCorridor);

        if (!sameLane) continue;
        const d = dist(a.x, a.y, b.x, b.y);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      if (a.state === "gang" && (a.kind === "ultras" || a.kind === "hooligans")) {
        const post = this.nearestHostileOrdnerPost(a);
        if (post) {
          const pos = this.ordnerPostGangPos(post);
          const reachPost = a.rangedPyro ? RANGED_RANGE : MELEE_RANGE;
          if (dist(a.x, a.y, pos.x, pos.y) <= reachPost * 1.05) continue;
        }
      }

      if (!best || a.attackCd > 0) continue;

      a.armSwing = 1;
      a.attackCd = HIT_CD / Math.max(0.4, this.attackOf(a));

      if (a.rangedPyro && (a.state === "gang" || a.state === "moving" || a.isSteward)) {
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

      // Counter-hit only in melee reach — ranged pyro must not eat free Ordner punches
      // from halfway across the gang.
      if (best.hp > 0 && best.kind !== "hooligans") {
        const counterReach = best.isSteward || a.isSteward ? MELEE_RANGE * 1.15 : MELEE_RANGE;
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
      if (target.hp <= 0) target.hp = 0;
      return;
    }
    const dmg =
      (HIT_DAMAGE * HIT_DAMAGE_SCALE * rangedMul * this.attackOf(attacker) * this.neighborBonus(attacker) * atkMul) /
      Math.max(0.35, (this.defenseOf(target) * defMul) / this.neighborBonus(target));
    target.hp -= dmg;
    // Hitting an attacker must not cancel their push (aggro→100 used to recall them)
    if (!target.onOffense) {
      target.aggro = clamp(target.aggro + 12, 0, 100);
    } else if (target.aggro < 80) {
      target.aggro = 40;
    }
    if (target.hp <= 0) {
      target.hp = 0;
      if (target.isSteward) {
        this.onStewardDefeated(target);
        this.toast("Ordner besiegt");
      } else {
        this.toast(`${FAN_STATS[target.kind].label} besiegt`);
      }
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

  /** Neutral capture: spatial wave from battle-line pressure + neighbor seats */
  private tickNeutralCapture(dt: number): void {
    this.defectAcc += dt;
    for (const f of this.fans) {
      if (f.team !== "neutral" || f.hp <= 0 || f.isSteward) continue;
      if (f.state !== "block" || f.seatIndex == null) continue;
      if (f.blockId !== 1 && f.blockId !== 2) continue;

      const col = f.seatIndex % 3; // 0 left (heimward) … 2 right (gastward)
      const blockGx = blockIdToGangX(f.blockId);
      // How far each front has entered this block's zone (−1..1-ish)
      const playerDepth = clamp((this.linePlayer - (blockGx - 0.18)) / 0.36, 0, 1);
      const aiDepth = clamp(((blockGx + 0.18) - this.lineAi) / 0.36, 0, 1);

      // Spatial: heim pressure hits left columns first, gast hits right first
      const colHeimBias = 1 - col / 2; // col0=1, col1=0.5, col2=0
      const colGastBias = col / 2; // col0=0, col1=0.5, col2=1
      let pull =
        playerDepth * (0.35 + 0.55 * colHeimBias) -
        aiDepth * (0.35 + 0.55 * colGastBias);

      // Neighbor seats already converted push further
      let nearHeim = 0;
      let nearGast = 0;
      for (const o of this.fans) {
        if (o.hp <= 0 || o.isSteward || o.blockId !== f.blockId) continue;
        if (o.state !== "block" || o.seatIndex == null) continue;
        if (Math.abs(o.seatIndex - f.seatIndex) > 2) continue;
        if (o.team === this.playerTeam) nearHeim++;
        if (o.team === this.aiTeam) nearGast++;
      }
      pull += nearHeim * 0.22 - nearGast * 0.22;
      pull += this.momentum * 0.12;

      const ultraP = this.fans.some(
        (o) =>
          o.hp > 0 &&
          o.team === this.playerTeam &&
          o.kind === "ultras" &&
          (o.blockId === f.blockId ||
            (o.state === "gang" && Math.abs(o.gangX - blockGx) < 0.12)),
      );
      const ultraA = this.fans.some(
        (o) =>
          o.hp > 0 &&
          o.team === this.aiTeam &&
          o.kind === "ultras" &&
          (o.blockId === f.blockId ||
            (o.state === "gang" && Math.abs(o.gangX - blockGx) < 0.12)),
      );
      if (ultraP) pull += 0.5 * colHeimBias + 0.15;
      if (ultraA) pull -= 0.5 * colGastBias + 0.15;

      f.lean = clamp(f.lean + pull * dt * 0.045, -1, 1);
      const pressure = Math.abs(pull);
      // Slower seat-by-seat convert — clearly visible per person
      const rate = 0.01 + pressure * 0.022 + (ultraP || ultraA ? 0.015 : 0);
      if (f.lean > 0.35) f.captureProg = clamp(f.captureProg + rate * dt, 0, 1);
      else if (f.lean < -0.35)
        f.captureProg = clamp(f.captureProg - rate * dt, -1, 0);
      else f.captureProg *= 1 - 0.06 * dt;

      if (f.captureProg >= 1) {
        f.team = this.playerTeam;
        f.homeBlockId = f.blockId;
        f.lean = 1;
        f.captureProg = 0;
        this.toast(`Sitz → ${teamLabel(this.playerTeam)}`);
        this.floatAt(f.x, f.y, "✓ Heim", true);
      } else if (f.captureProg <= -1) {
        f.team = this.aiTeam;
        f.homeBlockId = f.blockId;
        f.lean = -1;
        f.captureProg = 0;
        this.toast(`Sitz → ${teamLabel(this.aiTeam)}`);
        this.floatAt(f.x, f.y, "✓ Gäste", false);
      }
    }

    this.refillNeutralSeats(dt);
  }

  private refillNeutralSeats(dt: number): void {
    if (this.defectAcc < 4.5) return;
    this.defectAcc = 0;
    for (const blockId of [NEUTRAL_BLOCK]) {
      if (this.blockOwner[blockId] !== "neutral") continue;
      const seated = this.fans.filter(
        (f) =>
          f.hp > 0 &&
          !f.isSteward &&
          f.blockId === blockId &&
          f.state === "block" &&
          f.seatIndex != null,
      ).length;
      const target = 9; // ¾ of 12
      if (seated >= target) continue;
      const seat = this.freeSeat(blockId);
      // Only refill as neutral — converted seats stay team-colored
      const kind: FanKind =
        seated % 3 === 0 ? "normalos" : seated % 3 === 1 ? "hooligans" : "ultras";
      this.fans.push(this.makeFan(kind, "neutral", blockId, seat));
    }
    void dt;
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

    // Mood display mirrors block power (not shops / not goals)
    const targetHeim = clamp(0.35 + pHeim * MOOD_FROM_POWER, 0, 3);
    const targetGast = clamp(0.35 + pGast * MOOD_FROM_POWER, 0, 3);
    const moodApproach = 1 - Math.exp(-0.55 * dt);
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
  }

  private tickBlockStorm(dt: number): void {
    const countInv = (team: TeamId, blockId: number) =>
      this.fans.filter(
        (f) =>
          f.hp > 0 &&
          f.team === team &&
          f.kind === "ultras" &&
          f.blockId === blockId &&
          (f.state === "block" || f.invading),
      ).length;

    const pN = countInv(this.playerTeam, GAST_BLOCK);
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

    const aN = countInv(this.aiTeam, HEIM_BLOCK);
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
   * Scoring side's seated home crowd rushes the Bierstand to celebrate.
   * They leave the block briefly → block power (and momentum) dips;
   * beer buys still pay gold into the till.
   */
  private startGoalCelebration(team: TeamId): void {
    const home = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const bier = this.nearestBierStand(team, home);
    let n = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.isSteward || f.team !== team) continue;
      if (f.onOffense) continue;
      if (f.state !== "block" || f.blockId !== home) continue;
      f.cheerT = 2.8;
      if (!bier) continue;
      const sp = this.standWorld(bier);
      this.startPath(
        f,
        this.pathViaDoors(f.blockId, bier.blockId, sp),
        "stand",
      );
      f.standKey = slotKey(bier.blockId, bier.index);
      n++;
    }
    this.floatAt(
      blockCenterX(home),
      blockTopY(home) + 0.08,
      bier && n > 0 ? "Kurve leer — Bierrunde" : "Jubel!",
      true,
    );
    if (bier && n > 0) {
      bier.beer = Math.min(bier.capacity, Math.max(bier.beer, n));
      this.toast("Jubel — Bierrunde!", 4.2);
      const p = this.standWorld(bier);
      this.floatAt(p.x, p.y - 0.06, "Bierrunde!", true);
    } else if (!bier) {
      this.toast("Jubel! (noch kein Bierstand)", 3.5);
    } else {
      this.toast("Jubel!", 3.0);
    }
  }

  private spawnGoalConfetti(team: TeamId): void {
    const blockId = team === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
    const cx = blockCenterX(blockId);
    const top = blockTopY(blockId);
    const colors =
      team === "ksc"
        ? ["#1d4ed8", "#60a5fa", "#f3f0e7", "#93c5fd"]
        : ["#b91c1c", "#f87171", "#f3f0e7", "#fecaca"];
    for (let i = 0; i < 48; i++) {
      this.confetti.push({
        x: cx + (Math.random() - 0.5) * blockWidthNorm() * 0.85,
        y: top + 0.02 + Math.random() * 0.04,
        vx: (Math.random() - 0.5) * 0.18,
        vy: 0.04 + Math.random() * 0.12,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 8,
        color: colors[i % colors.length],
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
      } else if (p.kind === "flare") {
        p.vy -= 0.04 * dt;
        p.vx *= 1 - dt * 0.15;
      }
    }
    this.moodFx = this.moodFx.filter((p) => p.t < p.life);
  }

  private tickAi(dt: number): void {
    this.aiAcc += dt;
    const diff = this.cfg.settings.difficulty;
    const regen = AI_SOFT_REGEN * (diff === "easy" ? 0.7 : diff === "hard" ? 1.2 : 1);
    // Soft regen of AI send/buy resources (damped vs old ~1.0/s)
    this.aiMerch = Math.min(120, this.aiMerch + dt * regen);
    this.aiBeer = Math.min(120, this.aiBeer + dt * regen);
    this.aiSecurity = Math.min(120, this.aiSecurity + dt * regen * 0.85);

    const interval = 7 / diffMul(diff);

    if (this.aiAcc < interval) return;
    this.aiAcc = 0;
    this.aiTryBuild();
    this.aiTryHireSteward();
    this.aiTryBuyFans();
    this.aiTryUpgradeUnits();
    const act = aiActionMul(diff);
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
    const want = diff === "hard" ? 3 : diff === "easy" ? 1 : 2;
    if (
      hools.length &&
      onGang < want &&
      this.aiBeer >= HOOLIGAN_ORDER_BEER &&
      Math.random() < 0.45 * act
    ) {
      this.aiBeer -= HOOLIGAN_ORDER_BEER;
      hools[0].rangedPyro = false;
      this.sendToGang(hools[0]);
    } else if (
      ultras.length &&
      onGang < want &&
      this.aiMerch >= PYRO_FIGHT_MERCH &&
      Math.random() < 0.3 * act
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
    if (Math.random() > 0.4) return;
    const kinds: (FanKind | "ordner")[] = [
      "hooligans",
      "ultras",
      "normalos",
      "ordner",
    ];
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
    if (Math.random() > 0.55 * act) return;
    const own = this.countTeamFans(this.aiTeam);
    const target =
      diff === "easy" ? 10 : diff === "hard" ? 16 : 13;
    if (own.normalos + own.ultras + own.hooligans >= target) return;

    const seat = this.freeSeat(GAST_BLOCK);
    const options: FanKind[] = [];
    if (this.aiSecurity >= BUY_COST.normalos.security) options.push("normalos");
    if (this.aiMerch >= BUY_COST.ultras.merch) options.push("ultras");
    if (this.aiBeer >= BUY_COST.hooligans.beer) options.push("hooligans");
    if (!options.length) return;
    // Prefer the type the AI is short on
    options.sort((a, b) => own[a] - own[b]);
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
