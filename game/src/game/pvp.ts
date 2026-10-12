/**
 * Live PvP: host-authoritative commands + compact snapshots.
 * Host simulates one Match; guest sends inputs and applies snaps.
 */
import type {
  BuildingKind,
  FanKind,
  FanUnit,
  BuildSlot,
  TeamId,
} from "./types";
import type { Match } from "./Match";
import type { HalfBoostId } from "./feelPack";

export type PvpCmd =
  | { op: "buy"; kind: FanKind }
  | { op: "sendHool"; count: 1 | "all" }
  | { op: "sendPyro"; count: 1 | "all" }
  | { op: "build"; blockId: number; index: number; kind: BuildingKind }
  | { op: "upgradeBuild"; blockId: number; index: number }
  | { op: "upgradeUnit"; kind: FanKind | "ordner" }
  | { op: "hire"; blockId: number; index: number }
  | { op: "selectSlot"; blockId: number; index: number | null }
  | { op: "halfBoost"; id: HalfBoostId };

export type PvpFanSnap = {
  id: number;
  kind: FanKind;
  team: TeamId | "neutral";
  blockId: number;
  state: FanUnit["state"];
  seatIndex: number | null;
  standKey: string | null;
  hp: number;
  maxHp: number;
  gangX: number;
  x: number;
  y: number;
  invading: boolean;
  isSteward: boolean;
  homeBlockId: number;
  rangedPyro: boolean;
  onOffense: boolean;
  level: number;
  thirst: number;
  aggro: number;
  armSwing: number;
  drinkT: number;
  shopT: number;
  throwT: number;
  cheerT: number;
  homeStandKey: string | null;
  _homeSeat?: number | null;
  _after?: string;
};

export type PvpSlotSnap = {
  blockId: number;
  index: number;
  building: BuildingKind | null;
  greyNeutral: boolean;
  beer: number;
  merch: number;
  owner: TeamId | "neutral" | null;
  level: number;
  structHp: number;
  structMaxHp: number;
  prodFlash: number;
};

export type PvpSnap = {
  tick: number;
  minute: number;
  phase: string;
  scoreKsc: number;
  scoreVfb: number;
  momentum: number;
  moodHeim: number;
  moodGaeste: number;
  gold: number;
  currency: { beer: number; merch: number; security: number };
  aiGold: number;
  aiBeer: number;
  aiMerch: number;
  aiSecurity: number;
  unitTech: Record<FanKind | "ordner", number>;
  aiTech: Record<FanKind | "ordner", number>;
  linePlayer: number;
  lineAi: number;
  cd: { hooliganOrder: number; pyroFight: number };
  halfTimePending: boolean;
  result: Match["result"];
  scorePulse: number;
  lastGoalTeam: TeamId | null;
  beersDrunkPlayer: number;
  beersDrunkAi: number;
  fans: PvpFanSnap[];
  slots: PvpSlotSnap[];
  toast?: string;
};

