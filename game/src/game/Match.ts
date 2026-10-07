import {
  BLOCK_META,
  BLOCK_STORM_COUNT,
  BLOCK_STORM_SEC,
  BUILD_COST,
  BUY_COST,
  ET_REAL_SEC,
  FAMILY_SHOP_GOLD,
  FAMILY_SHOP_INTERVAL,
  FAN_STATS,
  FEVER_FROM_MIN,
  HIT_CD,
  HIT_DAMAGE,
  HIT_DAMAGE_SCALE,
  MELEE_RANGE,
  MOOD_CD,
  NEUTRAL_STEWARD_RESPAWN,
  NORMALO_BEER_INTERVAL,
  PROD_BEER,
  PROD_MERCH,
  PROD_SECURITY,
  PROD_SHOP_MOOD,
  REGULAR_REAL_SEC,
  SECURITY_FAMILY_GATE,
  STAND_CONVERT_SEC,
  STAND_CONVERT_SEAT_MAJORITY,
  START_GOLD,
  STEWARD_CAP,
  STEWARD_GOLD_PER_SEC,
  STEWARD_HIRE_GOLD,
  STEWARD_STATS,
  ULTRA_BEER_INTERVAL,
  ULTRA_ORDER_BEER,
  ULTRA_ORDER_CD,
  UPGRADE_COST,
  UPGRADE_MAX,
  productionRate,
  type AiDifficulty,
  type BuildSlot,
  type BuildingKind,
  type Currencies,
  type FanKind,
  type FanUnit,
  type MatchPhase,
  type MoodAction,
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
  SEATS_PER_BLOCK,
  blockCenterX,
  blockIdToGangX,
  blockTopY,
  blockWidthNorm,
  boothCenter,
  doorPos,
  gangLanePos,
  gangMidY,
  gangXToWorld,
  seatPos,
  slotIndicesForBlock,
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
  if (d === "easy") return 0.6;
  if (d === "hard") return 1.15;
  return 0.85;
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

export type MoodParticle = {
  kind: "note" | "smoke" | "spark";
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
  /** short jubel multipliers from gesang/pyro */
  jubelMulHeim = { ultras: 1, normalos: 1, familie: 1 };
  jubelMulGast = { ultras: 1, normalos: 1, familie: 1 };
  /** UI: brief momentum pulse after Gesang/Pyro (0..1) */
  moodKick = 0;
  /** UI: scoreboard punch after goal (0..1) */
  scorePulse = 0;
  /** last team that scored — for crest flash */
  lastGoalTeam: TeamId | null = null;
  confetti: ConfettiBit[] = [];
  moodFx: MoodParticle[] = [];
  speed: SpeedMode = 0;
  toasts: { text: string; t: number }[] = [];
  result: MatchResult | null = null;
  cd = { gesang: 0, pyro: 0, ultraOrder: 0 };
  /** AI mood cooldowns (independent of player) */
  aiCd = { gesang: 8, pyro: 10 };
  selectedSlot: { blockId: number; index: number } | null = null;
  selectedSeat: { blockId: number; seatIndex: number } | null = null;
  seatMenu: { blockId: number; seatIndex: number } | null = null;
  buildMenu: { blockId: number; index: number } | null = null;
  chanceAcc = 0;
  aiAcc = 0;
  defectAcc = 0;
  buildPulse = 0;
  captureAcc: Record<string, number> = {};
  aiGold = START_GOLD + 20;
  aiBuildRot = 0;
  /** soft AI mood resources (not shared with player wallet) */
  aiMerch = 40;
  aiBeer = 40;
  width = 960;
  height = 440;
  pensRound = 0;
  pens: { ksc: boolean | null; vfb: boolean | null }[] = [];
  pensTimer = 0;
  currency: Currencies = { beer: 0, merch: 0, security: 0 };
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
    this.blockOwner = [this.playerTeam, "neutral", "neutral", this.aiTeam];

    for (const b of BLOCK_META) {
      for (const i of slotIndicesForBlock(b.id)) {
        const isNeutral = b.id === 1 || b.id === 2;
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
        });
      }
    }

    // Neutrale Zone: Bier-Claims (grau) + aktiver Ordnerposten mit 2 Ordnern als Puffer
    for (const blockId of [1, 2]) {
      this.placeBuilding(blockId, 0, "bier", true, "neutral");
      const s0 = this.slots.find((x) => x.blockId === blockId && x.index === 0);
      if (s0) {
        s0.greyNeutral = true;
        s0.beer = 25;
      }
    }
    // Ein Ordnerposten in der Neutralzone (Block 1) mit zwei Ordnern ab Start
    // Same level/stats as any other Ordnerposten — not buffed
    this.placeBuilding(1, 1, "ordner", true, "neutral");
    const bufferPost = this.slots.find((x) => x.blockId === 1 && x.index === 1);
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
        st.gangX = blockIdToGangX(1) + spread * 0.5;
        st.patrolDir = i === 0 ? 1 : -1;
        this.fans.push(st);
      }
    }
    // Zweites Neutral-Slot-Index 1 bleibt freier Bauplatz (Claim später möglich)
    // Block 2 Index 1: freier + Slot ohne vorgebautes Gebäude

    const homeKinds = expandMix(cfg.playerSetup.mix);
    homeKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.playerTeam, HEIM_BLOCK, i));
    });
    const awayKinds = expandMix(cfg.aiSetup.mix);
    awayKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.aiTeam, GAST_BLOCK, i));
    });
    // Neutrale Blöcke: anfangs ¾ der Plätze besetzt (9/12), gemischt
    for (const blockId of [1, 2]) {
      for (let i = 0; i < 9; i++) {
        const kind: FanKind =
          i % 3 === 0 ? "normalos" : i % 3 === 1 ? "familie" : "ultras";
        this.fans.push(this.makeFan(kind, "neutral", blockId, i));
      }
    }

    this.toast(`${teamLabel(this.playerTeam)} vs ${teamLabel(this.aiTeam)} — ▶ starten`);
    this.speed = 0;
  }

  private makeFan(
    kind: FanKind,
    team: TeamId | "neutral",
    blockId: number,
    seatIndex: number,
  ): FanUnit {
    const seat = Math.min(seatIndex, SEATS_PER_BLOCK - 1);
    const p = seatPos(blockId, seat);
    const beerIv =
      kind === "ultras" ? ULTRA_BEER_INTERVAL : NORMALO_BEER_INTERVAL;
    return {
      id: uid(),
      kind,
      team,
      blockId,
      state: "block",
      seatIndex: seat,
      standKey: null,
      hp: FAN_STATS[kind].maxHp,
      maxHp: FAN_STATS[kind].maxHp,
      thirst: 25 + Math.random() * 25,
      satisfiedUntil:
        kind === "familie"
          ? 1e9
          : this.realElapsed + beerIv * (0.4 + Math.random() * 0.4),
      shopUntil:
        kind === "familie"
          ? this.realElapsed + FAMILY_SHOP_INTERVAL * (0.5 + Math.random() * 0.5)
          : 1e9,
      aggro: kind === "ultras" ? 30 : 10,
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
    };
  }

  private makeSteward(team: TeamId | "neutral", stand: BuildSlot): FanUnit {
    const sp = this.stewardPostPos(stand);
    const gx = blockIdToGangX(stand.blockId);
    const hp = STEWARD_STATS.maxHpBase + stand.level * STEWARD_STATS.maxHpPerLevel;
    return {
      id: uid(),
      kind: "normalos",
      team,
      blockId: stand.blockId,
      state: "moving",
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
      path: [sp],
      pathI: 0,
      armSwing: 0,
      attackCd: 0,
      invading: false,
      isSteward: true,
      homeStandKey: slotKey(stand.blockId, stand.index),
      homeBlockId: stand.blockId,
      patrolDir: Math.random() < 0.5 ? 1 : -1,
      cheerT: 0,
      _after: "steward",
    };
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
  }

  toast(text: string): void {
    this.toasts.push({ text, t: 2.2 });
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
      return `BLOCKSTURM ${Math.ceil(BLOCK_STORM_SEC - this.stormAccPlayer)}s · ${pInv}/3 Ultras`;
    }
    if (this.stormAccAi > 0) {
      return `GEGEN-STURM ${Math.ceil(BLOCK_STORM_SEC - this.stormAccAi)}s · ${aInv}/3`;
    }
    if (pInv > 0) return `ANGRIFF im Gästeblock · ${pInv} Ultra${pInv > 1 ? "s" : ""} — Verteidigung!`;
    if (aInv > 0) return `VERTEIDIGUNG · ${aInv} Feind-Ultra${aInv > 1 ? "s" : ""} im Heimblock`;
    return null;
  }

  securityOk(): boolean {
    return this.currency.security >= SECURITY_FAMILY_GATE;
  }

  canBuy(kind: FanKind): boolean {
    const c = BUY_COST[kind];
    if (kind === "familie") {
      return this.gold >= c.gold && this.securityOk();
    }
    if (kind === "ultras") return this.currency.beer >= c.beer;
    return this.currency.merch >= c.merch;
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
    familie: number;
    ordner: number;
  } {
    let ultras = 0,
      normalos = 0,
      familie = 0,
      ordner = 0;
    for (const f of this.fans) {
      if (f.hp <= 0 || f.team !== team) continue;
      if (f.isSteward) {
        ordner++;
        continue;
      }
      if (f.kind === "ultras") ultras++;
      else if (f.kind === "normalos") normalos++;
      else familie++;
    }
    return { ultras, normalos, familie, ordner };
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

  freeSeat(blockId: number): number | null {
    for (let i = 0; i < SEATS_PER_BLOCK; i++) {
      if (!this.seatOccupied(blockId, i)) return i;
    }
    return null;
  }

  blockFanCount(blockId: number): number {
    return this.fans.filter(
      (f) => f.hp > 0 && !f.isSteward && f.blockId === blockId && f.seatIndex != null,
    ).length;
  }

  moodActionReady(act: MoodAction): boolean {
    if (this.cd[act] > 0) return false;
    const kind: FanKind = act === "gesang" ? "normalos" : "ultras";
    if (this.countInBlock(this.playerTeam, HEIM_BLOCK, kind) <= 0) return false;
    const cost = this.moodCost(act);
    if (act === "gesang") return this.currency.merch >= cost;
    return this.currency.beer >= cost;
  }

  private moodCost(act: MoodAction): number {
    const kind: FanKind = act === "gesang" ? "normalos" : "ultras";
    const n = Math.max(1, this.countInBlock(this.playerTeam, HEIM_BLOCK, kind));
    // Gesang günstiger (Shop-Pfad), Pyro teurer (teilt Bier mit Ultra)
    if (act === "gesang") return Math.round(4 + n * 1.2);
    return Math.round(9 + n * 1.8);
  }

  tryMoodAction(act: MoodAction): boolean {
    if (this.cd[act] > 0) {
      this.toast(`${act}: Abklingzeit`);
      return false;
    }
    const kind: FanKind = act === "gesang" ? "normalos" : "ultras";
    const n = this.countInBlock(this.playerTeam, HEIM_BLOCK, kind);
    if (n <= 0) {
      this.toast(`Keine ${FAN_STATS[kind].label}s im Block`);
      return false;
    }
    const cost = this.moodCost(act);
    const door = doorPos(HEIM_BLOCK);
    if (act === "gesang") {
      if (!this.spend("merch", cost, door, "FANARTIKEL")) {
        this.toast(`Gesang braucht ${cost} Fanartikel`);
        return false;
      }
      this.moodHeim = clamp(this.moodHeim + 0.38 * n, 0, 3);
      this.jubelMulHeim.normalos = 1.65;
      this.jubelMulHeim.familie = 1.4;
      const before = this.momentum;
      this.momentum = clamp(this.momentum + 0.095 * n, -1, 1);
      this.moodKick = Math.min(1, 0.7 + Math.abs(this.momentum - before));
      this.triggerCheer("gesang", this.playerTeam, HEIM_BLOCK);
      this.toast(`Gesang ×${n}`);
    } else {
      if (!this.spend("beer", cost, door, "BIER")) {
        this.toast(`Pyro braucht ${cost} Bier`);
        return false;
      }
      this.moodHeim = clamp(this.moodHeim + 0.32 * n, 0, 3);
      this.moodGaeste = clamp(this.moodGaeste - 0.1 * n, 0, 3);
      this.jubelMulHeim.ultras = 1.35;
      const before = this.momentum;
      this.momentum = clamp(this.momentum + 0.065 * n, -1, 1);
      this.moodKick = Math.min(1, 0.8 + Math.abs(this.momentum - before));
      this.triggerCheer("pyro", this.playerTeam, HEIM_BLOCK);
      this.toast(`Pyro ×${n}`);
    }
    this.cd[act] = MOOD_CD[act];
    return true;
  }

  /** Wave flags / raise pyro + spawn particles on matching fans */
  private triggerCheer(
    act: MoodAction,
    team: TeamId,
    blockId: number,
  ): void {
    const kinds: FanKind[] =
      act === "gesang" ? ["normalos", "familie"] : ["ultras"];
    const color = team === "ksc" ? "#3b82f6" : "#ef4444";
    for (const f of this.fans) {
      if (f.hp <= 0 || f.team !== team || f.isSteward) continue;
      if (f.blockId !== blockId && f.state !== "block") continue;
      if (!kinds.includes(f.kind)) continue;
      f.cheerT = Math.max(f.cheerT, act === "gesang" ? 3.2 : 3.6);
      f.armSwing = 1;
      for (let i = 0; i < (act === "gesang" ? 3 : 5); i++) {
        if (act === "gesang") {
          this.moodFx.push({
            kind: "note",
            x: f.x + (Math.random() - 0.5) * 0.04,
            y: f.y - 0.02,
            vx: (Math.random() - 0.5) * 0.04,
            vy: -0.06 - Math.random() * 0.05,
            color: Math.random() < 0.5 ? color : "#f3f0e7",
            t: 0,
            life: 1.1 + Math.random() * 0.5,
            size: 0.012 + Math.random() * 0.008,
          });
        } else {
          this.moodFx.push({
            kind: "smoke",
            x: f.x + (Math.random() - 0.5) * 0.03,
            y: f.y - 0.04,
            vx: (Math.random() - 0.5) * 0.05,
            vy: -0.05 - Math.random() * 0.04,
            color,
            t: 0,
            life: 1.4 + Math.random() * 0.6,
            size: 0.02 + Math.random() * 0.02,
          });
          if (Math.random() < 0.4) {
            this.moodFx.push({
              kind: "spark",
              x: f.x,
              y: f.y - 0.05,
              vx: (Math.random() - 0.5) * 0.08,
              vy: -0.08 - Math.random() * 0.06,
              color: "#fbbf24",
              t: 0,
              life: 0.7,
              size: 0.008,
            });
          }
        }
      }
    }
  }

  ultraOrderReady(): boolean {
    return (
      this.currency.beer >= ULTRA_ORDER_BEER &&
      this.fans.some(
        (f) =>
          f.team === this.playerTeam &&
          f.kind === "ultras" &&
          f.hp > 0 &&
          f.state === "block",
      )
    );
  }

  tryUltraOrder(): boolean {
    const ultras = this.fans.filter(
      (f) =>
        f.team === this.playerTeam &&
        f.kind === "ultras" &&
        f.hp > 0 &&
        f.state === "block",
    );
    if (!ultras.length) {
      this.toast("Keine Ultras im Block");
      return false;
    }
    const door = doorPos(this.homeBlockOf(ultras[0]));
    if (!this.spend("beer", ULTRA_ORDER_BEER, door, "BIER")) {
      this.toast(`Ultra braucht ${ULTRA_ORDER_BEER} Bier`);
      return false;
    }
    this.sendToGang(ultras[0]);
    this.cd.ultraOrder = ULTRA_ORDER_CD; // 0 — no cooldown
    const onGang = this.fans.filter(
      (f) =>
        f.team === this.playerTeam &&
        f.kind === "ultras" &&
        f.hp > 0 &&
        (f.state === "gang" || f.state === "moving"),
    ).length;
    this.toast(`Ultra → Gang (${onGang} unterwegs)`);
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
    if (this.blockFanCount(blockId) >= SEATS_PER_BLOCK) {
      this.toast("Block voll (12)");
      return false;
    }
    if (this.seatOccupied(blockId, seatIndex)) {
      this.toast("Platz belegt");
      return false;
    }
    if (kind === "familie" && !this.securityOk()) {
      this.toast(`Sicherheit ≥ ${SECURITY_FAMILY_GATE} nötig`);
      return false;
    }
    if (!this.canBuy(kind)) {
      this.toast("Zu wenig Ressourcen");
      return false;
    }
    const c = BUY_COST[kind];
    const p = seatPos(blockId, seatIndex);
    if (c.beer > 0) this.spend("beer", c.beer, p, "BIER");
    if (c.merch > 0) this.spend("merch", c.merch, p, "FANARTIKEL");
    if (c.gold > 0) {
      this.gold -= c.gold;
      this.floatAt(p.x, p.y, `−${c.gold}€`, false);
    }
    this.fans.push(this.makeFan(kind, this.playerTeam, blockId, seatIndex));
    this.seatMenu = null;
    this.floatAt(p.x, p.y + 0.02, `+${FAN_STATS[kind].label}`, true);
    this.toast(`${FAN_STATS[kind].label} gekauft`);
    return true;
  }

  /** Only build in own territory (battle-line / owned blocks) */
  inPlayerTerritory(blockId: number): boolean {
    if (blockId === HEIM_BLOCK) return true;
    if (blockId === GAST_BLOCK) return false;
    // Neutral blocks: player frontmost ultra must be past block center
    const mid = blockIdToGangX(blockId);
    return this.linePlayer >= mid - 0.05;
  }

  tryBuild(kind: BuildingKind): boolean {
    if (!this.selectedSlot && !this.buildMenu) {
      this.toast("Slot wählen");
      return false;
    }
    const sel = this.buildMenu ?? this.selectedSlot!;
    if (!this.inPlayerTerritory(sel.blockId)) {
      this.toast("Nur eigenes Territorium");
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
    if (s.building === "ordner") s.stewardCd = 9999; // manual hire only
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
    this.buildMenu = null;
    this.floatAtSlot(s, `Lv${s.level}`, true);
    this.toast(`Upgrade → Lv${s.level}`);
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
    // decay jubel multipliers
    for (const t of ["ultras", "normalos", "familie"] as FanKind[]) {
      this.jubelMulHeim[t] = Math.max(1, this.jubelMulHeim[t] - step * 0.08);
      this.jubelMulGast[t] = Math.max(1, this.jubelMulGast[t] - step * 0.08);
    }
    if (this.moodKick > 0) this.moodKick = Math.max(0, this.moodKick - step * 0.9);
    if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - step * 1.15);

    this.tickEconomy(step);
    this.tickStewards(step);
    this.tickFans(step);
    this.tickAutoDefend(step);
    this.updateBattleLines();
    this.tickCaptureConvert(step);
    this.tickCombat(step);
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

  private tickEconomy(dt: number): void {
    // Passive gold (low); Familie bonus only while in own safe block
    const fam = this.countInBlock(this.playerTeam, HEIM_BLOCK, "familie");
    this.gold += (1.0 + fam * 0.3) * dt;
    const aiFam = this.countInBlock(this.aiTeam, GAST_BLOCK, "familie");
    this.aiGold += (1.1 + aiFam * 0.35) * dt;

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
          this.gain("security", PROD_SECURITY * rate * dt, undefined, "SICHERHEIT");
        } else if (s.building === "fanshop") {
          this.gain("merch", PROD_MERCH * rate * dt, undefined, "FANARTIKEL");
          this.moodHeim = clamp(this.moodHeim + PROD_SHOP_MOOD * rate * dt, 0, 3);
        }
        void p;
      } else if (s.owner === this.aiTeam) {
        this.aiGold += 0.12 * rate * dt;
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
            this.floatAt(
              this.standWorld(s).x,
              this.standWorld(s).y - 0.04,
              "+Stimmung",
              true,
            );
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

      // Neutral Ordner stuck deep in owned land: retreat to post, then despawn
      if (
        f.team === "neutral" &&
        stand.owner === "neutral" &&
        !this.isContestedGangZone(stand.blockId)
      ) {
        const homeGx = blockIdToGangX(stand.blockId);
        const midY = gangMidY();
        const dx = homeGx - f.gangX;
        f.gangX += Math.sign(dx) * Math.min(Math.abs(dx), 0.12 * dt);
        f.x = gangXToWorld(f.gangX);
        f.y += (midY - f.y) * Math.min(1, 5 * dt);
        f.state = "gang";
        f.blockId = stand.blockId;
        if (Math.abs(f.gangX - homeGx) < 0.03) {
          f.hp = 0; // leave the field — no grey Ordner in blue/red land
          this.floatAt(f.x, f.y, "Ordner zieht ab", false);
        }
        continue;
      }

      const band = this.stewardPatrolBand(f);
      const threat = this.stewardThreat(f, band);
      const midY = gangMidY();

      if (threat) {
        const speed = STEWARD_STATS.chaseSpeed;
        const dx = threat.x - f.x;
        const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
        f.x += step;
        f.y += (midY - f.y) * Math.min(1, 6 * dt);
        f.gangX = clamp(
          (f.x - blockCenterX(0)) /
            Math.max(0.001, blockCenterX(BLOCK_COUNT - 1) - blockCenterX(0)),
          0,
          1,
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
        f.y += (midY - f.y) * Math.min(1, 4 * dt);
      }
      f.state = "gang";
      f.blockId = stand.blockId;
    }
  }

  /** Gang-X patrol range for a steward's team / post */
  private stewardPatrolBand(f: FanUnit): { min: number; max: number } {
    if (f.team === "neutral") {
      return {
        min: blockIdToGangX(1) - 0.08,
        max: blockIdToGangX(2) + 0.08,
      };
    }
    if (f.team === this.playerTeam) {
      return { min: 0, max: blockIdToGangX(1) + 0.12 };
    }
    return { min: blockIdToGangX(2) - 0.12, max: 1 };
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
      if (o.kind !== "ultras") continue;
      if (o.team === f.team) continue;
      if (o.team === "neutral") continue;
      const onGang =
        o.state === "gang" ||
        o.invading ||
        (o.state === "block" && (o.blockId === 1 || o.blockId === 2));
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
        if (f.kind === "ultras" || f.kind === "normalos") {
          f.thirst += FAN_STATS[f.kind].drink * 3.2 * dt;
          const ready = this.realElapsed >= (f.satisfiedUntil || 0);
          if (f.thirst > 55 && ready) {
            const stand = this.nearestBierStand(
              f.team === "neutral" ? this.playerTeam : f.team,
              f.blockId,
            );
            // Neutrals don't buy beer for now; only team fans
            if (stand && f.team !== "neutral") {
              const sp = this.standWorld(stand);
              this.startPath(
                f,
                this.pathViaDoors(f.blockId, stand.blockId, sp),
                "stand",
              );
              f.standKey = slotKey(stand.blockId, stand.index);
            }
          }
        } else if (f.kind === "familie" && f.team !== "neutral") {
          if (this.realElapsed >= f.shopUntil) {
            const shop = this.nearestFanshop(f.team as TeamId, f.blockId);
            if (shop) {
              const sp = this.standWorld(shop);
              this.startPath(
                f,
                this.pathViaDoors(f.blockId, shop.blockId, sp),
                "shop",
              );
              f.standKey = slotKey(shop.blockId, shop.index);
            } else {
              f.shopUntil = this.realElapsed + 8;
            }
          }
        }
      } else if (f.state === "moving") {
        this.followPath(f, dt);
      } else if (f.state === "stand") {
        this.finishStandVisit(f);
      } else if (f.state === "gang") {
        this.tickGangMove(f, dt);
      }
    }
  }

  private finishStandVisit(f: FanUnit): void {
    const stand = this.slots.find(
      (s) => slotKey(s.blockId, s.index) === f.standKey,
    );
    if (f.kind === "familie") {
      // Fanshop purchase → gold to owner
      if (stand && stand.building === "fanshop" && stand.owner === f.team) {
        if (f.team === this.playerTeam) {
          this.gold += FAMILY_SHOP_GOLD;
          this.floatAtSlot(stand, `+${FAMILY_SHOP_GOLD}€`, true);
        } else if (f.team === this.aiTeam) {
          this.aiGold += FAMILY_SHOP_GOLD;
        }
        f.shopUntil = this.realElapsed + FAMILY_SHOP_INTERVAL;
      }
    } else if (stand && stand.building === "bier" && stand.beer >= 1) {
      // Exactly 1 beer from Fass — no currency beer spent
      stand.beer -= 1;
      f.thirst = 5;
      const iv =
        f.kind === "ultras" ? ULTRA_BEER_INTERVAL : NORMALO_BEER_INTERVAL;
      f.satisfiedUntil = this.realElapsed + iv;
      this.floatAtSlot(stand, "−1 Fass", false);
    }

    const home =
      f.team === this.playerTeam
        ? HEIM_BLOCK
        : f.team === this.aiTeam
          ? GAST_BLOCK
          : f.blockId;
    // Prefer reserved seat
    const seat =
      f.seatIndex != null && !this.seatOccupied(home, f.seatIndex)
        ? f.seatIndex
        : f._homeSeat != null && this.seatOccupied(home, f._homeSeat) === f
          ? f._homeSeat
          : this.freeSeat(home);
    const end = seat != null ? seatPos(home, seat) : doorPos(home);
    this.startPath(f, this.pathViaDoors(f.blockId, home, end), "home");
    f._homeSeat = seat;
    // keep seatIndex reserved for ultras; for others assign on home
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
    if (Math.abs(f.y - gangMidY()) < 0.06) {
      const left = blockCenterX(0);
      const right = blockCenterX(BLOCK_COUNT - 1);
      f.gangX = clamp((f.x - left) / (right - left || 1), 0, 1);
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
    } else if (after === "stand" || after === "shop") {
      f.state = "stand";
      if (f.standKey) {
        const [b] = f.standKey.split(":").map(Number);
        f.blockId = b;
      }
    } else if (after === "home") {
      f.state = "block";
      f.invading = false;
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

  /** Blocking enemy in front — cannot pass fans/ultras/ordners (incl. neutral stewards) */
  private blockerAhead(f: FanUnit): FanUnit | null {
    const dir = f.team === this.playerTeam ? 1 : -1;
    let best: FanUnit | null = null;
    // Stop close enough that melee combat can engage
    let bestD = MELEE_RANGE * 1.15;
    for (const o of this.fans) {
      if (o === f || o.hp <= 0) continue;
      const hostile =
        o.team !== f.team &&
        (o.team !== "neutral" || o.isSteward);
      if (!hostile) continue;
      const onLane =
        o.state === "gang" ||
        o.isSteward ||
        (o.state === "block" && Math.abs(blockIdToGangX(o.blockId) - f.gangX) < 0.1);
      if (!onLane && o.state !== "stand") continue;
      const dx = (o.x - f.x) * dir;
      if (dx < -0.01 || dx > bestD) continue;
      if (Math.abs(o.y - f.y) > 0.1) continue;
      bestD = dx;
      best = o;
    }
    return best;
  }

  private tickGangMove(f: FanUnit, dt: number): void {
    if (f.isSteward) return; // held at post
    const dir = f.team === this.playerTeam ? 1 : -1;
    const blocker = this.blockerAhead(f);
    const speed = 0.06 * FAN_STATS[f.kind].fight;
    if (!blocker) {
      f.gangX = clamp(f.gangX + dir * speed * dt, 0, 1);
    } else {
      // Keep pressing into the enemy — stay in melee, never freeze idle
      const bx =
        blocker.state === "gang" || blocker.isSteward
          ? blocker.gangX
          : blockIdToGangX(blocker.blockId);
      const contact = bx - dir * (MELEE_RANGE * 0.55);
      // Creep toward contact point (and slightly into foe) so the brawl drifts forward
      const push = dir * speed * 0.45 * dt;
      if (dir > 0) f.gangX = clamp(Math.min(f.gangX + push, contact + 0.012), 0, 1);
      else f.gangX = clamp(Math.max(f.gangX + push, contact - 0.012), 0, 1);
      // Snap into melee if we drifted out of range
      const worldGap = (blocker.x - f.x) * dir;
      if (worldGap > MELEE_RANGE * 0.9) {
        f.gangX = clamp(f.gangX + dir * speed * 1.2 * dt, 0, 1);
      }
    }
    f.x = gangXToWorld(f.gangX);
    f.y = gangMidY() + (blocker ? 0 : Math.sin(this.realElapsed * 3 + f.id) * 0.008);

    const goalBlock = f.team === this.playerTeam ? GAST_BLOCK : HEIM_BLOCK;
    const goalGx = blockIdToGangX(goalBlock);
    const reached =
      f.team === this.playerTeam
        ? f.gangX >= goalGx - 0.02
        : f.gangX <= goalGx + 0.02;
    if (reached && !blocker) {
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

  private updateBattleLines(): void {
    const pUltras = this.fans.filter(
      (f) =>
        f.hp > 0 &&
        f.team === this.playerTeam &&
        f.kind === "ultras" &&
        (f.state === "gang" || f.invading),
    );
    const aUltras = this.fans.filter(
      (f) =>
        f.hp > 0 &&
        f.team === this.aiTeam &&
        f.kind === "ultras" &&
        (f.state === "gang" || f.invading),
    );
    this.linePlayer = pUltras.length
      ? Math.max(...pUltras.map((f) => f.gangX))
      : blockIdToGangX(HEIM_BLOCK);
    this.lineAi = aUltras.length
      ? Math.min(...aUltras.map((f) => f.gangX))
      : blockIdToGangX(GAST_BLOCK);
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
    if (f.isSteward) return STEWARD_STATS.attack;
    return FAN_STATS[f.kind].attack;
  }

  private defenseOf(f: FanUnit): number {
    if (f.isSteward) return STEWARD_STATS.defense;
    return FAN_STATS[f.kind].defense;
  }

  private enemyUltraInBlock(blockId: number, defenderTeam: TeamId): boolean {
    return this.fans.some(
      (f) =>
        f.hp > 0 &&
        f.kind === "ultras" &&
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
              n.kind === "familie" ||
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
          d.kind !== "familie",
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
      } else if (a.kind === "ultras") {
        canAttack =
          a.state === "gang" ||
          a.invading ||
          (a.state === "block" && (blockInvaded || a.blockId === home));
      } else if (a.kind === "normalos" && a.state === "block" && !a.isSteward) {
        // Always defend actively when any enemy Ultra is in THIS block
        canAttack =
          a.team !== "neutral" &&
          this.enemyUltraInBlock(a.blockId, a.team as TeamId);
      }

      if (!canAttack && a.state !== "gang" && !a.isSteward) continue;

      let best: FanUnit | null = null;
      // Strict melee — must stand directly next to each other
      let bestD = MELEE_RANGE;

      for (const b of this.fans) {
        if (b.hp <= 0 || b === a) continue;
        const hostile =
          b.team !== a.team && (b.team !== "neutral" || b.isSteward);
        if (!hostile) continue;

        const sameBlockFight =
          a.blockId === b.blockId &&
          (a.state === "block" || a.invading) &&
          (b.state === "block" || b.invading) &&
          a.kind !== "familie" &&
          b.kind !== "familie";

        const sameLane =
          sameBlockFight ||
          ((a.state === "gang" || a.isSteward) &&
            (b.state === "gang" || b.isSteward || b.state === "stand"));

        if (!sameLane) continue;
        const d = dist(a.x, a.y, b.x, b.y);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      if (!best || a.attackCd > 0) continue;

      a.armSwing = 1;
      a.attackCd = HIT_CD / Math.max(0.4, this.attackOf(a));
      this.applyHit(a, best);

      // Steward fights always trade — Ultra must deal damage back
      if (best.hp > 0 && best.kind !== "familie") {
        const stewardFight = a.isSteward || best.isSteward;
        if (stewardFight || best.attackCd <= 0) {
          best.armSwing = 1;
          best.attackCd = HIT_CD / Math.max(0.4, this.attackOf(best));
          this.applyHit(best, a);
        }
      }
    }
  }

  private applyHit(attacker: FanUnit, target: FanUnit): void {
    let atkMul = 1;
    let defMul = 1;
    // Ordner anti-rush: stewards hit Ultras harder / take less from them
    if (attacker.isSteward && target.kind === "ultras" && !target.isSteward) {
      atkMul = STEWARD_STATS.vsUltraMul;
    }
    if (target.isSteward && attacker.kind === "ultras" && !attacker.isSteward) {
      defMul = STEWARD_STATS.vsUltraMul;
    }
    if (target.kind === "familie" && !target.isSteward) {
      // Don't insta-kill — family flight system handles unsafe blocks
      const dmg =
        (HIT_DAMAGE * HIT_DAMAGE_SCALE * this.attackOf(attacker) * this.neighborBonus(attacker) * atkMul) /
        Math.max(0.35, this.defenseOf(target) * defMul);
      target.hp -= dmg * 0.5;
      if (target.hp <= 0) target.hp = 0;
      return;
    }
    const dmg =
      (HIT_DAMAGE * HIT_DAMAGE_SCALE * this.attackOf(attacker) * this.neighborBonus(attacker) * atkMul) /
      Math.max(0.35, (this.defenseOf(target) * defMul) / this.neighborBonus(target));
    target.hp -= dmg;
    target.aggro = clamp(target.aggro + 12, 0, 100);
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
    for (const blockId of [1, 2]) {
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
      if (seat == null) continue;
      // Only refill as neutral — converted seats stay team-colored
      const kind: FanKind =
        seated % 3 === 0 ? "normalos" : seated % 3 === 1 ? "familie" : "ultras";
      this.fans.push(this.makeFan(kind, "neutral", blockId, seat));
    }
    void dt;
  }

  /** Block unsafe → families relocate then leave */
  private tickFamilyFlight(dt: number): void {
    void dt;
    for (const blockId of [HEIM_BLOCK, GAST_BLOCK]) {
      const owner = blockId === HEIM_BLOCK ? this.playerTeam : this.aiTeam;
      const unsafe = this.enemyUltraInBlock(blockId, owner);
      if (!unsafe) continue;
      const families = this.fans.filter(
        (f) =>
          f.hp > 0 &&
          f.team === owner &&
          f.kind === "familie" &&
          f.blockId === blockId &&
          f.state === "block",
      );
      for (const fam of families) {
        const safeHome = owner === this.playerTeam ? HEIM_BLOCK : GAST_BLOCK;
        // If already in "home" and unsafe, try other seats in same block first then leave
        const alt = this.freeSeat(safeHome);
        if (alt != null && alt !== fam.seatIndex && !this.enemyUltraInBlock(safeHome, owner)) {
          fam.seatIndex = alt;
          const p = seatPos(safeHome, alt);
          fam.x = p.x;
          fam.y = p.y;
          this.toast("Familie wechselt Platz");
        } else if (unsafe) {
          // Leave stadium
          fam.hp = 0;
          this.toast("Familie wandert ab!");
          this.floatAt(fam.x, fam.y, "Abwanderung", false);
        }
      }
    }
  }

  /** Jubel from block fans only → momentum */
  private tickJubelMomentum(dt: number): void {
    const jubel = (team: TeamId, blockId: number, mul: Record<FanKind, number>) => {
      let j = 0;
      for (const f of this.fans) {
        if (f.hp <= 0 || f.team !== team || f.isSteward) continue;
        if (f.blockId !== blockId || f.state !== "block") continue;
        j += FAN_STATS[f.kind].jubel * (mul[f.kind] ?? 1);
      }
      return j;
    };
    const jH = jubel(this.playerTeam, HEIM_BLOCK, this.jubelMulHeim);
    const jG = jubel(this.aiTeam, GAST_BLOCK, this.jubelMulGast);
    const k = 0.042;
    const lambda = 0.07;
    const sign = this.playerTeam === "ksc" ? 1 : 1;
    // momentum + = player advantage
    this.momentum = clamp(
      this.momentum + (k * (jH - jG) - lambda * this.momentum) * dt * sign,
      -1,
      1,
    );
    this.moodHeim = clamp(this.moodHeim + (jH * 0.002 - 0.01) * dt, 0, 3);
    this.moodGaeste = clamp(this.moodGaeste + (jG * 0.002 - 0.01) * dt, 0, 3);
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
    if (this.chanceAcc < 16 / fever) return;
    this.chanceAcc = 0;
    const ch = this.goalChance();
    if (Math.random() > ch.pTor) return;
    this.scoreGoal(Math.random() < ch.pHeim ? this.playerTeam : this.aiTeam);
  }

  /** Public HUD: next-goal probability from momentum */
  goalChance(): { pTor: number; pHeim: number; pGast: number; momentum: number } {
    const M = this.momentum;
    const pTor = clamp(0.28 + 0.35 * Math.abs(M), 0.15, 0.85);
    const pHeim = clamp(0.5 + 0.5 * M, 0.05, 0.95);
    return { pTor, pHeim, pGast: 1 - pHeim, momentum: M };
  }

  private scoreGoal(team: TeamId): void {
    if (team === "ksc") this.scoreKsc++;
    else this.scoreVfb++;
    if (team === this.playerTeam) {
      this.moodHeim = clamp(this.moodHeim + 0.35, 0, 3);
      this.momentum = clamp(this.momentum + 0.12, -1, 1);
    } else {
      this.moodGaeste = clamp(this.moodGaeste + 0.35, 0, 3);
      this.momentum = clamp(this.momentum - 0.12, -1, 1);
    }
    this.lastGoalTeam = team;
    this.scorePulse = 1;
    this.spawnGoalConfetti(team);
    this.toast(`TOR ${teamLabel(team)}! ${this.scoreKsc}:${this.scoreVfb}`);
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
        p.size += 0.01 * dt;
      }
    }
    this.moodFx = this.moodFx.filter((p) => p.t < p.life);
  }

  private tickAi(dt: number): void {
    this.aiAcc += dt;
    for (const k of Object.keys(this.aiCd) as (keyof typeof this.aiCd)[]) {
      if (this.aiCd[k] > 0) this.aiCd[k] = Math.max(0, this.aiCd[k] - dt);
    }
    // Soft regen of AI mood resources
    this.aiMerch = Math.min(120, this.aiMerch + dt * 1.1);
    this.aiBeer = Math.min(120, this.aiBeer + dt * 1.0);

    const interval = 7 / diffMul(this.cfg.settings.difficulty);
    // Mood checks ~every 2.2s (scaled by difficulty)
    const moodEvery = diffMul(this.cfg.settings.difficulty) > 1 ? 1.6 : 2.4;
    if (Math.floor(this.realElapsed / moodEvery) !== Math.floor((this.realElapsed - dt) / moodEvery)) {
      this.aiTryMood();
    }

    if (this.aiAcc < interval) return;
    this.aiAcc = 0;
    this.aiTryBuild();
    this.aiTryHireSteward();
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
    // AI can stack multiple Ultras on gang (no CD) when beer-like budget via gold proxy
    const want = this.cfg.settings.difficulty === "hard" ? 3 : 2;
    if (ultras.length && onGang < want && Math.random() < 0.4) {
      this.sendToGang(ultras[0]);
    }
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

  /** AI Gesang/Pyro — frequency & timing scale with difficulty */
  private aiTryMood(): void {
    const diff = this.cfg.settings.difficulty;
    const chance =
      diff === "easy" ? 0.22 : diff === "hard" ? 0.72 : 0.45;
    if (Math.random() > chance) return;

    // Prefer Gesang slightly over Pyro when catching up (RPS balance)
    const behind = this.momentum > 0.08; // player (heim) ahead → AI should push
    const preferPyro = behind && Math.random() < 0.4;
    const act: MoodAction = preferPyro ? "pyro" : "gesang";
    if (this.aiCd[act] > 0) {
      const alt: MoodAction = act === "pyro" ? "gesang" : "pyro";
      if (this.aiCd[alt] > 0) return;
      this.aiFireMood(alt);
      return;
    }
    // Hard: only fire when it matters; easy: random even when ahead
    if (diff === "hard" && !behind && Math.random() < 0.55) return;
    if (diff === "easy" && behind && Math.random() < 0.4) return; // clumsier when needed
    this.aiFireMood(act);
  }

  private aiFireMood(act: MoodAction): void {
    const kind: FanKind = act === "gesang" ? "normalos" : "ultras";
    const n = this.countInBlock(this.aiTeam, GAST_BLOCK, kind);
    if (n <= 0) return;
    const cost =
      act === "gesang" ? Math.round(4 + n * 1.2) : Math.round(9 + n * 1.8);
    if (act === "gesang") {
      if (this.aiMerch < cost) return;
      this.aiMerch -= cost;
      this.moodGaeste = clamp(this.moodGaeste + 0.38 * n, 0, 3);
      this.jubelMulGast.normalos = 1.65;
      this.jubelMulGast.familie = 1.4;
      const before = this.momentum;
      this.momentum = clamp(this.momentum - 0.095 * n, -1, 1);
      this.moodKick = Math.min(1, 0.55 + Math.abs(this.momentum - before));
      this.triggerCheer("gesang", this.aiTeam, GAST_BLOCK);
      this.toast(`KI Gesang ×${n}`);
    } else {
      if (this.aiBeer < cost) return;
      this.aiBeer -= cost;
      this.moodGaeste = clamp(this.moodGaeste + 0.32 * n, 0, 3);
      this.moodHeim = clamp(this.moodHeim - 0.1 * n, 0, 3);
      this.jubelMulGast.ultras = 1.35;
      const before = this.momentum;
      this.momentum = clamp(this.momentum - 0.065 * n, -1, 1);
      this.moodKick = Math.min(1, 0.65 + Math.abs(this.momentum - before));
      this.triggerCheer("pyro", this.aiTeam, GAST_BLOCK);
      this.toast(`KI Pyro ×${n}`);
    }
    this.aiCd[act] = MOOD_CD[act] * (this.cfg.settings.difficulty === "easy" ? 1.35 : 1);
  }

  private aiTryBuild(): void {
    const kinds: BuildingKind[] = ["bier", "ordner", "fanshop"];
    const kind = kinds[this.aiBuildRot % kinds.length];
    this.aiBuildRot++;
    let s =
      this.slots.find((x) => x.blockId === GAST_BLOCK && !x.building) ??
      this.slots.find(
        (x) =>
          (x.blockId === 1 || x.blockId === 2) &&
          x.building &&
          (x.owner === "neutral" || x.greyNeutral) &&
          this.lineAi <= blockIdToGangX(x.blockId) + 0.05,
      ) ??
      this.slots.find((x) => x.blockId === GAST_BLOCK && !x.building);
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
    const claim = s.blockId !== GAST_BLOCK;
    const cost = claim
      ? Math.floor(BUILD_COST[kind] * 0.65)
      : BUILD_COST[kind];
    if (this.aiGold < cost) return;
    this.aiGold -= cost;
    if (!s.building) s.building = kind;
    s.owner = this.aiTeam;
    s.greyNeutral = false;
    if (s.building === "bier" && s.beer < 20) s.beer = 40;
    if (s.building === "ordner") s.stewardCd = 9999; // AI hires manually
    this.floatAtSlot(s, claim ? "KI Claim" : "KI baut", false);
  }

  private tickPens(dt: number): void {
    this.pensTimer += dt;
    if (this.pensTimer < 1.8) return;
    this.pensTimer = 0;
    if (this.pensRound >= 5 && this.pens.filter((p) => p.ksc !== null).length >= 5) {
      // already resolving
    }
    const kscGoal = Math.random() < 0.72 + this.momentum * 0.1;
    const vfbGoal = Math.random() < 0.72 - this.momentum * 0.1;
    this.pens.push({ ksc: kscGoal, vfb: vfbGoal });
    if (kscGoal) this.scoreGoal("ksc");
    if (vfbGoal) this.scoreGoal("vfb");
    this.pensRound++;
    this.toast(
      `Elfmeter ${this.pensRound}: ${kscGoal ? "✓" : "✗"} – ${vfbGoal ? "✓" : "✗"}`,
    );
    if (this.pensRound >= 5) {
      if (this.scoreKsc !== this.scoreVfb) this.endByScore();
      else {
        // sudden death already baked into continuing — cap at 8
        if (this.pensRound >= 8) this.endByScore();
      }
    }
  }

  private endByScore(): void {
    if (this.scoreKsc === this.scoreVfb) {
      this.finish(
        Math.random() < 0.5 ? "ksc" : "vfb",
        "pens",
        "Entscheidung nach Elfmeter",
      );
      return;
    }
    const winner = this.scoreKsc > this.scoreVfb ? "ksc" : "vfb";
    const reason = this.phase === "et" ? "et" : "score";
    this.finish(
      winner,
      reason,
      `Endstand ${this.scoreKsc}:${this.scoreVfb}`,
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
