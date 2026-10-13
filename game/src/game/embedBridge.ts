/**
 * Host-app bridge for Challenge + Live-PvP embeds (WebView / iframe).
 *
 * Async Challenge launch:
 *   ?embed=1&c=<encoded>&role=a|b&playerName=…&autoplay=1
 *   ?embed=1&mode=challenge&goal=…&difficulty=…&playerClub=…&aiClub=…&role=a&autoplay=1
 *
 * Live PvP launch:
 *   ?embed=1&mode=live&role=host&scope=clubs|nations|any&random=1&difficulty=normal&playerName=…&autoplay=1
 *   ?embed=1&mode=live&live=AB12CD&role=guest&playerName=…&autoplay=1
 *   Optional fixed clubs: playerClub=&aiClub= (skips random)
 *   Optional host code: live=CODE with role=host
 *
 * Outbound postMessage:
 *   matchday.ready | matchday.pong | matchday.catalog
 *   matchday.challenge.created | matchday.challenge.result | matchday.challenge.close
 *   matchday.live.created | matchday.live.result | matchday.live.close | matchday.live.error
 *
 * Inbound postMessage:
 *   matchday.ping | matchday.catalog.request
 *   matchday.challenge.close | matchday.live.close
 */
import {
  allClubs,
  allNationals,
  getClub,
  randomMatchup,
  type Club,
  type MatchupScope,
  type RandomMatchup,
} from "./clubs";
import {
  CHALLENGE_GOAL_BLURB,
  CHALLENGE_GOAL_LABEL,
  challengeCreateEmbedUrl,
  challengeEmbedResult,
  challengeEmbedUrl,
  createChallenge,
  decodeChallenge,
  encodeChallenge,
  type Challenge,
  type ChallengeEmbedResult,
  type ChallengeGoal,
} from "./challenge";
import type { LiveKpis, LiveRole, LiveRoomConfig } from "./liveChallenge";
import type { AiBehavior, AiDifficulty } from "./types";

export const EMBED_PROTOCOL_V = 1 as const;
export const EMBED_SOURCE = "matchday-embed" as const;

export type EmbedMode = "challenge" | "live";

export type EmbedLaunch = {
  embed: boolean;
  mode: EmbedMode | null;
  challenge: Challenge | null;
  /** Create-from-query (no ?c= yet). */
  create: {
    goal: ChallengeGoal;
    difficulty: AiDifficulty;
    behavior: AiBehavior;
    playerClub: string;
    aiClub: string;
    hostName?: string;
  } | null;
  /** Challenge role a/b */
  role: "a" | "b" | null;
  /** Live role host/guest */
  liveRole: LiveRole | null;
  liveCode: string | null;
  liveScope: MatchupScope;
  liveRandom: boolean;
  playerClub: string | null;
  aiClub: string | null;
  difficulty: AiDifficulty;
  playerName: string | null;
  autoplay: boolean;
};

export type LiveEmbedResult = {
  type: "matchday.live.result";
  v: typeof EMBED_PROTOCOL_V;
  code: string;
  role: LiveRole;
  outcome: "win" | "loss" | "draw";
  me: LiveKpis;
  them: LiveKpis;
  config: LiveRoomConfig | null;
  playerClub: string | null;
  aiClub: string | null;
  difficulty: AiDifficulty | null;
};