export function exportPvpSnap(m: Match, tick: number): PvpSnap {
  return {
    tick,
    minute: m.minute,
    phase: m.phase,
    scoreKsc: m.scoreKsc,
    scoreVfb: m.scoreVfb,
    momentum: m.momentum,
    moodHeim: m.moodHeim,
    moodGaeste: m.moodGaeste,
    gold: m.gold,
    currency: { ...m.currency },
    aiGold: m.aiGold,
    aiBeer: m.aiBeer,
    aiMerch: m.aiMerch,
    aiSecurity: m.aiSecurity,
    unitTech: { ...m.unitTech },
    aiTech: { ...m.aiTech },
    linePlayer: m.linePlayer,
    lineAi: m.lineAi,
    cd: { ...m.cd },
    halfTimePending: m.halfTimePending,
    result: m.result,
    scorePulse: m.scorePulse,
    lastGoalTeam: m.lastGoalTeam,
    beersDrunkPlayer: m.beersDrunkPlayer,
    beersDrunkAi: m.beersDrunkAi,
    toast: m.toasts[0]?.text,
    fans: m.fans.map(
      (f): PvpFanSnap => ({
        id: f.id,
        kind: f.kind,
        team: f.team,
        blockId: f.blockId,
        state: f.state,
        seatIndex: f.seatIndex,
        standKey: f.standKey,
        hp: f.hp,
        maxHp: f.maxHp,
        gangX: f.gangX,
        x: f.x,
        y: f.y,
        invading: f.invading,
        isSteward: f.isSteward,
        homeBlockId: f.homeBlockId,
        rangedPyro: f.rangedPyro,
        onOffense: f.onOffense,
        level: f.level,
        thirst: f.thirst,
        aggro: f.aggro,
        armSwing: f.armSwing,
        drinkT: f.drinkT,
        shopT: f.shopT,
        throwT: f.throwT,
        cheerT: f.cheerT,
        homeStandKey: f.homeStandKey,
        _homeSeat: f._homeSeat,
        _after: f._after,
      }),
    ),
    slots: m.slots.map(
      (s): PvpSlotSnap => ({
        blockId: s.blockId,
        index: s.index,
        building: s.building,
        greyNeutral: s.greyNeutral,
        beer: s.beer,
        merch: s.merch,
        owner: s.owner,
        level: s.level,
        structHp: s.structHp,
        structMaxHp: s.structMaxHp,
        prodFlash: s.prodFlash,
      }),
    ),
  };
}

export function applyPvpSnap(m: Match, snap: PvpSnap): void {
  m.minute = snap.minute;
  m.phase = snap.phase as Match["phase"];
  m.scoreKsc = snap.scoreKsc;
  m.scoreVfb = snap.scoreVfb;
  m.momentum = snap.momentum;
  m.moodHeim = snap.moodHeim;
  m.moodGaeste = snap.moodGaeste;
  m.gold = snap.gold;
  m.currency.beer = snap.currency.beer;
  m.currency.merch = snap.currency.merch;
  m.currency.security = snap.currency.security;
  m.aiGold = snap.aiGold;
  m.aiBeer = snap.aiBeer;
  m.aiMerch = snap.aiMerch;
  m.aiSecurity = snap.aiSecurity;
  Object.assign(m.unitTech, snap.unitTech);
  Object.assign(m.aiTech, snap.aiTech);
  m.linePlayer = snap.linePlayer;
  m.lineAi = snap.lineAi;
  m.cd.hooliganOrder = snap.cd.hooliganOrder;
  m.cd.pyroFight = snap.cd.pyroFight;
  m.halfTimePending = snap.halfTimePending;
  m.result = snap.result;
  m.scorePulse = snap.scorePulse;
  m.lastGoalTeam = snap.lastGoalTeam;
  m.beersDrunkPlayer = snap.beersDrunkPlayer;
  m.beersDrunkAi = snap.beersDrunkAi;

  const byKey = new Map<string, BuildSlot>();
  for (const s of m.slots) byKey.set(`${s.blockId}:${s.index}`, s);
  for (const ss of snap.slots) {
    const s = byKey.get(`${ss.blockId}:${ss.index}`);
    if (!s) continue;
    s.building = ss.building;
    s.greyNeutral = ss.greyNeutral;
    s.beer = ss.beer;
    s.merch = ss.merch;
    s.owner = ss.owner;
    s.level = ss.level;
    s.structHp = ss.structHp;
    s.structMaxHp = ss.structMaxHp;
    s.prodFlash = ss.prodFlash;
  }

  const prev = new Map(m.fans.map((f) => [f.id, f]));
  const next: FanUnit[] = [];
  for (const fs of snap.fans) {
    const old = prev.get(fs.id);
    if (old) {
      old.kind = fs.kind;
      old.team = fs.team;
      old.blockId = fs.blockId;
      old.state = fs.state;
      old.seatIndex = fs.seatIndex;
      old.standKey = fs.standKey;
      old.hp = fs.hp;
      old.maxHp = fs.maxHp;
      old.gangX = fs.gangX;
      old.x = fs.x;
      old.y = fs.y;
      old.invading = fs.invading;
      old.isSteward = fs.isSteward;
      old.homeBlockId = fs.homeBlockId;
      old.rangedPyro = fs.rangedPyro;
      old.onOffense = fs.onOffense;
      old.level = fs.level;
      old.thirst = fs.thirst;
      old.aggro = fs.aggro;
      old.armSwing = fs.armSwing;
      old.drinkT = fs.drinkT;
      old.shopT = fs.shopT;
      old.throwT = fs.throwT;
      old.cheerT = fs.cheerT;
      old.homeStandKey = fs.homeStandKey;
      old._homeSeat = fs._homeSeat;
      old._after = fs._after;
      old.path = [];
      old.pathI = 0;
      next.push(old);
    } else {
      next.push({
        id: fs.id,
        kind: fs.kind,
        team: fs.team,
        blockId: fs.blockId,
        state: fs.state,
        seatIndex: fs.seatIndex,
        standKey: fs.standKey,
        hp: fs.hp,
        maxHp: fs.maxHp,
        thirst: fs.thirst,
        satisfiedUntil: 0,
        shopUntil: 0,
        aggro: fs.aggro,
        lean: 0,
        captureProg: 0,
        gangX: fs.gangX,
        x: fs.x,
        y: fs.y,
        path: [],
        pathI: 0,
        armSwing: fs.armSwing,
        attackCd: 0,
        invading: fs.invading,
        isSteward: fs.isSteward,
        homeStandKey: fs.homeStandKey,
        homeBlockId: fs.homeBlockId,
        patrolDir: 1,
        cheerT: fs.cheerT,
        drinkT: fs.drinkT,
        shopT: fs.shopT,
        throwT: fs.throwT,
        rangedPyro: fs.rangedPyro,
        onOffense: fs.onOffense,
        level: fs.level,
        _homeSeat: fs._homeSeat,
        _after: fs._after,
      });
    }
  }
  m.fans = next;
  if (snap.toast && (!m.toasts[0] || m.toasts[0].text !== snap.toast)) {
    m.toast(snap.toast, 2.2);
  }
}

