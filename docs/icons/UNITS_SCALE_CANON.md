# Unit-Icons — einheitliche Figurgröße

**Status:** freigegeben  
**Stand:** 2026-10-08  
**Vergleichsmatrix:** [`units-uniform-scale.png`](./units-uniform-scale.png)

Alle vier Unit-Typen (`fan`, `ordner`, `hooligan`, `ultra`) × Farben (`grey`, `blue`, `red`) × Level `1…5` teilen dieselbe **Körperhöhe** auf dem 256×256-Canvas.

## Regeln

- Canvas: 256×256 PNG RGBA, freigestellt
- Füße verankert bei **y ≈ 248**
- Ziel-Körperhöhe (Kopf-/Hood-Oberkante → Füße): **≈ 200 px**
- Geometrie wird am **Grau-Master** gemessen und 1:1 auf Blau/Rot übertragen (Silhouette bleibt identisch)
- Ultras: gemeinsame Skalierung über alle Level (Rauch/Props dürfen oben anschneiden, die Figur nicht)

## Quelle der Wahrheit

`game/public/icons/units/{fan|ordner|hooligan|ultra}-{grey|blue|red}-{1..5}.png`

Spiegel: `unit-icons-agent/assets/units/` sowie die jeweiligen `*-progression/final/`-Ordner.

Neue Unit-Icons müssen vor Ablage gegen `units-uniform-scale.png` geprüft werden — keine Kind-/Riesen-Proportionen relativ zu den anderen Typen.
