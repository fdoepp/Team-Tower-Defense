import {
  ET_REAL_SEC,
  FEVER_FROM_MIN,
  REGULAR_REAL_SEC,
  TOWERS,
  type AiBehavior,
  type AiDifficulty,
  type EnemyKind,
  type FanMix,
  type MatchPhase,
  type SetupConfig,
  type SoloSettings,
  type TeamId,
  type TowerKind,
} from "./types";
import { clamp, synergyBonus, teamLabel } from "./util";

export type Slot = {
  id: number;
  x: number;
  y: number;
  tower: TowerKind | null;
  level: number;
};

export type Enemy = {
  id: number;
  kind: EnemyKind;
  t: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  x: number;
  y: number;
};

export type Toast = { text: string; t: number };

export type SideState = {
  team: TeamId;
  mix: FanMix;
  hp: number;
  gold: number;
  beer: number;
  thirst: number;
  interest: number;
  mood: number;
  beerDrunk: number;
  aggro: number;
  momentum: number;
  slots: Slot[];
  income: number;
};

export type MatchConfig = {
  settings: SoloSettings;
  playerSetup: SetupConfig;
  aiSetup: SetupConfig;
};

export type MatchResult = {
  winner: TeamId | "draw-bug";
  reason:
    | "score"
    | "et"
    | "pens"
    | "beer"
    | "mood"
    | "curva"
    | "player-curva-lost";
  score: [number, number];
  detail: string;
};

const PATH: { x: number; y: number }[] = [
  { x: 0.5, y: 0.06 },
  { x: 0.5, y: 0.22 },
  { x: 0.28, y: 0.38 },
  { x: 0.72, y: 0.52 },
  { x: 0.35, y: 0.68 },
  { x: 0.5, y: 0.9 },
];

const SLOT_LAYOUT = [
  { x: 0.18, y: 0.28 },
  { x: 0.82, y: 0.28 },
  { x: 0.18, y: 0.48 },
  { x: 0.82, y: 0.48 },
  { x: 0.18, y: 0.68 },
  { x: 0.82, y: 0.68 },
];

let nextId = 1;
function uid(): number {
  return nextId++;
}

function enemyStats(kind: EnemyKind): Omit<Enemy, "id" | "t" | "x" | "y"> {
  switch (kind) {
    case "runner":
      return { kind, hp: 28, maxHp: 28, speed: 0.12, damage: 1 };
    case "grunt":
      return { kind, hp: 55, maxHp: 55, speed: 0.08, damage: 1 };
    case "tank":
      return { kind, hp: 160, maxHp: 160, speed: 0.045, damage: 2 };
    case "swarm":
      return { kind, hp: 18, maxHp: 18, speed: 0.1, damage: 1 };
    case "boss":
      return { kind, hp: 280, maxHp: 280, speed: 0.04, damage: 4 };
  }
}

function pointOnPath(t: number): { x: number; y: number } {
  const clamped = clamp(t, 0, 1);
  const seg = (PATH.length - 1) * clamped;
  const i = Math.min(PATH.length - 2, Math.floor(seg));
  const f = seg - i;
  return {
    x: PATH[i].x + (PATH[i + 1].x - PATH[i].x) * f,
    y: PATH[i].y + (PATH[i + 1].y - PATH[i].y) * f,
  };
}

function diffMul(d: AiDifficulty): number {
  if (d === "easy") return 0.55;
  if (d === "hard") return 1.15;
  return 0.85;
}

export class Match {
  readonly cfg: MatchConfig;
  readonly player: SideState;
  readonly ai: SideState;
  phase: MatchPhase = "regular";
  /** 0..90 during regular, continues conceptually */
  minute = 0;
  realElapsed = 0;
  etElapsed = 0;
  score: [number, number] = [0, 0]; // [playerTeam, other] mapped by team later
  scoreKsc = 0;
  scoreVfb = 0;
  enemies: Enemy[] = [];
  spawnAcc = 0;
  chanceAcc = 0;
  aiBuyAcc = 0;
  pensRound = 0;
  pens: { ksc: boolean | null; vfb: boolean | null }[] = [];
  toasts: Toast[] = [];
  result: MatchResult | null = null;
  selectedSlot: number | null = null;
  width = 390;
  height = 700;
  fever = false;
  stadiumPegel = 0;
  log: string[] = [];

