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
| 5 | `ui/btn-senden-grey.png` / `btn-senden-green.png` / `btn-senden-blue.png` | Senden (grau/grün/blau) |
| 5b | `ui/btn-bauen-amber.png` / `btn-bauen-grey.png` | Bauen (Game-Kanon) |
| 5c | `ui/btn-upgrade-purple.png` / `btn-upgrade-grey.png` | Upgrade (Game-Kanon) |
| 6 | `ui/menu-rail-brown.png` (+ `-tile`) | Durchgehende Bloons-braune Menüleiste |
| 7 | `ui/pennant-ksc.png` / `pennant-vfb.png` | Fanwimpel-Ständer |
| 8 | `ui/hp-bar-unit.png` / `ui/hp-bar-building.png` | **Default** Gesundheitsbalken (verbindlich) — Person kompakt / Gebäude + Sicherheitsschild; Zustände `-{full,high,mid,low,empty}` |
| 9 | `ui/fx-gain-*.png` / `ui/fx-spend-*.png` | **Default** Floating-FX bei Währungs-± (Logo + grünes `+` / rotes `−`) |
| 10 | `ui/fx-gain-momentum.png` | **Default** +Momentum vom Fan-Block (aufsteigend) |

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

## Währungs- & Momentum-FX (verbindlich / final)

Bei jeder Einnahme/Ausgabe und bei Momentum vom Fan-Block nur diese freigestellten Pops:

- `fx-gain|spend-{gold,bier,fanartikel,sicherheit}.png`
- `fx-gain-momentum.png` (aufsteigend über dem Fan-Block)
- Runtime: `game/src/assets/currencyFx.ts` · Canon: `docs/icons/CURRENCY_FX_CANON.md`
- Preview: `ui/preview-fx-currency.jpg`, `ui/preview-fx-momentum.jpg`, `ui/preview-bierstand-kauf-fx.jpg`

## Gesundheitsbalken (verbindlich / final)

Nur die **reinen Bars** (keine Figuren eingebrannt). Bei **jedem** Deployment Gesundheit damit anzeigen.

- **Person:** `hp-bar-unit-{full\|high\|mid\|low\|empty}.png` — schmale Kapsel
- **Gebäude:** `hp-bar-building-*.png` — breiter + Sicherheitsschild, 4 Segmente
- Farbe nach HP: Grün → Gelb → Orange → Rot
- Runtime: `game/src/assets/hpBars.ts` → `unitHpBarPath` / `buildingHpBarPath`
- Canon: `docs/icons/HP_BARS_CANON.md`

## Previews

- `docs/mockups/icons/ui/preview-ui.jpg`
- `docs/mockups/icons/ui/preview-hp-bars.jpg` (nur Balken-Zustände)
- `docs/mockups/icons/stands-colored/preview-lv3.jpg`
- `docs/mockups/icons/units-colored/preview-lv3.jpg`

## Lücken (noch zu erstellen / einzuspielen)

Siehe **`docs/icons/ASSET_GAP_AUDIT.md`**. Kurz:

1. `game/public/assets/` — Derby-BG + Tribune-Blöcke (fertig auf Stadium-Branch)
2. `ui/btn-anwerben-{green\|grey}.png`, `ui/btn-bauen-{green\|grey}.png`
3. `ui/status-{durst,interesse,stimmung,pyro,fremdtrinken}.png`
4. Optional: Aktionschips Gesang/Pyro/Klatschen, Selection-Marker, Lane-Pfeil
