import {
  COSTS,
  ET_REAL_SEC,
  FAN_STATS,
  FEVER_FROM_MIN,
  LANE_SLOTS,
  REGULAR_REAL_SEC,
  type AiBehavior,
  type AiDifficulty,
  type BierStand,
  type CurvaAction,
  type FanKind,
  type FanUnit,
  type LaneBlock,
  type MatchPhase,
  type SendKind,
  type SetupConfig,
  type SoloSettings,
  type SpeedMode,
  type TeamId,
} from "./types";
import { clamp, expandMix, teamLabel } from "./util";

export type MatchConfig = {
  settings: SoloSettings;
  playerSetup: SetupConfig;
  aiSetup: SetupConfig;
};

export type MatchResult = {
  winner: TeamId;
  reason: "score" | "et" | "pens" | "beer" | "mood" | "curva";
  score: [number, number];
  detail: string;
};

export type BuyState = {
  ok: boolean;
  label: string;
  cost: number;
  reason?: string;
};

let nextId = 1;
function uid(): number {
  return nextId++;
}

function diffMul(d: AiDifficulty): number {
  if (d === "easy") return 0.65;
  if (d === "hard") return 1.2;
  return 0.9;
}

function makeFans(mix: SetupConfig["mix"]): FanUnit[] {
  return expandMix(mix).map((kind) => ({
    id: uid(),
    kind,
    hp: FAN_STATS[kind].maxHp,
    maxHp: FAN_STATS[kind].maxHp,
    thirst: 25 + Math.random() * 15,
    aggro: kind === "ultras" ? 35 : kind === "normalos" ? 15 : 8,
    zone: "curva" as const,
  }));
}

export class Match {
  readonly cfg: MatchConfig;
  readonly playerTeam: TeamId;
  readonly aiTeam: TeamId;
  playerFans: FanUnit[];
  aiFans: FanUnit[];
  blocks: LaneBlock[] = [];
  stands: BierStand[] = [];
  phase: MatchPhase = "regular";
  minute = 0;
  realElapsed = 0;
  etElapsed = 0;
  scoreKsc = 0;
  scoreVfb = 0;
  gold = 160;
  aiGold = 150;
  momentum = 40;
  aiMomentum = 40;
  mood = 30;
  aiMood = 30;
  beerDrunk = 0;
  aiBeerDrunk = 0;
  speed: SpeedMode = 1;
  toasts: { text: string; t: number }[] = [];
  result: MatchResult | null = null;
  chanceAcc = 0;
  aiAcc = 0;
  pensRound = 0;
  pens: { ksc: boolean | null; vfb: boolean | null }[] = [];
  pensTimer = 0;
  selectedLaneSlot: number | null = null;
  width = 900;
  height = 420;
  pressure = 0; // -1..1 negative = toward player curva

  constructor(cfg: MatchConfig) {
    this.cfg = cfg;
    this.playerTeam = cfg.settings.playerTeam;
    this.aiTeam = cfg.settings.playerTeam === "ksc" ? "vfb" : "ksc";
    this.playerFans = makeFans(cfg.playerSetup.mix);
    this.aiFans = makeFans(cfg.aiSetup.mix);
    if (cfg.playerSetup.startBier) {
      this.stands.push({
        id: uid(),
        slot: 1,
        owner: this.playerTeam,
        beer: 40,
        capacity: 100,
      });
    }
    this.stands.push({
      id: uid(),
      slot: 3,
      owner: this.aiTeam,
      beer: 40,
      capacity: 100,
    });
    // neutral middle stand empty-ish
    this.stands.push({
      id: uid(),
      slot: 2,
      owner: "neutral",
      beer: 55,
      capacity: 100,
    });
    // Sichtbare Demo-Blöcke, damit die Lane sofort lesbar ist
    this.blocks.push({
      id: uid(),
      team: this.playerTeam,
      ultras: 1,
      normalos: 1,
      familie: 0,
      x: 0.28,
      hp: 70,
      maxHp: 70,
      thirst: 30,
      aggro: 40,
    });
    this.blocks.push({
      id: uid(),
      team: this.aiTeam,
      ultras: 1,
      normalos: 0,
      familie: 1,
      x: 0.72,
      hp: 65,
      maxHp: 65,
      thirst: 30,
      aggro: 35,
    });
    this.toast(`${teamLabel(this.playerTeam)} vs ${teamLabel(this.aiTeam)} — ▶ starten`);
    this.speed = 0;
  }

