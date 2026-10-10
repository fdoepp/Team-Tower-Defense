# Personen-Rail ohne Senden + Quadrat-Icon-Buttons

**Status:** Personen-Rail Alt D **freigegeben** (Runtime) · Icon-/Upgrade-Buttons freigegeben  
**Mocks:** [index.html](./index.html) (C) · [index-alt-d.html](./index-alt-d.html) (D — Ertrag unter Icon, große Kosten)

## 1. Personen-Rail ohne „Senden“ (Alt D)

Alle Karten (Fans, Ultras, Hooligans, Ordner) nur noch:

| Aktion | Chrome |
| --- | --- |
| KAUFEN | Unit-Icon + Ertrag darunter · Kosten groß rechts |
| UPGRADE | nächste Stufe + Yield-Delta darunter · Kosten groß rechts |

- Dual-Grid überall: `1% · 48% · 2% · 48% · 1%`
- Kein Triple-Grid / kein SENDEN in der linken Rail
- Unten: `Schließen` (`.rail-close`, gleiche Farbe wie Baumenu)
- Face-Tokens (%): `--face-left 2.5%` · `--unit-w 36%` · `--col-gap 4%` · `--yield-gap 4%`
- Angriff/Blocksturm → eigener Quadrat-Button (rot)

## 2. Quadrat-Icon-Buttons (Holzrand)

| ID | Datei | Face | Zentrum |
| --- | --- | --- | --- |
| `btnIconUltraBlue` | `btn-icon-ultra-blue.png` | Blau (#3184ca) | Ultra Lv5 |
| `btnIconBierAmber` | `btn-icon-bier-amber.png` | Bau-Amber (#e08f22) | Bierstand Lv5 |
| `btnIconAngriffRed` | `btn-icon-angriff-red.png` | Rot (#c42a2a) | Angriff-Symbol |
| `btnIconSquareRed` | `btn-icon-square-red.png` | Rot | leer (Chrome) |
| `iconAngriffBlocksturm` | `icon-angriff-blocksturm.png` | — | freigestelltes Symbol |

**Maßregeln (skalierbar):**

| Token | Wert |
| --- | --- |
| Native | 256×256, AR 1:1 |
| Holzrand | ~7,5 % der Kantenlänge |
| Icon-Fill | ~72–78 % der Face |
| Live-Inset | n/a (Emblem ist das Chrome-Motiv) |
| Freigestellt | RGBA, transparente Ecken |

Generator: `scripts/ui-final/make-square-icon-btns.py`

## Freigabe

Quadrat-Icon-Buttons + Angriff-Symbol: **freigegeben** (`game/public/icons/ui-final/`, `UI_ICONS`).  
Upgrade-Buttons + Pfeil (`btnIconUpgradePerson` / `btnIconUpgradeBuilding` / `iconUpgradeArrow`): **freigegeben**.  
Personen-Rail Alt D: **freigegeben** — Abstände/Größen relativ (`cqw`/`cqh`/%-Tokens der Rail/Face); Texte live (Lvl, Anzahl, Icons, Ertrag `/s`, Kauf-/Upgradekosten, ready/cd).  
Gebäude-Rail Alt D: **Spiegel** (Banner Amber) — gleiche Dual-Karten Bau/UP, relative Tokens, live Texte; immer sichtbar.
