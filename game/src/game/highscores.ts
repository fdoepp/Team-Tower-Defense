import { getClub } from "./clubs";
import type { AiDifficulty, TeamId } from "./types";

export type ScoreBoardKind = "ergebnis" | "blocksturm";

export type HighscoreEntry = {
  name: string;
  /** Ergebnis: Tor-Differenz gewichtet; Blocksturm: Spielminute (niedriger = besser) */
  value: number;
  detail: string;
  at: string;
  difficulty: AiDifficulty;
  /** Side slot the player won with (legacy / ScoreDrop encode) */
  team?: TeamId;
  /** Club id the player used — frozen at insert, never live menu branding */
  playerClub?: string;
  /** Club id of the AI opponent — frozen at insert */
  opponentClub?: string;
  /** Immutable short codes snapshotted at insert (survive catalog / branding changes) */
  playerShort?: string;
  opponentShort?: string;
};

export type HighscoreTables = Record<
  AiDifficulty,
  Record<ScoreBoardKind, HighscoreEntry[]>
>;

const STORAGE_KEY = "matchday-highscores-v1";
/** Per-player personal boards (multiple results per name allowed). */
const PERSONAL_KEY = "matchday-hs-personal-v1";
const TOP_N = 10;

export type HighscoreScope = "gesamt" | "persoenlich";

/** Shared boards via ScoreDrop (browser CORS, free tier). */
const REMOTE_BASE = "https://leaderboard-game.vercel.app";
const BOARD_KEYS: Record<AiDifficulty, Record<ScoreBoardKind, string>> = {
  easy: { ergebnis: "mdhs-erg-e", blocksturm: "mdhs-bst-e" },
  normal: { ergebnis: "mdhs-erg-n", blocksturm: "mdhs-bst-n" },
  hard: { ergebnis: "mdhs-erg-h", blocksturm: "mdhs-bst-h" },
};

/**
 * ScoreDrop `player`: max 30 chars, only [A-Za-z0-9 _-].
 * Layout: `{k|v|x} {name} {detail}` e.g. `k DemoFan 2-0` / `v Anna m18`.
 */
const PLAYER_MAX = 30;

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
        base[d][k] = Array.isArray(list)
          ? list.slice(0, TOP_N).map((e) => freezeEntryClubs(e))
          : [];
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

function sanitizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 _-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stable club short code from stored club id or `short:CODE` placeholder.
 * Never uses live side branding (`clubShort("ksc"|"vfb")`). */
export function clubCode(clubId?: string): string {
  if (!clubId) return "";
  if (clubId.startsWith("short:")) return clubId.slice(6);
  try {
    return getClub(clubId).short;
  } catch {
    return "";
  }
}

/** Parse "B04 vs LIV" (or "B04vLIV") out of a frozen detail string. */
function matchupFromDetail(detail: string): {
  playerShort?: string;
  opponentShort?: string;
} {
  const m =
    detail.match(/\b([A-Za-z0-9]{2,5})\s+vs\s+([A-Za-z0-9]{2,5})\b/i) ||
    detail.match(/\b([A-Za-z0-9]{2,5})v([A-Za-z0-9]{2,5})\b/);
  if (!m) return {};
  return { playerShort: m[1], opponentShort: m[2] };
}

/**
 * Snapshot club shorts onto the entry so display never depends on the
 * current menu selection / live branding.
 */
export function freezeEntryClubs(entry: HighscoreEntry): HighscoreEntry {
  const fromDetail = matchupFromDetail(entry.detail || "");
  const playerShort =
    entry.playerShort ||
    clubCode(entry.playerClub) ||
    fromDetail.playerShort ||
    undefined;
  const opponentShort =
    entry.opponentShort ||
    clubCode(entry.opponentClub) ||
    fromDetail.opponentShort ||
    undefined;
  return {
    ...entry,
    playerShort,
    opponentShort,
    // Keep ids when present; also store short: placeholders for remote-only rows
    playerClub:
      entry.playerClub ||
      (playerShort ? `short:${playerShort}` : undefined),
    opponentClub:
      entry.opponentClub ||
      (opponentShort ? `short:${opponentShort}` : undefined),
  };
}

/** Display short for a highscore side — entry snapshot only, never live branding. */
export function entryClubShort(
  clubId: string | undefined,
  fallbackTeam?: TeamId,
  frozenShort?: string,
): string {
  if (frozenShort) return frozenShort;
  const code = clubCode(clubId);
  if (code) return code;
  // Legacy side slot only — fixed KSC/VfB labels, NOT current kit branding
  return teamShort(fallbackTeam);
}