  toast(text: string): void {
    this.toasts.push({ text, t: 2.4 });
  }

  setSpeed(s: SpeedMode): void {
    this.speed = s;
  }

  aliveInCurva(fans: FanUnit[]): FanUnit[] {
    return fans.filter((f) => f.zone === "curva" && f.hp > 0);
  }

  countKind(fans: FanUnit[], kind: FanKind): number {
    return this.aliveInCurva(fans).filter((f) => f.kind === kind).length;
  }

  sendCost(kind: SendKind): number {
    if (kind === "ultras") return COSTS.sendUltras;
    if (kind === "normalos") return COSTS.sendNormalos;
    if (kind === "familie") return COSTS.sendFamilie;
    return COSTS.sendMix;
  }

  canSend(kind: SendKind): BuyState {
    const cost = this.sendCost(kind);
    if (this.gold < cost)
      return { ok: false, label: this.sendLabel(kind), cost, reason: "Gold" };
    if (kind === "mix") {
      if (this.aliveInCurva(this.playerFans).length < 2)
        return { ok: false, label: this.sendLabel(kind), cost, reason: "Fans" };
      return { ok: true, label: this.sendLabel(kind), cost };
    }
    if (this.countKind(this.playerFans, kind) < 1)
      return {
        ok: false,
        label: this.sendLabel(kind),
        cost,
        reason: "Fan-Typ",
      };
    return { ok: true, label: this.sendLabel(kind), cost };
  }

  sendLabel(kind: SendKind): string {
    if (kind === "mix") return "Mix-Block";
    return `${FAN_STATS[kind].label}-Trupp`;
  }

  canBuildBier(slot: number): BuyState {
    const cost = COSTS.bierstand;
    if (this.stands.some((s) => s.slot === slot))
      return { ok: false, label: "Bierstand", cost, reason: "Belegt" };
    if (this.gold < cost)
      return { ok: false, label: "Bierstand", cost, reason: "Gold" };
    return { ok: true, label: "Bierstand", cost };
  }

  canCurvaAction(act: CurvaAction): BuyState {
    if (act === "pyro") {
      const cost = COSTS.pyro;
      const ultrasOk = this.countKind(this.playerFans, "ultras") >= 1;
      if (this.gold < cost)
        return { ok: false, label: "Pyro", cost, reason: "Gold" };
      if (!ultrasOk)
        return { ok: false, label: "Pyro", cost, reason: "Ultra nötig" };
      return { ok: true, label: "Pyro", cost };
    }
    const cost = COSTS.chor;
    if (this.gold < cost)
      return { ok: false, label: "Chor", cost, reason: "Gold" };
    if (this.aliveInCurva(this.playerFans).length < 3)
      return { ok: false, label: "Chor", cost, reason: "Fans" };
    return { ok: true, label: "Chor", cost };
  }

