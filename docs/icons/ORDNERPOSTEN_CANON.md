# Ordnerposten-Gebäude — verbindlicher Kanon

**Status:** freigegeben / final für alle neuen Spielversionen und Deployments  
**Stand:** 2026-10-08  
**Quelle der Wahrheit:** `game/public/icons/stands/ordner-{grey|blue|red}-{1..5}.png`

Ältere Ordnerposten (Zaun-Käfige, Proposal-Sheets, unskalierte Mini-Figuren, seitlich versetzte Units) dürfen **nicht** mehr für neue Builds, Mockups, Agent-Generierungen oder Deployments verwendet werden.

Maschinenlesbar: [`ordnerposten-canon.json`](./ordnerposten-canon.json)  
Runtime-Pfade: `game/src/assets/stands.ts` → `ordnerStandPath(color, level)`  
Regel: `.cursor/rules/stadium-background.mdc` (alwaysApply)

## Dateipfade

| Farbe | Pfade |
| --- | --- |
| Grau (neutral) | `game/public/icons/stands/ordner-grey-1.png` … `ordner-grey-5.png` |
| Blau (Heim) | `game/public/icons/stands/ordner-blue-1.png` … `ordner-blue-5.png` |
| Rot (Gäste) | `game/public/icons/stands/ordner-red-1.png` … `ordner-red-5.png` |
| Fallback | `game/public/icons/stands/ordner-1.png` … `ordner-5.png` (= grau) |

Spiegel / Mockups: `docs/mockups/icons/stands-colored/ordner-{color}-{level}.png`  
Sheets: `docs/mockups/icons/stands-colored/sheet-ordner-{grey|blue|red}.png`

## Progression (Gebäude)

| Level | Gebäude | Figur |
| --- | --- | --- |
| 1 | Stuhl + Standarte/Fahne (Schild mit Ziffer) | Ordner sitzt auf dem Stuhl (Kanon Lv1, Funk) |
| 2 | Schreibtisch + Schirm + gleiche Fahne | Ordner hinter dem Pult (Kanon Lv2, Stock) |
| 3 | betretbares Ordnerbüro, Schild **3**, Warnleuchte | Ordner mittig in der Tür (Kanon Lv3) |
| 4 | gleiches Büro + Dach-Antennen, Schild **4** | Ordner mittig in der Tür (Kanon Lv4, Schild+Pistole) |
| 5 | gleiches Büro + Antennen/Dish, Schild **5** | Ordner mittig in der Tür (Kanon Lv5, Schild+MG) |

Units in der Tür: immer `game/public/icons/units/ordner-{color}-{level}.png` (siehe `ORDNER_CANON.md`).

## Regeln für Agents & Deployments

1. Bei **jedem** neuen Spielaufsetzen / Match-Render / Deployment nur die 15 (+5 Fallback) Dateien unter `game/public/icons/stands/ordner-*.png` laden.
2. Teamfarbe wählen: Heim → `blue`, Gäste → `red`, Neutral → `grey` (oder Fallback ohne Farbe).
3. Keine Regeneration der Posten, solange dieser Kanon gilt — außer ausdrücklicher Revisions-Auftrag.
4. Keine Canvas-/Platzhalter-Budiken, solange diese PNGs existieren.
5. Figurengröße und Positionierung der freigegebenen Composites nicht durch ältere Mini-/Seiten-Varianten ersetzen.

## Kurz-Check

- [ ] Dateiname `ordner-{grey|blue|red}-{1-5}.png`
- [ ] 512×512 PNG RGBA freigestellt
- [ ] Lv1 sitzend, Lv2 hinter Pult, Lv3–5 in der Tür
- [ ] Kanon-Ordner-Unit im Composite
- [ ] Runtime lädt über `ordnerStandPath` / gleiche Pfade
