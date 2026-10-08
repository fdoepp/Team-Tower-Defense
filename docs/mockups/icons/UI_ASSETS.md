# Einzel-UI-Assets & Farbvarianten

Alle Pfade relativ zu `game/public/icons/`.

**Hintergrund:** Icons sind freigestellte **RGBA-PNGs** (kein Karten-/Sheet-Hintergrund). Ausnahme: `ui/menu-rail-brown*.png` (das *ist* der Menü-Hintergrund) und die Scoreboard-Tafel selbst bleibt als Element erhalten.

## 1–8 UI-Bausteine (`ui/`)

| # | Datei | Beschreibung |
|---|---|---|
| 1 | `ui/slot-empty.png` | Leerer Bauplatz mit Bauzaun-Rechteck + `+` |
| 2 | `ui/currency-gold.png` … `currency-sicherheit.png` | Nur Logo (Gold/Bier/Fanartikel/Sicherheit) — Anzahl kommt aus dem HUD |
| 3 | `ui/scoreboard-momentum.png` | Anzeigetafel (Logos, Stand, Minute) + Momentum |
| 4 | `ui/btn-kaufen-grey.png` / `btn-kaufen-green.png` | Kaufen (grau/grün) |
| 5 | `ui/btn-senden-grey.png` / `btn-senden-green.png` | Senden (grau/grün) |
| 6 | `ui/menu-rail-brown.png` (+ `-tile`) | Durchgehende Bloons-braune Menüleiste |
| 7 | `ui/pennant-ksc.png` / `pennant-vfb.png` | Fanwimpel-Ständer |
| 8 | `ui/hp-bar-unit.png` / `ui/hp-bar-building.png` | Gesundheitsbalken (Person kompakt / Gebäude + Sicherheitsschild); Zustände `-{full,high,mid,low,empty}` |

## 9 Buden farbig (`stands/`)

Schema: `{bier\|fanshop\|ordner}-{blue\|red\|grey}-{1..5}.png`

- **blue** = blau-weiß (Heim/KSC)
- **red** = rot-weiß (Gäste/VfB)
- **grey** = grau/neutral

→ **45** Icons (3 Typen × 3 Farben × 5 Level)

**Bierstand Defaults (verbindlich):** `bier-{blue\|red\|grey}-{1..5}.png` sind die freigegebenen freigestellten Assets (Tracht-Vendor, braune Fässer mit grauen Reifen um den Stand, Gläser auf der Theke; Lv3+ Markise/Lichter/Brezel; Lv4–5 Neon **BIER** + 2. Vendor). Bei jeder neuen Spiel-/Match-Umsetzung diese Dateien nutzen — nicht neu generieren. Canonical-Kopien: `docs/mockups/icons/stands-colored/`.

**Fanshop Defaults (verbindlich / final):** `fanshop-{blue\|red\|grey}-{1..5}.png` — immer mit Vendor (blau/rot im Vereinstrikot); Lv1 Schalständer (braunes Gerüst), Lv2 Theke (+ ein Fähnchen), Lv3+ gestreifte Markise/Lichter, Lv4–5 **FANSHOP**-Schild in Teamfarbe + braune Holzkisten; Fähnchen nur auf Lv2. Bei **jeder** weiteren Spielcode-Änderung diese Dateien nutzen — nicht neu generieren.

**Ordnerposten Defaults (verbindlich / final):** `ordner-{blue\|red\|grey}-{1..5}.png` — Lv1 sitzend auf Stuhl+Fahne, Lv2 hinter Pult+gleiche Fahne, Lv3–5 mittig in der Tür im Ordnerbüro (Antennen ab Lv4); Kanon-Ordner-Units `units/ordner-{color}-{level}.png`. Runtime: `game/src/assets/stands.ts` → `ordnerStandPath`. Canon: `docs/icons/ORDNERPOSTEN_CANON.md`. Bei **jedem** Deployment / Spielaufsetzen / Code-Änderung nur diese Posten — nicht neu generieren.

## 10 Figuren farbig (`units/`)

Schema: `{fan\|ultra\|hooligan\|ordner}-{blue\|red\|grey}-{1..5}.png`

→ **60** Icons (4 Typen × 3 Farben × 5 Level)

## Gesundheitsbalken (Konzept)

- **Person:** schmale Kapsel über dem Kopf — Grün → Gelb → Orange → Rot nach HP-Anteil
- **Gebäude:** etwas breiter + blaues Sicherheitsschild links; 4 Segment-Ticks
- Runtime-Pfade: `game/public/icons/ui/hp-bar-unit-*.png`, `hp-bar-building-*.png`
- Beispiele: `ui/preview-hp-ordner-lv3.jpg`, `ui/preview-hp-hooligan-lv3.jpg`, `ui/preview-hp-bars.jpg`

## Previews

- `docs/mockups/icons/ui/preview-ui.jpg`
- `docs/mockups/icons/ui/preview-hp-bars.jpg`
- `docs/mockups/icons/ui/preview-hp-ordner-lv3.jpg`
- `docs/mockups/icons/ui/preview-hp-hooligan-lv3.jpg`
- `docs/mockups/icons/stands-colored/preview-lv3.jpg`
- `docs/mockups/icons/units-colored/preview-lv3.jpg`