/** e.g. "B04 vs LIV" — from the entry's frozen match, never current menu clubs */
export function matchupLabel(entry: HighscoreEntry): string {
  const a = entryClubShort(entry.playerClub, entry.team, entry.playerShort);
  const b = entryClubShort(entry.opponentClub, undefined, entry.opponentShort);
  if (a !== "—" && b !== "—") return `${a} vs ${b}`;
  if (a !== "—") return a;
  return "";
}

/** Compact matchup for ScoreDrop detail: B04vLIV */
function matchupTag(entry: HighscoreEntry): string {
  const frozen = freezeEntryClubs(entry);
  const a = entryClubShort(frozen.playerClub, frozen.team, frozen.playerShort);
  const b = entryClubShort(
    frozen.opponentClub,
    undefined,
    frozen.opponentShort,
  );
  if (a !== "—" && b !== "—") return `${a}v${b}`;
  return a === "—" ? "" : a;
}

/** Primary kit color for a stored club id / short:CODE — not live branding. */
export function entryClubPrimary(clubId?: string): string | undefined {
  if (!clubId || clubId.startsWith("short:")) return undefined;
  try {
    return getClub(clubId).primary;
  } catch {
    return undefined;
  }
}

/** Prefer richer local club metadata when remote sync would drop it. */
function mergeClubMeta(
  remote: HighscoreEntry,
  local?: HighscoreEntry,
): HighscoreEntry {
  const base = freezeEntryClubs(remote);
  if (!local) return base;
  const loc = freezeEntryClubs(local);
  return freezeEntryClubs({
    ...base,
    playerClub: loc.playerClub || base.playerClub,
    opponentClub: loc.opponentClub || base.opponentClub,
    playerShort: loc.playerShort || base.playerShort,
    opponentShort: loc.opponentShort || base.opponentShort,
    // Keep remote detail if it already has vs; else prefer local detail with matchup
    detail:
      matchupFromDetail(base.detail).playerShort || !loc.detail
        ? base.detail
        : loc.detail,
  });
}

function shortDetail(entry: HighscoreEntry, kind: ScoreBoardKind): string {
  let base: string;
  if (kind === "blocksturm") {
    const m = entry.detail.match(/(\d+)(?:[.,](\d+))?/);
    if (m) base = m[2] ? `m${m[1]}-${m[2]}` : `m${m[1]}`;
    else {
      const whole = Math.floor(entry.value);
      const frac = Math.round((entry.value - whole) * 10);
      base = frac > 0 ? `m${whole}-${frac}` : `m${whole}`;
    }
  } else {
    const score = entry.detail.match(/(\d+):(\d+)/);
    base = score
      ? `${score[1]}-${score[2]}`
      : String(Math.max(0, Math.round(entry.value)));
  }
  const tag = matchupTag(entry);
  if (!tag) return base;
  // Keep ScoreDrop payload compact (name still needs room in 30 chars)
  const withTag = `${base}_${tag}`;
  return withTag.length <= 16 ? withTag : base;
}

function encodePlayer(entry: HighscoreEntry, kind: ScoreBoardKind): string {
  const team =
    entry.team === "ksc" ? "k" : entry.team === "vfb" ? "v" : "x";
  const detail = shortDetail(entry, kind);
  const reserve = team.length + 1 + 1 + detail.length; // "t " + " " + detail
  const nameMax = Math.max(1, PLAYER_MAX - reserve);
  let name = sanitizeName(entry.name).slice(0, nameMax) || "Spieler";
  name = name.replace(/ /g, "_");
  const encoded = `${team} ${name} ${detail}`;
  return encoded.slice(0, PLAYER_MAX);
}

/** Parse optional `_B04vLIV` suffix from remote short detail. */
function splitDetailTag(short: string): {
  core: string;
  playerClub?: string;
  opponentClub?: string;
  playerShort?: string;
  opponentShort?: string;
} {
  const m = short.match(/^(.*)_([A-Za-z0-9]{2,5})v([A-Za-z0-9]{2,5})$/);
  if (!m) return { core: short };
  return {
    core: m[1]!,
    playerShort: m[2],
    opponentShort: m[3],
  };
}