export type EmbedOutbound =
  | {
      type: "matchday.ready";
      v: typeof EMBED_PROTOCOL_V;
      source: typeof EMBED_SOURCE;
      mode: EmbedMode | null;
      challengeId: string | null;
      liveCode: string | null;
      liveRole: LiveRole | null;
    }
  | {
      type: "matchday.challenge.created";
      v: typeof EMBED_PROTOCOL_V;
      source: typeof EMBED_SOURCE;
      challenge: Challenge;
      encoded: string;
      sharePath: string;
      embedUrl: string;
    }
  | (ChallengeEmbedResult & {
      source: typeof EMBED_SOURCE;
    })
  | {
      type: "matchday.challenge.close";
      v: typeof EMBED_PROTOCOL_V;
      source: typeof EMBED_SOURCE;
      challengeId: string | null;
      result: ChallengeEmbedResult | null;
    }
  | {
      type: "matchday.live.created";
      v: typeof EMBED_PROTOCOL_V;
      source: typeof EMBED_SOURCE;
      code: string;
      role: LiveRole;
      config: LiveRoomConfig;
      matchup: RandomMatchup | null;
      joinPath: string;
      embedUrl: string;
    }
  | (LiveEmbedResult & { source: typeof EMBED_SOURCE })
  | {
      type: "matchday.live.close";
      v: typeof EMBED_PROTOCOL_V;
      source: typeof EMBED_SOURCE;
      code: string | null;
      result: LiveEmbedResult | null;
    }
  | {
      type: "matchday.live.error";
      v: typeof EMBED_PROTOCOL_V;
      source: typeof EMBED_SOURCE;
      message: string;
    }
  | {
      type: "matchday.catalog";
      v: typeof EMBED_PROTOCOL_V;
      source: typeof EMBED_SOURCE;
      clubs: EmbedClubInfo[];
      nationals: EmbedClubInfo[];
      goals: Array<{ id: ChallengeGoal; label: string; blurb: string }>;
      difficulties: AiDifficulty[];
    }
  | {
      type: "matchday.pong";
      v: typeof EMBED_PROTOCOL_V;
      source: typeof EMBED_SOURCE;
    };

export type EmbedClubInfo = {
  id: string;
  short: string;
  name: string;
  country: string;
  league: string;
  primary: string;
  secondary: string;
  kind: "club" | "national";
};

function clubInfo(c: Club): EmbedClubInfo {
  return {
    id: c.id,
    short: c.short,
    name: c.name,
    country: c.country,
    league: c.league,
    primary: c.primary,
    secondary: c.secondary,
    kind: c.kind === "national" ? "national" : "club",
  };
}

function parseGoal(raw: string | null): ChallengeGoal | null {
  if (raw === "ergebnis" || raw === "blocksturm" || raw === "bier") return raw;
  return null;
}

function parseDiff(raw: string | null): AiDifficulty | null {
  if (raw === "easy" || raw === "normal" || raw === "hard") return raw;
  return null;
}

function parseBehavior(raw: string | null): AiBehavior {
  if (
    raw === "patient" ||
    raw === "balanced" ||
    raw === "aggro" ||
    raw === "beer" ||
    raw === "earlywin"
  ) {
    return raw;
  }
  return "balanced";
}

function parseChallengeRole(raw: string | null): "a" | "b" | null {
  if (raw === "a" || raw === "b") return raw;
  return null;
}

function parseLiveRole(raw: string | null): LiveRole | null {
  if (raw === "host" || raw === "guest") return raw;
  return null;
}

function parseScope(raw: string | null): MatchupScope {
  if (raw === "clubs" || raw === "nations" || raw === "any") return raw;
  return "any";
}

export function isEmbedMode(
  search = typeof location !== "undefined" ? location.search : "",
): boolean {
  const qs = new URLSearchParams(search);
  return qs.get("embed") === "1" || qs.get("embed") === "true";
}

