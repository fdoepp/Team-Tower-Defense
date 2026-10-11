import type { AiDifficulty } from "./types";

export type ScoreBoardKind = "ergebnis" | "blocksturm";

export type HighscoreEntry = {
  name: string;
  /** Ergebnis: Tor-Differenz gewichtet; Blocksturm: Spielminute (niedriger = besser) */
  value: number;
  detail: string;
  at: string;
  difficulty: AiDifficulty;
};

export type HighscoreTables = Record<
  AiDifficulty,
  Record<ScoreBoardKind, HighscoreEntry[]>
>;

const STORAGE_KEY = "matchday-highscores-v1";
const TOP_N = 10;

function emptyTables(): HighscoreTables {
  const blank = (): Record<ScoreBoardKind, HighscoreEntry[]> => ({
    ergebnis: [],
    blocksturm: [],
  });
  return { easy: blank(), normal: blank(), hard: blank() };
}

export function loadHighscores(): HighscoreTables {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyTables();
    const parsed = JSON.parse(raw) as HighscoreTables;
    const base = emptyTables();
    for (const d of ["easy", "normal", "hard"] as AiDifficulty[]) {
      for (const k of ["ergebnis", "blocksturm"] as ScoreBoardKind[]) {
        const list = parsed?.[d]?.[k];
        base[d][k] = Array.isArray(list) ? list.slice(0, TOP_N) : [];
      }
    }
    return base;
  } catch {
    return emptyTables();
  }
}

function saveHighscores(tables: HighscoreTables): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
}

/** Higher is better for Ergebnis. */
export function ergebnisValue(playerGoals: number, aiGoals: number): number {
  const diff = playerGoals - aiGoals;
  return diff * 1000 + playerGoals * 10 - aiGoals;
}

/** Lower minute is better for Blocksturm. Stored as value = minute. */
export function blocksturmValue(minute: number): number {
  return Math.max(0.1, minute);
}

export function wouldEnterTop10(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  value: number,
): boolean {
  const list = loadHighscores()[difficulty][kind];
  if (list.length < TOP_N) return true;
  const worst = list[list.length - 1]!;
  if (kind === "ergebnis") return value > worst.value;
  return value < worst.value;
}

export function tryInsertHighscore(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  entry: Omit<HighscoreEntry, "difficulty" | "at"> & { at?: string },
): { placed: boolean; rank: number; tables: HighscoreTables } {
  const tables = loadHighscores();
  const list = [...tables[difficulty][kind]];
  const full: HighscoreEntry = {
    ...entry,
    difficulty,
    at: entry.at ?? new Date().toISOString(),
  };
  list.push(full);
  list.sort((a, b) =>
    kind === "ergebnis" ? b.value - a.value : a.value - b.value,
  );
  const rank = list.findIndex(
    (e) => e.name === full.name && e.value === full.value && e.at === full.at,
  ) + 1;
  tables[difficulty][kind] = list.slice(0, TOP_N);
  const placed = rank > 0 && rank <= TOP_N;
  if (placed) saveHighscores(tables);
  return { placed, rank: placed ? rank : -1, tables };
}

export function difficultyLabel(d: AiDifficulty): string {
  if (d === "easy") return "Einfach";
  if (d === "hard") return "Schwer";
  return "Mittel";
}