  constructor(cfg: MatchConfig) {
    this.cfg = cfg;
    this.player = this.makeSide(cfg.settings.playerTeam, cfg.playerSetup, true);
    const aiTeam: TeamId = cfg.settings.playerTeam === "ksc" ? "vfb" : "ksc";
    this.ai = this.makeSide(aiTeam, cfg.aiSetup, false);
    this.placeStartTower(this.player, cfg.playerSetup.startTower);
    this.placeStartTower(this.ai, cfg.aiSetup.startTower);
    this.toast(`${teamLabel(this.player.team)} vs ${teamLabel(this.ai.team)}`);
  }

  private makeSide(team: TeamId, setup: SetupConfig, isPlayer: boolean): SideState {
    return {
      team,
      mix: { ...setup.mix },
      hp: 24,
      gold: isPlayer ? 130 : 120,
      beer: 12,
      thirst: 20,
      interest: 70,
      mood: 25 + setup.mix.ultras * 3,
      beerDrunk: 0,
      aggro: setup.mix.ultras * 2,
      momentum: 40 + setup.mix.ultras * 2 + setup.mix.normalos,
      slots: SLOT_LAYOUT.map((p, id) => ({
        id,
        x: p.x,
        y: p.y,
        tower: null,
        level: 1,
      })),
      income: 8,
    };
  }

  private placeStartTower(side: SideState, kind: TowerKind): void {
    const slot = side.slots[kind === "gitter" || kind === "pyro" ? 2 : 0];
    slot.tower = kind;
    slot.level = 1;
    const syn = synergyBonus(side.mix, kind);
    side.mood += TOWERS[kind].mood * 0.4 * syn;
  }

  toast(text: string): void {
    this.toasts.push({ text, t: 2.2 });
    this.log.unshift(text);
    if (this.log.length > 8) this.log.pop();
  }

  pathPoints(): { x: number; y: number }[] {
    return PATH;
  }

  update(dt: number): void {
    if (this.result) return;
    this.toasts = this.toasts
      .map((x) => ({ ...x, t: x.t - dt }))
      .filter((x) => x.t > 0);

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

    this.fever =
      this.phase === "et" || this.minute >= FEVER_FROM_MIN;
    const feverMul = this.phase === "et" ? 2 : this.minute >= 85 ? 2 : this.fever ? 1.5 : 1;

    this.tickEconomy(this.player, dt, feverMul);
    this.tickEconomy(this.ai, dt, feverMul * 0.9);
    this.tickAi(dt);
    this.tickWaves(dt);
    this.tickCombat(dt);
    this.tickMatchChances(dt, feverMul);
    this.tickStadium();
    this.checkEarlyWins();
    this.checkCurvaDeath();
  }