function decodePlayer(
  player: string,
  kind: ScoreBoardKind,
  difficulty: AiDifficulty,
  remoteScore: number,
): HighscoreEntry {
  const m = player.trim().match(/^([kvx])\s+(.+?)\s+(\S+)$/i);
  if (m) {
    const teamRaw = m[1]!.toLowerCase();
    const team: TeamId | undefined =
      teamRaw === "k" ? "ksc" : teamRaw === "v" ? "vfb" : undefined;
    const name = m[2]!.replace(/_/g, " ").slice(0, 20) || "Spieler";
    const { core, playerShort, opponentShort } = splitDetailTag(m[3]!);
    const value = fromRemoteScore(kind, remoteScore);
    const vs =
      playerShort && opponentShort
        ? `${playerShort} vs ${opponentShort}`
        : playerShort || "";
    let detail: string;
    if (kind === "blocksturm") {
      const mm = core.match(/^m(\d+)(?:-(\d+))?$/i);
      const label = mm
        ? mm[2]
          ? `${mm[1]},${mm[2]}′`
          : `${mm[1]}′`
        : `${value}′`;
      detail = vs
        ? `Blocksturm in ${label} · ${vs} (${difficultyLabel(difficulty)})`
        : `Blocksturm in ${label} (${difficultyLabel(difficulty)})`;
    } else {
      const sc = core.match(/^(\d+)-(\d+)$/);
      const label = sc ? `${sc[1]}:${sc[2]}` : core;
      detail = vs
        ? `${label} · ${vs} (${difficultyLabel(difficulty)})`
        : `${label} · ${teamShort(team)} (${difficultyLabel(difficulty)})`;
    }
    return freezeEntryClubs({
      name,
      team,
      detail,
      value,
      difficulty,
      at: new Date(0).toISOString(),
      // Shorts from remote tag — ids unknown after round-trip
      playerShort: playerShort || undefined,
      opponentShort: opponentShort || undefined,
      playerClub: playerShort ? `short:${playerShort}` : undefined,
      opponentClub: opponentShort ? `short:${opponentShort}` : undefined,
    });
  }
  return freezeEntryClubs({
    name: sanitizeName(player).slice(0, 20) || "Spieler",
    detail:
      kind === "ergebnis"
        ? String(remoteScore)
        : `${fromRemoteScore(kind, remoteScore)}′`,
    value: fromRemoteScore(kind, remoteScore),
    difficulty,
    at: new Date(0).toISOString(),
  });
}

/** Unique per submission so ScoreDrop keeps multiple rows for the same display name. */
function playerIdFor(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  name: string,
  entry: HighscoreEntry,
): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);
  const stamp = (entry.at || new Date().toISOString())
    .replace(/[^0-9]/g, "")
    .slice(-10);
  const val = Math.round(entry.value * 10);
  return `md-${difficulty}-${kind}-${slug || "spieler"}-${val}-${stamp}`;
}

