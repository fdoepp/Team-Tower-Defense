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

## Fan-Progression (Gimmicks)

Stufen müssen additiv unterscheidbar sein:

1. normales Outfit + kleines Fähnchen  
2. + Schal  
3. + Mütze  
4. + Trikot  
5. + große Fahne  

Siehe `docs/fan-progression/README.md`.

## Ablauf

1. `list_cutout_unit_icons` — Inventar aus `assets/units/` (+ ggf. `game/public/icons/units/`).
2. `build_unit_icon_gallery` — HTML-Galerie mit Schachbrett-Hintergrund (Transparenz sichtbar).
3. `record_icon_inventory` — Kurzbericht speichern.
4. Nutzerantwort: Trefferquote + Pfad zur Galerie + fehlende Dateinamen.
