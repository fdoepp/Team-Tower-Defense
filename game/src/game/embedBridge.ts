/**
 * Host-app bridge for async Challenge embeds (WebView / iframe).
 *
 * Launch (URL query):
 *   ?embed=1&c=<encoded>&role=a|b&playerName=…&autoplay=1
 *   ?embed=1&mode=challenge&goal=…&difficulty=…&playerClub=…&aiClub=…&role=a&autoplay=1
 *
 * Outbound postMessage (to parent / opener):
 *   matchday.ready | matchday.challenge.created | matchday.challenge.result
 *   | matchday.challenge.close | matchday.catalog | matchday.pong
 *
 * Inbound postMessage:
 *   matchday.ping | matchday.catalog.request | matchday.challenge.close
 */
import { allClubs, allNationals, getClub, type Club } from "./clubs";
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
import type { AiBehavior, AiDifficulty } from "./types";

export const EMBED_PROTOCOL_V = 1 as const;
export const EMBED_SOURCE = "matchday-embed" as const;

export type EmbedLaunch = {
  embed: boolean;
  mode: "challenge" | null;
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
  role: "a" | "b" | null;
  playerName: string | null;
  autoplay: boolean;
};

export type EmbedOutbound =
  | {
      type: "matchday.ready";
      v: typeof EMBED_PROTOCOL_V;
      source: typeof EMBED_SOURCE;
      mode: "challenge" | null;
      challengeId: string | null;
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

function parseRole(raw: string | null): "a" | "b" | null {
  if (raw === "a" || raw === "b") return raw;
  return null;
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
  const role = parseRole(qs.get("role"));
  const playerName = (qs.get("playerName") || qs.get("name") || "").trim().slice(0, 20) || null;
  const autoplay =
    qs.get("autoplay") === "1" ||
    qs.get("autoplay") === "true" ||
    (embed && !!role);

  let challenge: Challenge | null = null;
  const fromQ = qs.get("c");
  if (fromQ) challenge = decodeChallenge(fromQ);
  if (!challenge) {
    const hm = hash.match(/[#&?]c=([^&]+)/);
    if (hm?.[1]) challenge = decodeChallenge(decodeURIComponent(hm[1]));
  }

  let create: EmbedLaunch["create"] = null;
  const modeRaw = qs.get("mode");
  const mode = modeRaw === "challenge" || (!challenge && embed && qs.has("goal"))
    ? "challenge"
    : challenge
      ? "challenge"
      : null;

  if (!challenge && embed) {
    const goal = parseGoal(qs.get("goal"));
    const difficulty = parseDiff(qs.get("difficulty")) || "normal";
    const playerClub = (qs.get("playerClub") || "").trim();
    const aiClub = (qs.get("aiClub") || "").trim();
    if (goal && playerClub && aiClub) {
      try {
        getClub(playerClub);
        getClub(aiClub);
        create = {
          goal,
          difficulty,
          behavior: parseBehavior(qs.get("behavior")),
          playerClub,
          aiClub,
          hostName: (qs.get("hostName") || playerName || undefined)?.slice(0, 20),
        };
      } catch {
        create = null;
      }
    }
  }

  return { embed, mode, challenge, create, role, playerName, autoplay };
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
  // Also dispatch locally for same-window host shells / tests.
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

export function buildCatalogMessage(): Extract<EmbedOutbound, { type: "matchday.catalog" }> {
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

export function emitReady(challengeId: string | null, mode: "challenge" | null): void {
  postToHost({
    type: "matchday.ready",
    v: EMBED_PROTOCOL_V,
    source: EMBED_SOURCE,
    mode,
    challengeId,
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

/** Materialize create-from-query into a Challenge. */
export function materializeEmbedCreate(create: NonNullable<EmbedLaunch["create"]>): Challenge {
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
    if (type === "matchday.challenge.close") {
      handlers.onCloseRequest?.();
    }
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

export { challengeCreateEmbedUrl, challengeEmbedUrl };