  trySend(kind: SendKind): boolean {
    const st = this.canSend(kind);
    if (!st.ok) {
      this.toast(`${st.label}: fehlt ${st.reason}`);
      return false;
    }
    this.gold -= st.cost;
    let ultras = 0,
      normalos = 0,
      familie = 0;
    if (kind === "mix") {
      const pool = this.aliveInCurva(this.playerFans);
      const take = pool.slice(0, Math.min(3, pool.length));
      for (const f of take) {
        if (f.kind === "ultras") ultras++;
        if (f.kind === "normalos") normalos++;
        if (f.kind === "familie") familie++;
        f.zone = "neutral"; // left curva temporarily while on lane represented by block
        f.hp = Math.max(1, f.hp - 5);
      }
    } else {
      const f = this.aliveInCurva(this.playerFans).find((x) => x.kind === kind);
      if (!f) return false;
      if (kind === "ultras") ultras = 1;
      if (kind === "normalos") normalos = 1;
      if (kind === "familie") familie = 1;
      f.zone = "neutral";
    }
    const fight =
      ultras * FAN_STATS.ultras.fight +
      normalos * FAN_STATS.normalos.fight +
      familie * FAN_STATS.familie.fight;
    const hp = 40 + fight * 35;
    this.blocks.push({
      id: uid(),
      team: this.playerTeam,
      ultras,
      normalos,
      familie,
      x: 0.12,
      hp,
      maxHp: hp,
      thirst: 30,
      aggro: 20 + ultras * 25,
    });
    this.toast(`${st.label} auf die Lane`);
    return true;
  }

  tryBuildBier(slot: number): boolean {
    const st = this.canBuildBier(slot);
    if (!st.ok) {
      this.toast(`Bierstand: ${st.reason}`);
      return false;
    }
    this.gold -= st.cost;
    this.stands.push({
      id: uid(),
      slot,
      owner: this.playerTeam,
      beer: 25,
      capacity: 100,
    });
    this.toast("Bierstand gebaut");
    return true;
  }

  tryCurvaAction(act: CurvaAction): boolean {
    const st = this.canCurvaAction(act);
    if (!st.ok) {
      this.toast(`${st.label}: ${st.reason}`);
      return false;
    }
    this.gold -= st.cost;
    if (act === "pyro") {
      this.momentum = clamp(this.momentum + 12, 0, 100);
      this.mood = clamp(this.mood + 14, 0, 100);
      for (const f of this.aliveInCurva(this.playerFans)) {
        f.aggro = clamp(f.aggro + (f.kind === "ultras" ? 18 : 6), 0, 100);
        f.thirst = clamp(f.thirst + 8, 0, 100);
      }
      this.aiMood = clamp(this.aiMood - 6, 0, 100);
      this.toast("Pyro! Stimmung↑");
    } else {
      this.momentum = clamp(this.momentum + 8, 0, 100);
      this.mood = clamp(this.mood + 10, 0, 100);
      for (const f of this.aliveInCurva(this.playerFans)) {
        if (f.kind === "normalos") f.thirst = clamp(f.thirst + 5, 0, 100);
      }
      this.toast("Chor singt");
    }
    return true;
  }

  update(dtRaw: number): void {
    if (this.result) return;
    const dt = dtRaw * (this.speed === 0 ? 0 : this.speed);
    this.toasts = this.toasts
      .map((t) => ({ ...t, t: t.t - dtRaw }))
      .filter((t) => t.t > 0);
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

    const fever =
      this.phase === "et" || this.minute >= FEVER_FROM_MIN
        ? this.minute >= 85 || this.phase === "et"
          ? 2
          : 1.5
        : 1;

    this.tickFans(dt, fever);
    this.tickStands(dt);
    this.tickBlocks(dt, fever);
    this.tickIncome(dt);
    this.tickChances(dt, fever);
    this.tickAi(dt);
    this.checkWins();
  }

