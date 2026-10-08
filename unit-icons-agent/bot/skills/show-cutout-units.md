# Freigeschnittene Personen-Icons anzeigen

## Ziel

Alle abgelegten Personen-Icons zeigen, die als freigeschnittene RGBA-PNGs in **Grau, Blau und Rot** für die Stufen **1–5** existieren.

## Typen

| id | Label |
| --- | --- |
| `fan` | Fan / Normalo |
| `ultra` | Ultra |
| `hooligan` | Hooligan |
| `ordner` | Ordner |

Farben: `grey` (Grau), `blue` (Blau), `red` (Rot). Erwartung: **4 × 3 × 5 = 60** Dateien.

## Fan-Kanon (verbindlich)

Fans haben einen freigegebenen Kanon — **nur** diese Dateien für neue Spielversionen:

- Repo-Regeln: `docs/icons/FAN_CANON.md` / `docs/icons/fan-canon.json`
- Runtime: `game/public/icons/units/fan-{grey|blue|red}-{1..5}.png`
- Agent-Spiegel: `assets/units/fan-*.png`

Kurzregeln:

| Level | Gear | Stimmung |
| --- | --- | --- |
| 1 | Trikot #1 + Bier (kein Fähnchen) | ruhig |
| 2 | + Fähnchen · #2 | freudig |
| 3 | + Schal + Baseball-Cap · #3 | singt |
| 4 | größere Fahne · #4 | jubelt |
| 5 | große Fahne · #5 | Eskalation |

Ganzfigurig, kurze Hose/Trikot, Bier immer, Fahne/Cap in Lagerfarbe. Keine Legacy-Fans regenerieren oder empfehlen.

## Ablauf

1. `list_cutout_unit_icons` — Inventar aus `assets/units/` (+ ggf. `game/public/icons/units/`).
2. `build_unit_icon_gallery` — HTML-Galerie mit Schachbrett-Hintergrund (Transparenz sichtbar).
3. `record_icon_inventory` — Kurzbericht speichern.
4. Nutzerantwort: Trefferquote + Pfad zur Galerie + fehlende Dateinamen.
