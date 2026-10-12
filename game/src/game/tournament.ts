/**
 * Solo-Turnier: Gegner werden mit dem Fortschritt stärker.
 * Zusätzlich Turnier-Schwierigkeit einfach / mittel / schwer.
 */
import type { AiBehavior, AiDifficulty, SoloSettings } from "./types";
import {
  DEFAULT_AI_CLUB,
  DEFAULT_PLAYER_CLUB,
  DERBIES,
  type ClubId,
} from "./clubs";

export type TournamentDifficulty = AiDifficulty;

export type TournamentRoundOpp = {
  difficulty: AiDifficulty;
  behavior: AiBehavior;
  label: string;
  playerClub: ClubId;
  aiClub: ClubId;
};

export type TournamentState = {
  v: 1;
  id: string;
  /** Overall tournament difficulty ladder */
  tourneyDiff: TournamentDifficulty;
  playerClub: ClubId;
  /** 0-based current round */
  round: number;
  /** Total rounds */
  totalRounds: number;
  wins: number;
  /** Opponents frozen at start */
  opponents: TournamentRoundOpp[];
  active: boolean;
};

const SAVE_KEY = "matchday-tournament-v1";
export const TOURNAMENT_ROUNDS = 5;

type LadderStep = { difficulty: AiDifficulty; behavior: AiBehavior; label: string };

const LADDERS: Record<TournamentDifficulty, LadderStep[]> = {
  easy: [
    { difficulty: "easy", behavior: "patient", label: "Aufbaugegner" },
    { difficulty: "easy", behavior: "balanced", label: "Heimspiel" },
    { difficulty: "easy", behavior: "aggro", label: "Druckphase" },
    { difficulty: "normal", behavior: "balanced", label: "Viertelfinale" },
    { difficulty: "normal", behavior: "aggro", label: "Finale" },
  ],
  normal: [
    { difficulty: "easy", behavior: "balanced", label: "Auftakt" },
    { difficulty: "normal", behavior: "patient", label: "Gruppenspiel" },
    { difficulty: "normal", behavior: "balanced", label: "Achtelfinale" },
    { difficulty: "normal", behavior: "aggro", label: "Halbfinale" },
    { difficulty: "hard", behavior: "earlywin", label: "Finale" },
  ],
  hard: [
    { difficulty: "normal", behavior: "balanced", label: "Feuerprobe" },
    { difficulty: "normal", behavior: "aggro", label: "Derby-Härte" },
    { difficulty: "hard", behavior: "patient", label: "Viertelfinale" },
    { difficulty: "hard", behavior: "aggro", label: "Halbfinale" },
    { difficulty: "hard", behavior: "earlywin", label: "Finale" },
  ],
};

function uid(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
}

function pickOpponents(
  playerClub: ClubId,
  tourneyDiff: TournamentDifficulty,
): TournamentRoundOpp[] {
  const ladder = LADDERS[tourneyDiff];
  const pool = DERBIES.filter((d) => d.a === playerClub || d.b === playerClub);
  const clubs: ClubId[] = [];
  for (const d of pool) {
    clubs.push(d.a === playerClub ? d.b : d.a);
  }
  // fill with other derby clubs
  for (const d of DERBIES) {
    if (clubs.length >= TOURNAMENT_ROUNDS) break;
    for (const c of [d.a, d.b] as ClubId[]) {
      if (c !== playerClub && !clubs.includes(c)) clubs.push(c);
      if (clubs.length >= TOURNAMENT_ROUNDS) break;
    }
  }
  while (clubs.length < TOURNAMENT_ROUNDS) {
    clubs.push(DEFAULT_AI_CLUB as ClubId);
  }

  return ladder.map((step, i) => ({
    ...step,
    playerClub,
    aiClub: clubs[i]!,
  }));
}

export function createTournament(
  tourneyDiff: TournamentDifficulty,
  playerClub: ClubId = DEFAULT_PLAYER_CLUB as ClubId,
): TournamentState {
  return {
    v: 1,
    id: uid(),
    tourneyDiff,
    playerClub,
    round: 0,
    totalRounds: TOURNAMENT_ROUNDS,
    wins: 0,
    opponents: pickOpponents(playerClub, tourneyDiff),
    active: true,
  };
}

export function loadTournament(): TournamentState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as TournamentState;
    return t.active ? t : null;
  } catch {
    return null;
  }
}

export function saveTournament(t: TournamentState | null): void {
  if (!t) {
    localStorage.removeItem(SAVE_KEY);
    return;
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(t));
}

export function clearTournament(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function currentOpponent(t: TournamentState): TournamentRoundOpp | null {
  return t.opponents[t.round] ?? null;
}

export function settingsFromTournament(t: TournamentState): SoloSettings | null {
  const opp = currentOpponent(t);
  if (!opp) return null;
  return {
    difficulty: opp.difficulty,
    behavior: opp.behavior,
    playerTeam: "ksc",
    playerClub: opp.playerClub,
    aiClub: opp.aiClub,
  };
}

export function tournamentProgressLabel(t: TournamentState): string {
  const opp = currentOpponent(t);
  const step = opp?.label ?? "Ende";
  return `Runde ${Math.min(t.round + 1, t.totalRounds)}/${t.totalRounds} · ${step}`;
}

/** After a match: advance or end. Returns champion if finished with win. */
export function applyTournamentMatchResult(
  t: TournamentState,
  won: boolean,
): { state: TournamentState; champion: boolean; eliminated: boolean } {
  if (!won) {
    const next = { ...t, active: false };
    saveTournament(next);
    return { state: next, champion: false, eliminated: true };
  }
  const wins = t.wins + 1;
  const round = t.round + 1;
  if (round >= t.totalRounds) {
    const next = { ...t, wins, round, active: false };
    saveTournament(next);
    return { state: next, champion: true, eliminated: false };
  }
  const next = { ...t, wins, round, active: true };
  saveTournament(next);
  return { state: next, champion: false, eliminated: false };
}

export function tourneyDiffLabel(d: TournamentDifficulty): string {
  if (d === "easy") return "Einfach";
  if (d === "hard") return "Schwer";
  return "Mittel";
}
