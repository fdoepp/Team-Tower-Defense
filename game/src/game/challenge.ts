/**
 * Challenge-Modus: 1v1 asynchron über Share-Link.
 * Herausforderer setzt Ziel + Diff + Matchup, spielt einmal;
 * Gegner öffnet den Link und spielt dasselbe Setup einmal.
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
  /** Host / Ersteller */
  a?: ChallengeAttempt;
  /** Annehmender */
  b?: ChallengeAttempt;
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
}): Challenge {
  return {
    v: 1,
    id: uid(),
    goal: cfg.goal,
    difficulty: cfg.difficulty,
    behavior: cfg.behavior,
    playerClub: cfg.playerClub,
    aiClub: cfg.aiClub,
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

export function markPlayedChallengeRole(id: string, role: "a" | "b"): void {
  const store = loadPlayed();
  const list = new Set(store[id] || []);
  list.add(role);
  store[id] = [...list];
  savePlayed(store);
}

export function openChallengeRole(c: Challenge): "a" | "b" | "done" | "full" {
  if (c.a && c.b) return "done";
  // Ein Gerät = ein Versuch (nicht beide Rollen lokal füllen)
  const playedHere = (loadPlayed()[c.id] || []).length > 0;
  if (playedHere) return c.a && c.b ? "done" : "full";
  if (!c.a) return "a";
  if (!c.b) return "b";
  return "done";
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
    if (c.a && !c.b) return `Warte auf Gegner — Link teilen`;
    if (!c.a) return "Noch niemand hat gespielt";
    return "Ausstehend";
  }
  if (winner === "draw") return "Unentschieden!";
  const w = winner === "a" ? c.a : c.b;
  const l = winner === "a" ? c.b : c.a;
  return `${w?.name || "Spieler"} gewinnt gegen ${l?.name || "Gegner"}!`;
}
