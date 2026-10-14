/**
 * Live-PvP: ein gemeinsames Match über PeerJS (WebRTC).
 * Host simuliert (Heim/ksc), Guest steuert Gast/vfb per Input;
 * Snapshots halten den Guest synchron.
 */
import type { AiDifficulty, FanMix, SoloSettings } from "./types";
import type { PvpCmd, PvpSnap } from "./pvp";

export type LiveRole = "host" | "guest";

export type LiveKpis = {
  name: string;
  scoreFor: number;
  scoreAgainst: number;
  minute: number;
  beers: number;
  gold: number;
  done: boolean;
  winner?: "player" | "ai" | null;
  reason?: string;
  detail?: string;
};

export type LiveRoomConfig = {
  playerClub: string;
  aiClub: string;
  difficulty: AiDifficulty;
  hostName: string;
  guestName?: string;
  /** Always true — shared-board PvP */
  pvp?: boolean;
  /** 60s Blitz reaction mode (both humans; no AI taps) */
  blitz?: boolean;
  /** Solo Blitz vs AI — no PeerJS, immediate play */
  vsAi?: boolean;
};

export type LivePersonalStats = {
  wins: number;
  losses: number;
  draws: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  beers: number;
  lastAt?: string;
};

export type LiveHistoryEntry = {
  id: string;
  at: string;
  opponent: string;
  myScore: string;
  oppScore: string;
  minute: number;
  outcome: "win" | "loss" | "draw";
  detail: string;
};

type WireMsg =
  | { type: "hello"; role: LiveRole; name: string }
  | { type: "config"; config: LiveRoomConfig }
  | { type: "ready"; name: string; ready: boolean; mix?: FanMix }
  | {
      type: "start";
      at: number;
      config: LiveRoomConfig;
      hostMix: FanMix;
      guestMix: FanMix;
    }
  | { type: "input"; seq: number; cmd: PvpCmd }
  | { type: "snap"; snap: PvpSnap; ack: number }
  | { type: "kpi"; kpi: LiveKpis }
  | { type: "bye"; reason?: string };

const STATS_KEY = "matchday-live-stats-v1";
const HISTORY_KEY = "matchday-live-history-v1";
const HISTORY_MAX = 30;

declare global {
  interface Window {
    Peer?: new (id?: string, opts?: Record<string, unknown>) => PeerLike;
  }
}

type PeerLike = {
  id: string;
  destroyed: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(ev: string, fn: (...args: any[]) => void): void;
  connect(id: string, opts?: { reliable?: boolean }): DataConn;
  destroy(): void;
};

type DataConn = {
  open: boolean;
  peer: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(ev: string, fn: (...args: any[]) => void): void;
  send(data: unknown): void;
  close(): void;
};

let peerScriptPromise: Promise<void> | null = null;

function loadPeerScript(): Promise<void> {
  if (window.Peer) return Promise.resolve();
  if (peerScriptPromise) return peerScriptPromise;
  peerScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("PeerJS konnte nicht geladen werden"));
    document.head.appendChild(s);
  });
  return peerScriptPromise;
}

function roomId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[(Math.random() * alphabet.length) | 0]!;
  }
  return out;
}

export function livePeerId(code: string): string {
  return `derbytime-live-${code.toUpperCase()}`;
}

export type LiveSession = {
  code: string;
  role: LiveRole;
  config: LiveRoomConfig | null;
  localName: string;
  remoteName: string;
  localReady: boolean;
  remoteReady: boolean;
  remoteKpi: LiveKpis | null;
  remoteMix: FanMix | null;
  hostMix: FanMix | null;
  guestMix: FanMix | null;
  lastSnap: PvpSnap | null;
  connected: boolean;
  status: string;
  destroy(): void;
  sendReady(ready: boolean, mix?: FanMix): void;
  sendStart(hostMix: FanMix, guestMix: FanMix): void;
  sendInput(cmd: PvpCmd): void;
  sendSnap(snap: PvpSnap, ack: number): void;
  sendKpi(kpi: LiveKpis): void;
  setConfig(cfg: LiveRoomConfig): void;
  onUpdate(cb: () => void): void;
  onStart(
    cb: (cfg: LiveRoomConfig, at: number, mixes: { host: FanMix; guest: FanMix }) => void,
  ): void;
  onInput(cb: (cmd: PvpCmd, seq: number) => void): void;
  onSnap(cb: (snap: PvpSnap) => void): void;
};