  private tickFans(dt: number, fever: number): void {
    for (const f of this.playerFans) {
      if (f.hp <= 0) continue;
      f.thirst = clamp(f.thirst + 1.1 * dt * fever, 0, 100);
      // drink from nearest owned/neutral stand if thirsty
      if (f.thirst > 40 && f.zone === "curva") {
        const stand = this.stands.find(
          (s) =>
            s.beer > 0 &&
            (s.owner === this.playerTeam || s.owner === "neutral"),
        );
        if (stand) {
          const drink =
            Math.min(8 * dt * FAN_STATS[f.kind].drink, stand.beer, f.thirst);
          stand.beer -= drink;
          f.thirst -= drink * 1.2;
          this.beerDrunk += drink * 0.2;
          this.momentum = clamp(
            this.momentum + drink * 0.08 * FAN_STATS[f.kind].mood * fever,
            0,
            100,
          );
        } else if (f.thirst > 70) {
          f.aggro = clamp(f.aggro + 2 * dt, 0, 100);
          if (f.kind !== "ultras" && f.thirst > 85 && Math.random() < 0.002) {
            f.zone = "neutral";
            this.toast(`${FAN_STATS[f.kind].label} → Neutral`);
          }
        }
      }
      if (f.zone === "neutral" && f.thirst < 45 && Math.random() < 0.01 * dt) {
        f.zone = "curva";
      }
    }
    // light AI fan thirst
    for (const f of this.aiFans) {
      if (f.hp <= 0) continue;
      f.thirst = clamp(f.thirst + 1.0 * dt * fever, 0, 100);
      const stand = this.stands.find(
        (s) => s.beer > 0 && (s.owner === this.aiTeam || s.owner === "neutral"),
      );
      if (stand && f.thirst > 40) {
        const drink = Math.min(6 * dt, stand.beer);
        stand.beer -= drink;
        f.thirst -= drink;
        this.aiBeerDrunk += drink * 0.2;
      }
    }
  }

  private tickStands(dt: number): void {
    for (const s of this.stands) {
      if (s.owner === this.playerTeam) s.beer = clamp(s.beer + 2.2 * dt, 0, s.capacity);
      else if (s.owner === this.aiTeam) s.beer = clamp(s.beer + 2.0 * dt, 0, s.capacity);
      else s.beer = clamp(s.beer + 0.6 * dt, 0, s.capacity);
    }
  }

  private tickIncome(dt: number): void {
    let income = 3;
    for (const f of this.aliveInCurva(this.playerFans)) {
      income += FAN_STATS[f.kind].income * 0.9;
    }
    this.gold += income * dt;
    this.aiGold += (4 + (this.cfg.settings.difficulty === "easy" ? 1 : 3)) * dt;
  }

  private blockPower(b: LaneBlock): number {
    return (
      b.ultras * FAN_STATS.ultras.fight +
      b.normalos * FAN_STATS.normalos.fight +
      b.familie * FAN_STATS.familie.fight +
      b.aggro / 80
    );
  }

  private tickBlocks(dt: number, fever: number): void {
    const mul = diffMul(this.cfg.settings.difficulty);
    // move
    for (const b of this.blocks) {
      const speed = 0.022 + this.blockPower(b) * 0.005;
      if (b.team === this.playerTeam) b.x += speed * dt;
      else b.x -= speed * dt * mul;
      b.thirst = clamp(b.thirst + 4 * dt, 0, 100);
      // drink while passing stands
      const slot = Math.round(b.x * (LANE_SLOTS - 1));
      const stand = this.stands.find((s) => s.slot === slot && s.beer > 0);
      if (stand && b.thirst > 25) {
        const drink = Math.min(10 * dt, stand.beer);
        stand.beer -= drink;
        b.thirst -= drink;
        if (b.team === this.playerTeam) {
          this.beerDrunk += drink * 0.25;
          if (b.normalos > 0) this.mood = clamp(this.mood + drink * 0.15, 0, 100);
          if (b.familie > 0) this.gold += drink * 0.8;
        } else {
          this.aiBeerDrunk += drink * 0.25;
        }
      }
    }

    // collide opposing blocks
    for (let i = 0; i < this.blocks.length; i++) {
      for (let j = i + 1; j < this.blocks.length; j++) {
        const a = this.blocks[i];
        const b = this.blocks[j];
        if (a.team === b.team) continue;
        if (Math.abs(a.x - b.x) > 0.06) continue;
        const pa = this.blockPower(a);
        const pb = this.blockPower(b);
        a.hp -= pb * 10 * dt * fever;
        b.hp -= pa * 10 * dt * fever;
        a.aggro = clamp(a.aggro + 10 * dt, 0, 100);
        b.aggro = clamp(b.aggro + 10 * dt, 0, 100);
        // push
        if (pa > pb) {
          b.x += 0.02 * dt;
          a.x += 0.01 * dt;
        } else {
          a.x -= 0.02 * dt;
          b.x -= 0.01 * dt;
        }
      }
    }

    // overflow into curvas
    const left: LaneBlock[] = [];
    for (const b of this.blocks) {
      if (b.hp <= 0) continue;
      if (b.team === this.playerTeam && b.x >= 0.92) {
        this.applyOverflow(b, "intoAi");
        continue;
      }
      if (b.team === this.aiTeam && b.x <= 0.08) {
        this.applyOverflow(b, "intoPlayer");
        continue;
      }
      left.push(b);
    }
    this.blocks = left;

    // pressure meter from blocks on lane
    let p = 0;
    for (const b of this.blocks) {
      const pow = this.blockPower(b);
      p += b.team === this.playerTeam ? pow * b.x : -pow * (1 - b.x);
    }
    this.pressure = clamp(p / 8, -1, 1);
  }

