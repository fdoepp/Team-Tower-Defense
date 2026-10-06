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
  MOOD_CD,
  NORMALO_BEER_INTERVAL,
  REGULAR_REAL_SEC,
  SECURITY_FAMILY_GATE,
  STAND_CONVERT_SEC,
  START_GOLD,
  STEWARD_GOLD_PER_SEC,
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
  boothCenter,
  doorPos,
  gangLanePos,
  gangMidY,
  gangXToWorld,
  seatPos,
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
  speed: SpeedMode = 0;
  toasts: { text: string; t: number }[] = [];
  result: MatchResult | null = null;
  cd = { gesang: 0, pyro: 0, ultraOrder: 0 };
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
      for (let i = 0; i < 4; i++) {
        const isNeutral = b.id === 1 || b.id === 2;
        this.slots.push({
          blockId: b.id,
          index: i,
          building: null,
          greyNeutral: isNeutral && i < 2,
          beer: 0,
          capacity: 100,
          owner: isNeutral ? "neutral" : null,
          level: 1,
          stewardCd: 2 + Math.random() * 3,
          convertAcc: 0,
        });
      }
    }

    // Neutrale Buden als graue Claims (noch niemand)
    for (const blockId of [1, 2]) {
      this.placeBuilding(blockId, 0, "bier", true, "neutral");
      this.placeBuilding(blockId, 1, "ordner", true, "neutral");
      const s0 = this.slots.find((x) => x.blockId === blockId && x.index === 0);
      const s1 = this.slots.find((x) => x.blockId === blockId && x.index === 1);
      if (s0) {
        s0.greyNeutral = true;
        s0.beer = 25;
      }
      if (s1) s1.greyNeutral = true;
    }

    const homeKinds = expandMix(cfg.playerSetup.mix);
    homeKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.playerTeam, HEIM_BLOCK, i));
    });
    const awayKinds = expandMix(cfg.aiSetup.mix);
    awayKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.aiTeam, GAST_BLOCK, i));
    });
    for (const blockId of [1, 2]) {
      for (let i = 0; i < 4; i++) {
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
    s.stewardCd = kind === "ordner" ? 1.5 : 8;
    s.convertAcc = 0;
    if (kind === "bier") s.beer = 40;
  }

  toast(text: string): void {
    this.toasts.push({ text, t: 2.2 });
  }

  floatAt(x: number, y: number, text: string, good: boolean): void {
    this.floats.push({ x, y, text, good, t: 1.35, vy: 0.045 });
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
    this.currency[key] = clamp(this.currency[key] - amount, 0, 100);
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
    this.currency[key] = clamp(this.currency[key] + amount, 0, 100);
    if (at) {
      const tag = label ?? key.toUpperCase();
      this.floatAt(at.x, at.y, `+${Math.round(amount)} ${tag}`, true);
    }
  }

  setSpeed(s: SpeedMode): void {
    this.speed = s;
  }

  currencyPct(key: keyof Currencies): number {
    return Math.min(100, Math.floor(this.currency[key]));
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
    if (f.team === this.playerTeam) return HEIM_BLOCK;
    if (f.team === this.aiTeam) return GAST_BLOCK;
    return f.blockId;
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
    if (act === "gesang") return Math.round(5 + n * 1.5);
    return Math.round(7 + n * 1.5);
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
      this.moodHeim = clamp(this.moodHeim + 0.3 * n, 0, 3);
      this.jubelMulHeim.normalos = 1.4;
      this.toast(`Gesang ×${n}`);
    } else {
      if (!this.spend("beer", cost, door, "BIER")) {
        this.toast(`Pyro braucht ${cost} Bier`);
        return false;
      }
      this.moodHeim = clamp(this.moodHeim + 0.4 * n, 0, 3);
      this.moodGaeste = clamp(this.moodGaeste - 0.12 * n, 0, 3);
      this.jubelMulHeim.ultras = 1.5;
      this.toast(`Pyro ×${n}`);
    }
    this.cd[act] = MOOD_CD[act];
    return true;
  }

  ultraOrderReady(): boolean {
    return (
      this.cd.ultraOrder <= 0 &&
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
    if (this.cd.ultraOrder > 0) {
      this.toast("Ultra-Befehl: CD");
      return false;
    }
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
    const door = doorPos(HEIM_BLOCK);
    if (!this.spend("beer", ULTRA_ORDER_BEER, door, "BIER")) {
      this.toast(`Ultra braucht ${ULTRA_ORDER_BEER} Bier`);
      return false;
    }
    this.sendToGang(ultras[0]);
    this.cd.ultraOrder = ULTRA_ORDER_CD;
    this.toast("1 Ultra → Gang");
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
    if (blockId !== HEIM_BLOCK) {
      this.toast("Nur Heimblock");
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
    if (s.building === "ordner") s.stewardCd = Math.min(s.stewardCd || 8, 2);
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

    this.tickEconomy(step);
    this.tickStewards(step);
    this.tickFans(step);
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

    for (const f of this.fans) {
      if (f.armSwing > 0) f.armSwing = Math.max(0, f.armSwing - step * 2.2);
      if (f.attackCd > 0) f.attackCd = Math.max(0, f.attackCd - step);
    }
    this.fans = this.fans.filter((f) => f.hp > 0 || f.hp === 0);
    // remove dead after short? keep corpses 0 — filter dead for economy
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
          this.gain("beer", 0.28 * rate * dt, undefined, "BIER");
        } else if (s.building === "ordner") {
          this.gain("security", 0.26 * rate * dt, undefined, "SICHERHEIT");
        } else if (s.building === "fanshop") {
          this.gain("merch", 0.26 * rate * dt, undefined, "FANARTIKEL");
          this.moodHeim = clamp(this.moodHeim + 0.01 * rate * dt, 0, 3);
        }
        void p;
      } else if (s.owner === this.aiTeam) {
        this.aiGold += 0.12 * rate * dt;
      }
    }

    if (this.buildPulse >= 2.8) {
      this.buildPulse = 0;
      for (const s of this.slots) {
        if (!s.building || s.owner !== this.playerTeam || s.greyNeutral) continue;
        const n = Math.max(1, Math.round(productionRate(s.level || 1)));
        if (s.building === "bier") this.floatAtSlot(s, `+${n} Bier`, true);
        else if (s.building === "ordner") this.floatAtSlot(s, `+${n} Sicherheit`, true);
        else if (s.building === "fanshop") this.floatAtSlot(s, `+${n} Fanartikel`, true);
      }
    }
  }

  private tickStewards(dt: number): void {
    for (const s of this.slots) {
      if (s.building !== "ordner" || !s.owner || s.greyNeutral) continue;
      const key = slotKey(s.blockId, s.index);
      const alive = this.fans.filter(
        (f) => f.hp > 0 && f.isSteward && f.homeStandKey === key,
      ).length;
      const cap = Math.min(2, 1 + Math.floor(((s.level || 1) - 1) / 2));
      s.stewardCd -= dt;
      if (alive >= cap) continue;
      if (s.stewardCd > 0) continue;
      s.stewardCd = 9 / productionRate(s.level || 1);
      this.fans.push(this.makeSteward(s.owner, s));
    }

    // Hold stewards at post
    for (const f of this.fans) {
      if (!f.isSteward || f.hp <= 0 || f.state === "moving") continue;
      const stand = this.slots.find(
        (s) => slotKey(s.blockId, s.index) === f.homeStandKey,
      );
      if (!stand) continue;
      const p = this.stewardPostPos(stand);
      f.x += (p.x - f.x) * Math.min(1, 4 * dt);
      f.y += (p.y - f.y) * Math.min(1, 4 * dt);
      f.gangX = blockIdToGangX(stand.blockId);
      f.state = "gang";
      f.blockId = stand.blockId;
    }
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
      // keep seatIndex = home reservation; stand in enemy block visually
      this.toast(
        f.team === this.playerTeam
          ? "Ultra im Gästeblock!"
          : "Ultra im Heimblock!",
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
    let bestD = 0.065;
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
    if (!blocker) {
      f.gangX = clamp(
        f.gangX + dir * 0.055 * FAN_STATS[f.kind].fight * dt,
        0,
        1,
      );
      f.x = gangXToWorld(f.gangX);
      f.y = gangMidY() + Math.sin(this.realElapsed * 3 + f.id) * 0.008;
    } else {
      f.x = gangXToWorld(f.gangX);
      f.y = gangMidY();
    }

    const goalBlock = f.team === this.playerTeam ? GAST_BLOCK : HEIM_BLOCK;
    const goalGx = blockIdToGangX(goalBlock);
    const reached =
      f.team === this.playerTeam
        ? f.gangX >= goalGx - 0.02
        : f.gangX <= goalGx + 0.02;
    if (reached && !blocker) {
      const door = doorPos(goalBlock);
      // Visual gather point in enemy block — home seatIndex stays reserved
      const gather = seatPos(goalBlock, Math.min(2, SEATS_PER_BLOCK - 1));
      f.blockId = goalBlock;
      f.path = [
        { x: gangLanePos(goalBlock).x, y: gangLanePos(goalBlock).y },
        { x: door.x, y: door.y },
        { x: gather.x, y: gather.y },
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

  /** Stand conversion by battle-line dominance (medium time) — no HP attack on stands */
  private tickCaptureConvert(dt: number): void {
    for (const s of this.slots) {
      if (!s.building) continue;
      const mid = blockIdToGangX(s.blockId);
      let dominant: TeamId | null = null;
      if (this.linePlayer > mid + 0.03 && this.linePlayer > this.lineAi) {
        dominant = this.playerTeam;
      } else if (this.lineAi < mid - 0.03 && this.lineAi < this.linePlayer) {
        dominant = this.aiTeam;
      }
      if (!dominant || dominant === s.owner) {
        s.convertAcc = Math.max(0, s.convertAcc - dt * 0.6);
        continue;
      }
      s.convertAcc += dt;
      if (s.convertAcc >= STAND_CONVERT_SEC) {
        const prev = s.owner;
        s.owner = dominant;
        s.greyNeutral = false;
        s.convertAcc = 0;
        if (s.building === "bier" && s.beer < 20) s.beer = 35;
        this.floatAtSlot(s, "Konvertiert!", true);
        this.toast(
          dominant === this.playerTeam
            ? `Stand übernommen (${s.building})`
            : `KI übernimmt Stand (${s.building})`,
        );
        if (dominant === this.aiTeam) this.aiGold += 10;
        void prev;
      } else if (Math.random() < 0.015) {
        const pct = Math.floor((s.convertAcc / STAND_CONVERT_SEC) * 100);
        this.floatAtSlot(s, `${pct}%`, true);
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
        (f.state === "block" || f.invading),
    );
  }

  private tickCombat(dt: number): void {
    void dt;
    for (const a of this.fans) {
      if (a.hp <= 0) continue;
      if (a.team === "neutral" && !a.isSteward) continue;

      // Who may actively attack?
      let canAttack = false;
      if (a.isSteward || a.kind === "ultras") {
        canAttack = a.state === "gang" || a.invading || a.state === "block";
      } else if (a.kind === "normalos" && a.state === "block" && !a.isSteward) {
        // Active only when enemy ultra entered block; otherwise only counter later
        canAttack = this.enemyUltraInBlock(a.blockId, a.team as TeamId);
      } else if (a.kind === "familie") {
        canAttack = false;
      }

      if (!canAttack && a.state !== "gang" && !a.isSteward) continue;

      let best: FanUnit | null = null;
      let bestD = 0.07;
      for (const b of this.fans) {
        if (b.hp <= 0 || b === a) continue;
        const hostile =
          b.team !== a.team && (b.team !== "neutral" || b.isSteward);
        if (!hostile) continue;
        const sameLane =
          (a.state === "gang" || a.isSteward) &&
          (b.state === "gang" || b.isSteward || b.state === "stand") ||
          (a.invading && b.blockId === a.blockId && b.state === "block") ||
          (a.state === "block" &&
            b.invading &&
            b.blockId === a.blockId) ||
          (a.state === "gang" &&
            b.state === "block" &&
            Math.abs(blockIdToGangX(b.blockId) - a.gangX) < 0.1);
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

      // Defender counter (Normalos always when hit; Familie does not fight back)
      if (best.hp > 0 && best.kind !== "familie" && best.attackCd <= 0) {
        best.armSwing = 1;
        best.attackCd = HIT_CD / Math.max(0.4, this.attackOf(best));
        this.applyHit(best, a);
      }
    }
  }

  private applyHit(attacker: FanUnit, target: FanUnit): void {
    if (target.kind === "familie" && !target.isSteward) {
      // Don't insta-kill — family flight system handles unsafe blocks
      const dmg =
        (HIT_DAMAGE * this.attackOf(attacker) * this.neighborBonus(attacker)) /
        Math.max(0.35, this.defenseOf(target));
      target.hp -= dmg * 0.5;
      if (target.hp <= 0) target.hp = 0;
      return;
    }
    const dmg =
      (HIT_DAMAGE * this.attackOf(attacker) * this.neighborBonus(attacker)) /
      Math.max(0.35, this.defenseOf(target) / this.neighborBonus(target));
    target.hp -= dmg;
    target.aggro = clamp(target.aggro + 12, 0, 100);
    if (target.hp <= 0) {
      target.hp = 0;
      this.toast(
        target.isSteward
          ? "Ordner besiegt"
          : `${FAN_STATS[target.kind].label} besiegt`,
      );
    }
  }

  /** Neutral capture: presence (A) + ultra pressure (B) */
  private tickNeutralCapture(dt: number): void {
    this.defectAcc += dt;
    for (const f of this.fans) {
      if (f.team !== "neutral" || f.hp <= 0 || f.isSteward) continue;

      let pull = 0;
      // Path A: presence — nearby team fans in same/adjacent block, owned stands
      const nearPlayer = this.fans.some(
        (o) =>
          o.hp > 0 &&
          o.team === this.playerTeam &&
          !o.isSteward &&
          Math.abs(o.blockId - f.blockId) <= 1 &&
          (o.state === "block" || o.state === "gang") &&
          dist(f.x, f.y, o.x, o.y) < 0.25,
      );
      const nearAi = this.fans.some(
        (o) =>
          o.hp > 0 &&
          o.team === this.aiTeam &&
          !o.isSteward &&
          Math.abs(o.blockId - f.blockId) <= 1 &&
          dist(f.x, f.y, o.x, o.y) < 0.25,
      );
      if (nearPlayer) pull += 0.35;
      if (nearAi) pull -= 0.35;
      const standP = this.slots.some(
        (s) => s.building && s.owner === this.playerTeam && s.blockId === f.blockId,
      );
      const standA = this.slots.some(
        (s) => s.building && s.owner === this.aiTeam && s.blockId === f.blockId,
      );
      if (standP) pull += 0.25;
      if (standA) pull -= 0.25;
      pull += this.momentum * 0.2;

      // Path B: ultra at seat — faster
      const ultraP = this.fans.some(
        (o) =>
          o.hp > 0 &&
          o.team === this.playerTeam &&
          o.kind === "ultras" &&
          dist(f.x, f.y, o.x, o.y) < 0.08,
      );
      const ultraA = this.fans.some(
        (o) =>
          o.hp > 0 &&
          o.team === this.aiTeam &&
          o.kind === "ultras" &&
          dist(f.x, f.y, o.x, o.y) < 0.08,
      );
      if (ultraP) pull += 0.7;
      if (ultraA) pull -= 0.7;

      f.lean = clamp(f.lean + pull * dt * 0.12, -1, 1);
      const rate = ultraP || ultraA ? 0.22 : 0.08;
      if (f.lean > 0.35) f.captureProg = clamp(f.captureProg + rate * dt, 0, 1);
      else if (f.lean < -0.35)
        f.captureProg = clamp(f.captureProg - rate * dt, -1, 0);
      else f.captureProg *= 1 - 0.15 * dt;

      if (f.captureProg >= 1) {
        const seat = this.freeSeat(HEIM_BLOCK);
        if (seat == null) {
          f.captureProg = 0.85;
          continue;
        }
        f.team = this.playerTeam;
        f.blockId = HEIM_BLOCK;
        f.state = "block";
        f.seatIndex = seat;
        f.lean = 0;
        f.captureProg = 0;
        const p = seatPos(HEIM_BLOCK, seat);
        f.x = p.x;
        f.y = p.y;
        this.toast("Neutraler Fan → Heim");
        this.floatAt(p.x, p.y, "+Fan", true);
      } else if (f.captureProg <= -1) {
        const seat = this.freeSeat(GAST_BLOCK);
        if (seat == null) {
          f.captureProg = -0.85;
          continue;
        }
        f.team = this.aiTeam;
        f.blockId = GAST_BLOCK;
        f.state = "block";
        f.seatIndex = seat;
        f.lean = 0;
        f.captureProg = 0;
        const p = seatPos(GAST_BLOCK, seat);
        f.x = p.x;
        f.y = p.y;
        this.toast("Neutraler Fan → Gäste");
      }
    }
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
    const k = 0.035;
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
    const M = this.momentum;
    const P0 = 0.28;
    const P1 = 0.35;
    const pTor = P0 + P1 * Math.abs(M);
    if (Math.random() > pTor) return;
    const pHeim = 0.5 + 0.5 * M;
    const scorer =
      Math.random() < pHeim ? this.playerTeam : this.aiTeam;
    this.scoreGoal(scorer);
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
    this.toast(`TOR ${teamLabel(team)}! ${this.scoreKsc}:${this.scoreVfb}`);
  }

  private tickAi(dt: number): void {
    this.aiAcc += dt;
    const interval = 7 / diffMul(this.cfg.settings.difficulty);
    if (this.aiAcc < interval) return;
    this.aiAcc = 0;
    this.aiTryBuild();
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
    // AI rarely storms — keep onGang low so blockstorm ~10-15%
    if (ultras.length && onGang < 1 && Math.random() < 0.35) {
      this.sendToGang(ultras[0]);
    }
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
    if (kscGoal) this.scoreKsc++;
    if (vfbGoal) this.scoreVfb++;
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
