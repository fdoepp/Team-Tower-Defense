/**
 * Binding floating FX for currency / momentum gains and spends.
 * Style: freigestellte logo + green "+" or red "−" pill (see Kauf-Feedback mock).
 *
 * `.cursor/rules/stadium-background.mdc` · `docs/icons/CURRENCY_FX_CANON.md`
 */

export type CurrencyId = "gold" | "bier" | "fanartikel" | "sicherheit";
export type FxKind = "gain" | "spend";

const UI = "/icons/ui";

export function currencyFxPath(kind: FxKind, currency: CurrencyId): string {
  return `${UI}/fx-${kind}-${currency}.png`;
}

/** Fan-block → Momentum: always rising +Momentum pops */
export function momentumGainFxPath(): string {
  return `${UI}/fx-gain-momentum.png`;
}

export const CURRENCY_FX_PATHS: readonly string[] = (
  ["gain", "spend"] as const
).flatMap((kind) =>
  (["gold", "bier", "fanartikel", "sicherheit"] as const).map(
    (c) => currencyFxPath(kind, c),
  ),
);

export const MOMENTUM_FX_PATH = momentumGainFxPath();
