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

## 9 Buden farbig (`stands/`)

Schema: `{bier\|fanshop\|ordner}-{blue\|red\|grey}-{1..5}.png`

- **blue** = blau-weiß (Heim/KSC)
- **red** = rot-weiß (Gäste/VfB)
- **grey** = grau/neutral

→ **45** Icons (3 Typen × 3 Farben × 5 Level)

## 10 Figuren farbig (`units/`)

Schema: `{fan\|ultra\|hooligan\|ordner}-{blue\|red\|grey}-{1..5}.png`

→ **60** Icons (4 Typen × 3 Farben × 5 Level)

## Previews

- `docs/mockups/icons/ui/preview-ui.jpg`
- `docs/mockups/icons/stands-colored/preview-lv3.jpg`
- `docs/mockups/icons/units-colored/preview-lv3.jpg`
