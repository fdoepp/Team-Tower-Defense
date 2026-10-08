# Unit head crops

Freigestellte Kopf-Ausschnitte (Kinn → Haare/Kopfbedeckung) für die kompakte Personen-Rail.

Pfad: `icons/units/heads/{fan|ultra|hooligan|ordner}-{blue|red|grey}-{1..5}.png`

Runtime: `unitHeadIconPath(kind, color, level)` — soft-bound, Level wechselt mit `Match.unitLevels`.

Neu generieren:

```bash
python3 game/scripts/make_unit_heads.py
```
