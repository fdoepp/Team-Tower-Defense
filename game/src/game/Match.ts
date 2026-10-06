import {
  BLOCK_META,
  ET_REAL_SEC,
  FAN_STATS,
  FEVER_FROM_MIN,
  MOOD_CD,
  RECRUIT,
  REGULAR_REAL_SEC,
  ULTRA_ORDER_CD,
  type AiDifficulty,
  type BuildSlot,
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
import { blockCenterX, blockIdToGangX, gangXToWorld } from "./layout";

export type MatchConfig = {
  settings: SoloSettings;
  playerSetup: SetupConfig;
  aiSetup: SetupConfig;
};

export type MatchResult = {
  winner: TeamId;
  reason: "score" | "et" | "pens" | "curva";
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
  momentum = 0; // -1 AI ... +1 player
  moodHeim = 1; // 0..3 segments filled (display 1-4)
  moodGaeste = 1;
  speed: SpeedMode = 0;
  toasts: { text: string; t: number }[] = [];
  result: MatchResult | null = null;
  cd = { gesang: 0, pyro: 0, klatschen: 0, ultraOrder: 0 };
  selectedSlot: { blockId: number; index: number } | null = null;
  chanceAcc = 0;
  aiAcc = 0;
  recruitAcc = 0;
  /** progress meters 0..need */
  recruit = { beer: 0, security: 0, fight: 0 };
  defectAcc = 0;
  width = 960;
  height = 440;
  pensRound = 0;
  pens: { ksc: boolean | null; vfb: boolean | null }[] = [];
  pensTimer = 0;

  constructor(cfg: MatchConfig) {
    this.cfg = cfg;
    this.playerTeam = cfg.settings.playerTeam;
    this.aiTeam = cfg.settings.playerTeam === "ksc" ? "vfb" : "ksc";

    for (const b of BLOCK_META) {
      for (let i = 0; i < 4; i++) {
        const isNeutralBlock = b.id >= 1 && b.id <= 3;
        this.slots.push({
          blockId: b.id,
          index: i,
          hasBier: false,
          greyNeutral: isNeutralBlock && (i === 0 || i === 1),
          beer: 0,
          capacity: 100,
          owner: isNeutralBlock ? "neutral" : null,
        });
      }
    }
    // start bier in heim + gaeste (colored)
    this.placeBier(0, 0, true, this.playerTeam);
    this.placeBier(0, 2, true, this.playerTeam);
    this.placeBier(4, 0, true, this.aiTeam);
    this.placeBier(4, 2, true, this.aiTeam);

    const homeKinds = expandMix(cfg.playerSetup.mix);
    homeKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.playerTeam, 0, i));
    });
    const awayKinds = expandMix(cfg.aiSetup.mix);
    awayKinds.forEach((kind, i) => {
      this.fans.push(this.makeFan(kind, this.aiTeam, 4, i));
    });
    // Neutrals populate blocks 1-3
    for (const blockId of [1, 2, 3]) {
      const count = 4 + (blockId === 2 ? 2 : 0);
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
    idx: number,
  ): FanUnit {
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    return {
      id: uid(),
      kind,
      team,
      blockId,
      state: "block",
      standKey: null,
      hp: FAN_STATS[kind].maxHp,
      maxHp: FAN_STATS[kind].maxHp,
      thirst: 20 + Math.random() * 20,
      aggro: kind === "ultras" ? 30 : 10,
      lean: 0,
      gangX: blockIdToGangX(blockId),
      x: blockCenterX(blockId) - 0.04 + col * 0.02,
      y: 0.28 + row * 0.05,
    };
  }

  private placeBier(
    blockId: number,
    index: number,
    free: boolean,
    owner: TeamId | "neutral",
  ): void {
    const s = this.slots.find((x) => x.blockId === blockId && x.index === index);
    if (!s || s.hasBier) return;
    if (!free && this.gold < 50) return;
    if (!free) this.gold -= 50;
    s.hasBier = true;
    s.greyNeutral = false;
    s.beer = 60;
    s.owner = owner;
  }

  toast(text: string): void {
    this.toasts.push({ text, t: 2.2 });
  }

  setSpeed(s: SpeedMode): void {
    this.speed = s;
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

  moodActionReady(act: MoodAction): boolean {
    return this.cd[act] <= 0;
  }

  tryMoodAction(act: MoodAction): boolean {
    if (this.cd[act] > 0) {
      this.toast(`${act}: Abklingzeit`);
      return false;
    }
    const kind: FanKind =
      act === "gesang" ? "normalos" : act === "pyro" ? "ultras" : "familie";
    const n = this.countInBlock(this.playerTeam, 0, kind);
    if (n <= 0) {
      this.toast(`Keine ${FAN_STATS[kind].label}s im Block`);
      return false;
    }
    const effect = n;
    this.cd[act] = MOOD_CD[act];
    if (act === "gesang") {
      this.moodHeim = clamp(this.moodHeim + 0.35 * effect, 0, 3);
      this.momentum = clamp(this.momentum + 0.04 * effect, -1, 1);
      this.toast(`Gesang ×${n}`);
    } else if (act === "pyro") {
      this.moodHeim = clamp(this.moodHeim + 0.45 * effect, 0, 3);
      this.momentum = clamp(this.momentum + 0.05 * effect, -1, 1);
      this.moodGaeste = clamp(this.moodGaeste - 0.15 * effect, 0, 3);
      for (const f of this.fans) {
        if (f.team === this.playerTeam && f.kind === "ultras")
          f.aggro = clamp(f.aggro + 8 * effect, 0, 100);
      }
      this.toast(`Pyro ×${n}`);
    } else {
      this.moodHeim = clamp(this.moodHeim + 0.25 * effect, 0, 3);
      this.gold += 4 * n;
      // Familie: Sicherheit + Spielstand/Stimmung
      const scoreLead =
        (this.playerTeam === "ksc" ? this.scoreKsc - this.scoreVfb : this.scoreVfb - this.scoreKsc);
      this.recruit.security += n * (1.2 + Math.max(0, scoreLead) * 0.4 + this.moodHeim * 0.35);
      this.toast(`Klatschen ×${n} (+Gold)`);
    }
    return true;
  }

  ultraOrderReady(): boolean {
    return (
      this.cd.ultraOrder <= 0 &&
      this.fans.some(
        (f) =>
          f.team === this.playerTeam &&
          f.kind === "ultras" &&
          f.hp > 0 &&
          (f.state === "block" || f.state === "stand"),
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
        (f.state === "block" || f.state === "stand"),
    );
    if (!ultras.length) {
      this.toast("Keine Ultras im Block");
      return false;
    }
    const take = ultras[0];
    take.state = "gang";
    take.standKey = null;
    take.gangX = blockIdToGangX(0) + 0.02;
    take.blockId = 0;
    take.x = gangXToWorld(take.gangX);
    take.y = 0.64;
    this.cd.ultraOrder = ULTRA_ORDER_CD;
    this.toast("1 Ultra → Gang (greift Stände an)");
    return true;
  }

  tryBuildSelected(): boolean {
    if (!this.selectedSlot) {
      this.toast("Slot wählen");
      return false;
    }
    const { blockId, index } = this.selectedSlot;
    if (blockId === 4) {
      this.toast("Gäste-Slots gesperrt");
      return false;
    }
    const s = this.slots.find((x) => x.blockId === blockId && x.index === index);
    if (!s) return false;
    if (s.hasBier) {
      this.toast("Slot belegt");
      return false;
    }
    // grey neutral buildings: claim for 35g (cheaper convert)
    const cost = s.greyNeutral ? 35 : 50;
    if (this.gold < cost) {
      this.toast(`${cost}g nötig`);
      return false;
    }
    this.gold -= cost;
    s.hasBier = true;
    s.greyNeutral = false;
    s.beer = 40;
    s.owner = this.playerTeam;
    this.toast(s.blockId >= 1 && s.blockId <= 3 ? "Neutral-Stand übernommen" : "Bierstand gebaut");
    return true;
  }

  update(dtRaw: number): void {
    if (this.result) return;
    const dt = dtRaw * (this.speed === 0 ? 0 : this.speed);
    this.toasts = this.toasts
      .map((t) => ({ ...t, t: t.t - dtRaw }))
      .filter((t) => t.t > 0);

    // CDs tick even? only when playing
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
    this.tickRecruit(dt);
    this.tickDefection(dt);
    this.checkCurva();
  }

  private tickEconomy(dt: number): void {
    this.gold += (3 + this.countInBlock(this.playerTeam, 0, "familie") * 0.8) * dt;
    for (const s of this.slots) {
      if (s.hasBier) s.beer = clamp(s.beer + 1.6 * dt, 0, s.capacity);
    }
  }

  private nearestBier(
    team: TeamId | "neutral",
    fromBlock: number,
  ): BuildSlot | null {
    const owned = this.slots.filter((s) => {
      if ((!s.hasBier && !s.greyNeutral) || (s.hasBier && s.beer <= 0)) return false;
      if (!s.hasBier && s.greyNeutral) return false; // grey = no beer yet
      if (team === "neutral") return s.blockId >= 1 && s.blockId <= 3;
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

  private tickFans(dt: number): void {
    for (const f of this.fans) {
      if (f.hp <= 0) continue;
      f.thirst = clamp(f.thirst + 1.0 * dt, 0, 100);

      if (f.state === "block") {
        // idle drift in block
        f.y = 0.26 + (f.id % 5) * 0.035 + Math.sin(this.realElapsed + f.id) * 0.004;
        f.x = blockCenterX(f.blockId) - 0.045 + (f.id % 5) * 0.02;
        if (f.thirst > 55) {
          const stand = this.nearestBier(f.team, f.blockId);
          if (stand) {
            f.state = "moving";
            f.standKey = slotKey(stand.blockId, stand.index);
            f.gangX = blockIdToGangX(stand.blockId);
          }
        }
      } else if (f.state === "moving") {
        const targetX = f.gangX;
        // move toward gang then to stand x
        f.y += (0.62 - f.y) * Math.min(1, 2.2 * dt);
        f.x += (gangXToWorld(targetX) - f.x) * Math.min(1, 1.8 * dt);
        if (Math.abs(f.y - 0.62) < 0.03 && Math.abs(f.x - gangXToWorld(targetX)) < 0.04) {
          f.state = "stand";
          f.blockId = Math.round(targetX * 4);
        }
      } else if (f.state === "stand") {
        const stand = this.slots.find(
          (s) => slotKey(s.blockId, s.index) === f.standKey,
        );
        if (stand && stand.hasBier && stand.beer > 0) {
          const drink = Math.min(10 * dt * FAN_STATS[f.kind].drink, stand.beer);
          stand.beer -= drink;
          f.thirst -= drink * 1.3;
          if (f.team === this.playerTeam) {
            this.momentum = clamp(
              this.momentum + drink * 0.002 * FAN_STATS[f.kind].mood,
              -1,
              1,
            );
            this.recruit.beer += drink * 0.45;
          } else if (f.team === this.aiTeam) {
            this.momentum = clamp(
              this.momentum - drink * 0.002 * FAN_STATS[f.kind].mood,
              -1,
              1,
            );
          }
          // defend / push toward next stand if thirsty low and aggro
          if (f.thirst < 35 && f.kind === "ultras" && Math.random() < 0.01) {
            f.state = "gang";
            f.gangX = blockIdToGangX(f.blockId);
          } else if (f.thirst < 25) {
            f.state = "block";
            f.standKey = null;
            f.blockId = f.team === this.playerTeam ? 0 : 4;
          }
        } else {
          // fight toward next stocked stand
          const next = this.nearestBier(f.team, f.blockId);
          if (next) {
            f.state = "moving";
            f.standKey = slotKey(next.blockId, next.index);
            f.gangX = blockIdToGangX(next.blockId);
          } else {
            f.state = "block";
            f.standKey = null;
          }
        }
        // spread around the stand slot instead of stacking
        const slotIdx = stand?.index ?? f.id % 4;
        const side = slotIdx % 2 === 0 ? -1 : 1;
        const above = slotIdx < 2 ? -1 : 1;
        f.x =
          gangXToWorld(blockIdToGangX(f.blockId)) +
          side * 0.035 +
          ((f.id % 3) - 1) * 0.012;
        f.y = 0.655 + above * 0.045 + (f.id % 2) * 0.008;
      } else if (f.state === "gang") {
        const dir = f.team === this.playerTeam ? 1 : -1;
        // slower when engaged in stand fight (handled in combat)
        const speed = 0.055 * FAN_STATS[f.kind].fight;
        f.gangX = clamp(f.gangX + dir * speed * dt, 0, 1);
        f.x = gangXToWorld(f.gangX);
        f.y = 0.655 + Math.sin(this.realElapsed * 4 + f.id) * 0.012;
        if (f.hp < f.maxHp * 0.22) {
          f.state = "block";
          f.blockId = f.team === this.playerTeam ? 0 : 4;
          f.x = blockCenterX(f.blockId);
          f.y = 0.3;
        }
      }
    }
  }

  private tickCombat(dt: number): void {
    const onGang = this.fans.filter((f) => f.hp > 0 && f.state === "gang");

    // 1) Gang vs Gang
    for (let i = 0; i < onGang.length; i++) {
      for (let j = i + 1; j < onGang.length; j++) {
        const a = onGang[i];
        const b = onGang[j];
        if (a.team === b.team || a.team === "neutral" || b.team === "neutral")
          continue;
        if (Math.abs(a.gangX - b.gangX) > 0.08) continue;
        a.hp -= FAN_STATS[b.kind].fight * 14 * dt;
        b.hp -= FAN_STATS[a.kind].fight * 14 * dt;
        // push stalemate slightly
        if (FAN_STATS[a.kind].fight >= FAN_STATS[b.kind].fight) b.gangX -= 0.01 * dt;
        else a.gangX += 0.01 * dt;
        if (a.team === this.playerTeam)
          this.recruit.fight += FAN_STATS[a.kind].fight * 5 * dt;
        if (b.team === this.playerTeam)
          this.recruit.fight += FAN_STATS[b.kind].fight * 5 * dt;
      }
    }

    // 2) Ultras on gang attack fans at stands they pass
    for (const attacker of onGang) {
      if (attacker.team === "neutral") continue;
      const enemyTeam =
        attacker.team === this.playerTeam ? this.aiTeam : this.playerTeam;
      for (const stand of this.slots) {
        if (!stand.hasBier) continue;
        const standGx = blockIdToGangX(stand.blockId);
        if (Math.abs(attacker.gangX - standGx) > 0.09) continue;
        // attack defenders at this stand
        const defenders = this.fans.filter(
          (f) =>
            f.hp > 0 &&
            f.state === "stand" &&
            f.blockId === stand.blockId &&
            f.team !== attacker.team,
        );
        if (defenders.length) {
          for (const d of defenders) {
            d.hp -= FAN_STATS[attacker.kind].fight * 16 * dt;
            attacker.hp -= FAN_STATS[d.kind].fight * 6 * dt;
          }
          // slow down while fighting the stand
          attacker.gangX -= (attacker.team === this.playerTeam ? 1 : -1) * 0.02 * dt;
          if (attacker.team === this.playerTeam)
            this.recruit.fight += 6 * dt;
          if (Math.random() < 0.01)
            this.toast("Stand-Kampf!");
        } else if (stand.owner === enemyTeam || stand.owner === "neutral") {
          // smash unattended / enemy beer
          stand.beer = Math.max(0, stand.beer - 18 * dt);
          if (stand.beer <= 0 && stand.owner === enemyTeam) {
            stand.hasBier = false;
            stand.owner = null;
            this.toast("Stand zerstört!");
          }
        }
      }

      // 3) Reach enemy block → pressure / damage curva
      const goal = attacker.team === this.playerTeam ? 0.92 : 0.08;
      const reached =
        attacker.team === this.playerTeam
          ? attacker.gangX >= goal
          : attacker.gangX <= goal;
      if (reached) {
        const targetBlock = attacker.team === this.playerTeam ? 4 : 0;
        const victims = this.fans.filter(
          (f) =>
            f.hp > 0 &&
            f.blockId === targetBlock &&
            f.team !== attacker.team &&
            (f.state === "block" || f.state === "stand"),
        );
        for (const v of victims.slice(0, 3)) {
          v.hp -= FAN_STATS[attacker.kind].fight * 10 * dt;
        }
        if (attacker.team === this.playerTeam) {
          this.momentum = clamp(this.momentum + 0.08 * dt, -1, 1);
          this.moodGaeste = clamp(this.moodGaeste - 0.05 * dt, 0, 3);
          this.recruit.fight += 8 * dt;
        } else {
          this.momentum = clamp(this.momentum - 0.08 * dt, -1, 1);
          this.moodHeim = clamp(this.moodHeim - 0.05 * dt, 0, 3);
        }
        // bounce back a bit so they don't stick forever
        if (Math.random() < 0.02) {
          attacker.gangX = clamp(
            attacker.gangX + (attacker.team === this.playerTeam ? -0.15 : 0.15),
            0,
            1,
          );
          this.toast(
            attacker.team === this.playerTeam
              ? "Ultra stürmt Gästeblock!"
              : "Gegner-Ultra im Heimblock!",
          );
        }
      }
    }

    let p = 0;
    for (const f of onGang) {
      if (f.team === "neutral") continue;
      p += f.team === this.playerTeam ? FAN_STATS[f.kind].fight : -FAN_STATS[f.kind].fight;
    }
    this.momentum = clamp(this.momentum + p * 0.012 * dt, -1, 1);
  }

  private tickMatch(dt: number): void {
    const fever = this.minute >= FEVER_FROM_MIN || this.phase === "et" ? 1.5 : 1;
    this.chanceAcc += dt;
    if (this.chanceAcc < 16 / fever) return;
    this.chanceAcc = 0;
    // only side with momentum can score when fully swung
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
      for (const f of this.fans) {
        if (f.team === this.playerTeam) f.thirst = clamp(f.thirst + 12, 0, 100);
        else {
          f.thirst = clamp(f.thirst + 10, 0, 100);
          f.aggro = clamp(f.aggro + 6, 0, 100);
        }
      }
    } else {
      this.moodGaeste = clamp(this.moodGaeste + 0.4, 0, 3);
      for (const f of this.fans) {
        if (f.team === this.playerTeam) {
          f.thirst = clamp(f.thirst + 10, 0, 100);
          f.aggro = clamp(f.aggro + 5, 0, 100);
        }
      }
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
        f.state === "block",
    );
    if (ultras.length) {
      const f = ultras[0];
      f.state = "gang";
      f.standKey = null;
      f.gangX = blockIdToGangX(4) - 0.02;
      f.blockId = 4;
      f.x = gangXToWorld(f.gangX);
      f.y = 0.64;
    }
  }

  private tickRecruit(_dt: number): void {
    const homeCount = this.fans.filter(
      (f) => f.team === this.playerTeam && f.hp > 0,
    ).length;
    if (homeCount >= 18) return;

    if (this.recruit.beer >= RECRUIT.normalosBeer) {
      this.recruit.beer = 0;
      this.spawnHomeFan("normalos");
      this.toast("Neuer Normalo (Bier)");
    }
    if (this.recruit.security >= RECRUIT.familieSecurity) {
      this.recruit.security = 0;
      this.spawnHomeFan("familie");
      this.toast("Neue Familie (Sicherheit/Stimmung)");
    }
    if (this.recruit.fight >= RECRUIT.ultrasFight) {
      this.recruit.fight = 0;
      this.spawnHomeFan("ultras");
      this.toast("Neuer Ultra (Gang-Kampf)");
    }
  }

  private spawnHomeFan(kind: FanKind): void {
    const home = this.fans.filter((f) => f.team === this.playerTeam && f.hp > 0);
    this.fans.push(this.makeFan(kind, this.playerTeam, 0, home.length));
  }

  /**
   * Neutrals lean and eventually defect to Heim or Gäste.
   * Lean rises with nearby claimed beer, mood, momentum, score.
   */
  private tickDefection(dt: number): void {
    this.defectAcc += dt;
    const scoreLead =
      this.playerTeam === "ksc"
        ? this.scoreKsc - this.scoreVfb
        : this.scoreVfb - this.scoreKsc;

    for (const f of this.fans) {
      if (f.team !== "neutral" || f.hp <= 0) continue;
      // pull toward heim (+)
      let pull = this.momentum * 0.35 + (this.moodHeim - this.moodGaeste) * 0.12;
      pull += scoreLead * 0.08;
      const nearHeimStand = this.slots.some(
        (s) =>
          s.hasBier &&
          s.owner === this.playerTeam &&
          Math.abs(s.blockId - f.blockId) <= 1,
      );
      const nearGuestStand = this.slots.some(
        (s) =>
          s.hasBier &&
          s.owner === this.aiTeam &&
          Math.abs(s.blockId - f.blockId) <= 1,
      );
      if (nearHeimStand) pull += 0.25;
      if (nearGuestStand) pull -= 0.25;
      // pyro/mood actions leave residual via mood meters already
      f.lean = clamp(f.lean + pull * dt * 0.15, -1, 1);

      if (this.defectAcc < 1.2) continue;
      if (f.lean > 0.72 && Math.random() < 0.08) {
        f.team = this.playerTeam;
        f.blockId = 0;
        f.state = "block";
        this.toast("Überläufer → Heim");
      } else if (f.lean < -0.72 && Math.random() < 0.08) {
        f.team = this.aiTeam;
        f.blockId = 4;
        f.state = "block";
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
      this.finish(this.playerTeam, "curva", "Gästeblock übernommen");
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
