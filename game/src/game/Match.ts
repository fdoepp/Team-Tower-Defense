import {
  BLOCK_META,
  BUILD_COST,
  BUY_COST,
  ET_REAL_SEC,
  FAN_STATS,
  FEVER_FROM_MIN,
  HIT_CD,
  HIT_DAMAGE,
  INVADE_WIN_COUNT,
  MOOD_CD,
  REGULAR_REAL_SEC,
  ULTRA_ORDER_CD,
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
  blockWidthNorm,
  doorPos,
  gangLanePos,
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
  reason: "score" | "et" | "pens" | "curva" | "invade";
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
  gold = 180;
  momentum = 0;
  moodHeim = 1;
  moodGaeste = 1;
  speed: SpeedMode = 0;
  toasts: { text: string; t: number }[] = [];
  result: MatchResult | null = null;
  cd = { gesang: 0, pyro: 0, klatschen: 0, ultraOrder: 0 };
  selectedSlot: { blockId: number; index: number } | null = null;
  selectedSeat: { blockId: number; seatIndex: number } | null = null;
  /** UI menus */
  seatMenu: { blockId: number; seatIndex: number } | null = null;
  buildMenu: { blockId: number; index: number } | null = null;
  chanceAcc = 0;
  aiAcc = 0;
  defectAcc = 0;
  /** accumulate building income for float pulses */
  buildPulse = 0;
  /** drink float accumulators per stand key */
  drinkAcc: Record<string, number> = {};
  width = 960;
  height = 440;
  pensRound = 0;
  pens: { ksc: boolean | null; vfb: boolean | null }[] = [];
  pensTimer = 0;
  /** capped currencies 0..100 — rise slowly, fall via actions */
  currency: Currencies = { beer: 12, ordner: 10, shop: 10 };
  /** block ownership for capture visuals */
  blockOwner: (TeamId | "neutral" | null)[] = [null, null, null, null];
  /** floating +/− numbers at buildings / seats */
  floats: FloatFx[] = [];

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
        });
      }
    }
    this.placeBuilding(HEIM_BLOCK, 0, "bier", true, this.playerTeam);
    this.placeBuilding(HEIM_BLOCK, 2, "ordner", true, this.playerTeam);
    this.placeBuilding(GAST_BLOCK, 0, "bier", true, this.aiTeam);
    this.placeBuilding(GAST_BLOCK, 2, "ordner", true, this.aiTeam);

    const homeKinds = expandMix(cfg.playerSetup.mix);
    homeKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.playerTeam, HEIM_BLOCK, i));
    });
    const awayKinds = expandMix(cfg.aiSetup.mix);
    awayKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.aiTeam, GAST_BLOCK, i));
    });
    for (const blockId of [1, 2]) {
      const count = blockId === 1 ? 5 : 5;
      for (let i = 0; i < count; i++) {
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
      thirst: 20 + Math.random() * 20,
      aggro: kind === "ultras" ? 30 : 10,
      lean: 0,
      gangX: blockIdToGangX(blockId),
      x: p.x,
      y: p.y,
      path: [],
      pathI: 0,
      armSwing: 0,
      attackCd: 0,
      invading: false,
    };
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
    if (kind === "bier") s.beer = 60;
  }

  toast(text: string): void {
    this.toasts.push({ text, t: 2.2 });
  }

  /** Spawn a floating green (+) or red (−) number in normalized coords */
  floatAt(x: number, y: number, text: string, good: boolean): void {
    this.floats.push({ x, y, text, good, t: 1.35, vy: 0.045 });
  }

  floatAtSlot(s: BuildSlot, text: string, good: boolean): void {
    const p = this.standWorld(s);
    this.floatAt(p.x, p.y - 0.02, text, good);
  }

  floatAtSeat(blockId: number, seatIndex: number, text: string, good: boolean): void {
    const p = seatPos(blockId, seatIndex);
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

  canBuy(kind: FanKind): boolean {
    const c = BUY_COST[kind];
    return (
      this.currency.beer >= c.beer &&
      this.currency.ordner >= c.ordner &&
      this.currency.shop >= c.shop
    );
  }

  countInBlock(team: TeamId, blockId: number, kind?: FanKind): number {
    return this.fans.filter(
      (f) =>
        f.team === team &&
        f.blockId === blockId &&
        f.hp > 0 &&
        (f.state === "block" || f.state === "stand") &&
        (kind ? f.kind === kind : true),
    ).length;
  }

  seatOccupied(blockId: number, seatIndex: number): FanUnit | null {
    return (
      this.fans.find(
        (f) =>
          f.hp > 0 &&
          f.blockId === blockId &&
          f.seatIndex === seatIndex &&
          f.state === "block",
      ) ?? null
    );
  }

  freeSeat(blockId: number): number | null {
    for (let i = 0; i < SEATS_PER_BLOCK; i++) {
      if (!this.seatOccupied(blockId, i)) return i;
    }
    return null;
  }

  moodActionReady(act: MoodAction): boolean {
    if (this.cd[act] > 0) return false;
    const kind: FanKind =
      act === "gesang" ? "normalos" : act === "pyro" ? "ultras" : "familie";
    if (this.countInBlock(this.playerTeam, HEIM_BLOCK, kind) <= 0) return false;
    const cost = this.moodCost(act);
    if (act === "gesang") return this.currency.shop >= cost;
    if (act === "pyro") return this.currency.beer >= cost;
    return this.currency.ordner >= cost;
  }

  private moodCost(act: MoodAction): number {
    const kind: FanKind =
      act === "gesang" ? "normalos" : act === "pyro" ? "ultras" : "familie";
    const n = Math.max(1, this.countInBlock(this.playerTeam, HEIM_BLOCK, kind));
    if (act === "gesang") return 6 + n * 2; // SHOP
    if (act === "pyro") return 8 + n * 2; // BIER
    return 5 + n * 2; // ORDNER
  }

  tryMoodAction(act: MoodAction): boolean {
    if (this.cd[act] > 0) {
      this.toast(`${act}: Abklingzeit`);
      return false;
    }
    const kind: FanKind =
      act === "gesang" ? "normalos" : act === "pyro" ? "ultras" : "familie";
    const n = this.countInBlock(this.playerTeam, HEIM_BLOCK, kind);
    if (n <= 0) {
      this.toast(`Keine ${FAN_STATS[kind].label}s im Block`);
      return false;
    }
    const cost = this.moodCost(act);
    const door = doorPos(HEIM_BLOCK);
    if (act === "gesang") {
      if (!this.spend("shop", cost, door, "SHOP")) {
        this.toast(`Gesang braucht ${cost} SHOP`);
        return false;
      }
      this.moodHeim = clamp(this.moodHeim + 0.35 * n, 0, 3);
      this.momentum = clamp(this.momentum + 0.04 * n, -1, 1);
      this.toast(`Gesang ×${n}`);
    } else if (act === "pyro") {
      if (!this.spend("beer", cost, door, "BIER")) {
        this.toast(`Pyro braucht ${cost} BIER`);
        return false;
      }
      this.moodHeim = clamp(this.moodHeim + 0.45 * n, 0, 3);
      this.momentum = clamp(this.momentum + 0.05 * n, -1, 1);
      this.moodGaeste = clamp(this.moodGaeste - 0.15 * n, 0, 3);
      this.toast(`Pyro ×${n}`);
    } else {
      if (!this.spend("ordner", cost, door, "ORDNER")) {
        this.toast(`Klatschen braucht ${cost} ORDNER`);
        return false;
      }
      this.moodHeim = clamp(this.moodHeim + 0.25 * n, 0, 3);
      const goldGain = 4 * n;
      this.gold += goldGain;
      this.floatAt(door.x, door.y - 0.03, `+${goldGain}€`, true);
      this.toast(`Klatschen ×${n}`);
    }
    this.cd[act] = MOOD_CD[act];
    return true;
  }

  ultraOrderReady(): boolean {
    return (
      this.cd.ultraOrder <= 0 &&
      this.currency.beer >= 5 &&
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
    const beerCost = 5;
    const door = doorPos(HEIM_BLOCK);
    if (!this.spend("beer", beerCost, door, "BIER")) {
      this.toast(`Ultra braucht ${beerCost} BIER`);
      return false;
    }
    const take = ultras[0];
    this.sendToGang(take);
    this.cd.ultraOrder = ULTRA_ORDER_CD;
    this.toast("1 Ultra → Gang");
    return true;
  }

  private sendToGang(f: FanUnit): void {
    const door = doorPos(f.blockId);
    const lane = gangLanePos(f.blockId);
    f.state = "moving";
    f.standKey = null;
    f.seatIndex = null;
    f.invading = false;
    f.path = [
      { x: door.x, y: door.y },
      { x: lane.x, y: lane.y },
    ];
    f.pathI = 0;
    this.setAfter(f, "gang");
  }

  /** internal path completion flag */
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
    if (this.seatOccupied(blockId, seatIndex)) {
      this.toast("Platz belegt");
      return false;
    }
    if (!this.canBuy(kind)) {
      this.toast("Zu wenig Ressourcen");
      return false;
    }
    const c = BUY_COST[kind];
    const p = seatPos(blockId, seatIndex);
    if (c.beer > 0) this.spend("beer", c.beer, p, "BIER");
    if (c.ordner > 0) this.spend("ordner", c.ordner, p, "ORDNER");
    if (c.shop > 0) this.spend("shop", c.shop, p, "SHOP");
    this.fans.push(this.makeFan(kind, this.playerTeam, blockId, seatIndex));
    this.seatMenu = null;
    this.floatAt(p.x, p.y + 0.02, `+${FAN_STATS[kind].label}`, true);
    this.toast(`${FAN_STATS[kind].label} gekauft`);
    return true;
  }

  tryBuild(kind: BuildingKind): boolean {
    if (!this.selectedSlot && !this.buildMenu) {
      this.toast("Slot wählen");
      return false;
    }
    const sel = this.buildMenu ?? this.selectedSlot!;
    if (sel.blockId === GAST_BLOCK) {
      this.toast("Gäste-Slots gesperrt");
      return false;
    }
    const s = this.slots.find(
      (x) => x.blockId === sel.blockId && x.index === sel.index,
    );
    if (!s || s.building) {
      this.toast("Slot belegt");
      return false;
    }
    const cost = s.greyNeutral ? Math.floor(BUILD_COST[kind] * 0.7) : BUILD_COST[kind];
    if (this.gold < cost) {
      this.toast(`${cost}g nötig`);
      return false;
    }
    this.gold -= cost;
    s.building = kind;
    s.greyNeutral = false;
    s.owner = this.playerTeam;
    if (kind === "bier") s.beer = 40;
    this.buildMenu = null;
    const p = this.standWorld(s);
    this.floatAt(p.x, p.y, `−${cost}€`, false);
    if (kind === "bier") {
      this.gain("beer", 4, { x: p.x, y: p.y - 0.025 }, "BIER");
    } else if (kind === "ordner") {
      this.gain("ordner", 6, { x: p.x, y: p.y - 0.025 }, "ORDNER");
    } else {
      this.gain("shop", 6, { x: p.x, y: p.y - 0.025 }, "SHOP");
    }
    this.toast(
      `${kind === "bier" ? "Bierstand" : kind === "ordner" ? "Ordnerposten" : "Fanshop"} gebaut`,
    );
    return true;
  }

  update(dtRaw: number): void {
    if (this.result) return;
    const dt = dtRaw * (this.speed === 0 ? 0 : this.speed);
    this.toasts = this.toasts
      .map((t) => ({ ...t, t: t.t - dtRaw }))
      .filter((t) => t.t > 0);
    // floats animate even while paused (short)
    this.floats = this.floats
      .map((f) => ({ ...f, t: f.t - dtRaw, y: f.y - f.vy * dtRaw }))
      .filter((f) => f.t > 0);

    if (dt > 0) {
      (Object.keys(this.cd) as (keyof typeof this.cd)[]).forEach((k) => {
        this.cd[k] = Math.max(0, this.cd[k] - dt);
      });
    }
    if (this.speed === 0) return;

    if (this.phase === "pens") {
      this.updatePens(dt);
      return;
    }
    if (this.phase === "regular") {
      this.realElapsed += dt;
      this.minute = (this.realElapsed / REGULAR_REAL_SEC) * 90;
      if (this.minute >= 90) {
        this.minute = 90;
        this.endRegular();
        return;
      }
    } else if (this.phase === "et") {
      this.etElapsed += dt;
      this.minute = 90 + (this.etElapsed / ET_REAL_SEC) * 30;
      if (this.etElapsed >= ET_REAL_SEC) {
        this.endEt();
        return;
      }
    }

    this.tickEconomy(dt);
    this.tickFans(dt);
    this.tickCombat(dt);
    this.tickMatch(dt);
    this.tickAi(dt);
    this.tickDefection(dt);
    this.checkInvadeWin();
    this.checkCurva();
    this.cleanupDead();
  }

  private cleanupDead(): void {
    const before = this.fans.length;
    this.fans = this.fans.filter((f) => f.hp > 0);
    if (this.fans.length < before) {
      // seats freed automatically
    }
  }

  private tickEconomy(dt: number): void {
    this.gold += (1.2 + this.countInBlock(this.playerTeam, HEIM_BLOCK, "familie") * 0.35) * dt;
    this.buildPulse += dt;

    for (const s of this.slots) {
      if (!s.building) continue;
      // stock refill for any bier stand
      if (s.building === "bier") {
        s.beer = clamp(s.beer + 0.9 * dt, 0, s.capacity);
      }
      if (s.owner !== this.playerTeam) continue;

      // slow currency drip — pulse floats every ~2.8s
      if (s.building === "bier") {
        this.currency.beer = clamp(this.currency.beer + 0.22 * dt, 0, 100);
      } else if (s.building === "ordner") {
        this.currency.ordner = clamp(this.currency.ordner + 0.2 * dt, 0, 100);
      } else if (s.building === "fanshop") {
        this.currency.shop = clamp(this.currency.shop + 0.2 * dt, 0, 100);
        this.moodHeim = clamp(this.moodHeim + 0.012 * dt, 0, 3);
      }
    }

    if (this.buildPulse >= 2.8) {
      this.buildPulse = 0;
      for (const s of this.slots) {
        if (!s.building || s.owner !== this.playerTeam) continue;
        if (s.building === "bier") this.floatAtSlot(s, "+1 BIER", true);
        else if (s.building === "ordner") this.floatAtSlot(s, "+1 ORDNER", true);
        else if (s.building === "fanshop") this.floatAtSlot(s, "+1 SHOP", true);
      }
    }
  }

  private nearestBierStand(
    team: TeamId | "neutral",
    fromBlock: number,
  ): BuildSlot | null {
    const owned = this.slots.filter((s) => {
      if (s.building !== "bier" || s.beer <= 0) return false;
      if (team === "neutral") return s.blockId === 1 || s.blockId === 2;
      if (team === this.playerTeam)
        return s.owner === this.playerTeam || s.owner === "neutral";
      return s.owner === this.aiTeam || s.owner === "neutral";
    });
    if (!owned.length) return null;
    owned.sort(
      (a, b) => Math.abs(a.blockId - fromBlock) - Math.abs(b.blockId - fromBlock),
    );
    return owned[0];
  }

  /** Path: current → door out → gang lane → gang under target → door in → target */
  private pathViaDoors(
    fromBlock: number,
    toBlock: number,
    end: { x: number; y: number },
  ): { x: number; y: number }[] {
    const outDoor = doorPos(fromBlock);
    const outLane = gangLanePos(fromBlock);
    const inLane = gangLanePos(toBlock);
    const inDoor = doorPos(toBlock);
    return [
      { x: outDoor.x, y: outDoor.y },
      { x: outLane.x, y: outLane.y },
      { x: inLane.x, y: inLane.y },
      { x: inDoor.x, y: inDoor.y },
      { x: end.x, y: end.y },
    ];
  }

  private startPath(f: FanUnit, path: { x: number; y: number }[], after: string): void {
    f.state = "moving";
    f.path = path;
    f.pathI = 0;
    f.seatIndex = null;
    this.setAfter(f, after);
  }

  private tickFans(dt: number): void {
    for (const f of this.fans) {
      if (f.hp <= 0) continue;
      f.thirst = clamp(f.thirst + 1.0 * dt, 0, 100);
      f.armSwing = Math.max(0, f.armSwing - dt * 2.2);
      f.attackCd = Math.max(0, f.attackCd - dt);

      if (f.state === "block") {
        if (f.seatIndex != null) {
          const p = seatPos(f.blockId, f.seatIndex);
          f.x = p.x;
          f.y = p.y;
        }
        if (f.thirst > 55 && f.kind !== "familie") {
          const stand = this.nearestBierStand(f.team, f.blockId);
          if (stand) {
            const sp = this.standWorld(stand);
            this.startPath(
              f,
              this.pathViaDoors(f.blockId, stand.blockId, sp),
              "stand",
            );
            f.standKey = slotKey(stand.blockId, stand.index);
          }
        }
      } else if (f.state === "moving") {
        this.followPath(f, dt);
      } else if (f.state === "stand") {
        const stand = this.slots.find(
          (s) => slotKey(s.blockId, s.index) === f.standKey,
        );
        if (stand && stand.building === "bier" && stand.beer > 0) {
          const drink = Math.min(8 * dt * FAN_STATS[f.kind].drink, stand.beer);
          stand.beer -= drink;
          f.thirst -= drink * 1.3;
          if (f.team === this.playerTeam) {
            this.momentum = clamp(
              this.momentum + drink * 0.002 * FAN_STATS[f.kind].mood,
              -1,
              1,
            );
            // accumulate drinks → discrete float events (+5€, −1 Bier-Vorrat)
            const key = slotKey(stand.blockId, stand.index);
            this.drinkAcc[key] = (this.drinkAcc[key] ?? 0) + drink;
            while (this.drinkAcc[key] >= 1) {
              this.drinkAcc[key] -= 1;
              this.gold += 5;
              const p = this.standWorld(stand);
              this.floatAt(p.x - 0.02, p.y - 0.01, "+5€", true);
              this.floatAt(p.x + 0.02, p.y - 0.025, "−1 Bier", false);
              // Vorrat-trinken zehrt auch die Bier-Währung
              const before = this.currency.beer;
              this.currency.beer = clamp(this.currency.beer - 1, 0, 100);
              if (before > 0) {
                this.floatAt(p.x, p.y - 0.04, "−1 BIER", false);
              }
            }
          } else if (f.team === this.aiTeam) {
            this.momentum = clamp(
              this.momentum - drink * 0.002 * FAN_STATS[f.kind].mood,
              -1,
              1,
            );
          }
          if (f.thirst < 25) {
            const seat = this.freeSeat(
              f.team === this.playerTeam
                ? HEIM_BLOCK
                : f.team === this.aiTeam
                  ? GAST_BLOCK
                  : f.blockId,
            );
            const home =
              f.team === this.playerTeam
                ? HEIM_BLOCK
                : f.team === this.aiTeam
                  ? GAST_BLOCK
                  : f.blockId;
            const end =
              seat != null ? seatPos(home, seat) : doorPos(home);
            this.startPath(f, this.pathViaDoors(f.blockId, home, end), "home");
            f._homeSeat = seat;
          }
        } else {
          const next = this.nearestBierStand(f.team, f.blockId);
          if (next) {
            const sp = this.standWorld(next);
            this.startPath(
              f,
              this.pathViaDoors(f.blockId, next.blockId, sp),
              "stand",
            );
            f.standKey = slotKey(next.blockId, next.index);
          } else {
            const home =
              f.team === this.playerTeam
                ? HEIM_BLOCK
                : f.team === this.aiTeam
                  ? GAST_BLOCK
                  : f.blockId;
            const seat = this.freeSeat(home) ?? 0;
            this.startPath(
              f,
              this.pathViaDoors(f.blockId, home, seatPos(home, seat)),
              "home",
            );
            f._homeSeat = seat;
          }
        }
        const sp = stand ? this.standWorld(stand) : { x: f.x, y: f.y };
        f.x = sp.x;
        f.y = sp.y;
      } else if (f.state === "gang") {
        this.tickGangMove(f, dt);
      }
    }
  }

  private standWorld(s: BuildSlot): { x: number; y: number } {
    const cx = blockCenterX(s.blockId);
    const above = s.index < 2;
    const side = s.index % 2 === 0 ? -1 : 1;
    return {
      x: cx + side * blockWidthNorm() * 0.28,
      y: (0.58 + 0.08) + (above ? -0.04 : 0.04),
    };
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
    // track gangX while on lane
    if (Math.abs(f.y - (0.58 + 0.08)) < 0.05) {
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
      f.y = 0.58 + 0.08;
      f.x = gangXToWorld(f.gangX);
    } else if (after === "stand") {
      f.state = "stand";
      if (f.standKey) {
        const [b] = f.standKey.split(":").map(Number);
        f.blockId = b;
      }
    } else if (after === "home" || after === "invade") {
      f.state = "block";
      const seat = f._homeSeat ?? this.freeSeat(f.blockId);
      f.seatIndex = seat;
      if (seat != null) {
        const p = seatPos(f.blockId, seat);
        f.x = p.x;
        f.y = p.y;
      }
      if (after === "invade") {
        f.invading = true;
        this.toast(
          f.team === this.playerTeam
            ? "Ultra im Gästeblock!"
            : "Ultra im Heimblock!",
        );
      }
    } else {
      f.state = "block";
    }
    this.setAfter(f, "");
  }

  private tickGangMove(f: FanUnit, dt: number): void {
    const dir = f.team === this.playerTeam ? 1 : -1;
    const foeNear = this.fans.some(
      (o) =>
        o !== f &&
        o.hp > 0 &&
        o.team !== f.team &&
        o.team !== "neutral" &&
        (o.state === "gang" || o.state === "stand" || o.state === "block") &&
        Math.abs(o.x - f.x) < 0.06 &&
        Math.abs(o.y - f.y) < 0.08,
    );
    if (!foeNear) {
      f.gangX = clamp(f.gangX + dir * 0.07 * FAN_STATS[f.kind].fight * dt, 0, 1);
      f.x = gangXToWorld(f.gangX);
      f.y = 0.58 + 0.08 + Math.sin(this.realElapsed * 3 + f.id) * 0.008;
    }

    // reach enemy door → enter block
    const goalBlock = f.team === this.playerTeam ? GAST_BLOCK : HEIM_BLOCK;
    const goalGx = blockIdToGangX(goalBlock);
    const reached =
      f.team === this.playerTeam ? f.gangX >= goalGx - 0.02 : f.gangX <= goalGx + 0.02;
    if (reached && !foeNear) {
      const door = doorPos(goalBlock);
      const seat = this.freeSeat(goalBlock) ?? 0;
      f.blockId = goalBlock;
      f.path = [
        { x: gangLanePos(goalBlock).x, y: gangLanePos(goalBlock).y },
        { x: door.x, y: door.y },
        { ...seatPos(goalBlock, seat) },
      ];
      f.pathI = 0;
      f.state = "moving";
      (f as FanUnit & { _homeSeat?: number })._homeSeat = seat;
      this.setAfter(f, "invade");
    }
  }

  private tickCombat(dt: number): void {
    void dt;
    const fighters = this.fans.filter(
      (f) => f.hp > 0 && (f.state === "gang" || f.invading || f.state === "block"),
    );

    for (const a of fighters) {
      if (a.team === "neutral") continue;
      if (a.kind !== "ultras" && a.state !== "gang" && !a.invading) continue;
      // find nearest enemy in range
      let best: FanUnit | null = null;
      let bestD = 0.07;
      for (const b of this.fans) {
        if (b.hp <= 0 || b === a) continue;
        if (b.team === a.team || b.team === "neutral") continue;
        // gang combat or invade into enemy block
        const sameLane =
          (a.state === "gang" && (b.state === "gang" || b.state === "stand")) ||
          (a.invading && b.blockId === a.blockId && b.state === "block") ||
          (a.state === "gang" &&
            b.state === "block" &&
            Math.abs(blockIdToGangX(b.blockId) - a.gangX) < 0.12);
        if (!sameLane) continue;
        const d = dist(a.x, a.y, b.x, b.y);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      if (!best) continue;
      if (a.attackCd > 0) continue;

      // swing + hit
      a.armSwing = 1;
      a.attackCd = HIT_CD / FAN_STATS[a.kind].fight;
      this.applyHit(a, best);

      // defender counter (except familie flee)
      if (best.hp > 0 && best.kind !== "familie" && best.attackCd <= 0) {
        best.armSwing = 1;
        best.attackCd = HIT_CD / Math.max(0.5, FAN_STATS[best.kind].fight);
        this.applyHit(best, a);
      }
    }
  }

  private applyHit(attacker: FanUnit, target: FanUnit): void {
    if (target.kind === "familie") {
      // leave stadium immediately
      target.hp = 0;
      this.toast("Familie verlässt das Stadion!");
      return;
    }
    const dmg = HIT_DAMAGE * FAN_STATS[attacker.kind].fight;
    target.hp -= dmg;
    target.aggro = clamp(target.aggro + 12, 0, 100);
    if (target.hp <= 0) {
      target.hp = 0;
      this.toast(`${FAN_STATS[target.kind].label} besiegt`);
    }
  }

  private checkInvadeWin(): void {
    const playerInvaders = this.fans.filter(
      (f) =>
        f.hp > 0 &&
        f.team === this.playerTeam &&
        f.kind === "ultras" &&
        f.blockId === GAST_BLOCK &&
        (f.state === "block" || f.invading),
    ).length;
    const aiInvaders = this.fans.filter(
      (f) =>
        f.hp > 0 &&
        f.team === this.aiTeam &&
        f.kind === "ultras" &&
        f.blockId === HEIM_BLOCK &&
        (f.state === "block" || f.invading),
    ).length;

    if (playerInvaders >= INVADE_WIN_COUNT) {
      this.blockOwner[GAST_BLOCK] = this.playerTeam;
      this.finish(
        this.playerTeam,
        "invade",
        "Gästeblock übernommen (3 Ultras)",
      );
    } else if (aiInvaders >= INVADE_WIN_COUNT) {
      this.blockOwner[HEIM_BLOCK] = this.aiTeam;
      this.finish(this.aiTeam, "invade", "Heimblock übernommen (3 Ultras)");
    }
  }

  private tickMatch(dt: number): void {
    const fever = this.minute >= FEVER_FROM_MIN || this.phase === "et" ? 1.5 : 1;
    this.chanceAcc += dt;
    if (this.chanceAcc < 16 / fever) return;
    this.chanceAcc = 0;
    if (this.momentum > 0.85) {
      if (Math.random() < 0.55) this.scoreGoal(this.playerTeam);
    } else if (this.momentum < -0.85) {
      if (Math.random() < 0.55) this.scoreGoal(this.aiTeam);
    } else {
      const bias = (this.momentum + 1) / 2;
      if (Math.random() < 0.35) {
        this.scoreGoal(Math.random() < bias ? this.playerTeam : this.aiTeam);
      }
    }
  }

  private scoreGoal(team: TeamId): void {
    if (team === "ksc") this.scoreKsc++;
    else this.scoreVfb++;
    if (team === this.playerTeam) {
      this.moodHeim = clamp(this.moodHeim + 0.4, 0, 3);
      // Tor-Jubel: etwas SHOP, kostet etwas BIER (Pyro-Feeling)
      const door = doorPos(HEIM_BLOCK);
      this.gain("shop", 3, door, "SHOP");
      this.spend("beer", 2, { x: door.x, y: door.y - 0.03 }, "BIER");
    } else {
      this.moodGaeste = clamp(this.moodGaeste + 0.4, 0, 3);
    }
    this.toast(`TOR ${teamLabel(team)}! ${this.scoreKsc}:${this.scoreVfb}`);
  }

  private tickAi(dt: number): void {
    this.aiAcc += dt;
    if (this.aiAcc < 12 / diffMul(this.cfg.settings.difficulty)) return;
    this.aiAcc = 0;
    const ultras = this.fans.filter(
      (f) =>
        f.team === this.aiTeam &&
        f.kind === "ultras" &&
        f.hp > 0 &&
        f.state === "block" &&
        f.blockId === GAST_BLOCK,
    );
    if (ultras.length) this.sendToGang(ultras[0]);
  }

  private tickDefection(dt: number): void {
    this.defectAcc += dt;
    const scoreLead =
      this.playerTeam === "ksc"
        ? this.scoreKsc - this.scoreVfb
        : this.scoreVfb - this.scoreKsc;

    for (const f of this.fans) {
      if (f.team !== "neutral" || f.hp <= 0) continue;
      let pull = this.momentum * 0.35 + (this.moodHeim - this.moodGaeste) * 0.12;
      pull += scoreLead * 0.08;
      const nearHeim = this.slots.some(
        (s) =>
          s.building &&
          s.owner === this.playerTeam &&
          Math.abs(s.blockId - f.blockId) <= 1,
      );
      const nearGuest = this.slots.some(
        (s) =>
          s.building &&
          s.owner === this.aiTeam &&
          Math.abs(s.blockId - f.blockId) <= 1,
      );
      if (nearHeim) pull += 0.25;
      if (nearGuest) pull -= 0.25;
      f.lean = clamp(f.lean + pull * dt * 0.15, -1, 1);

      if (this.defectAcc < 1.2) continue;
      if (f.lean > 0.72 && Math.random() < 0.08) {
        const seat = this.freeSeat(HEIM_BLOCK);
        if (seat == null) continue;
        f.team = this.playerTeam;
        f.blockId = HEIM_BLOCK;
        f.state = "block";
        f.seatIndex = seat;
        const p = seatPos(HEIM_BLOCK, seat);
        f.x = p.x;
        f.y = p.y;
        this.toast("Überläufer → Heim");
      } else if (f.lean < -0.72 && Math.random() < 0.08) {
        const seat = this.freeSeat(GAST_BLOCK);
        if (seat == null) continue;
        f.team = this.aiTeam;
        f.blockId = GAST_BLOCK;
        f.state = "block";
        f.seatIndex = seat;
        const p = seatPos(GAST_BLOCK, seat);
        f.x = p.x;
        f.y = p.y;
        this.toast("Überläufer → Gäste");
      }
    }
    if (this.defectAcc >= 1.2) this.defectAcc = 0;
  }

  private checkCurva(): void {
    const homeAlive = this.fans.some(
      (f) => f.team === this.playerTeam && f.hp > 0,
    );
    const awayAlive = this.fans.some((f) => f.team === this.aiTeam && f.hp > 0);
    if (!homeAlive) this.finish(this.aiTeam, "curva", "Kurve zusammengebrochen");
    else if (!awayAlive)
      this.finish(this.playerTeam, "curva", "Gästeblock leer");
  }

  private endRegular(): void {
    if (this.scoreKsc !== this.scoreVfb) {
      this.finish(
        this.scoreKsc > this.scoreVfb ? "ksc" : "vfb",
        "score",
        "Sieg nach 90′",
      );
      return;
    }
    this.phase = "et";
    this.toast("Verlängerung");
  }

  private endEt(): void {
    if (this.scoreKsc !== this.scoreVfb) {
      this.finish(
        this.scoreKsc > this.scoreVfb ? "ksc" : "vfb",
        "et",
        "Sieg nach VL",
      );
      return;
    }
    this.phase = "pens";
    this.pens = Array.from({ length: 5 }, () => ({ ksc: null, vfb: null }));
    this.pensRound = 0;
    this.toast("Elfmeter");
  }

  private updatePens(dt: number): void {
    this.pensTimer += dt;
    if (this.pensTimer < 1.1) return;
    this.pensTimer = 0;
    if (this.pensRound >= 5) {
      this.resolvePens();
      return;
    }
    const r = this.pens[this.pensRound];
    if (r.ksc == null) {
      r.ksc = Math.random() < 0.55 + this.momentum * 0.1;
      return;
    }
    if (r.vfb == null) {
      r.vfb = Math.random() < 0.55 - this.momentum * 0.1;
      this.pensRound++;
      if (this.pensRound >= 5) this.resolvePens();
    }
  }

  private resolvePens(): void {
    const k = this.pens.filter((p) => p.ksc).length;
    const v = this.pens.filter((p) => p.vfb).length;
    const winner: TeamId =
      k === v ? (Math.random() < 0.5 ? "ksc" : "vfb") : k > v ? "ksc" : "vfb";
    this.finish(winner, "pens", `Elfmeter ${k}:${v}`);
  }

  private finish(
    winner: TeamId,
    reason: MatchResult["reason"],
    detail: string,
  ): void {
    this.phase = "ended";
    this.speed = 0;
    this.result = {
      winner,
      reason,
      score: [this.scoreKsc, this.scoreVfb],
      detail,
    };
    this.toast(detail);
  }
}
