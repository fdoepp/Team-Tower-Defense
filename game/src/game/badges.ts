/**
 * Persönliche Badges — Staffel nach Schwierigkeit:
 * Bronze = Einfach · Silber = Mittel · Gold = Schwer
 */
import type { AiDifficulty, TeamId } from "./types";

export type BadgeTier = "bronze" | "silver" | "gold";

export type BadgeDef = {
  id: string;
  title: string;
  blurb: string;
  /** Icon letter / short mark */
  mark: string;
};

export type BadgeUnlock = {
  tier: BadgeTier;
  at: string;
  difficulty: AiDifficulty;
};

/** id → best unlock */
export type BadgeSave = Record<string, BadgeUnlock>;

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first_win",
    title: "Erster Sieg",
    blurb: "Gewinne ein Solo-Spiel",
    mark: "1",
  },
  {
    id: "blocksturm",
    title: "Blockstürmer",
    blurb: "Siege per Blocksturm",
    mark: "B",
  },
  {
    id: "early_storm",
    title: "Früher Sturm",
    blurb: "Blocksturm vor der 60.",
    mark: "⚡",
  },
  {
    id: "clean_sheet",
    title: "Zu Null",
    blurb: "Siege ohne Gegentor",
    mark: "0",
  },
  {
    id: "comeback",
    title: "Comeback",
    blurb: "Siege nach Rückstand",
    mark: "↩",
  },
  {
    id: "beer_5",
    title: "Angetrunken",
    blurb: "5+ Biere in einem Spiel",
    mark: "🍺",
  },
  {
    id: "beer_12",
    title: "Sauftour",
    blurb: "12+ Biere in einem Spiel",
    mark: "🍻",
  },
  {
    id: "builder",
    title: "Baumeister",
    blurb: "3+ eigene Gebäude am Ende",
    mark: "🏗",
  },
  {
    id: "late_drama",
    title: "Schlussphase",
    blurb: "Siege in der Schlussphase (ab 75′)",
    mark: "⏱",
  },
  {
    id: "tourney_round",
    title: "Turnier-Schritt",
    blurb: "Gewinne eine Turnier-Runde",
    mark: "T",
  },
  {
    id: "tourney_champ",
    title: "Turnier-Champion",
    blurb: "Gewinne ein komplettes Solo-Turnier",
    mark: "🏆",
  },
  {
    id: "live_win",
    title: "Live-Held",
    blurb: "Gewinne eine Live Challenge",
    mark: "L",
  },
];

const SAVE_KEY = "matchday-badges-v1";
const TIER_RANK: Record<BadgeTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

export function tierFromDifficulty(d: AiDifficulty): BadgeTier {
  if (d === "hard") return "gold";
  if (d === "normal") return "silver";
  return "bronze";
}

export function tierLabel(t: BadgeTier): string {
  if (t === "gold") return "Gold";
  if (t === "silver") return "Silber";
  return "Bronze";
}

export function difficultyForTier(t: BadgeTier): string {
  if (t === "gold") return "Schwer";
  if (t === "silver") return "Mittel";
  return "Einfach";
}

export function loadBadges(): BadgeSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as BadgeSave) : {};
  } catch {
    return {};
  }
}

function saveBadges(s: BadgeSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
}

/** Upgrade badge if new tier is higher. Returns unlock if newly gained/upgraded. */
export function unlockBadge(
  id: string,
  difficulty: AiDifficulty,
): BadgeUnlock | null {
  const tier = tierFromDifficulty(difficulty);
  const save = loadBadges();
  const prev = save[id];
  if (prev && TIER_RANK[prev.tier] >= TIER_RANK[tier]) return null;
  const next: BadgeUnlock = {
    tier,
    at: new Date().toISOString(),
    difficulty,
  };
  save[id] = next;
  saveBadges(save);
  return next;
}

export type MatchBadgeContext = {
  difficulty: AiDifficulty;
  playerTeam: TeamId;
  winner: TeamId;
  reason: "score" | "et" | "pens" | "invade";
  scoreFor: number;
  scoreAgainst: number;
  minute: number;
  beers: number;
  buildingsOwned: number;
  /** Was player behind on the scoreboard at some point? */
  wasBehind: boolean;
  fromTournamentRound?: boolean;
  tournamentChampion?: boolean;
  fromLiveWin?: boolean;
};

export function evaluateMatchBadges(ctx: MatchBadgeContext): {
  id: string;
  def: BadgeDef;
  unlock: BadgeUnlock;
}[] {
  const won = ctx.winner === ctx.playerTeam;
  const candidates: string[] = [];
  if (won) {
    candidates.push("first_win");
    if (ctx.reason === "invade") candidates.push("blocksturm");
    if (ctx.reason === "invade" && ctx.minute < 60) candidates.push("early_storm");
    if (ctx.scoreAgainst === 0) candidates.push("clean_sheet");
    if (ctx.wasBehind) candidates.push("comeback");
    if (ctx.minute >= 75) candidates.push("late_drama");
  }
  if (ctx.beers >= 5) candidates.push("beer_5");
  if (ctx.beers >= 12) candidates.push("beer_12");
  if (ctx.buildingsOwned >= 3) candidates.push("builder");
  if (ctx.fromTournamentRound && won) candidates.push("tourney_round");
  if (ctx.tournamentChampion) candidates.push("tourney_champ");
  if (ctx.fromLiveWin) candidates.push("live_win");

  const out: { id: string; def: BadgeDef; unlock: BadgeUnlock }[] = [];
  for (const id of candidates) {
    const unlock = unlockBadge(id, ctx.difficulty);
    if (!unlock) continue;
    const def = BADGE_DEFS.find((b) => b.id === id);
    if (!def) continue;
    out.push({ id, def, unlock });
  }
  return out;
}

export function badgeCount(): { unlocked: number; total: number; gold: number } {
  const save = loadBadges();
  let gold = 0;
  for (const u of Object.values(save)) {
    if (u.tier === "gold") gold += 1;
  }
  return {
    unlocked: Object.keys(save).length,
    total: BADGE_DEFS.length,
    gold,
  };
}