  private applyOverflow(b: LaneBlock, dir: "intoAi" | "intoPlayer"): void {
    const power = this.blockPower(b);
    if (dir === "intoAi") {
      this.damageCurva(this.aiFans, power * 10);
      this.momentum = clamp(this.momentum + 5, 0, 100);
      this.mood = clamp(this.mood + 4, 0, 100);
      this.aiMood = clamp(this.aiMood - 5, 0, 100);
      this.toast("Überschwappen in die Gegnerkurve!");
      // return some fans home
      this.recallLaneFans(this.playerFans, b);
    } else {
      this.damageCurva(this.playerFans, power * 10 * diffMul(this.cfg.settings.difficulty));
      this.toast("Gegner drängt in eure Kurve!");
      this.recallLaneFans(this.aiFans, b);
    }
  }

  private recallLaneFans(fans: FanUnit[], b: LaneBlock): void {
    let need =
      b.ultras + b.normalos + b.familie;
    for (const f of fans) {
      if (need <= 0) break;
      if (f.zone === "neutral" && f.hp > 0) {
        f.zone = "curva";
        f.hp = Math.max(10, f.hp - 8);
        need--;
      }
    }
  }

  private damageCurva(fans: FanUnit[], dmg: number): void {
    let left = dmg;
    const targets = fans.filter((f) => f.zone === "curva" && f.hp > 0);
    if (!targets.length) return;
    const each = left / targets.length;
    for (const f of targets) {
      f.hp -= each;
      f.aggro = clamp(f.aggro + 8, 0, 100);
      if (f.hp <= 0) {
        f.hp = 0;
        f.zone = "neutral";
      }
    }
  }

  private tickChances(dt: number, fever: number): void {
    this.chanceAcc += dt;
    const interval = fever > 1 ? 14 : 20;
    if (this.chanceAcc < interval) return;
    this.chanceAcc = 0;
    const p = this.momentum + this.mood * 0.3 + this.pressure * 15;
    const a = this.aiMomentum + this.aiMood * 0.3 - this.pressure * 15;
    const total = Math.max(1, p + a);
    const roll = Math.random();
    if (roll < (p / total) * 0.45) this.scoreGoal(this.playerTeam);
    else if (roll > 1 - (a / total) * 0.45) this.scoreGoal(this.aiTeam);
  }

