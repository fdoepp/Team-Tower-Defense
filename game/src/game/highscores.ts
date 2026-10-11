import type { AiDifficulty, TeamId } from "./types";

export type ScoreBoardKind = "ergebnis" | "blocksturm";

export type HighscoreEntry = {
  name: string;
  /** Ergebnis: Tor-Differenz gewichtet; Blocksturm: Spielminute (niedriger = besser) */
  value: number;
  detail: string;
  at: string;
  difficulty: AiDifficulty;
  /** Team the player won with */
  team?: TeamId;
};

export type HighscoreTables = Record<
  AiDifficulty,
  Record<ScoreBoardKind, HighscoreEntry[]>
>;

const STORAGE_KEY = "matchday-highscores-v1";
const TOP_N = 10;

/** Shared boards via ScoreDrop (browser CORS, free tier). */
const REMOTE_BASE = "https://leaderboard-game.vercel.app";
const BOARD_KEYS: Record<AiDifficulty, Record<ScoreBoardKind, string>> = {
  easy: { ergebnis: "mdhs-erg-e", blocksturm: "mdhs-bst-e" },
  normal: { ergebnis: "mdhs-erg-n", blocksturm: "mdhs-bst-n" },
  hard: { ergebnis: "mdhs-erg-h", blocksturm: "mdhs-bst-h" },
};

const META_SEP = " ¦ ";

function emptyTables(): HighscoreTables {
  const blank = (): Record<ScoreBoardKind, HighscoreEntry[]> => ({
    ergebnis: [],
    blocksturm: [],
  });
  return { easy: blank(), normal: blank(), hard: blank() };
}

function saveLocal(tables: HighscoreTables): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
  } catch {
    /* quota / private mode */
  }
}

/** Local cache (offline / instant paint). Prefer fetchSharedHighscores(). */
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

/** Higher is better for Ergebnis. */
export function ergebnisValue(playerGoals: number, aiGoals: number): number {
  const diff = playerGoals - aiGoals;
  return diff * 1000 + playerGoals * 10 - aiGoals;
}

/** Lower minute is better for Blocksturm. Stored as value = minute. */
export function blocksturmValue(minute: number): number {
  return Math.max(0.1, minute);
}

/** ScoreDrop ranks higher-is-better; invert Blocksturm minutes. */
function toRemoteScore(kind: ScoreBoardKind, value: number): number {
  if (kind === "ergebnis") return Math.max(1, Math.round(value));
  const minute = Math.max(0.1, value);
  return Math.max(1, Math.round(1_000_000 / minute));
}

function fromRemoteScore(kind: ScoreBoardKind, remote: number): number {
  if (kind === "ergebnis") return remote;
  if (remote <= 0) return 90;
  return Math.round((1_000_000 / remote) * 10) / 10;
}

function encodePlayer(entry: HighscoreEntry): string {
  const team = entry.team === "ksc" || entry.team === "vfb" ? entry.team : "-";
  const name = entry.name.replaceAll(META_SEP, " ").slice(0, 20);
  const detail = entry.detail.replaceAll(META_SEP, " · ").slice(0, 80);
  return `${name}${META_SEP}${team}${META_SEP}${detail}`;
}

function decodePlayer(
  player: string,
  kind: ScoreBoardKind,
  difficulty: AiDifficulty,
  remoteScore: number,
): HighscoreEntry {
  const parts = player.split(META_SEP);
  if (parts.length >= 3) {
    const teamRaw = parts[1]!;
    const team: TeamId | undefined =
      teamRaw === "ksc" || teamRaw === "vfb" ? teamRaw : undefined;
    return {
      name: parts[0]!.slice(0, 20) || "Spieler",
      team,
      detail: parts.slice(2).join(" · "),
      value: fromRemoteScore(kind, remoteScore),
      difficulty,
      at: new Date(0).toISOString(),
    };
  }
  // Legacy / plain names from the board UI
  return {
    name: player.slice(0, 20) || "Spieler",
    detail: kind === "ergebnis" ? String(remoteScore) : `${fromRemoteScore(kind, remoteScore)}′`,
    value: fromRemoteScore(kind, remoteScore),
    difficulty,
    at: new Date(0).toISOString(),
  };
}

function playerIdFor(difficulty: AiDifficulty, kind: ScoreBoardKind, name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `md-${difficulty}-${kind}-${slug || "spieler"}`;
}

type RemoteTop = {
  scores?: Array<{ player: string; score: number }>;
};

