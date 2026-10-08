/**
 * Binding stand / building icon paths for LaneLink match deployments.
 * Always load these freigestellte PNGs — do not invent alternate booth art.
 *
 * See `.cursor/rules/stadium-background.mdc` and `docs/icons/ORDNERPOSTEN_CANON.md`.
 */

export type StandColor = "blue" | "red" | "grey";
export type StandLevel = 1 | 2 | 3 | 4 | 5;
export type StandKind = "bier" | "fanshop" | "ordner";

const STANDS_BASE = "/icons/stands";

/** Heim → blue, Gäste → red, Neutral → grey */
export function teamToStandColor(
  team: "home" | "away" | "neutral" | StandColor,
): StandColor {
  if (team === "home") return "blue";
  if (team === "away") return "red";
  if (team === "neutral") return "grey";
  return team;
}

export function standPath(
  kind: StandKind,
  color: StandColor | "home" | "away" | "neutral",
  level: StandLevel,
): string {
  const c = teamToStandColor(color);
  return `${STANDS_BASE}/${kind}-${c}-${level}.png`;
}

/** Ordnerposten only — binding defaults for every game setup / deployment */
export function ordnerStandPath(
  color: StandColor | "home" | "away" | "neutral",
  level: StandLevel,
): string {
  return standPath("ordner", color, level);
}

export function bierStandPath(
  color: StandColor | "home" | "away" | "neutral",
  level: StandLevel,
): string {
  return standPath("bier", color, level);
}

export function fanshopStandPath(
  color: StandColor | "home" | "away" | "neutral",
  level: StandLevel,
): string {
  return standPath("fanshop", color, level);
}

/** Uncolored fallback (= grey pixels) */
export function standFallbackPath(kind: StandKind, level: StandLevel): string {
  return `${STANDS_BASE}/${kind}-${level}.png`;
}

/** All 15 colored Ordnerposten paths (grey/blue/red × Lv1–5) */
export const ORDNER_STAND_PATHS: readonly string[] = (
  ["grey", "blue", "red"] as const
).flatMap((color) =>
  ([1, 2, 3, 4, 5] as const).map((level) => ordnerStandPath(color, level)),
);
