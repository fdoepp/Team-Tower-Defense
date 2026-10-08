/**
 * Binding health-bar UI paths for units and buildings.
 *
 * Always use these freigestellte bar PNGs for every match / deployment
 * that shows HP — see `.cursor/rules/stadium-background.mdc` and
 * `docs/icons/HP_BARS_CANON.md`. Bars only (no baked-in figures).
 */

export type HpFillState = "full" | "high" | "mid" | "low" | "empty";

const UI = "/icons/ui";

export function hpFillState(ratio: number): HpFillState {
  if (ratio >= 0.995) return "full";
  if (ratio > 0.55) return "high";
  if (ratio > 0.3) return "mid";
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

/** All unit + building bar state paths (canon set). */
export const HP_BAR_PATHS: readonly string[] = (
  ["unit", "building"] as const
).flatMap((kind) =>
  (["full", "high", "mid", "low", "empty"] as const).map(
    (state) => `${UI}/hp-bar-${kind}-${state}.png`,
  ),
);
