# unit-icons-agent

BDK-Agent für **freigeschnittene Personen-Icons** (LaneLink / Team-Tower-Defense).

Zieht die abgelegten Unit-Cutouts und zeigt alle Varianten in **Grau / Blau / Rot** für die Stufen **1–5**.

## Icon-Quelle

| Quelle | Rolle |
| --- | --- |
| `assets/units/` | Bundled Snapshot aus `cursor/matchday-icons-a9b1` |
| `game/public/icons/units/` | Live-Checkout im Monorepo (falls vorhanden) |

Schema: `{fan\|ultra\|hooligan\|ordner}-{grey\|blue\|red}-{1..5}.png` → **60** Icons.

## Tools

| Tool | Zweck |
| --- | --- |
| `list_cutout_unit_icons` | Inventar scannen |
| `build_unit_icon_gallery` | HTML-Galerie schreiben |
| `record_icon_inventory` | Kurzbericht speichern |

## Lokal

```bash
cd unit-icons-agent
npm install
npx @cursor/bdk validate --dir .
npx @cursor/bdk info --dir . --json
npx @cursor/bdk call list_cutout_unit_icons --dir . --input '{}'
npx @cursor/bdk call build_unit_icon_gallery --dir . --input '{}'
npx @cursor/bdk eval --dir . --list
```

Galerie öffnen: `docs/gallery/unit-icons-cutouts.html`

## Playground

```bash
npx @cursor/bdk serve --dir . --mode single --dev
# http://127.0.0.1:3000/playground
```