  private scoreGoal(team: TeamId): void {
    if (team === "ksc") this.scoreKsc++;
    else this.scoreVfb++;
    const us = team === this.playerTeam;
    if (us) {
      this.momentum = clamp(this.momentum + 8, 0, 100);
      for (const f of this.playerFans) {
        f.thirst = clamp(f.thirst + 14, 0, 100);
        f.aggro = clamp(f.aggro + (f.kind === "ultras" ? 10 : 3), 0, 100);
      }
      for (const f of this.aiFans) {
        f.thirst = clamp(f.thirst + 12, 0, 100); // Kummerbier
        f.aggro = clamp(f.aggro + 8, 0, 100);
      }
    } else {
      this.aiMomentum = clamp(this.aiMomentum + 8, 0, 100);
      for (const f of this.playerFans) {
        f.thirst = clamp(f.thirst + 12, 0, 100);
        f.aggro = clamp(f.aggro + 6, 0, 100);
      }
    }
    this.toast(`TOR ${teamLabel(team)}!  ${this.scoreKsc}:${this.scoreVfb}`);
  }

  private tickAi(dt: number): void {
    this.aiAcc += dt;
    const every =
      this.cfg.settings.difficulty === "easy"
        ? 14
        : this.cfg.settings.difficulty === "hard"
          ? 7
          : 10;
    if (this.aiAcc < every) return;
    this.aiAcc = 0;
    const b: AiBehavior = this.cfg.settings.behavior;
    // AI send
    const cost = COSTS.sendMix;
    if (this.aiGold >= cost && this.aliveInCurva(this.aiFans).length >= 2) {
      this.aiGold -= cost;
      const pool = this.aliveInCurva(this.aiFans).slice(0, 2);
      let ultras = 0,
        normalos = 0,
        familie = 0;
      for (const f of pool) {
        if (f.kind === "ultras") ultras++;
        else if (f.kind === "normalos") normalos++;
        else familie++;
        f.zone = "neutral";
      }
      if (b === "aggro") {
        ultras++;
      }
      const fight =
        ultras * FAN_STATS.ultras.fight +
        normalos * FAN_STATS.normalos.fight +
        familie * FAN_STATS.familie.fight;
      const hp = 40 + fight * 30;
      this.blocks.push({
        id: uid(),
        team: this.aiTeam,
        ultras: Math.max(ultras, b === "aggro" ? 1 : ultras),
        normalos,
        familie,
        x: 0.88,
        hp,
        maxHp: hp,
        thirst: 30,
        aggro: 25,
      });
    }
  }

  private checkWins(): void {
    if (this.phase === "regular") {
      if (this.beerDrunk >= 160) {
        this.finish(this.playerTeam, "beer", "Bier-Early-Win");
        return;
      }
      if (this.aiBeerDrunk >= 160) {
        this.finish(this.aiTeam, "beer", "KI Bier-Win");
        return;
      }
      if (this.mood >= 90 && this.mood - this.aiMood >= 25) {
        this.finish(this.playerTeam, "mood", "Stimmungs-Übernahme");
        return;
      }
    }
    const playerAlive = this.playerFans.some((f) => f.hp > 0 && f.zone === "curva");
    const aiAlive = this.aiFans.some((f) => f.hp > 0 && f.zone === "curva");
    if (!playerAlive) {
      this.finish(this.aiTeam, "curva", "Kurve verloren");
      return;
    }
    if (!aiAlive) {
      this.finish(this.playerTeam, "curva", "Gegnerkurve übernommen");
    }
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
    this.toast("Verlängerung!");
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
    this.toast("Elfmeterschießen!");
  }

  private updatePens(dt: number): void {
    this.pensTimer += dt;
    if (this.pensTimer < 1.2) return;
    this.pensTimer = 0;
    if (this.pensRound >= 5) {
      this.resolvePens();
      return;
    }
    const round = this.pens[this.pensRound];
    if (round.ksc == null) {
      round.ksc = Math.random() < 0.55 + (this.playerTeam === "ksc" ? this.momentum - this.aiMomentum : this.aiMomentum - this.momentum) / 400;
      this.toast(round.ksc ? "KSC trifft" : "KSC daneben");
      return;
    }
    if (round.vfb == null) {
      round.vfb = Math.random() < 0.55;
      this.toast(round.vfb ? "VfB trifft" : "VfB daneben");
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
    this.result = { winner, reason, score: [this.scoreKsc, this.scoreVfb], detail };
    this.toast(detail);
  }
}
