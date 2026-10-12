/**
 * Matchday feel-pack: Choreo tiers, AI personalities, half-time boosts,
 * highlight labels — shared constants (no live branding).
 */
import type { AiBehavior, TeamId } from "./types";

/** Ultras im eigenen Block → Choreo-Stufe */
export type ChoreoTier = "klein" | "mittel" | "gross" | "gigantisch";

export function choreoTierFromUltras(n: number): ChoreoTier | null {
  if (n >= 30) return "gigantisch";
  if (n >= 20) return "gross";
  if (n >= 10) return "mittel";
  if (n >= 5) return "klein";
  return null;
}

export const CHOREO_LABEL: Record<ChoreoTier, string> = {
  klein: "Kleine Choreo",
  mittel: "Mittlere Choreo",
  gross: "Große Choreo",
  gigantisch: "Gigantische Choreo",
};

/** Momentum nudge toward scoring side while choreo is active */
export const CHOREO_MOMENTUM: Record<ChoreoTier, number> = {
  klein: 0.035,
  mittel: 0.06,
  gross: 0.1,
  gigantisch: 0.15,
};

export const CHOREO_DURATION: Record<ChoreoTier, number> = {
  klein: 4,
  mittel: 5.5,
  gross: 7,
  gigantisch: 9,
};

/** Cooldown after a choreo ends before the next can start */
export const CHOREO_COOLDOWN: Record<ChoreoTier, number> = {
  klein: 20,
  mittel: 18,
  gross: 16,
  gigantisch: 14,
};

export type ChoreoState = {
  team: TeamId;
  tier: ChoreoTier;
  t: number;
  dur: number;
};

export type HighlightKind = "goal" | "storm";

export type HighlightState = {
  kind: HighlightKind;
  team: TeamId;
  t: number;
  dur: number;
};

export const HIGHLIGHT_DUR: Record<HighlightKind, number> = {
  goal: 2.8,
  storm: 3.2,
};

/** Slow-mo factor while a highlight plays */
export const HIGHLIGHT_SLOW = 0.32;

export type HalfBoostId =
  | "gold"
  | "mood"
  | "vorrat"
  | "sicherheit"
  | "choreo";

export type HalfBoostDef = {
  id: HalfBoostId;
  title: string;
  blurb: string;
};

export const HALF_BOOSTS: HalfBoostDef[] = [
  {
    id: "gold",
    title: "Sponsorenschub",
    blurb: "+45 € für die 2. Hälfte",
  },
  {
    id: "mood",
    title: "12. Mann",
    blurb: "Kurve +0,35 Stimmung",
  },
  {
    id: "vorrat",
    title: "Nachschub",
    blurb: "+18 Bier & +18 Fanartikel",
  },
  {
    id: "sicherheit",
    title: "Ordner-Einsatz",
    blurb: "+25 Sicherheit",
  },
  {
    id: "choreo",
    title: "Doppelhalter bereit",
    blurb: "Nächste Choreo sofort möglich",
  },
];

/** AI character multipliers on top of difficulty profile */
export type PersonalityMods = {
  tickMul: number;
  sendMul: number;
  buildMul: number;
  hoolBias: number;
  ultraBias: number;
  fanBias: number;
  earlyWant: number;
};

export const AI_BEHAVIOR_LABEL: Record<AiBehavior, string> = {
  patient: "Abwartend",
  balanced: "Ausgewogen",
  aggro: "Aggressiv",
  beer: "Bier-Kurve",
  earlywin: "Früher Druck",
};

export const AI_BEHAVIOR_BLURB: Record<AiBehavior, string> = {
  patient: "Baut und hortet, sendet selten",
  balanced: "Klassische KI-Balance",
  aggro: "Viele Sendungen, früher Gang",
  beer: "Fokus Hooligans & Bier",
  earlywin: "Früher Blockdruck, wenig Geduld",
};

export function personalityMods(b: AiBehavior): PersonalityMods {
  switch (b) {
    case "patient":
      return {
        tickMul: 0.75,
        sendMul: 0.55,
        buildMul: 1.45,
        hoolBias: 0.8,
        ultraBias: 0.85,
        fanBias: 1.25,
        earlyWant: -1,
      };
    case "aggro":
      return {
        tickMul: 1.25,
        sendMul: 1.45,
        buildMul: 0.75,
        hoolBias: 1.2,
        ultraBias: 1.35,
        fanBias: 0.7,
        earlyWant: 1,
      };
    case "beer":
      return {
        tickMul: 1.05,
        sendMul: 1.15,
        buildMul: 1.1,
        hoolBias: 1.7,
        ultraBias: 0.7,
        fanBias: 0.9,
        earlyWant: 0,
      };
    case "earlywin":
      return {
        tickMul: 1.35,
        sendMul: 1.55,
        buildMul: 0.85,
        hoolBias: 1.4,
        ultraBias: 1.25,
        fanBias: 0.65,
        earlyWant: 2,
      };
    case "balanced":
    default:
      return {
        tickMul: 1,
        sendMul: 1,
        buildMul: 1,
        hoolBias: 1,
        ultraBias: 1,
        fanBias: 1,
        earlyWant: 0,
      };
  }
}

/** Hash club id → stable chant profile (tempo / base Hz) for sound identity */
export function clubChantProfile(clubId: string): {
  baseHz: number;
  tempo: number;
  brightness: number;
} {
  let h = 0;
  for (let i = 0; i < clubId.length; i++) h = (h * 31 + clubId.charCodeAt(i)) | 0;
  const u = Math.abs(h);
  return {
    baseHz: 85 + (u % 70),
    tempo: 0.55 + ((u >> 3) % 50) / 100,
    brightness: 0.4 + ((u >> 7) % 50) / 100,
  };
}
