/**
 * Challenge-Modus: 1v1 asynchron über Einladungslink.
 * Erstellen → Link generieren → beide spielen 1× → Historie + Bilanz.
 */
import { getClub } from "./clubs";
import {
  bierValue,
  blocksturmValue,
  clubCode,
  difficultyLabel,
  ergebnisValue,
} from "./highscores";
import type { AiBehavior, AiDifficulty, TeamId } from "./types";

export type ChallengeGoal = "ergebnis" | "blocksturm" | "bier";

export type ChallengeAttempt = {
  name: string;
  /** Comparable metric (ergebnisValue / minute / beers). null = kein gültiger Score */
  value: number | null;
  detail: string;
  /** Match gegen KI gewonnen? */
  beatAi: boolean;
  at: string;
};

export type Challenge = {
  v: 1;
  id: string;
  goal: ChallengeGoal;
  difficulty: AiDifficulty;
  behavior: AiBehavior;
  playerClub: string;
  aiClub: string;
  /** Optional: Name des Erstellers (für Historie) */
  hostName?: string;
  /** Host / Spieler 1 */
  a?: ChallengeAttempt;
  /** Annehmender / Spieler 2 */
  b?: ChallengeAttempt;
};

export type ChallengeHistoryEntry = Challenge & {
  /** Rolle dieses Geräts, falls gespielt */
  myRole?: "a" | "b";
  savedAt: string;
};

export type ChallengeStats = {
  wins: number;
  losses: number;
  draws: number;
  played: number;
};

export const CHALLENGE_GOAL_LABEL: Record<ChallengeGoal, string> = {
  ergebnis: "Höchster Sieg",
  blocksturm: "Frühester Blocksturm",
  bier: "Meiste Biere",
};

export const CHALLENGE_GOAL_BLURB: Record<ChallengeGoal, string> = {
  ergebnis: "Besseres Endergebnis (Tordifferenz) gewinnt",
  blocksturm: "Früherer Blocksturm gewinnt — ohne Sturm verlierst du",
  bier: "Mehr getrunkene Biere der eigenen Figuren gewinnt",
};

const PLAYED_KEY = "matchday-challenge-played-v1";
const HISTORY_KEY = "matchday-challenge-history-v1";
const STATS_COUNTED_KEY = "matchday-challenge-stats-counted-v1";
const HISTORY_MAX = 40;

function uid(): string {
  return (
    Math.random().toString(36).slice(2, 8) +
    Date.now().toString(36).slice(-4)
  );
}

export function createChallenge(cfg: {
  goal: ChallengeGoal;
  difficulty: AiDifficulty;
  behavior: AiBehavior;
  playerClub: string;
  aiClub: string;
  hostName?: string;
}): Challenge {
  return {
    v: 1,
    id: uid(),
    goal: cfg.goal,
    difficulty: cfg.difficulty,
    behavior: cfg.behavior,
    playerClub: cfg.playerClub,
    aiClub: cfg.aiClub,
    hostName: cfg.hostName?.trim().slice(0, 20) || undefined,
  };
}

export function challengeMatchupLabel(c: Challenge): string {
  const a = clubCode(c.playerClub) || c.playerClub;
  const b = clubCode(c.aiClub) || c.aiClub;
  try {
    return `${getClub(c.playerClub).short} vs ${getClub(c.aiClub).short}`;
  } catch {
    return `${a} vs ${b}`;
  }
}

export function challengeSetupLine(c: Challenge): string {
  return `${CHALLENGE_GOAL_LABEL[c.goal]} · ${difficultyLabel(c.difficulty)} · ${challengeMatchupLabel(c)}`;
}

/** Encode challenge for URL (?c=…) — compact JSON + base64url */
export function encodeChallenge(c: Challenge): string {
  const json = JSON.stringify(c);
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return b64;
}