function normalizeRoomCode(raw?: string): string {
  const cleaned = (raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return cleaned.length >= 4 ? cleaned : roomId();
}

/** Host a Live room. Optional `code` lets a host app pre-assign the invite code. */
export async function createLiveHost(
  name: string,
  code?: string,
): Promise<LiveSession> {
  await loadPeerScript();
  const PeerCtor = window.Peer!;
  const room = normalizeRoomCode(code);
  const peer = new PeerCtor(livePeerId(room), {
    debug: 0,
  });
  return wireSession(peer, room, "host", name);
}

export async function joinLiveGuest(
  code: string,
  name: string,
): Promise<LiveSession> {
  await loadPeerScript();
  const PeerCtor = window.Peer!;
  const peer = new PeerCtor(undefined, { debug: 0 });
  const session = await wireSession(peer, code.toUpperCase(), "guest", name);
  await waitPeerOpen(peer);
  const conn = peer.connect(livePeerId(code.toUpperCase()), { reliable: true });
  attachConn(session as SessionInternal, conn);
  return session;
}

type SessionInternal = LiveSession & {
  _peer: PeerLike;
  _conn: DataConn | null;
  _update: Set<() => void>;
  _start: Set<
    (cfg: LiveRoomConfig, at: number, mixes: { host: FanMix; guest: FanMix }) => void
  >;
  _input: Set<(cmd: PvpCmd, seq: number) => void>;
  _snap: Set<(snap: PvpSnap) => void>;
  _inputSeq: number;
  _emit(): void;
  _handle(msg: WireMsg): void;
};

function waitPeerOpen(peer: PeerLike): Promise<void> {
  return new Promise((resolve, reject) => {
    // PeerJS may already be open (e.g. after wireSession awaited "open").
    if (peer.id) {
      resolve();
      return;
    }
    const t = window.setTimeout(
      () => reject(new Error("Peer-Timeout — bitte erneut versuchen")),
      15000,
    );
    peer.on("open", () => {
      window.clearTimeout(t);
      resolve();
    });
    peer.on("error", (err: unknown) => {
      window.clearTimeout(t);
      reject(err instanceof Error ? err : new Error(String(err)));
    });
  });
}

function wireSession(
  peer: PeerLike,
  code: string,
  role: LiveRole,
  name: string,
): Promise<LiveSession> {
  const session: SessionInternal = {
    code,
    role,
    config: null,
    localName: name.trim().slice(0, 20) || (role === "host" ? "Host" : "Gast"),
    remoteName: "",
    localReady: false,
    remoteReady: false,
    remoteKpi: null,
    remoteMix: null,
    hostMix: null,
    guestMix: null,
    lastSnap: null,
    connected: false,
    status: role === "host" ? "Warte auf Mitspieler…" : "Verbinde…",
    _peer: peer,
    _conn: null,
    _update: new Set(),
    _start: new Set(),
    _input: new Set(),
    _snap: new Set(),
    _inputSeq: 0,
    _emit() {
      for (const cb of this._update) cb();
    },
    _handle(msg: WireMsg) {
      if (msg.type === "hello") {
        this.remoteName = msg.name;
        this.connected = true;
        this.status = `Verbunden mit ${msg.name}`;
        if (this.role === "host" && this.config) {
          this._conn?.send({ type: "config", config: this.config } satisfies WireMsg);
        }
        this._conn?.send({
          type: "hello",
          role: this.role,
          name: this.localName,
        } satisfies WireMsg);
        this._emit();
      } else if (msg.type === "config") {
        this.config = { ...msg.config, pvp: true };
        this.remoteName = msg.config.hostName || this.remoteName;
        this.status = "Matchup empfangen — Live-PvP";
        this._emit();
      } else if (msg.type === "ready") {
        this.remoteReady = msg.ready;
        this.remoteName = msg.name || this.remoteName;
        if (msg.mix) this.remoteMix = msg.mix;
        this._emit();
      } else if (msg.type === "start") {
        this.config = { ...msg.config, pvp: true };
        this.hostMix = msg.hostMix;
        this.guestMix = msg.guestMix;
        for (const cb of this._start)
          cb(msg.config, msg.at, { host: msg.hostMix, guest: msg.guestMix });
      } else if (msg.type === "input") {
        for (const cb of this._input) cb(msg.cmd, msg.seq);
      } else if (msg.type === "snap") {
        this.lastSnap = msg.snap;
        for (const cb of this._snap) cb(msg.snap);
        this._emit();
      } else if (msg.type === "kpi") {
        this.remoteKpi = msg.kpi;
        this._emit();
      } else if (msg.type === "bye") {
        this.status = msg.reason || "Gegner hat verlassen";
        this.connected = false;
        this._emit();
      }
    },
    destroy() {
      try {
        this._conn?.send({ type: "bye", reason: "Verlassen" } satisfies WireMsg);
      } catch {
        /* ignore */
      }
      this._conn?.close();
      if (!this._peer.destroyed) this._peer.destroy();
      this._update.clear();
      this._start.clear();
      this._input.clear();
      this._snap.clear();
    },
    sendReady(ready: boolean, mix?: FanMix) {
      this.localReady = ready;
      this._conn?.send({
        type: "ready",
        name: this.localName,
        ready,
        mix,
      } satisfies WireMsg);
      this._emit();
    },
    sendStart(hostMix: FanMix, guestMix: FanMix) {
      if (!this.config || this.role !== "host") return;
      const at = Date.now() + 3200;
      const config = { ...this.config, pvp: true };
      this.hostMix = hostMix;
      this.guestMix = guestMix;
      const msg: WireMsg = { type: "start", at, config, hostMix, guestMix };
      this._conn?.send(msg);
      for (const cb of this._start)
        cb(config, at, { host: hostMix, guest: guestMix });
    },
    sendInput(cmd: PvpCmd) {
      this._inputSeq += 1;
      this._conn?.send({
        type: "input",
        seq: this._inputSeq,
        cmd,
      } satisfies WireMsg);
    },
    sendSnap(snap: PvpSnap, ack: number) {
      this._conn?.send({ type: "snap", snap, ack } satisfies WireMsg);
    },
    sendKpi(kpi: LiveKpis) {
      this._conn?.send({ type: "kpi", kpi } satisfies WireMsg);
    },
    setConfig(cfg: LiveRoomConfig) {
      this.config = { ...cfg, pvp: true };
      this._conn?.send({ type: "config", config: this.config } satisfies WireMsg);
      this._emit();
    },
    onUpdate(cb) {
      this._update.add(cb);
    },
    onStart(cb) {
      this._start.add(cb);
    },
    onInput(cb) {
      this._input.add(cb);
    },
    onSnap(cb) {
      this._snap.add(cb);
    },
  };

  return new Promise((resolve, reject) => {
    const t = window.setTimeout(
      () => reject(new Error("Peer-Timeout")),
      15000,
    );
    peer.on("open", () => {
      window.clearTimeout(t);
      if (role === "host") {
        peer.on("connection", (c: unknown) => {
          attachConn(session, c as DataConn);
        });
      }
      resolve(session);
    });
    peer.on("error", (err: unknown) => {
      window.clearTimeout(t);
      reject(err instanceof Error ? err : new Error(String(err)));
    });
  });
}

function attachConn(session: SessionInternal, conn: DataConn): void {
  session._conn = conn;
  conn.on("open", () => {
    session.connected = true;
    session.status = "Verbunden — Live-PvP";
    conn.send({
      type: "hello",
      role: session.role,
      name: session.localName,
    } satisfies WireMsg);
    if (session.role === "host" && session.config) {
      conn.send({ type: "config", config: session.config } satisfies WireMsg);
    }
    session._emit();
  });
  conn.on("data", (raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    session._handle(raw as WireMsg);
  });
  conn.on("close", () => {
    session.connected = false;
    session.status = "Verbindung getrennt";
    session._emit();
  });
  conn.on("error", () => {
    session.status = "Verbindungsfehler";
    session._emit();
  });
}

/**
 * Shared board, local perspective: each client sees own club as Heim (left).
 * Host config: playerClub=host, aiClub=guest. Guest settings swap clubs.
 */
export function settingsFromLive(
  cfg: LiveRoomConfig,
  role: LiveRole,
): SoloSettings {
  const hostClub = cfg.playerClub;
  const guestClub = cfg.aiClub;
  return {
    difficulty: cfg.difficulty,
    behavior: "balanced",
    playerTeam: "ksc",
    playerClub: role === "guest" ? guestClub : hostClub,
    aiClub: role === "guest" ? hostClub : guestClub,
  };
}

export function loadLiveStats(): LivePersonalStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return {
        wins: 0,
        losses: 0,
        draws: 0,
        played: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        beers: 0,
      };
    }
    return { ...JSON.parse(raw) } as LivePersonalStats;
  } catch {
    return {
      wins: 0,
      losses: 0,
      draws: 0,
      played: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      beers: 0,
    };
  }
}