/** Parse launch params from the current (or given) URL. */
export function parseEmbedLaunch(
  search = typeof location !== "undefined" ? location.search : "",
  hash = typeof location !== "undefined" ? location.hash : "",
): EmbedLaunch {
  const qs = new URLSearchParams(search);
  const embed = qs.get("embed") === "1" || qs.get("embed") === "true";
  const playerName =
    (qs.get("playerName") || qs.get("name") || "").trim().slice(0, 20) || null;
  const liveCode = (qs.get("live") || qs.get("room") || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || null;
  const liveRole = parseLiveRole(qs.get("role"));
  const challengeRole = parseChallengeRole(qs.get("role"));
  const modeRaw = qs.get("mode");
  const difficulty = parseDiff(qs.get("difficulty")) || "normal";
  const playerClubRaw = (qs.get("playerClub") || "").trim() || null;
  const aiClubRaw = (qs.get("aiClub") || "").trim() || null;
  let playerClub: string | null = null;
  let aiClub: string | null = null;
  if (playerClubRaw && aiClubRaw) {
    try {
      getClub(playerClubRaw);
      getClub(aiClubRaw);
      playerClub = playerClubRaw;
      aiClub = aiClubRaw;
    } catch {
      playerClub = null;
      aiClub = null;
    }
  }

  let challenge: Challenge | null = null;
  const fromQ = qs.get("c");
  if (fromQ) challenge = decodeChallenge(fromQ);
  if (!challenge) {
    const hm = hash.match(/[#&?]c=([^&]+)/);
    if (hm?.[1]) challenge = decodeChallenge(decodeURIComponent(hm[1]));
  }

  let mode: EmbedMode | null = null;
  if (modeRaw === "live" || (embed && liveRole && !challenge && !qs.has("goal"))) {
    mode = "live";
  } else if (
    modeRaw === "challenge" ||
    challenge ||
    (!!embed && qs.has("goal"))
  ) {
    mode = "challenge";
  }

  const autoplay =
    qs.get("autoplay") === "1" ||
    qs.get("autoplay") === "true" ||
    (embed && !!(challengeRole || liveRole));

  let create: EmbedLaunch["create"] = null;
  if (!challenge && embed && mode === "challenge") {
    const goal = parseGoal(qs.get("goal"));
    if (goal && playerClub && aiClub) {
      create = {
        goal,
        difficulty,
        behavior: parseBehavior(qs.get("behavior")),
        playerClub,
        aiClub,
        hostName: (qs.get("hostName") || playerName || undefined)?.slice(0, 20),
      };
    }
  }

  const liveRandom =
    qs.get("random") === "1" ||
    qs.get("random") === "true" ||
    (mode === "live" && !playerClub);

  return {
    embed,
    mode,
    challenge,
    create,
    role: mode === "challenge" ? challengeRole : null,
    liveRole: mode === "live" ? liveRole : null,
    liveCode,
    liveScope: parseScope(qs.get("scope")),
    liveRandom,
    playerClub,
    aiClub,
    difficulty,
    playerName,
    autoplay,
  };
}

export function resolveLiveMatchup(launch: EmbedLaunch): RandomMatchup {
  if (launch.playerClub && launch.aiClub) {
    const a = getClub(launch.playerClub);
    return {
      playerClub: launch.playerClub,
      aiClub: launch.aiClub,
      scope: a.kind === "national" ? "nations" : "clubs",
    };
  }
  return randomMatchup(launch.liveScope);
}

export function liveGuestEmbedUrl(
  code: string,
  opts: { base?: string; playerName?: string; autoplay?: boolean } = {},
): string {
  const base =
    opts.base ||
    (typeof location !== "undefined"
      ? `${location.origin}${location.pathname}`
      : "");
  const qs = new URLSearchParams();
  qs.set("embed", "1");
  qs.set("mode", "live");
  qs.set("live", code.toUpperCase());
  qs.set("role", "guest");
  if (opts.playerName?.trim()) {
    qs.set("playerName", opts.playerName.trim().slice(0, 20));
  }
  if (opts.autoplay !== false) qs.set("autoplay", "1");
  return `${base}?${qs.toString()}`;
}

export function liveHostEmbedUrl(
  opts: {
    base?: string;
    scope?: MatchupScope;
    random?: boolean;
    playerClub?: string;
    aiClub?: string;
    difficulty?: AiDifficulty;
    playerName?: string;
    code?: string;
    autoplay?: boolean;
  } = {},
): string {
  const base =
    opts.base ||
    (typeof location !== "undefined"
      ? `${location.origin}${location.pathname}`
      : "");
  const qs = new URLSearchParams();
  qs.set("embed", "1");
  qs.set("mode", "live");
  qs.set("role", "host");
  qs.set("scope", opts.scope || "any");
  if (opts.code) qs.set("live", opts.code.toUpperCase());
  if (opts.playerClub && opts.aiClub) {
    qs.set("playerClub", opts.playerClub);
    qs.set("aiClub", opts.aiClub);
  } else if (opts.random !== false) {
    qs.set("random", "1");
  }
  if (opts.difficulty) qs.set("difficulty", opts.difficulty);
  if (opts.playerName?.trim()) {
    qs.set("playerName", opts.playerName.trim().slice(0, 20));
  }
  if (opts.autoplay !== false) qs.set("autoplay", "1");
  return `${base}?${qs.toString()}`;
}

export function clearEmbedLaunchParams(): void {
  try {
    const u = new URL(location.href);
    const keys = [
      "embed",
      "mode",
      "goal",
      "difficulty",
      "behavior",
      "playerClub",
      "aiClub",
      "hostName",
      "playerName",
      "name",
      "role",
      "autoplay",
      "c",
      "live",
      "room",
      "scope",
      "random",
    ];
    let changed = false;
    for (const k of keys) {
      if (u.searchParams.has(k)) {
        u.searchParams.delete(k);
        changed = true;
      }
    }
    if (!changed && !location.hash.includes("c=")) return;
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

function targetOrigins(): Window[] {
  const out: Window[] = [];
  if (typeof window === "undefined") return out;
  try {
    if (window.parent && window.parent !== window) out.push(window.parent);
  } catch {
    /* cross-origin */
  }
  try {
    if (window.opener && !window.opener.closed) out.push(window.opener);
  } catch {
    /* cross-origin */
  }
  return out;
}

export function postToHost(msg: EmbedOutbound): void {
  if (typeof window === "undefined") return;
  const targets = targetOrigins();
  try {
    window.dispatchEvent(new CustomEvent("matchday-embed", { detail: msg }));
  } catch {
    /* ignore */
  }
  for (const w of targets) {
    try {
      w.postMessage(msg, "*");
    } catch {
      /* ignore */
    }
  }
}

export function buildCatalogMessage(): Extract<
  EmbedOutbound,
  { type: "matchday.catalog" }
> {
  return {
    type: "matchday.catalog",
    v: EMBED_PROTOCOL_V,
    source: EMBED_SOURCE,
    clubs: allClubs().map(clubInfo),
    nationals: allNationals().map(clubInfo),
    goals: (Object.keys(CHALLENGE_GOAL_LABEL) as ChallengeGoal[]).map((id) => ({
      id,
      label: CHALLENGE_GOAL_LABEL[id],
      blurb: CHALLENGE_GOAL_BLURB[id],
    })),
    difficulties: ["easy", "normal", "hard"],
  };
}

export function emitReady(opts: {
  mode: EmbedMode | null;
  challengeId?: string | null;
  liveCode?: string | null;
  liveRole?: LiveRole | null;
}): void {
  postToHost({
    type: "matchday.ready",
    v: EMBED_PROTOCOL_V,
    source: EMBED_SOURCE,
    mode: opts.mode,
    challengeId: opts.challengeId ?? null,
    liveCode: opts.liveCode ?? null,
    liveRole: opts.liveRole ?? null,
  });
}

export function emitChallengeCreated(c: Challenge): void {
  const encoded = encodeChallenge(c);
  postToHost({
    type: "matchday.challenge.created",
    v: EMBED_PROTOCOL_V,
    source: EMBED_SOURCE,
    challenge: c,
    encoded,
    sharePath: `?c=${encoded}`,
    embedUrl: challengeEmbedUrl(c, { role: "a", autoplay: true }),
  });
}

export function emitChallengeResult(
  c: Challenge,
  myRole: "a" | "b" | null,
): ChallengeEmbedResult {
  const result = {
    ...challengeEmbedResult(c, myRole),
    source: EMBED_SOURCE,
  } as ChallengeEmbedResult & { source: typeof EMBED_SOURCE };
  postToHost(result);
  return result;
}

export function emitChallengeClose(
  c: Challenge | null,
  myRole: "a" | "b" | null,
): void {
  postToHost({
    type: "matchday.challenge.close",
    v: EMBED_PROTOCOL_V,
    source: EMBED_SOURCE,
    challengeId: c?.id ?? null,
    result: c ? challengeEmbedResult(c, myRole) : null,
  });
}

export function emitLiveCreated(opts: {
  code: string;
  role: LiveRole;
  config: LiveRoomConfig;
  matchup: RandomMatchup | null;
}): void {
  const joinPath = `?embed=1&mode=live&live=${encodeURIComponent(opts.code)}&role=guest&autoplay=1`;
  postToHost({
    type: "matchday.live.created",
    v: EMBED_PROTOCOL_V,
    source: EMBED_SOURCE,
    code: opts.code,
    role: opts.role,
    config: opts.config,
    matchup: opts.matchup,
    joinPath,
    embedUrl: liveGuestEmbedUrl(opts.code),
  });
}

export function buildLiveEmbedResult(opts: {
  code: string;
  role: LiveRole;
  outcome: "win" | "loss" | "draw";
  me: LiveKpis;
  them: LiveKpis;
  config: LiveRoomConfig | null;
}): LiveEmbedResult {
  return {
    type: "matchday.live.result",
    v: EMBED_PROTOCOL_V,
    code: opts.code,
    role: opts.role,
    outcome: opts.outcome,
    me: opts.me,
    them: opts.them,
    config: opts.config,
    playerClub: opts.config?.playerClub ?? null,
    aiClub: opts.config?.aiClub ?? null,
    difficulty: opts.config?.difficulty ?? null,
  };
}

export function emitLiveResult(result: LiveEmbedResult): LiveEmbedResult {
  postToHost({ ...result, source: EMBED_SOURCE });
  return result;
}

export function emitLiveClose(result: LiveEmbedResult | null, code: string | null): void {
  postToHost({
    type: "matchday.live.close",
    v: EMBED_PROTOCOL_V,
    source: EMBED_SOURCE,
    code,
    result,
  });
}

export function emitLiveError(message: string): void {
  postToHost({
    type: "matchday.live.error",
    v: EMBED_PROTOCOL_V,
    source: EMBED_SOURCE,
    message,
  });
}

/** Materialize create-from-query into a Challenge. */
export function materializeEmbedCreate(
  create: NonNullable<EmbedLaunch["create"]>,
): Challenge {
  return createChallenge({
    goal: create.goal,
    difficulty: create.difficulty,
    behavior: create.behavior,
    playerClub: create.playerClub,
    aiClub: create.aiClub,
    hostName: create.hostName,
  });
}

export function installEmbedHostListener(handlers: {
  onCloseRequest?: () => void;
}): () => void {
  if (typeof window === "undefined") return () => {};
  const onMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (!data || typeof data !== "object") return;
    const type = (data as { type?: string }).type;
    if (type === "matchday.ping") {
      postToHost({
        type: "matchday.pong",
        v: EMBED_PROTOCOL_V,
        source: EMBED_SOURCE,
      });
      return;
    }
    if (type === "matchday.catalog.request") {
      postToHost(buildCatalogMessage());
      return;
    }
    if (type === "matchday.challenge.close" || type === "matchday.live.close") {
      handlers.onCloseRequest?.();
    }
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

export {
  challengeCreateEmbedUrl,
  challengeEmbedUrl,
  randomMatchup,
};