export function decodeChallenge(raw: string): Challenge | null {
  try {
    let s = raw.trim();
    if (!s) return null;
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const json = decodeURIComponent(escape(atob(s)));
    const parsed = JSON.parse(json) as Challenge;
    if (parsed?.v !== 1 || !parsed.id || !parsed.goal) return null;
    if (!parsed.playerClub || !parsed.aiClub) return null;
    if (!["ergebnis", "blocksturm", "bier"].includes(parsed.goal)) return null;
    if (!["easy", "normal", "hard"].includes(parsed.difficulty)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function challengeShareUrl(c: Challenge): string {
  const base = `${location.origin}${location.pathname}`;
  return `${base}?c=${encodeChallenge(c)}`;
}

/** Read challenge from ?c= or #c= */
export function challengeFromLocation(
  search = location.search,
  hash = location.hash,
): Challenge | null {
  const qs = new URLSearchParams(search);
  const fromQ = qs.get("c");
  if (fromQ) return decodeChallenge(fromQ);
  const hm = hash.match(/[#&?]c=([^&]+)/);
  if (hm?.[1]) return decodeChallenge(decodeURIComponent(hm[1]));
  return null;
}

export function clearChallengeFromUrl(): void {
  try {
    const u = new URL(location.href);
    if (!u.searchParams.has("c") && !location.hash.includes("c=")) return;
    u.searchParams.delete("c");
    const h = u.hash.replace(/([#&?])c=[^&]*/g, "").replace(/^[#&]+/, "");
    history.replaceState(
      null,
      "",
      u.pathname + u.search + (h ? `#${h}` : ""),
    );
  } catch {
    /* ignore */
  }
}

type PlayedStore = Record<string, ("a" | "b")[]>;

function loadPlayed(): PlayedStore {
  try {
    const raw = localStorage.getItem(PLAYED_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PlayedStore;
  } catch {
    return {};
  }
}

function savePlayed(store: PlayedStore): void {
  try {
    localStorage.setItem(PLAYED_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function hasPlayedChallengeRole(
  id: string,
  role: "a" | "b",
): boolean {
  return (loadPlayed()[id] || []).includes(role);
}

export function myChallengeRole(id: string): "a" | "b" | null {
  const roles = loadPlayed()[id] || [];
  if (roles.includes("a")) return "a";
  if (roles.includes("b")) return "b";
  return null;
}

export function markPlayedChallengeRole(id: string, role: "a" | "b"): void {
  const store = loadPlayed();
  const list = new Set(store[id] || []);
  list.add(role);
  store[id] = [...list];
  savePlayed(store);
}

export function openChallengeRole(
  c: Challenge,
  opts?: {
    /** Prefer this empty slot (host app / embed). */
    prefer?: "a" | "b";
    /** Host app owns uniqueness — allow both roles on one device. */
    ignoreDeviceLock?: boolean;
  },
): "a" | "b" | "done" | "full" {
  if (c.a && c.b) return "done";
  const prefer = opts?.prefer;
  if (prefer === "a" && !c.a) {
    if (!opts?.ignoreDeviceLock && (loadPlayed()[c.id] || []).includes("b")) {
      return "full";
    }
    return "a";
  }
  if (prefer === "b" && !c.b) {
    if (!opts?.ignoreDeviceLock && (loadPlayed()[c.id] || []).includes("a")) {
      return "full";
    }
    return "b";
  }
  if (prefer && ((prefer === "a" && c.a) || (prefer === "b" && c.b))) {
    return c.a && c.b ? "done" : "full";
  }
  // Ein Gerät = ein Versuch (nicht beide Rollen lokal füllen)
  const playedHere = (loadPlayed()[c.id] || []).length > 0;
  if (!opts?.ignoreDeviceLock && playedHere) {
    return c.a && c.b ? "done" : "full";
  }
  if (!c.a) return "a";
  if (!c.b) return "b";
  return "done";
}

/** Structured result for host apps (postMessage / return URL). */
export type ChallengeEmbedResult = {
  type: "matchday.challenge.result";
  v: 1;
  challengeId: string;
  goal: ChallengeGoal;
  difficulty: AiDifficulty;
  behavior: AiBehavior;
  playerClub: string;
  aiClub: string;
  setupLabel: string;
  a?: ChallengeAttempt;
  b?: ChallengeAttempt;
  winner: "a" | "b" | "draw" | "pending";
  myRole: "a" | "b" | null;
  outcome: "win" | "loss" | "draw" | "pending" | "open";
  /** Updated challenge blob for the host to store / re-invite. */
  challenge: Challenge;
  /** Ready-to-open share path (?c=…) relative to game origin. */
  encoded: string;
  sharePath: string;
};

export function challengeEmbedResult(
  c: Challenge,
  myRole: "a" | "b" | null = null,
): ChallengeEmbedResult {
  const winner = compareChallengeAttempts(c.goal, c.a, c.b);
  const role = myRole || myChallengeRole(c.id);
  const encoded = encodeChallenge(c);
  return {
    type: "matchday.challenge.result",
    v: 1,
    challengeId: c.id,
    goal: c.goal,
    difficulty: c.difficulty,
    behavior: c.behavior,
    playerClub: c.playerClub,
    aiClub: c.aiClub,
    setupLabel: challengeSetupLine(c),
    a: c.a,
    b: c.b,
    winner,
    myRole: role,
    outcome: challengeOutcomeForMe(c, role),
    challenge: c,
    encoded,
    sharePath: `?c=${encoded}`,
  };
}

/** Build a full embed launch URL for an existing challenge. */
export function challengeEmbedUrl(
  c: Challenge,
  opts: {
    base?: string;
    role?: "a" | "b";
    playerName?: string;
    autoplay?: boolean;
  } = {},
): string {
  const base =
    opts.base ||
    (typeof location !== "undefined"
      ? `${location.origin}${location.pathname}`
      : "");
  const qs = new URLSearchParams();
  qs.set("c", encodeChallenge(c));
  qs.set("embed", "1");
  if (opts.role) qs.set("role", opts.role);
  if (opts.playerName?.trim()) {
    qs.set("playerName", opts.playerName.trim().slice(0, 20));
  }
  if (opts.autoplay !== false) qs.set("autoplay", "1");
  return `${base}?${qs.toString()}`;
}

/** Create-challenge launch without a prebuilt blob (host picks setup in query). */
export function challengeCreateEmbedUrl(opts: {
  base?: string;
  goal: ChallengeGoal;
  difficulty: AiDifficulty;
  behavior?: AiBehavior;
  playerClub: string;
  aiClub: string;
  hostName?: string;
  playerName?: string;
  role?: "a" | "b";
  autoplay?: boolean;
}): string {
  const base =
    opts.base ||
    (typeof location !== "undefined"
      ? `${location.origin}${location.pathname}`
      : "");
  const qs = new URLSearchParams();
  qs.set("embed", "1");
  qs.set("mode", "challenge");
  qs.set("goal", opts.goal);
  qs.set("difficulty", opts.difficulty);
  qs.set("behavior", opts.behavior || "balanced");
  qs.set("playerClub", opts.playerClub);
  qs.set("aiClub", opts.aiClub);
  qs.set("role", opts.role || "a");
  if (opts.hostName?.trim()) qs.set("hostName", opts.hostName.trim().slice(0, 20));
  if (opts.playerName?.trim()) {
    qs.set("playerName", opts.playerName.trim().slice(0, 20));
  }
  if (opts.autoplay !== false) qs.set("autoplay", "1");
  return `${base}?${qs.toString()}`;
}

/** Build attempt metric from a finished match */
export function attemptFromMatch(opts: {
  goal: ChallengeGoal;
  name: string;
  playerTeam: TeamId;
  winner: TeamId | "draw" | null;
  reason: string;
  score: [number, number];
  minute: number;
  beersDrunk: number;
}): ChallengeAttempt {
  const playerIsKsc = opts.playerTeam === "ksc";
  const playerGoals = playerIsKsc ? opts.score[0] : opts.score[1];
  const aiGoals = playerIsKsc ? opts.score[1] : opts.score[0];
  const beatAi = opts.winner === opts.playerTeam;

  let value: number | null = null;
  let detail = "";

  if (opts.goal === "ergebnis") {
    value = ergebnisValue(playerGoals, aiGoals);
    detail = `${playerGoals}:${aiGoals}`;
  } else if (opts.goal === "blocksturm") {
    if (opts.reason === "invade" && beatAi) {
      value = blocksturmValue(opts.minute);
      detail = `Blocksturm ${opts.minute.toFixed(1).replace(".", ",")}′`;
    } else {
      value = null;
      detail = "Kein Blocksturm";
    }
  } else {
    value = bierValue(opts.beersDrunk);
    detail = `${value} Bier`;
  }

  return {
    name: opts.name.trim().slice(0, 20) || "Spieler",
    value,
    detail,
    beatAi,
    at: new Date().toISOString(),
  };
}

/**
 * Who wins the challenge metric.
 * Blocksturm: lower minute wins; null loses to any number.
 * Ergebnis/Bier: higher wins; null loses.
 */
export function compareChallengeAttempts(
  goal: ChallengeGoal,
  a?: ChallengeAttempt,
  b?: ChallengeAttempt,
): "a" | "b" | "draw" | "pending" {
  if (!a || !b) return "pending";
  const va = a.value;
  const vb = b.value;
  if (va == null && vb == null) return "draw";
  if (va == null) return "b";
  if (vb == null) return "a";
  if (goal === "blocksturm") {
    if (va < vb) return "a";
    if (vb < va) return "b";
    return "draw";
  }
  if (va > vb) return "a";
  if (vb > va) return "b";
  return "draw";
}

export function challengeVerdictLabel(
  c: Challenge,
  winner: "a" | "b" | "draw" | "pending",
): string {
  if (winner === "pending") {
    if (!c.a && !c.b) return "Einladungslink teilen — beide spielen 1×";
    if (c.a && !c.b) return `Warte auf Gegner — Link teilen`;
    if (!c.a) return "Noch niemand hat gespielt";
    return "Ausstehend";
  }
  if (winner === "draw") return "Unentschieden!";
  const w = winner === "a" ? c.a : c.b;
  const l = winner === "a" ? c.b : c.a;
  return `${w?.name || "Spieler"} gewinnt gegen ${l?.name || "Gegner"}!`;
}

/* ─── Historie & Bilanz (localStorage) ─── */

function loadHistoryRaw(): ChallengeHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ChallengeHistoryEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveHistoryRaw(list: ChallengeHistoryEntry[]): void {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(list.slice(0, HISTORY_MAX)),
    );
  } catch {
    /* quota */
  }
}

/** Merge challenge into local history (newest first). */
export function upsertChallengeHistory(c: Challenge): ChallengeHistoryEntry {
  const list = loadHistoryRaw();
  const myRole = myChallengeRole(c.id) || undefined;
  const entry: ChallengeHistoryEntry = {
    ...c,
    myRole,
    savedAt: new Date().toISOString(),
  };
  const without = list.filter((e) => e.id !== c.id);
  without.unshift(entry);
  saveHistoryRaw(without);
  maybeCountStats(entry);
  return entry;
}

export function loadChallengeHistory(): ChallengeHistoryEntry[] {
  return loadHistoryRaw();
}

export function getChallengeFromHistory(id: string): ChallengeHistoryEntry | null {
  return loadHistoryRaw().find((e) => e.id === id) || null;
}

function loadCountedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STATS_COUNTED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveCountedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(STATS_COUNTED_KEY, JSON.stringify([...ids]));
  } catch {
    /* quota */
  }
}

/** Count W/L once per challenge when finished and we know our role. */
function maybeCountStats(entry: ChallengeHistoryEntry): void {
  const winner = compareChallengeAttempts(entry.goal, entry.a, entry.b);
  if (winner === "pending") return;
  const role = entry.myRole || myChallengeRole(entry.id);
  if (!role) return;
  const counted = loadCountedIds();
  if (counted.has(entry.id)) return;
  counted.add(entry.id);
  saveCountedIds(counted);
  // Stats are derived from counted history — no separate counter store
}

/** Bilanz dieses Geräts (nur Challenges, bei denen wir mitgespielt haben). */
export function challengeStats(): ChallengeStats {
  const stats: ChallengeStats = { wins: 0, losses: 0, draws: 0, played: 0 };
  for (const e of loadHistoryRaw()) {
    const role = e.myRole || myChallengeRole(e.id);
    if (!role) continue;
    const winner = compareChallengeAttempts(e.goal, e.a, e.b);
    if (winner === "pending") continue;
    stats.played++;
    if (winner === "draw") stats.draws++;
    else if (winner === role) stats.wins++;
    else stats.losses++;
  }
  return stats;
}

export function challengeOutcomeForMe(
  c: Challenge,
  myRole?: "a" | "b" | null,
): "win" | "loss" | "draw" | "pending" | "open" {
  const role = myRole || myChallengeRole(c.id);
  const winner = compareChallengeAttempts(c.goal, c.a, c.b);
  if (winner === "pending") {
    if (!c.a && !c.b) return "open";
    return "pending";
  }
  if (!role) return winner === "draw" ? "draw" : "pending";
  if (winner === "draw") return "draw";
  return winner === role ? "win" : "loss";
}

export function challengeOutcomeLabel(
  outcome: ReturnType<typeof challengeOutcomeForMe>,
): string {
  if (outcome === "win") return "Gewonnen";
  if (outcome === "loss") return "Verloren";
  if (outcome === "draw") return "Unentschieden";
  if (outcome === "open") return "Offen";
  return "Läuft";
}