function saveLiveStats(s: LivePersonalStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(s));
}

export function loadLiveHistory(): LiveHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as LiveHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLiveHistory(list: LiveHistoryEntry[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
}

export function recordLiveResult(opts: {
  opponent: string;
  me: LiveKpis;
  them: LiveKpis;
}): { outcome: "win" | "loss" | "draw"; stats: LivePersonalStats } {
  const myDiff = opts.me.scoreFor - opts.me.scoreAgainst;
  const theirDiff = opts.them.scoreFor - opts.them.scoreAgainst;
  let outcome: "win" | "loss" | "draw" = "draw";
  if (opts.me.winner === "player" && opts.them.winner !== "player") {
    outcome = "win";
  } else if (opts.them.winner === "player" && opts.me.winner !== "player") {
    outcome = "loss";
  } else if (myDiff !== theirDiff) {
    outcome = myDiff > theirDiff ? "win" : "loss";
  } else if (opts.me.beers !== opts.them.beers) {
    outcome = opts.me.beers > opts.them.beers ? "win" : "loss";
  }

  const stats = loadLiveStats();
  stats.played += 1;
  if (outcome === "win") stats.wins += 1;
  else if (outcome === "loss") stats.losses += 1;
  else stats.draws += 1;
  stats.goalsFor += opts.me.scoreFor;
  stats.goalsAgainst += opts.me.scoreAgainst;
  stats.beers += opts.me.beers;
  stats.lastAt = new Date().toISOString();
  saveLiveStats(stats);

  const hist = loadLiveHistory();
  hist.unshift({
    id: `${Date.now().toString(36)}`,
    at: stats.lastAt,
    opponent: opts.opponent,
    myScore: `${opts.me.scoreFor}:${opts.me.scoreAgainst}`,
    oppScore: `${opts.them.scoreFor}:${opts.them.scoreAgainst}`,
    minute: Math.max(opts.me.minute, opts.them.minute),
    outcome,
    detail: opts.me.detail || "",
  });
  saveLiveHistory(hist);

  return { outcome, stats };
}
