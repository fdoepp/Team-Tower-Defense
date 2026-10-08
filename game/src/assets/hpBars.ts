/**
 * Health-bar UI paths for units and buildings.
 * Prefer drawing fill dynamically; these PNGs are the visual canon / fallbacks.
 */

export type HpFillState = "full" | "high" | "mid" | "low" | "empty";

const UI = "/icons/ui";

export function hpFillState(ratio: number): HpFillState {
  if (ratio >= 0.995) return "full";
  if (ratio > 0.55) return "high";
  if (ratio > 0.30) return "mid";
  if (ratio > 0.02) return "low";
  return "empty";
}

export function unitHpBarPath(ratioOrState: number | HpFillState): string {
  const state =
    typeof ratioOrState === "number" ? hpFillState(ratioOrState) : ratioOrState;
  return `${UI}/hp-bar-unit-${state}.png`;
}

export function buildingHpBarPath(ratioOrState: number | HpFillState): string {
  const state =
    typeof ratioOrState === "number" ? hpFillState(ratioOrState) : ratioOrState;
  return `${UI}/hp-bar-building-${state}.png`;
}