  private tickEconomy(side: SideState, dt: number, feverMul: number): void {
    side.gold += side.income * dt;
    side.thirst = clamp(side.thirst + 1.8 * dt * feverMul, 0, 100);

    let beerGen = 0.4;
    for (const s of side.slots) {
      if (!s.tower) continue;
      const def = TOWERS[s.tower];
      const syn = synergyBonus(side.mix, s.tower);
      beerGen += def.beerGen * s.level * syn * 0.2;
      side.mood = clamp(
        side.mood + def.mood * 0.015 * s.level * syn * dt * feverMul,
        0,
        100,
      );
      side.aggro = clamp(side.aggro + def.aggro * 0.01 * dt, 0, 100);
    }

    side.beer = clamp(side.beer + beerGen * dt, 0, 80);
    const drink = Math.min(side.thirst * 0.35 * dt, side.beer, 8 * dt);
    if (drink > 0) {
      side.beer -= drink;
      side.thirst -= drink * 1.4;
      const quality = side.interest / 100;
      side.beerDrunk += drink * (1 + (this.fever ? 0.3 : 0));
      side.momentum = clamp(
        side.momentum + drink * 0.35 * quality * feverMul,
        0,
        100,
      );
      // Normalos like beer
      if (side.mix.normalos >= 4) side.interest = clamp(side.interest + drink * 0.15, 0, 100);
    } else if (side.thirst > 55) {
      side.interest = clamp(side.interest - 3 * dt * feverMul, 0, 100);
      if (side.mix.ultras >= 4) side.aggro = clamp(side.aggro + 2 * dt, 0, 100);
    }

    // Interest drift
    side.interest = clamp(side.interest - 0.35 * dt, 0, 100);
    if (side.interest < 35) {
      // fans drift — reduce mood effectiveness
      side.mood = clamp(side.mood - 1.5 * dt, 0, 100);
    }
    if (side.interest < 18) {
      side.hp = Math.max(0, side.hp); // home walk doesn't instantly kill, soft loss of fan cap via mood already
    }
  }

  private tickStadium(): void {
    const pege = Math.min(this.player.mood, this.ai.mood);
    const lead = Math.abs(this.player.mood - this.ai.mood);
    this.stadiumPegel = pege;
    if (lead < 15) {
      this.player.interest = clamp(this.player.interest + pege * 0.01, 0, 100);
      this.ai.interest = clamp(this.ai.interest + pege * 0.01, 0, 100);
    } else {
      const leader = this.player.mood > this.ai.mood ? this.player : this.ai;
      const trailer = leader === this.player ? this.ai : this.player;
      trailer.interest = clamp(trailer.interest - 0.08, 0, 100);
      trailer.aggro = clamp(trailer.aggro + 0.05, 0, 100);
      // frustrated AI fans push harder waves indirectly via aggro
    }
  }