export function applyPvpCmd(m: Match, team: TeamId, cmd: PvpCmd): boolean {
  return m.runForTeam(team, () => {
    switch (cmd.op) {
      case "buy":
        return m.tryBuyFanQuick(cmd.kind);
      case "sendHool":
        return m.tryHooliganOrder(cmd.count);
      case "sendPyro":
        return m.tryPyroFight(cmd.count);
      case "build":
        m.selectedSlot = { blockId: cmd.blockId, index: cmd.index };
        m.buildMenu = { blockId: cmd.blockId, index: cmd.index };
        return m.tryBuild(cmd.kind);
      case "upgradeBuild":
        m.selectedSlot = { blockId: cmd.blockId, index: cmd.index };
        m.buildMenu = { blockId: cmd.blockId, index: cmd.index };
        return m.tryUpgrade();
      case "upgradeUnit":
        return m.tryUpgradeUnit(cmd.kind);
      case "hire":
        m.selectedSlot = { blockId: cmd.blockId, index: cmd.index };
        m.buildMenu = { blockId: cmd.blockId, index: cmd.index };
        return m.tryHireSteward();
      case "selectSlot":
        if (cmd.index == null) {
          m.selectedSlot = null;
          m.buildMenu = null;
        } else {
          m.selectedSlot = { blockId: cmd.blockId, index: cmd.index };
          m.buildMenu = { blockId: cmd.blockId, index: cmd.index };
        }
        return true;
      case "halfBoost":
        m.applyHalfBoost(cmd.id);
        return true;
      default:
        return false;
    }
  });
}