async function fetchBoard(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
): Promise<HighscoreEntry[]> {
  const key = BOARD_KEYS[difficulty][kind];
  const url = `${REMOTE_BASE}/api/top?key=${encodeURIComponent(key)}&limit=${TOP_N}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`highscore fetch ${res.status}`);
  const data = (await res.json()) as RemoteTop;
  const rows = Array.isArray(data.scores) ? data.scores : [];
  return rows.slice(0, TOP_N).map((s) =>
    decodePlayer(String(s.player ?? ""), kind, difficulty, Number(s.score) || 0),
  );
}

/**
 * Load shared tables for all difficulties (parallel).
 * Updates localStorage cache on success; falls back to cache on failure.
 */
export async function fetchSharedHighscores(): Promise<{
  tables: HighscoreTables;
  shared: boolean;
}> {
  try {
    const diffs: AiDifficulty[] = ["easy", "normal", "hard"];
    const kinds: ScoreBoardKind[] = ["ergebnis", "blocksturm"];
    const tables = emptyTables();
    await Promise.all(
      diffs.flatMap((d) =>
        kinds.map(async (k) => {
          tables[d][k] = await fetchBoard(d, k);
        }),
      ),
    );
    saveLocal(tables);
    return { tables, shared: true };
  } catch {
    return { tables: loadHighscores(), shared: false };
  }
}

export async function wouldEnterTop10Shared(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  value: number,
): Promise<boolean> {
  try {
    const list = await fetchBoard(difficulty, kind);
    if (list.length < TOP_N) return true;
    const worst = list[list.length - 1]!;
    if (kind === "ergebnis") return value > worst.value;
    return value < worst.value;
  } catch {
    return wouldEnterTop10Local(difficulty, kind, value);
  }
}

function wouldEnterTop10Local(
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

/** @deprecated Prefer wouldEnterTop10Shared — uses local cache only. */
export function wouldEnterTop10(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  value: number,
): boolean {
  return wouldEnterTop10Local(difficulty, kind, value);
}

async function submitRemote(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  entry: HighscoreEntry,
): Promise<boolean> {
  const key = BOARD_KEYS[difficulty][kind];
  const score = toRemoteScore(kind, entry.value);
  const player = encodePlayer(entry);
  const playerId = playerIdFor(difficulty, kind, entry.name);
  const url =
    `${REMOTE_BASE}/api/add?key=${encodeURIComponent(key)}` +
    `&player_id=${encodeURIComponent(playerId)}` +
    `&player=${encodeURIComponent(player)}` +
    `&score=${encodeURIComponent(String(score))}`;
  const res = await fetch(url);
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean; error?: string };
  return !!data.success && !data.error;
}

function insertLocal(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  entry: HighscoreEntry,
): { placed: boolean; rank: number; tables: HighscoreTables } {
  const tables = loadHighscores();
  const list = [...tables[difficulty][kind]];
  // Replace same-name entry if present
  const without = list.filter(
    (e) => e.name.trim().toLowerCase() !== entry.name.trim().toLowerCase(),
  );
  without.push(entry);
  without.sort((a, b) =>
    kind === "ergebnis" ? b.value - a.value : a.value - b.value,
  );
  const rank =
    without.findIndex(
      (e) => e.name === entry.name && e.value === entry.value,
    ) + 1;
  tables[difficulty][kind] = without.slice(0, TOP_N);
  const placed = rank > 0 && rank <= TOP_N;
  if (placed) saveLocal(tables);
  return { placed, rank: placed ? rank : -1, tables };
}

/**
 * Submit to shared board + refresh local cache.
 * Rank is computed from the shared list after submit.
 */
export async function tryInsertHighscoreShared(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  entry: Omit<HighscoreEntry, "difficulty" | "at"> & { at?: string },
): Promise<{ placed: boolean; rank: number; tables: HighscoreTables; shared: boolean }> {
  const full: HighscoreEntry = {
    ...entry,
    difficulty,
    at: entry.at ?? new Date().toISOString(),
  };
  let shared = false;
  try {
    shared = await submitRemote(difficulty, kind, full);
  } catch {
    shared = false;
  }
  // Always keep a local copy so the UI works offline
  insertLocal(difficulty, kind, full);
  try {
    const list = await fetchBoard(difficulty, kind);
    const tables = loadHighscores();
    tables[difficulty][kind] = list;
    saveLocal(tables);
    const rank =
      list.findIndex(
        (e) =>
          e.name.trim().toLowerCase() === full.name.trim().toLowerCase(),
      ) + 1;
    const placed = rank > 0 && rank <= TOP_N;
    return { placed, rank: placed ? rank : -1, tables, shared };
  } catch {
    const local = insertLocal(difficulty, kind, full);
    return { ...local, shared: false };
  }
}

/** Sync helper kept for older call sites — writes local only. */
export function tryInsertHighscore(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  entry: Omit<HighscoreEntry, "difficulty" | "at"> & { at?: string },
): { placed: boolean; rank: number; tables: HighscoreTables } {
  const full: HighscoreEntry = {
    ...entry,
    difficulty,
    at: entry.at ?? new Date().toISOString(),
  };
  return insertLocal(difficulty, kind, full);
}

export function difficultyLabel(d: AiDifficulty): string {
  if (d === "easy") return "Einfach";
  if (d === "hard") return "Schwer";
  return "Mittel";
}

export function teamShort(t?: TeamId): string {
  if (t === "ksc") return "KSC";
  if (t === "vfb") return "VfB";
  return "—";
}