  private tickWaves(dt: number): void {
    const mul = diffMul(this.cfg.settings.difficulty);
    const rate =
      (0.28 + this.minute / 140 + this.ai.aggro / 180) * mul *
      (this.phase === "et" ? 1.25 : 1);
    this.spawnAcc += dt * rate;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      this.spawnEnemyWave();
    }
  }

  private spawnEnemyWave(): void {
    const m = this.minute;
    let kind: EnemyKind = "grunt";
    const r = Math.random();
    if (m < 15) kind = r < 0.6 ? "runner" : "grunt";
    else if (m < 40) kind = r < 0.3 ? "runner" : r < 0.7 ? "grunt" : "swarm";
    else if (m < 70) kind = r < 0.25 ? "tank" : r < 0.55 ? "grunt" : r < 0.8 ? "swarm" : "runner";
    else kind = r < 0.2 ? "boss" : r < 0.45 ? "tank" : r < 0.7 ? "swarm" : "grunt";

    const count = kind === "swarm" ? 4 : 1;
    for (let i = 0; i < count; i++) {
      const st = enemyStats(kind);
      const e: Enemy = {
        id: uid(),
        ...st,
        t: -i * 0.03,
        x: 0.5,
        y: 0.06,
      };
      // difficulty scales hp
      const mul = diffMul(this.cfg.settings.difficulty);
      e.hp *= mul;
      e.maxHp *= mul;
      this.enemies.push(e);
    }
  }

  private tickCombat(dt: number): void {
    // Move enemies on player path only (solo: defend your curva against AI pressure)
    for (const e of this.enemies) {
      let slow = 1;
      let dps = 0;
      const pos = pointOnPath(clamp(e.t, 0, 1));
      e.x = pos.x;
      e.y = pos.y;
      for (const s of this.player.slots) {
        if (!s.tower) continue;
        const def = TOWERS[s.tower];
        if (def.dps <= 0 && def.slow <= 0) continue;
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        const dist = Math.hypot(dx, dy) * this.height;
        if (dist <= def.range + s.level * 8) {
          dps += def.dps * s.level * synergyBonus(this.player.mix, s.tower);
          slow *= 1 - def.slow * 0.5;
        }
      }
      e.hp -= dps * dt;
      e.t += e.speed * slow * dt;
    }

    const alive: Enemy[] = [];
    for (const e of this.enemies) {
      if (e.hp <= 0) {
        this.player.gold += 4;
        this.player.momentum = clamp(this.player.momentum + 0.4, 0, 100);
        continue;
      }
      if (e.t >= 1) {
        this.player.hp -= e.damage;
        this.player.interest = clamp(this.player.interest - 2, 0, 100);
        this.player.momentum = clamp(this.player.momentum - 3, 0, 100);
        this.ai.aggro = clamp(this.ai.aggro + 1, 0, 100);
        this.toast(`Leak! −${e.damage} Curva`);
        continue;
      }
      alive.push(e);
    }
    this.enemies = alive;
  }

  private tickMatchChances(dt: number, feverMul: number): void {
    // Cards from aggro
    if (Math.random() < ((this.player.aggro + this.ai.aggro) / 2) * 0.00035 * feverMul) {
      const victim = Math.random() < 0.5 ? this.player : this.ai;
      victim.momentum = clamp(victim.momentum - 8, 0, 100);
      victim.aggro = clamp(victim.aggro + 4, 0, 100);
      this.toast(`Gelb! ${teamLabel(victim.team)} geschwächt`);
      if (Math.random() < 0.22) {
        victim.momentum = clamp(victim.momentum - 12, 0, 100);
        victim.interest = clamp(victim.interest - 6, 0, 100);
        if (victim.mix.ultras >= 4) victim.aggro = clamp(victim.aggro + 10, 0, 100);
        this.toast(`ROT! ${teamLabel(victim.team)} Platzverweis`);
      }
    }

    this.chanceAcc += dt;
    const interval = this.fever ? 9 : 14;
    if (this.chanceAcc < interval) return;
    this.chanceAcc = 0;

    const p = this.player.momentum + this.player.mood * 0.25 + this.player.interest * 0.1;
    const a = this.ai.momentum + this.ai.mood * 0.25 + this.ai.interest * 0.1;
    const total = p + a + 1;
    const playerChance = p / total;
    const roll = Math.random();
    if (roll < playerChance * 0.55) {
      this.scoreGoal(this.player.team);
    } else if (roll > 1 - (1 - playerChance) * 0.55) {
      this.scoreGoal(this.ai.team);
    } else {
      // chance wasted
      if (Math.random() < 0.4) this.toast("Torwart hält!");
    }
  }

  private scoreGoal(team: TeamId): void {
    if (team === "ksc") this.scoreKsc += 1;
    else this.scoreVfb += 1;
    const scorer = team === this.player.team ? this.player : this.ai;
    const concede = scorer === this.player ? this.ai : this.player;
    const feverMul = this.fever ? 1.8 : 1;

    scorer.thirst = clamp(scorer.thirst + 18 * feverMul, 0, 100);
    scorer.interest = clamp(scorer.interest + 12 * feverMul, 0, 100);
    scorer.mood = clamp(scorer.mood + 10 * feverMul, 0, 100);
    scorer.momentum = clamp(scorer.momentum + 6, 0, 100);

    // Kummerbier
    concede.thirst = clamp(concede.thirst + 16 * feverMul, 0, 100);
    concede.interest = clamp(concede.interest - 14 * feverMul, 0, 100);
    if (concede.mix.ultras >= 3) concede.aggro = clamp(concede.aggro + 12 * feverMul, 0, 100);

    this.toast(`TOR ${teamLabel(team)}!  ${this.scoreKsc}:${this.scoreVfb}`);
  }

  private tickAi(dt: number): void {
    const b = this.cfg.settings.behavior;
    const d = this.cfg.settings.difficulty;
    const side = this.ai;
    this.aiBuyAcc += dt;
    const buyEvery = d === "easy" ? 7 : d === "hard" ? 3.5 : 5;
    if (this.aiBuyAcc >= buyEvery) {
      this.aiBuyAcc = 0;
      this.aiTryBuy(b);
    }
    if (b === "beer" || b === "earlywin") {
      side.thirst = clamp(side.thirst + dt * 1.2, 0, 100);
    }
    if (b === "aggro" || b === "earlywin") {
      side.mood = clamp(side.mood + dt * 1.5, 0, 100);
      side.aggro = clamp(side.aggro + dt * 0.8, 0, 100);
    }
    if (b === "patient") {
      side.gold += dt * 1.2;
      side.mood = clamp(side.mood + dt * 0.3, 0, 100);
    }
  }

  private aiTryBuy(behavior: AiBehavior): void {
    const free = this.ai.slots.find((s) => !s.tower);
    if (!free) return;
    let prefer: TowerKind[] = ["gitter", "bier", "chor", "pyro", "schmaeh"];
    if (behavior === "beer") prefer = ["bier", "chor", "gitter", "pyro", "schmaeh"];
    if (behavior === "aggro") prefer = ["pyro", "schmaeh", "chor", "gitter", "bier"];
    if (behavior === "earlywin") prefer = ["bier", "pyro", "chor", "schmaeh", "gitter"];
    if (behavior === "patient") prefer = ["gitter", "bier", "chor", "pyro", "schmaeh"];
    for (const kind of prefer) {
      const cost = TOWERS[kind].cost;
      if (this.ai.gold >= cost) {
        this.ai.gold -= cost;
        free.tower = kind;
        return;
      }
    }
  }

  tryBuild(kind: TowerKind): boolean {
    let slot =
      this.selectedSlot != null ? this.player.slots[this.selectedSlot] : null;
    if (!slot || slot.tower) {
      slot = this.player.slots.find((s) => !s.tower) ?? null;
      if (slot) this.selectedSlot = slot.id;
    }
    if (!slot || slot.tower) {
      this.toast("Kein freier Slot");
      return false;
    }
    const cost = TOWERS[kind].cost;
    if (this.player.gold < cost) {
      this.toast("Zu wenig Gold");
      return false;
    }
    this.player.gold -= cost;
    slot.tower = kind;
    slot.level = 1;
    this.toast(`${TOWERS[kind].name} gebaut`);
    return true;
  }

  tryUpgrade(): boolean {
    if (this.selectedSlot == null) return false;
    const slot = this.player.slots[this.selectedSlot];
    if (!slot?.tower || slot.level >= 3) return false;
    const cost = Math.floor(TOWERS[slot.tower].cost * (0.7 * slot.level));
    if (this.player.gold < cost) {
      this.toast("Zu wenig Gold");
      return false;
    }
    this.player.gold -= cost;
    slot.level += 1;
    this.toast(`Upgrade L${slot.level}`);
    return true;
  }

  activatePyro(): void {
    if (this.player.gold < 25) {
      this.toast("Pyro braucht 25 Gold");
      return;
    }
    this.player.gold -= 25;
    const mul = this.fever ? 2 : 1;
    this.player.mood = clamp(this.player.mood + 14 * mul, 0, 100);
    this.player.interest = clamp(this.player.interest + 16 * mul, 0, 100);
    this.player.aggro = clamp(this.player.aggro + 6 * mul, 0, 100);
    this.player.momentum = clamp(this.player.momentum + 5 * mul, 0, 100);
    this.toast("Pyro! Interesse↑");
  }

  drinkRaid(): void {
    // Fremdtrinken / Neutral
    if (this.player.gold < 20) {
      this.toast("Trinkkommando: 20 Gold");
      return;
    }
    this.player.gold -= 20;
    const gained = 6 + Math.random() * 5;
    this.player.beerDrunk += gained;
    this.ai.beer = Math.max(0, this.ai.beer - gained * 0.6);
    this.ai.thirst = clamp(this.ai.thirst + 4, 0, 100);
    this.toast(`Fremdtrinken +${gained.toFixed(0)}ℓ`);
  }

  private checkEarlyWins(): void {
    if (this.phase !== "regular") return;
    const beerNeed = 120;
    const moodNeed = 88;
    const moodLead = 22;

    if (this.player.beerDrunk >= beerNeed) {
      this.finish(this.player.team, "beer", "Bier-Early-Win: Stadion leergetrunken!");
      return;
    }
    if (this.ai.beerDrunk >= beerNeed) {
      this.finish(this.ai.team, "beer", "KI gewinnt per Bier-Übernahme");
      return;
    }
    if (this.player.mood >= moodNeed && this.player.mood - this.ai.mood >= moodLead) {
      this.finish(this.player.team, "mood", "Stimmungs-Early-Win: Kurva übernimmt!");
      return;
    }
    if (this.ai.mood >= moodNeed && this.ai.mood - this.player.mood >= moodLead) {
      this.finish(this.ai.team, "mood", "KI-Stimmung dominiert das Stadion");
    }
  }

  private checkCurvaDeath(): void {
    if (this.player.hp <= 0) {
      this.finish(this.ai.team, "curva", "Curva-Kill — eure Kurve bricht");
    }
  }

  private endRegular(): void {
    if (this.scoreKsc !== this.scoreVfb) {
      const winner: TeamId = this.scoreKsc > this.scoreVfb ? "ksc" : "vfb";
      this.finish(winner, "score", "Sieg nach 90 Minuten");
      return;
    }
    this.phase = "et";
    this.toast("Verlängerung!");
  }

  private endEt(): void {
    if (this.scoreKsc !== this.scoreVfb) {
      const winner: TeamId = this.scoreKsc > this.scoreVfb ? "ksc" : "vfb";
      this.finish(winner, "et", "Sieg nach Verlängerung");
      return;
    }
    this.phase = "pens";
    this.pens = Array.from({ length: 5 }, () => ({ ksc: null, vfb: null }));
    this.pensRound = 0;
    this.pensTimer = 0;
    this.toast("Elfmeterschießen!");
  }

  private pensTimer = 0;
  private updatePens(dt: number): void {
    this.pensTimer += dt;
    if (this.pensTimer < 1.1) return;
    this.pensTimer = 0;
    if (this.pensRound >= 5) {
      this.resolvePens();
      return;
    }
    const round = this.pens[this.pensRound];
    if (round.ksc == null) {
      const kscSide = this.player.team === "ksc" ? this.player : this.ai;
      round.ksc = Math.random() < clamp(0.45 + kscSide.momentum / 250, 0.35, 0.8);
      this.toast(round.ksc ? "KSC trifft!" : "KSC daneben!");
      return;
    }
    if (round.vfb == null) {
      const vfbSide = this.player.team === "vfb" ? this.player : this.ai;
      round.vfb = Math.random() < clamp(0.45 + vfbSide.momentum / 250, 0.35, 0.8);
      this.toast(round.vfb ? "VfB trifft!" : "VfB daneben!");
      this.pensRound += 1;
      if (this.pensRound >= 5) this.resolvePens();
    }
  }

  private resolvePens(): void {
    const k = this.pens.filter((p) => p.ksc).length;
    const v = this.pens.filter((p) => p.vfb).length;
    if (k === v) {
      // sudden death one more
      const winner: TeamId = Math.random() < 0.5 ? "ksc" : "vfb";
      this.finish(winner, "pens", `Elfmeter-Glück ${teamLabel(winner)} (${k}:${v}+)`);
      return;
    }
    const winner: TeamId = k > v ? "ksc" : "vfb";
    this.finish(winner, "pens", `Elfmeter ${k}:${v}`);
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
    this.toast(detail);
  }

  worldFromNorm(nx: number, ny: number): { x: number; y: number } {
    return { x: nx * this.width, y: ny * this.height };
  }
}