function entryMatchKey(e: HighscoreEntry): string {
  return [
    e.name.trim().toLowerCase(),
    String(Math.round(e.value * 10)),
    e.playerShort || clubCode(e.playerClub) || "",
    e.opponentShort || clubCode(e.opponentClub) || "",
    (e.at || "").slice(0, 19),
  ].join("|");
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
    const prev = loadHighscores();
    const tables = emptyTables();
    await Promise.all(
      diffs.flatMap((d) =>
        kinds.map(async (k) => {
          const remote = await fetchBoard(d, k);
          const localByKey = new Map(
            prev[d][k].map((e) => [entryMatchKey(e), e]),
          );
          // Soft name fallback when remote lacks matchup/at precision
          const localByName = new Map<string, HighscoreEntry[]>();
          for (const e of prev[d][k]) {
            const nk = e.name.trim().toLowerCase();
            const arr = localByName.get(nk) ?? [];
            arr.push(e);
            localByName.set(nk, arr);
          }
          tables[d][k] = remote.map((e) => {
            const hit =
              localByKey.get(entryMatchKey(e)) ||
              localByName.get(e.name.trim().toLowerCase())?.[0];
            return mergeClubMeta(e, hit);
          });
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
  const player = encodePlayer(entry, kind);
  const playerId = playerIdFor(difficulty, kind, entry.name, entry);
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

type PersonalStore = Record<string, HighscoreTables>;

function loadPersonalStore(): PersonalStore {
  try {
    const raw = localStorage.getItem(PERSONAL_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersonalStore;
  } catch {
    return {};
  }
}

function savePersonalStore(store: PersonalStore): void {
  try {
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

/** Top-10 for one player name (local personal history). */
export function loadPersonalHighscores(playerName: string): HighscoreTables {
  const key = playerName.trim().toLowerCase();
  const store = loadPersonalStore();
  const raw = store[key];
  if (!raw) return emptyTables();
  const base = emptyTables();
  for (const d of ["easy", "normal", "hard"] as AiDifficulty[]) {
    for (const k of ["ergebnis", "blocksturm"] as ScoreBoardKind[]) {
      const list = raw?.[d]?.[k];
      base[d][k] = Array.isArray(list)
        ? list.slice(0, TOP_N).map((e) => freezeEntryClubs(e))
        : [];
    }
  }
  return base;
}

function insertPersonal(entry: HighscoreEntry, kind: ScoreBoardKind): void {
  const frozen = freezeEntryClubs(entry);
  const nameKey = frozen.name.trim().toLowerCase() || "spieler";
  const store = loadPersonalStore();
  const tables = store[nameKey] ?? emptyTables();
  const list = [...tables[frozen.difficulty][kind], frozen];
  list.sort((a, b) =>
    kind === "ergebnis" ? b.value - a.value : a.value - b.value,
  );
  tables[frozen.difficulty][kind] = list.slice(0, TOP_N);
  store[nameKey] = tables;
  savePersonalStore(store);
}

function insertLocal(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  entry: HighscoreEntry,
): { placed: boolean; rank: number; tables: HighscoreTables } {
  const frozen = freezeEntryClubs(entry);
  const tables = loadHighscores();
  const list = [...tables[difficulty][kind]];
  // Keep multiple results per name — only drop exact duplicate submissions
  const without = list.filter((e) => entryMatchKey(e) !== entryMatchKey(frozen));
  without.push(frozen);
  without.sort((a, b) =>
    kind === "ergebnis" ? b.value - a.value : a.value - b.value,
  );
  const rank =
    without.findIndex((e) => entryMatchKey(e) === entryMatchKey(frozen)) + 1;
  tables[difficulty][kind] = without.slice(0, TOP_N);
  const placed = rank > 0 && rank <= TOP_N;
  if (placed) saveLocal(tables);
  insertPersonal(frozen, kind);
  return { placed, rank: placed ? rank : -1, tables };
}

/**
 * Submit to shared board + refresh local cache.
 * Rank is computed from the shared list after submit.
 * Club meta from this match is preserved even if the remote tag is thin.
 */
export async function tryInsertHighscoreShared(
  difficulty: AiDifficulty,
  kind: ScoreBoardKind,
  entry: Omit<HighscoreEntry, "difficulty" | "at"> & { at?: string },
): Promise<{ placed: boolean; rank: number; tables: HighscoreTables; shared: boolean }> {
  const full = freezeEntryClubs({
    ...entry,
    difficulty,
    at: entry.at ?? new Date().toISOString(),
  });
  let shared = false;
  try {
    shared = await submitRemote(difficulty, kind, full);
  } catch {
    shared = false;
  }
  // Always keep a local + personal copy so the UI works offline
  insertLocal(difficulty, kind, full);
  try {
    const list = await fetchBoard(difficulty, kind);
    const tables = loadHighscores();
    const fullKey = entryMatchKey(full);
    const merged = list.map((e) => {
      if (entryMatchKey(e) === fullKey) return mergeClubMeta(e, full);
      const sameName =
        e.name.trim().toLowerCase() === full.name.trim().toLowerCase() &&
        Math.round(e.value * 10) === Math.round(full.value * 10);
      if (sameName) return mergeClubMeta(e, full);
      return mergeClubMeta(
        e,
        tables[difficulty][kind].find((x) => entryMatchKey(x) === entryMatchKey(e)),
      );
    });
    tables[difficulty][kind] = merged;
    saveLocal(tables);
    const rank =
      merged.findIndex(
        (e) =>
          entryMatchKey(e) === fullKey ||
          (e.name.trim().toLowerCase() === full.name.trim().toLowerCase() &&
            Math.round(e.value * 10) === Math.round(full.value * 10)),
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
  const full = freezeEntryClubs({
    ...entry,
    difficulty,
    at: entry.at ?? new Date().toISOString(),
  });
  return insertLocal(difficulty, kind, full);
}

export function difficultyLabel(d: AiDifficulty): string {
  if (d === "easy") return "Einfach";
  if (d === "hard") return "Schwer";
  return "Mittel";
}

/** Fixed side-slot labels only — must NOT call live `clubShort()`. */
export function teamShort(t?: TeamId): string {
  if (t === "ksc") return "KSC";
  if (t === "vfb") return "VfB";
  return "—";
}
