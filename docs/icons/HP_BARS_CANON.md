# Gesundheitsbalken — verbindlicher Kanon

**Status:** freigegeben / final für alle neuen Spielversionen und Deployments  
**Stand:** 2026-10-08  
**Quelle der Wahrheit:** `game/public/icons/ui/hp-bar-{unit|building}-{full|high|mid|low|empty}.png`

Nur die **reinen Balken** (keine Figuren/Gebäude eingebrannt). Platzierung zur Laufzeit über dem Ziel.

Maschinenlesbar: [`hp-bars-canon.json`](./hp-bars-canon.json)  
Runtime: `game/src/assets/hpBars.ts` → `unitHpBarPath` / `buildingHpBarPath`  
Regel: `.cursor/rules/stadium-background.mdc` (alwaysApply)

## Dateipfade

| Ziel | Schema |
| --- | --- |
| Person | `game/public/icons/ui/hp-bar-unit-{state}.png` |
| Gebäude | `game/public/icons/ui/hp-bar-building-{state}.png` |
| Default-Alias | `hp-bar-unit.png` / `hp-bar-building.png` (= `high`) |

`state` ∈ `full` (100%) · `high` (~75%) · `mid` (~45%) · `low` (~18%) · `empty` (0%)

Spiegel: `docs/mockups/icons/ui/` · Zustandsübersicht: `docs/mockups/icons/ui/preview-hp-bars.jpg`

## Aussehen

- **Person:** schmale dunkle Outline-Kapsel
- **Gebäude:** etwas breiter, blaues Sicherheitsschild links, 4 Segment-Ticks
- **Füllfarbe nach HP:** Grün → Gelb → Orange → Rot

## Regeln für Agents & Deployments

1. Bei **jedem** Deployment / Match-HUD Gesundheit nur über diese PNGs (oder gleichwertiges Zeichnen im selben Look via `hpBars.ts`) anzeigen.
2. Keine alternativen Balken, solange dieser Kanon gilt — außer ausdrücklicher Revisions-Auftrag.
3. Keine Komposit-Mockups mit Figuren als Asset-Quelle; Figuren bleiben getrennt unter `units/` / `stands/`.
